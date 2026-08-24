import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.prod-local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^"|"$/g, '')]),
);
const res = await fetch(env.UPSTASH_REDIS_REST_URL, {
  method: 'POST',
  headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(['GET', 'langapp:db']),
});
const { result } = await res.json();
if (!result) { console.log('no redis dump'); process.exit(0); }
const db = JSON.parse(result);
for (const u of db.users) {
  const sub = u.push_subscription;
  console.log(JSON.stringify({
    id: u.id,
    email: u.email,
    reminder_time: u.reminder_time,
    push_schedule_id: u.push_schedule_id,
    orphan_schedule_ids: u.orphan_schedule_ids ?? null,
    endpoint_host: sub?.endpoint ? new URL(sub.endpoint).host : null,
    has_keys: Boolean(sub?.keys?.p256dh),
  }));
}
