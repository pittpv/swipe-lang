#!/usr/bin/env node
/**
 * One-time migration: load the LangApp state into Neon Postgres.
 *
 * Sources (by flag):
 *   --from-file   database/langapp.json (default)
 *   --from-redis  the `langapp:db` blob on Upstash Redis
 *                 (needs UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)
 *
 * Target: POSTGRES_URL or DATABASE_URL env var (Neon connection string).
 *
 * Run: npm run migrate:pg [-- --from-redis]
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const args = new Set(process.argv.slice(2));
const source = args.has('--from-redis') ? 'redis' : 'file';

const pgUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!pgUrl) {
  console.error('ERROR: set POSTGRES_URL (or DATABASE_URL) to your Neon connection string first.');
  console.error('  PowerShell: $env:POSTGRES_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"');
  process.exit(1);
}

async function loadFromFile() {
  const path = join(root, 'database', 'langapp.json');
  if (!existsSync(path)) {
    console.error(`ERROR: ${path} not found. Run "npm run import:vocab" first to build a state.`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

async function loadFromRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.error('ERROR: --from-redis needs UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.');
    process.exit(1);
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['GET', 'langapp:db']),
  });
  if (!res.ok) {
    console.error(`ERROR: Upstash REST ${res.status}`);
    process.exit(1);
  }
  const json = await res.json();
  if (!json.result) {
    console.error('ERROR: no `langapp:db` key found in Redis — nothing to migrate.');
    process.exit(1);
  }
  return JSON.parse(json.result);
}

const data = source === 'redis' ? await loadFromRedis() : await loadFromFile();

const sql = neon(pgUrl);
await sql`CREATE TABLE IF NOT EXISTS langapp_state (
  id integer PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
)`;
await sql`
  INSERT INTO langapp_state (id, data, updated_at)
  VALUES (1, ${JSON.stringify(data)}::jsonb, now())
  ON CONFLICT (id) DO UPDATE
    SET data = EXCLUDED.data, updated_at = now()
`;

// Verify round-trip.
const rows = await sql`SELECT data FROM langapp_state WHERE id = 1`;
const saved = rows[0]?.data;
if (!saved || (saved.words?.length ?? 0) !== (data.words?.length ?? 0)) {
  console.error('ERROR: verification failed — stored state does not match the source.');
  process.exit(1);
}

console.log('Migration complete ✔');
console.log(`  users:              ${saved.users?.length ?? 0}`);
console.log(`  words:              ${saved.words?.length ?? 0}`);
console.log(`  user_word_progress: ${saved.user_word_progress?.length ?? 0}`);
console.log(`  study_sessions:     ${saved.study_sessions?.length ?? 0}`);
console.log(`  analytics events:   ${saved.analytics?.length ?? 0}`);
console.log('\nDeploy with POSTGRES_URL set — the app will use Neon automatically.');
