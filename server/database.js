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

export const dbMode = pgEnabled ? 'postgres' : redisEnabled ? 'redis' : 'file';

const DB_KEY = 'langapp:db';

const defaultData = () => ({
  users: [],
  words: [],
  user_word_progress: [],
  study_sessions: [],
  analytics: [],
  _seq: { users: 0, words: 0, user_word_progress: 0, study_sessions: 0, analytics: 0 },
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

if (pgEnabled) {
  // Hydrate the full state from the single JSONB document before use.
  // Cold start on empty DB keeps defaultData; index.js seeds words right after.
  sql = neon(POSTGRES_URL);
  try {
    await sql`CREATE TABLE IF NOT EXISTS langapp_state (
      id integer PRIMARY KEY,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
    const rows = await sql`SELECT data FROM langapp_state WHERE id = 1`;
    if (rows.length && rows[0].data) cache = rows[0].data;
  } catch (err) {
    console.error('[db] Postgres load failed, starting empty:', err.message);
  }
} else if (redisEnabled) {
  try {
    const blob = await redisCommand(['GET', DB_KEY]);
    if (blob) cache = JSON.parse(blob);
  } catch (err) {
    console.error('[db] Redis load failed, starting empty:', err.message);
  }
} else {
  cache = loadFile();
}

let pendingSave = null;

function persistPostgres(data) {
  pendingSave = sql`
    INSERT INTO langapp_state (id, data, updated_at)
    VALUES (1, ${JSON.stringify(data)}::jsonb, now())
    ON CONFLICT (id) DO UPDATE
      SET data = EXCLUDED.data, updated_at = now()
  `;
  pendingSave.catch((err) => console.error('[db] Postgres persist failed:', err.message));
  // Keeps the write alive until it completes, even after the response is sent
  // (no-op outside Vercel).
  waitUntil(pendingSave);
}

function persistRemote(data) {
  pendingSave = redisCommand(['SET', DB_KEY, JSON.stringify(data)]);
  pendingSave.catch((err) => console.error('[db] Redis persist failed:', err.message));
  waitUntil(pendingSave);
}

export const db = {
  /** Resolves when all scheduled remote writes are done (file mode: instant). */
  async flush() {
    if (pendingSave) await pendingSave;
  },
  reload() {
    if (!redisEnabled && !pgEnabled) cache = loadFile();
  },
  persist() {
    if (pgEnabled) persistPostgres(cache);
    else if (redisEnabled) persistRemote(cache);
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

