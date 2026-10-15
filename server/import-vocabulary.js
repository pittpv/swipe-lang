import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseCsvFile } from './lib/csv-parse.js';
import { db, dbMode } from './database.js';
import { LANG_PAIRS, isLangPair, normalizeLangPair, wordLangPair } from './lang-pairs.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataRoot = join(__dirname, 'data');

/** Bump when examples/forms/associations shape or attach key changes. */
export const VOCAB_EXTRAS_VERSION = 3;

const POS_MAP = {
  İSİMLER: 'noun',
  ISIMLER: 'noun',
  FİİLLER: 'verb',
  FIILLER: 'verb',
  SIFATLAR: 'adjective',
  ZARFLAR: 'adverb',
  ZAMİRLER: 'pronoun',
  'EDATLAR / BAĞLAÇLAR': 'particle',
  'KALIP İFADELER': 'other',
  'DİĞER KELİMELER': 'other',
};

const VOCAB_PACKS = [
  {
    lang_pair: 'tr-ru',
    dir: 'vocabulary',
    files: [
      { file: 'vocabulary-Eski.csv', source: 'eski' },
      { file: 'vocabulary-Yeni.csv', source: 'yeni' },
    ],
  },
  {
    lang_pair: 'en-ru',
    dir: 'vocabulary-en',
    files: [{ file: 'vocabulary-EnglishFile.csv', source: 'english-file' }],
  },
  {
    lang_pair: 'es-ru',
    dir: 'vocabulary-es',
    files: [{ file: 'vocabulary-AulaPlus.csv', source: 'aula-plus' }],
  },
];

/**
 * Some Turkish exports store dotted i as U+0069 plus U+0307 COMBINING DOT ABOVE.
 * The letter already has a tittle, so the card draws two dots. Strip only that
 * mark. Do not lowercase here: İ must stay İ, and toLowerCase("İ") is i+U+0307.
 */
export function normalizeLemmaText(text) {
  return String(text ?? '').replace(/\u0307/g, '').trim();
}

function normalizeKey(lemma) {
  return normalizeLemmaText(lemma).toLowerCase();
}

function mapPos(tip) {
  if (!tip) return 'other';
  const upper = tip.toUpperCase();
  return POS_MAP[tip] ?? POS_MAP[upper] ?? 'other';
}

function rowToWord(row, source, langPair) {
  const lemma = normalizeLemmaText(row['Слово']);
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
    lang_pair: langPair,
  };
}

function packDir(pack) {
  return join(dataRoot, pack.dir);
}

function loadCsv(pack, filename) {
  const path = join(packDir(pack), filename);
  if (!existsSync(path)) {
    throw new Error(`Missing vocabulary file: ${path}`);
  }
  return parseCsvFile(readFileSync(path, 'utf8'));
}

/** @returns {Map<string, Array<{example: string, translate: string}>>} */
function loadExamplesBySourceId(pack) {
  const path = join(packDir(pack), 'examples.csv');
  const map = new Map();
  if (!existsSync(path)) return map;
  for (const row of parseCsvFile(readFileSync(path, 'utf8'))) {
    const wordId = String(row.word_id || '').trim();
    const example = normalizeLemmaText(row.example);
    const translate = normalizeLemmaText(row.translate);
    if (!wordId || !example) continue;
    if (!map.has(wordId)) map.set(wordId, []);
    map.get(wordId).push({ example, translate });
  }
  return map;
}

