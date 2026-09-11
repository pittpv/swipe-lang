import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { waitUntil } from '@vercel/functions';
import { neon } from '@neondatabase/serverless';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '..', 'database', 'langapp.json');

// Storage backends, by priority:
//   1. Neon Postgres  — when POSTGRES_URL / DATABASE_URL is set (serverless-friendly HTTP driver)
//   2. Upstash Redis  — when UPSTASH_REDIS_REST_* env vars are set
//   3. Local JSON file — local dev / long-running server
const POSTGRES_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const pgEnabled = Boolean(POSTGRES_URL);
const redisEnabled = Boolean(REDIS_URL && REDIS_TOKEN);

export let dbMode = pgEnabled ? 'postgres' : redisEnabled ? 'redis' : 'file';
/** True when every remote backend failed this isolate — persist is in-memory only. */
let remoteUnavailable = false;

const DB_KEY = 'langapp:db';

const defaultData = () => ({
  users: [],
  words: [],
  user_word_progress: [],
  study_sessions: [],
  analytics: [],
  _seq: { users: 0, words: 0, user_word_progress: 0, study_sessions: 0, analytics: 0 },
  _wordIdMap: {},
});

async function redisCommand(command) {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`Upstash REST ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.result;
}

function loadFile() {
  mkdirSync(dirname(dbPath), { recursive: true });
  if (!existsSync(dbPath)) {
    const data = defaultData();
    saveFile(data);
    return data;
  }
  return JSON.parse(readFileSync(dbPath, 'utf8'));
}

function saveFile(data) {
  writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
}

let cache = defaultData();
let sql = null;

async function loadPostgres() {
  const rows = await sql`SELECT data FROM langapp_state WHERE id = 1`;
  return rows.length && rows[0].data ? rows[0].data : null;
}

async function loadRedis() {
  const blob = await redisCommand(['GET', DB_KEY]);
  return blob ? JSON.parse(blob) : null;
}

/**
 * Fetches the latest shared document from the active backend.
 * Returns null when nothing has been stored yet.
 */
async function loadRemote() {
  if (dbMode === 'postgres') return loadPostgres();
  if (dbMode === 'redis') return loadRedis();
  return loadFile();
}

if (pgEnabled) {
  // Load the shared JSONB document (accounts/progress only — dictionary is CSV).
  // Empty DB keeps defaultData; index.js hydrates words from server/data.
  sql = neon(POSTGRES_URL);
  try {
    await sql`CREATE TABLE IF NOT EXISTS langapp_state (
      id integer PRIMARY KEY,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
    const data = await loadPostgres();
    if (data) cache = data;
  } catch (err) {
    console.error('[db] Postgres load failed:', err.message);
    if (redisEnabled) {
      try {
        const data = await loadRedis();
        if (data) cache = data;
        dbMode = 'redis';
        console.error('[db] Falling back to Redis after Postgres failure');
      } catch (redisErr) {
        console.error('[db] Redis fallback failed:', redisErr.message);
        remoteUnavailable = true;
      }
    } else {
      remoteUnavailable = true;
    }
  }
} else if (redisEnabled) {
  try {
    const data = await loadRedis();
    if (data) cache = data;
  } catch (err) {
    console.error('[db] Redis load failed, starting empty:', err.message);
    remoteUnavailable = true;
  }
} else {
  cache = loadFile();
}

let pendingSave = null;

function currentRev() {
  return Number(cache._rev) || 0;
}

function wordMapKey(pair, lemma) {
  return `${String(pair || 'tr-ru').toLowerCase().trim()}:${String(lemma || '').toLowerCase().trim()}`;
}

function wordIdMapFrom(data = cache) {
  const map = { ...(data._wordIdMap || {}) };
  for (const w of data.words || []) {
    if (w?.id == null || !w.lemma) continue;
    map[wordMapKey(w.lang_pair, w.lemma)] = w.id;
  }
  return map;
}

/**
 * Remote stores must not embed the dictionary (examples/forms ≈ 8MB).
 * File mode keeps words so local backups stay self-contained.
 */
export function persistableState(data = cache, mode = dbMode) {
  const _wordIdMap = wordIdMapFrom(data);
  if (mode === 'file') return { ...data, _wordIdMap };
  const { words, ...rest } = data;
  return { ...rest, _wordIdMap };
}

/**
 * Compare-and-swap write. Returns false when another instance already stored
 * a newer snapshot — callers must reload and retry instead of clobbering it.
 * Without this, a warm Vercel lambda that started before a push subscribe
 * would persist its stale blob and wipe `push_subscription`, so the next
 * day's QStash cron would fire and skip the reminder.
 */
