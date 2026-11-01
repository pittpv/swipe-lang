/**
 * Build English / Spanish association files from the hand-written banks and
 * write them next to the vocabulary pack, where import-vocabulary.js loads
 * them exactly like the Turkish file.
 *
 *   node server/scripts/generate-associations-enes.js
 *   node server/scripts/generate-associations-enes.js --lang=es --dry
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { parseCsvFile } from '../lib/csv-parse.js';
import { normalizeKey, tupleToAssociation, validateAssociation } from './lib/enes-association.js';
import { EN_A1 } from './vocab-banks/assoc-en-a1.js';
import { ES_A1 } from './vocab-banks/assoc-es-a1.js';

const dataRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');

export const PACKS = {
  en: { dir: 'vocabulary-en', csv: 'vocabulary-EnglishFile.csv', level: 'A1', bank: EN_A1 },
  es: { dir: 'vocabulary-es', csv: 'vocabulary-AulaPlus.csv', level: 'A1', bank: ES_A1 },
};

function loadRows(pack) {
  const merged = new Map();
  const rows = parseCsvFile(readFileSync(join(dataRoot, pack.dir, pack.csv), 'utf8'));
  for (const row of rows) {
    const lemma = (row['Слово'] || '').trim();
    if (lemma) merged.set(normalizeKey(lemma), row);
  }
  return merged;
}

/** @returns {{ entries: Record<string, object>, errors: string[], stats: object }} */
export function buildPack(lang) {
  const pack = PACKS[lang];
  const rows = loadRows(pack);
  const entries = {};
  const errors = [];
  const stats = { keyword: 0, cognate: 0, usage: 0 };

  for (const tuple of pack.bank) {
    const key = normalizeKey(tuple[0]);
    const row = rows.get(key);
    if (!row) {
      errors.push(`${tuple[0]}: not in dictionary`);
      continue;
    }
    if ((row['Курс'] || '').toUpperCase() !== pack.level) {
      errors.push(`${tuple[0]}: not ${pack.level}`);
      continue;
    }
    if (entries[key]) {
      errors.push(`${tuple[0]}: duplicate`);
      continue;
    }
    const association = tupleToAssociation(tuple);
    const problems = validateAssociation(association, {
      lemma: row['Слово'],
      translation: row['Перевод'],
    });
    if (problems.length) {
      errors.push(`${tuple[0]}: ${problems.join(',')}`);
      continue;
    }
    entries[key] = association;
    stats[association.kind] += 1;
  }

  const levelRows = [...rows.entries()].filter(([, row]) => (row['Курс'] || '').toUpperCase() === pack.level);
  const missing = levelRows.filter(([key]) => !entries[key]).map(([, row]) => row['Слово']);
  return {
    entries,
    errors,
    stats: { ...stats, authored: Object.keys(entries).length, levelTotal: levelRows.length, missing },
  };
}

function main() {
  const dry = process.argv.includes('--dry');
  const langArg = process.argv.find((a) => a.startsWith('--lang='));
  const langs = langArg ? [langArg.slice('--lang='.length)] : Object.keys(PACKS);
  let failed = false;

  for (const lang of langs) {
    if (!PACKS[lang]) {
      console.error(`Unknown --lang=${lang}. Use ${Object.keys(PACKS).join(', ')}`);
      process.exit(1);
    }
    const { entries, errors, stats } = buildPack(lang);
    const sorted = Object.fromEntries(Object.entries(entries).sort(([a], [b]) => a.localeCompare(b, lang)));
    const outPath = join(dataRoot, PACKS[lang].dir, 'associations.json');
    if (!dry && !errors.length) writeFileSync(outPath, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8');
    const { missing, ...counts } = stats;
    console.log(lang, JSON.stringify({ ...counts, left: missing.length, errors: errors.length, dry }));
    if (errors.length) {
      failed = true;
      for (const line of errors) console.log(`  ERROR ${line}`);
    }
  }
  if (failed) process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
