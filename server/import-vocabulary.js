import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseCsvFile } from './lib/csv-parse.js';
import { db } from './database.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, 'data', 'vocabulary');

/** Bump when examples/forms CSV shape or attach logic changes. */
export const VOCAB_EXTRAS_VERSION = 1;

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
    examples: '[]',
    forms: '[]',
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

/** @returns {Map<string, Array<{example: string, translate: string}>>} */
function loadExamplesBySourceId() {
  const path = join(dataDir, 'examples.csv');
  const map = new Map();
  if (!existsSync(path)) return map;
  for (const row of parseCsvFile(readFileSync(path, 'utf8'))) {
    const wordId = String(row.word_id || '').trim();
    const example = String(row.example || '').trim();
    const translate = String(row.translate || '').trim();
    if (!wordId || !example) continue;
    if (!map.has(wordId)) map.set(wordId, []);
    map.get(wordId).push({ example, translate });
  }
  return map;
}

/** @returns {Map<string, Array<{form: string, grammar: string, person: string, tense: string}>>} */
function loadFormsBySourceId() {
  const path = join(dataDir, 'forms.csv');
  const map = new Map();
  if (!existsSync(path)) return map;
  for (const row of parseCsvFile(readFileSync(path, 'utf8'))) {
    const wordId = String(row.word_id || '').trim();
    const form = String(row.form || '').trim();
    if (!wordId || !form) continue;
    if (!map.has(wordId)) map.set(wordId, []);
    map.get(wordId).push({
      form,
      grammar: String(row.grammar || '').trim(),
      person: String(row.person || '').trim(),
      tense: String(row.tense || '').trim(),
    });
  }
  return map;
}

function attachExtras(word, examplesBySource, formsBySource) {
  const sid = word.source_id != null ? String(word.source_id) : '';
  const examples = sid && examplesBySource.has(sid) ? examplesBySource.get(sid) : [];
  const forms = word.pos === 'verb' && sid && formsBySource.has(sid) ? formsBySource.get(sid) : [];
  word.examples = JSON.stringify(examples);
  word.forms = JSON.stringify(forms);
}

/**
 * Sync examples/forms from CSV onto existing word rows (by source_id).
 * Safe for live DBs — does not touch user progress.
 */
export function enrichVocabularyExtras({ force = false } = {}) {
  if (!force && db.data._vocabExtrasVersion === VOCAB_EXTRAS_VERSION) {
    return { updated: 0, skipped: true, version: VOCAB_EXTRAS_VERSION };
  }

  const examplesBySource = loadExamplesBySourceId();
  const formsBySource = loadFormsBySourceId();
  let updated = 0;

  for (const word of db.data.words) {
    const prevEx = word.examples;
    const prevForms = word.forms;
    attachExtras(word, examplesBySource, formsBySource);
    if (word.examples !== prevEx || word.forms !== prevForms) updated++;
  }

  db.data._vocabExtrasVersion = VOCAB_EXTRAS_VERSION;
  db.persist();

  return {
    updated,
    skipped: false,
    version: VOCAB_EXTRAS_VERSION,
    exampleSources: examplesBySource.size,
    formSources: formsBySource.size,
  };
}

export function importVocabulary({ replace = false } = {}) {
  const eski = loadCsv('vocabulary-Eski.csv');
  const yeni = loadCsv('vocabulary-Yeni.csv');
  const examplesBySource = loadExamplesBySourceId();
  const formsBySource = loadFormsBySourceId();

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
  for (const word of words) {
    attachExtras(word, examplesBySource, formsBySource);
  }

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

  // Refresh extras on all rows (including pre-existing) after import.
  for (const word of db.data.words) {
    attachExtras(word, examplesBySource, formsBySource);
  }
  db.data._vocabExtrasVersion = VOCAB_EXTRAS_VERSION;

  db.persist();

  return {
    eskiRows: eski.length,
    yeniRows: yeni.length,
    mergedUnique: words.length,
    added,
    total: db.data.words.length,
    exampleSources: examplesBySource.size,
    formSources: formsBySource.size,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const replace = process.argv.includes('--replace');
  const stats = importVocabulary({ replace });
  console.log('Vocabulary import complete:', stats);
}
