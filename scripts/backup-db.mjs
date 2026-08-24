/**
 * Backup database/langapp.json into database/backups/.
 * Keeps the last BACKUP_KEEP snapshots (default 14).
 * Run: npm run backup
 */
import { copyFileSync, mkdirSync, readdirSync, unlinkSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const source = join(root, 'database', 'langapp.json');
const backupDir = join(root, 'database', 'backups');
const keep = Number(process.env.BACKUP_KEEP ?? 14);

if (!existsSync(source)) {
  console.error(`Backup failed: source not found: ${source}`);
  process.exit(1);
}

mkdirSync(backupDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const target = join(backupDir, `langapp-${stamp}.json`);
copyFileSync(source, target);

// Prune old snapshots (sorted names == sorted timestamps).
const files = readdirSync(backupDir)
  .filter((f) => f.startsWith('langapp-') && f.endsWith('.json'))
  .sort();
while (files.length > keep) {
  unlinkSync(join(backupDir, files.shift()));
}

console.log(`Backup created: ${target} (${files.length}/${keep} kept)`);