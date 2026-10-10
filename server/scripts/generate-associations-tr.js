/**
 * Build Turkish association rows and write them next to the vocabulary pack.
 *
 *   node server/scripts/generate-associations-tr.js
 *   node server/scripts/generate-associations-tr.js --level A1 --force
 *   node server/scripts/generate-associations-tr.js --dry
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { parseCsvFile } from '../lib/csv-parse.js';
import { normalizeKey, planAssociation } from './lib/tr-association.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packDir = join(__dirname, '..', 'data', 'vocabulary');
const outPath = join(packDir, 'associations.json');

function parseArgs(argv) {
  const out = { level: 'A1', force: false, dry: false };
  for (const arg of argv) {
    if (arg === '--force') out.force = true;
    else if (arg === '--dry') out.dry = true;
    else if (arg.startsWith('--level=')) out.level = arg.slice('--level='.length).toUpperCase();
  }
  return out;
}

function loadRows() {
  const merged = new Map();
  for (const file of ['vocabulary-Eski.csv', 'vocabulary-Yeni.csv']) {
    for (const row of parseCsvFile(readFileSync(join(packDir, file), 'utf8'))) {
      const lemma = (row['Слово'] || '').trim();
      if (!lemma) continue;
      merged.set(normalizeKey(lemma), row);
    }
  }
  return merged;
}

function loadExisting() {
  try {
    const data = JSON.parse(readFileSync(outPath, 'utf8'));
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const rows = loadRows();
  const existing = args.force ? {} : loadExisting();
  const next = { ...existing };
  const stats = { keyword: 0, cognate: 0, usage: 0, kept: 0, missed: 0 };
  const missed = [];
  const fresh = [];

  for (const [key, row] of rows) {
    if ((row['Курс'] || '').toUpperCase() !== args.level) continue;
    if (!args.force && existing[key]) {
      stats.kept += 1;
      continue;
    }
    const word = {
      lemma: row['Слово'].trim(),
      translation: (row['Перевод'] || '').trim(),
      type: row['Тип'] || '',
    };
    const { association, errors } = planAssociation(word);
    if (!association) {
      stats.missed += 1;
      missed.push(`${word.lemma} | ${word.translation} | ${errors.join(',')}`);
      continue;
    }
    next[key] = association;
    stats[association.kind] += 1;
    fresh.push(word.lemma);
  }

  const sorted = Object.fromEntries(Object.entries(next).sort(([a], [b]) => a.localeCompare(b, 'tr')));
  if (!args.dry) {
    writeFileSync(outPath, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8');
  }

  console.log(JSON.stringify({ ...stats, written: Object.keys(sorted).length, dry: args.dry }, null, 2));
  if (missed.length) {
    console.log('MISSED');
    for (const line of missed) console.log(line);
  }
  console.log('SAMPLE');
  for (const lemma of fresh.slice(0, 25)) {
    const key = normalizeKey(lemma);
    const row = sorted[key];
    if (!row) continue;
    const tail = row.kind === 'keyword'
      ? `${row.phonetic} → ${row.hooks.join('+')} | ${row.image}`
      : row.kind === 'cognate'
        ? `похоже на ${row.hooks[0]}`
        : row.image;
    console.log(`${row.kind}\t${lemma}\t${tail}`);
  }
}

main();
