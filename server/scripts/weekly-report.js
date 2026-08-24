import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { db } from '../database.js';
import { buildAnalyticsDashboard, formatWeeklyReport } from '../analytics-report.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', '..', '..', 'ai', 'memory-bank', 'analytics');

mkdirSync(outDir, { recursive: true });

const dashboard = buildAnalyticsDashboard(db);
const report = formatWeeklyReport(dashboard);
const stamp = new Date().toISOString().slice(0, 10);

writeFileSync(join(outDir, `weekly-${stamp}.md`), report, 'utf8');
console.log(report);
console.log(`\nSaved: ai/memory-bank/analytics/weekly-${stamp}.md`);