async function persistCas(data, expectedRev) {
  const payload = JSON.stringify(persistableState(data));
  if (dbMode === 'postgres') {
    const updated = await sql`
      UPDATE langapp_state
      SET data = ${payload}::jsonb, updated_at = now()
      WHERE id = 1
        AND COALESCE((data->>'_rev')::int, 0) = ${expectedRev}
      RETURNING id
    `;
    if (updated.length) return true;
    const existing = await sql`SELECT id FROM langapp_state WHERE id = 1`;
    if (existing.length) return false;
    try {
      await sql`
        INSERT INTO langapp_state (id, data, updated_at)
        VALUES (1, ${payload}::jsonb, now())
      `;
      return true;
    } catch (err) {
      console.error('[db] Postgres insert race:', err.message);
      return false;
    }
  }
  if (dbMode === 'redis') {
    const script = `
      local current = redis.call('GET', KEYS[1])
      local expected = tonumber(ARGV[1])
      if not current then
        if expected ~= 0 then return 0 end
        redis.call('SET', KEYS[1], ARGV[2])
        return 1
      end
      local rev = tonumber(string.match(current, '"_rev":(%d+)')) or 0
      if rev ~= expected then return 0 end
      redis.call('SET', KEYS[1], ARGV[2])
      return 1
    `;
    try {
      const result = await redisCommand(['EVAL', script, 1, DB_KEY, String(expectedRev), payload]);
      return Number(result) === 1;
    } catch (err) {
      console.error('[db] Redis CAS failed, falling back to SET:', err.message);
      await redisCommand(['SET', DB_KEY, payload]);
      return true;
    }
  }
  saveFile(data);
  return true;
}

function schedulePersist(data) {
  // Chain .catch onto the promise waitUntil sees — a sibling .catch leaves
  // the original rejection intact and Vercel then reports FUNCTION_INVOCATION_FAILED.
  pendingSave = persistCas(data, currentRev() - 1)
    .then((ok) => {
      if (!ok) console.error('[db] persist CAS conflict — skipped stale write');
    })
    .catch((err) => {
      console.error(`[db] ${dbMode} persist failed:`, err.message);
    });
  waitUntil(pendingSave);
}

export const db = {
  /** Resolves when all scheduled remote writes are done (file mode: instant). */
  async flush() {
    if (pendingSave) await pendingSave;
  },
  /**
   * Re-reads the shared document from the backend so reads reflect writes made
   * by other processes / serverless instances. Critical on Vercel, where warm
   * lambdas would otherwise serve a stale in-memory snapshot forever and users
   * would see different stats (e.g. missing achievements) per device.
   * Mutates `cache` in place so existing references (db.data) stay valid.
   */
  async reload() {
    try {
      if (pendingSave) await pendingSave;
      const fresh = await loadRemote();
      if (!fresh) return;
      const words = cache.words;
      const wordIdMap = cache._wordIdMap;
      for (const key of Object.keys(cache)) delete cache[key];
      Object.assign(cache, fresh);
      if (!cache.words?.length && words?.length) cache.words = words;
      if ((!cache._wordIdMap || !Object.keys(cache._wordIdMap).length) && wordIdMap && Object.keys(wordIdMap).length) {
        cache._wordIdMap = wordIdMap;
      }
    } catch (err) {
      // Fail soft: stale data beats no data for a read-only refresh.
      console.error('[db] reload failed:', err.message);
    }
  },
  /**
   * Reload → mutate → CAS write, retrying when another instance won the race.
   * Request handlers that change user data (especially push subscriptions)
   * must use this instead of mutate-then-`persist()`.
   */
  async transact(mutator) {
    if (dbMode === 'file' || remoteUnavailable) {
      const result = await mutator();
      if (dbMode === 'file') saveFile(cache);
      return result;
    }
    for (let attempt = 0; attempt < 5; attempt++) {
      // First attempt uses the in-memory snapshot (already loaded on this
      // isolate). Reload only after a CAS miss so a swipe is one write, not
      // two full-document round-trips.
      if (attempt > 0) await this.reload();
      const expectedRev = currentRev();
      const result = await mutator();
      cache._rev = expectedRev + 1;
      const ok = await persistCas(cache, expectedRev);
      if (ok) {
        pendingSave = null;
        return result;
      }
      console.warn(`[db] write conflict, retry ${attempt + 1}/5`);
    }
    throw new Error('Database write conflict');
  },
  persist() {
    cache._rev = currentRev() + 1;
    if (remoteUnavailable) return;
    if (dbMode === 'postgres' || dbMode === 'redis') schedulePersist(cache);
    else saveFile(cache);
  },
  data: cache,
  nextId(table) {
    cache._seq[table] = (cache._seq[table] ?? 0) + 1;
    return cache._seq[table];
  },
};

export function initSchema() {
  if (!cache.words.length) return;
}

