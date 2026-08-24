import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseCsvFile } from './lib/csv-parse.js';
import { db } from './database.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, 'data', 'vocabulary');

const POS_MAP = {
  İSİMLER: 'noun',
  ISIMLER: 'noun',
  FİİLLER: 'verb',
  FIILLER: 'verb',
  SIFATLAR: 'adjective',
  ZARFLAR: 'adverb',
  ZAMİRLER: 'pronoun',
  'EDATLAR / BAĞLAÇLAR': 'particle',
  'DİĞER KELİMELER': 'other',
};

function normalizeKey(lemma) {
  return lemma.toLowerCase().trim();
}

function mapPos(tip) {
  if (!tip) return 'other';
  const upper = tip.toUpperCase();
  return POS_MAP[tip] ?? POS_MAP[upper] ?? 'other';
}

function rowToWord(row, source) {
  const lemma = row['Слово']?.trim();
  const translation = row['Перевод']?.trim();
  if (!lemma || !translation) return null;

  const cefr = (row['Курс'] || 'A1').toUpperCase();
  const unit = row['Урок'] || '';
  const pos = mapPos(row['Тип']);

  return {
    lemma,
    translation,
    pos,
    cefr_level: cefr,
    unit,
    source,
    source_id: row.id ? Number(row.id) : null,
    examples: JSON.stringify([lemma, translation.split(',')[0].trim()]),
    lang_pair: 'tr-ru',
  };
}

function loadCsv(filename) {
  const path = join(dataDir, filename);
  if (!existsSync(path)) {
    throw new Error(`Missing vocabulary file: ${path}`);
  }
  return parseCsvFile(readFileSync(path, 'utf8'));
}

export function importVocabulary({ replace = false } = {}) {
  const eski = loadCsv('vocabulary-Eski.csv');
  const yeni = loadCsv('vocabulary-Yeni.csv');

  const merged = new Map();

  for (const row of eski) {
    const word = rowToWord(row, 'eski');
    if (word) merged.set(normalizeKey(word.lemma), word);
  }

  for (const row of yeni) {
    const word = rowToWord(row, 'yeni');
    if (word) merged.set(normalizeKey(word.lemma), word);
  }

  const words = [...merged.values()];

  if (replace) {
    db.data.words = [];
    db.data._seq.words = 0;
  }

  const existing = new Set(db.data.words.map((w) => `${w.lang_pair}:${normalizeKey(w.lemma)}`));
  let added = 0;

  for (const word of words) {
    const key = `${word.lang_pair}:${normalizeKey(word.lemma)}`;
    if (existing.has(key)) continue;
    db.data.words.push({ id: db.nextId('words'), ...word });
    existing.add(key);
    added++;
  }

  db.persist();

  return {
    eskiRows: eski.length,
    yeniRows: yeni.length,
    mergedUnique: words.length,
    added,
    total: db.data.words.length,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const replace = process.argv.includes('--replace');
  const stats = importVocabulary({ replace });
  console.log('Vocabulary import complete:', stats);
}
