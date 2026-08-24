import { readFileSync } from 'fs';
import { neon } from '@neondatabase/serverless';

const url = process.env.POSTGRES_URL;
const sql = neon(url);
const row = (await sql`SELECT data FROM langapp_state WHERE id = 1`)[0]?.data;
console.log('users:', row.users.length);
for (const u of row.users) {
  console.log(`  id=${u.id} email=${u.email} created=${u.created_at} hash=${u.password_hash?.slice(0, 10)}... len=${u.password_hash?.length}`);
}
const upd = row.updated_at ?? 'n/a';
console.log('state updated_at:', upd);