/** @returns {Map<string, Array<{form: string, grammar: string, person: string, tense: string}>>} */
function loadFormsBySourceId(pack) {
  const path = join(packDir(pack), 'forms.csv');
  const map = new Map();
  if (!existsSync(path)) return map;
  for (const row of parseCsvFile(readFileSync(path, 'utf8'))) {
    const wordId = String(row.word_id || '').trim();
    const form = normalizeLemmaText(row.form);
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

/**
 * Association lookup. Strip U+0307 after toLowerCase so i̇skele, iskele, and
 * İngiliz (whose default lowercase is i+U+0307) share one key. Word ids use
 * normalizeKey instead and must keep that İ lowercase, or progress ids move.
 */
function normalizeLemmaKey(lemma) {
  return String(lemma || '').toLowerCase().replace(/\u0307/g, '').trim();
}

function loadAssociations(pack) {
  const path = join(packDir(pack), 'associations.json');
  const map = new Map();
  if (!existsSync(path)) return map;
  const data = JSON.parse(readFileSync(path, 'utf8'));
  if (!data || typeof data !== 'object' || Array.isArray(data)) return map;
  for (const [lemma, entry] of Object.entries(data)) {
    if (!entry || typeof entry !== 'object') continue;
    const key = normalizeLemmaKey(lemma);
    // Prefer the entry stored without the spurious dot when both exist (iç).
    if (lemma.includes('\u0307') && map.has(key)) continue;
    map.set(key, entry);
  }
  return map;
}

function encodeAssociation(entry) {
  return JSON.stringify({
    kind: entry.kind,
    phonetic: entry.phonetic || '',
    hooks: Array.isArray(entry.hooks) ? entry.hooks : [],
    image: entry.image || '',
  });
}

function attachExtras(word, examplesBySource, formsBySource, associationsByLemma) {
  const sid = word.source_id != null ? String(word.source_id) : '';
  const examples = sid && examplesBySource.has(sid) ? examplesBySource.get(sid) : [];
  const forms = word.pos === 'verb' && sid && formsBySource.has(sid) ? formsBySource.get(sid) : [];
  word.examples = JSON.stringify(examples);
  word.forms = JSON.stringify(forms);
  const entry = associationsByLemma?.get?.(normalizeLemmaKey(word.lemma)) || null;
  word.association = entry ? encodeAssociation(entry) : 'null';
}

function extrasByPair() {
  const map = new Map();
  for (const pack of VOCAB_PACKS) {
    map.set(pack.lang_pair, {
      examples: loadExamplesBySourceId(pack),
      forms: loadFormsBySourceId(pack),
      associations: loadAssociations(pack),
    });
  }
  return map;
}

function attachWordExtras(word, byPair) {
  const extras = byPair.get(wordLangPair(word));
  if (!extras) return;
  attachExtras(word, extras.examples, extras.forms, extras.associations);
}

function packsForPairs(pairs) {
  const wanted = new Set((pairs?.length ? pairs : LANG_PAIRS).map(normalizeLangPair));
  return VOCAB_PACKS.filter((p) => wanted.has(p.lang_pair));
}

const CEFR_RANK = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4, C2: 5 };

function earlierCefr(a, b) {
  return (CEFR_RANK[a] ?? 99) <= (CEFR_RANK[b] ?? 99) ? a : b;
}

/**
 * Last row wins, except a dotted duplicate (i + U+0307) must not push the
 * word out of the earlier course. A1 was only seeing iskele because of that
 * extra mark; after it collapses into the plain lemma the card stays on A1.
 */
function upsertLemma(merged, word, fromDot) {
  const key = normalizeKey(word.lemma);
  const prev = merged.get(key);
  if (!prev) {
    if (fromDot) word._fromDot = true;
    merged.set(key, word);
    return;
  }
  if (!prev._fromDot && !fromDot) {
    merged.set(key, word);
    return;
  }
  const cefr = earlierCefr(prev.cefr_level, word.cefr_level);
  if (fromDot && !prev._fromDot) {
    prev.cefr_level = cefr;
    prev._fromDot = true;
    return;
  }
  word.cefr_level = cefr;
  word._fromDot = true;
  merged.set(key, word);
}

export function loadPackWords(pack) {
  const merged = new Map();
  const rowCounts = {};
  for (const { file, source } of pack.files) {
    const rows = loadCsv(pack, file);
    rowCounts[source] = rows.length;
    for (const row of rows) {
      const raw = row['Слово']?.trim() || '';
      const word = rowToWord(row, source, pack.lang_pair);
      if (!word) continue;
      upsertLemma(merged, word, raw.includes('\u0307'));
    }
  }
  for (const word of merged.values()) delete word._fromDot;
  return { words: [...merged.values()], rowCounts };
}

export function missingVocabPairs() {
  const present = new Set((db.data.words || []).map((w) => wordLangPair(w)));
  return LANG_PAIRS.filter((p) => !present.has(p));
}

function wordMapKey(pair, lemma) {
  return `${normalizeLangPair(pair)}:${normalizeKey(lemma)}`;
}

export function buildWordIdMap(words) {
  const map = {};
  for (const w of words || []) {
    if (w?.id == null || !w.lemma) continue;
    map[wordMapKey(wordLangPair(w), w.lemma)] = w.id;
  }
  return map;
}

/**
 * Load TR/EN/ES dictionaries from CSV into memory. IDs stay stable via
 * `_wordIdMap` and any previously embedded `words` rows (one-time migration).
 * Does not persist the dictionary itself.
 */
export function hydrateVocabulary({ persist = false } = {}) {
  const byPair = extrasByPair();
  const incoming = [];
  for (const pack of VOCAB_PACKS) {
    const { words } = loadPackWords(pack);
    const extras = byPair.get(pack.lang_pair);
    for (const word of words) {
      if (extras) attachExtras(word, extras.examples, extras.forms, extras.associations);
      incoming.push(word);
    }
  }

  const idMap = { ...(db.data._wordIdMap || {}), ...buildWordIdMap(db.data.words) };
  const knownIds = Object.values(idMap).map(Number).filter((n) => Number.isFinite(n));
  let maxId = Math.max(0, db.data._seq?.words ?? 0, ...knownIds);

  const hydrated = incoming.map((word) => {
    const key = wordMapKey(word.lang_pair, word.lemma);
    let id = idMap[key];
    if (id == null) {
      maxId += 1;
      id = maxId;
      idMap[key] = id;
    }
    return { id, ...word };
  });

  if (!db.data._seq) db.data._seq = {};
  db.data.words = hydrated;
  db.data._wordIdMap = idMap;
  db.data._seq.words = maxId;
  db.data._vocabExtrasVersion = VOCAB_EXTRAS_VERSION;
  if (persist) db.persist();
  return { total: hydrated.length, mapped: Object.keys(idMap).length };
}

/**
 * Sync examples/forms from CSV onto existing word rows.
 * Keyed by (lang_pair, source_id) so EN/ES/TR numeric ids never mix.
 * Safe for live DBs — does not touch user progress.
 */
export function enrichVocabularyExtras({ force = false } = {}) {
  if (!force && db.data._vocabExtrasVersion === VOCAB_EXTRAS_VERSION) {
    return { updated: 0, skipped: true, version: VOCAB_EXTRAS_VERSION };
  }

  const byPair = extrasByPair();
  let updated = 0;
  let exampleSources = 0;
  let formSources = 0;
  for (const extras of byPair.values()) {
    exampleSources += extras.examples.size;
    formSources += extras.forms.size;
  }

  for (const word of db.data.words) {
    const prevEx = word.examples;
    const prevForms = word.forms;
    const prevAssociation = word.association;
    attachWordExtras(word, byPair);
    if (word.examples !== prevEx || word.forms !== prevForms || word.association !== prevAssociation) updated++;
  }

  db.data._vocabExtrasVersion = VOCAB_EXTRAS_VERSION;
  if (dbMode === 'file') db.persist();

  return {
    updated,
    skipped: false,
    version: VOCAB_EXTRAS_VERSION,
    exampleSources,
    formSources,
  };
}

export function importVocabulary({ replace = false, pairs } = {}) {
  const packs = packsForPairs(pairs);
  if (!packs.length) {
    throw new Error('No vocabulary packs to import');
  }

  const byPair = extrasByPair();
  const incoming = [];
  const packStats = {};

  for (const pack of packs) {
    const { words, rowCounts } = loadPackWords(pack);
    const extras = byPair.get(pack.lang_pair);
    for (const word of words) {
      if (extras) attachExtras(word, extras.examples, extras.forms, extras.associations);
    }
    incoming.push(...words);
    packStats[pack.lang_pair] = { unique: words.length, ...rowCounts };
  }

  const pairSet = new Set(packs.map((p) => p.lang_pair));

  if (replace) {
    if (pairSet.size >= LANG_PAIRS.length) {
      db.data.words = [];
      db.data._seq.words = 0;
    } else {
      db.data.words = db.data.words.filter((w) => !pairSet.has(wordLangPair(w)));
    }
  }

  const existing = new Set(db.data.words.map((w) => `${wordLangPair(w)}:${normalizeKey(w.lemma)}`));
  let added = 0;

  for (const word of incoming) {
    const key = `${word.lang_pair}:${normalizeKey(word.lemma)}`;
    if (existing.has(key)) continue;
    db.data.words.push({ id: db.nextId('words'), ...word });
    existing.add(key);
    added++;
  }

  for (const word of db.data.words) {
    if (!pairSet.has(wordLangPair(word))) continue;
    attachWordExtras(word, byPair);
  }
  db.data._vocabExtrasVersion = VOCAB_EXTRAS_VERSION;
  if (dbMode === 'file') db.persist();

  return {
    added,
    total: db.data.words.length,
    packs: packStats,
    exampleSources: [...byPair.values()].reduce((n, e) => n + e.examples.size, 0),
    formSources: [...byPair.values()].reduce((n, e) => n + e.forms.size, 0),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const replace = process.argv.includes('--replace');
  const pairFlag = process.argv.find((a) => a.startsWith('--pair='));
  const rawPair = pairFlag ? pairFlag.slice('--pair='.length) : null;
  if (rawPair && !isLangPair(rawPair)) {
    console.error(`Unknown --pair=${rawPair}. Use ${LANG_PAIRS.join(', ')}`);
    process.exit(1);
  }
  const stats = importVocabulary({
    replace,
    pairs: rawPair ? [normalizeLangPair(rawPair)] : undefined,
  });
  console.log('Vocabulary import complete:', stats);
}
