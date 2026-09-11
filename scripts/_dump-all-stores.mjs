/**
 * Snapshot every reachable LangApp store into database/backups/.
 * Loads .env.production.local if present. Does not print secrets.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const backupDir = join(root, 'database', 'backups');
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(join(root, '.env.production.local'));
loadEnvFile(join(root, '.env.prod-local'));
loadEnvFile(join(root, '.env.vercel'));
loadEnvFile(join(root, '.env.local'));
loadEnvFile(join(root, '.env'));

mkdirSync(backupDir, { recursive: true });

function summarize(data) {
  return {
    users: data?.users?.length ?? 0,
    words: data?.words?.length ?? 0,
    progress: data?.user_word_progress?.length ?? 0,
    sessions: data?.study_sessions?.length ?? 0,
    analytics: data?.analytics?.length ?? 0,
    rev: data?._rev ?? null,
  };
}

function writeSnapshot(label, data) {
  const target = join(backupDir, `langapp-${label}-${stamp}.json`);
  const json = JSON.stringify(data);
  writeFileSync(target, json);
  const mb = (Buffer.byteLength(json) / (1024 * 1024)).toFixed(2);
  console.log(`OK  ${label.padEnd(10)} ${target}`);
  console.log(`    ${mb} MB  ${JSON.stringify(summarize(data))}`);
  return target;
}

const results = [];

const localPath = join(root, 'database', 'langapp.json');
if (existsSync(localPath)) {
  const data = JSON.parse(readFileSync(localPath, 'utf8'));
  const copied = join(backupDir, `langapp-local-${stamp}.json`);
  copyFileSync(localPath, copied);
  const mb = (statSync(copied).size / (1024 * 1024)).toFixed(2);
  console.log(`OK  local      ${copied}`);
  console.log(`    ${mb} MB  ${JSON.stringify(summarize(data))}  mtime=${statSync(localPath).mtime.toISOString()}`);
  results.push('local');
} else {
  console.log('SKIP local     database/langapp.json not found');
}

try {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('UPSTASH_REDIS_REST_* not set');
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['GET', 'langapp:db']),
  });
  if (!res.ok) throw new Error(`Upstash REST ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  if (!json.result) throw new Error('no langapp:db key');
  writeSnapshot('redis', JSON.parse(json.result));
  results.push('redis');
} catch (err) {
  console.log(`FAIL redis     ${err.message}`);
}

function neonUrl(raw) {
  if (!raw) return '';
  let url = String(raw).trim().replace(/^psql\s+/i, '').replace(/^['"]|['"]$/g, '');
  if (url.startsWith('postgres://')) url = `postgresql://${url.slice('postgres://'.length)}`;
  const parsed = new URL(url);
  parsed.searchParams.delete('channel_binding');
  return parsed.toString();
}

try {
  const pgUrl = neonUrl(process.env.POSTGRES_URL || process.env.DATABASE_URL);
  if (!pgUrl) throw new Error('POSTGRES_URL not set');
  try {
    // Validate without printing credentials.
    const parsed = new URL(pgUrl);
    if (!parsed.hostname) throw new Error('missing host');
  } catch (err) {
    throw new Error(`invalid POSTGRES_URL (${err.message})`);
  }
  const sql = neon(pgUrl);
  const rows = await sql`SELECT data, updated_at FROM langapp_state WHERE id = 1`;
  if (!rows.length) throw new Error('langapp_state is empty');
  writeSnapshot('postgres', rows[0].data);
  console.log(`    postgres updated_at=${rows[0].updated_at}`);
  const localCopy = join(root, 'database', 'langapp.json');
  mkdirSync(dirname(localCopy), { recursive: true });
  writeFileSync(localCopy, JSON.stringify(rows[0].data));
  console.log(`    also wrote ${localCopy}`);
  results.push('postgres');
} catch (err) {
  console.log(`FAIL postgres  ${err.message}`);
}

console.log(results.length ? `\nSaved: ${results.join(', ')}` : '\nNothing saved.');
if (!results.length) process.exit(1);
