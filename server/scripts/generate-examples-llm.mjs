/**
 * Generate natural EN/ES example sentences + Russian translations via OpenAI.
 * Reads OPENAI_API_KEY from an env file (never writes the key into this repo).
 *
 *   node server/scripts/generate-examples-llm.mjs --env-file "C:\path\to\.env"
 *   node server/scripts/generate-examples-llm.mjs --lang en --limit 20
 */
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { parseCsvFile } from '../lib/csv-parse.js';
import { csvRow } from './lib/csv-util.js';
import { conjugateEnglish } from './lib/conjugate-en.js';
import { conjugateSpanish } from './lib/conjugate-es.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataRoot = join(__dirname, '..', 'data');

const POS_HINT = {
  İSİMLER: 'noun',
  FİİLLER: 'verb',
  SIFATLAR: 'adjective',
  ZARFLAR: 'adverb',
  ZAMİRLER: 'pronoun',
  'EDATLAR / BAĞLAÇLAR': 'preposition or conjunction',
  'KALIP İFADELER': 'fixed phrase',
  'DİĞER KELİMELER': 'function word (article, particle, interjection)',
};

function parseArgs(argv) {
  const out = { envFile: '', lang: 'all', limit: 0, concurrency: 5, batch: 20 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === '--env-file' && next) { out.envFile = next; i++; }
    else if (a === '--lang' && next) { out.lang = next; i++; }
    else if (a === '--limit' && next) { out.limit = Number(next) || 0; i++; }
    else if (a === '--concurrency' && next) { out.concurrency = Number(next) || 5; i++; }
    else if (a === '--batch' && next) { out.batch = Number(next) || 20; i++; }
  }
  return out;
}

function loadEnvFile(path) {
  const env = {};
  const text = readFileSync(path, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 1) continue;
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[t.slice(0, eq).trim()] = val;
  }
  return env;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function cachePath(lang) {
  return join(dataRoot, `vocabulary-${lang}`, 'examples-llm.json');
}

function loadCache(lang) {
  try {
    return JSON.parse(readFileSync(cachePath(lang), 'utf8'));
  } catch {
    return {};
  }
}

function saveCache(lang, cache) {
  const dir = join(dataRoot, `vocabulary-${lang}`);
  mkdirSync(dir, { recursive: true });
  const tmp = `${cachePath(lang)}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(cache)}\n`, 'utf8');
  writeFileSync(cachePath(lang), readFileSync(tmp, 'utf8'), 'utf8');
}

function loadWords(lang) {
  const vocabName = lang === 'en' ? 'vocabulary-EnglishFile.csv' : 'vocabulary-AulaPlus.csv';
  const rows = parseCsvFile(readFileSync(join(dataRoot, `vocabulary-${lang}`, vocabName), 'utf8'));
  return rows.map((r) => ({
    id: r.id,
    lemma: r['Слово'],
    translation: r['Перевод'],
    pos: r['Тип'],
    cefr: r['Курс'],
  }));
}

function lemmaUsed(lemma, example, lang) {
  const text = String(example || '').toLowerCase();
  const raw = String(lemma || '').toLowerCase().trim();
  if (!raw || !text) return false;
  if (text.includes(raw)) return true;
  const first = raw.split(/\s+/)[0];
  if (first.length >= 3 && text.includes(first)) return true;
  if (lang === 'en' && first.length >= 4) {
    const stem = first.replace(/(e|ed|ing|s|es|ies)$/, '');
    if (stem.length >= 4 && text.includes(stem)) return true;
  }
  if (lang === 'es' && first.length >= 4) {
    const stem = first.replace(/(ar|er|ir|arse|erse|irse)$/, '');
    if (stem.length >= 3 && text.includes(stem)) return true;
  }
  try {
    const forms = lang === 'es' ? conjugateSpanish(raw) : conjugateEnglish(raw);
    return forms.some((f) => {
      const token = String(f.form || '').toLowerCase().split(/\s+/).pop();
      return token && token.length >= 2 && text.includes(token);
    });
  } catch {
    return false;
  }
}

function hasCyrillic(s) {
  return /[а-яё]/i.test(s);
}

function systemPrompt(lang) {
  const target = lang === 'en' ? 'English' : 'Spanish';
  return `You write original example sentences for a Russian-speaking adult learning ${target}.
Return JSON: {"items":[{"lemma":"...","example":"...","translate":"..."}]}.
Rules:
- One short everyday sentence per lemma (5–14 words).
- The sentence MUST use that lemma (or a natural inflected/conjugated form).
- Match CEFR: A1/A2 very simple; B1 natural; B2+ a bit richer but still spoken.
- translate = grammatically correct Russian of the WHOLE sentence (cases, agreement). Do not paste the dictionary gloss unchanged if it does not fit.
- Verbs: finite everyday form, not "I need to VERB" / "Necesito VERB" templates.
- Function words (articles, prepositions, pronouns): a typical real context.
- No textbook clones, no "This is the X", "Remember this word", "Esto es X", "Necesito X".
- No quotes around the target word. No meta comments.
- Keep example and translate free of the pipe character.`;
}

function userPrompt(lang, batch) {
  const target = lang === 'en' ? 'English' : 'Spanish';
  const lines = batch.map((w) => (
    `- lemma: ${w.lemma} | pos: ${POS_HINT[w.pos] || w.pos} | cefr: ${w.cefr} | ru: ${w.translation}`
  ));
  return `Create ${target} examples for these lemmas:\n${lines.join('\n')}`;
}

async function chat(apiKey, model, messages, attempt = 0) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.5,
      response_format: { type: 'json_object' },
      messages,
    }),
  });
  if (res.status === 429 || res.status >= 500) {
    if (attempt >= 6) throw new Error(`OpenAI ${res.status}`);
    const wait = Math.min(20000, 800 * 2 ** attempt);
    await sleep(wait);
    return chat(apiKey, model, messages, attempt + 1);
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI ${res.status}: ${body.slice(0, 400)}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '{}';
  return JSON.parse(text);
}

async function generateBatch(apiKey, model, lang, batch) {
  const data = await chat(apiKey, model, [
    { role: 'system', content: systemPrompt(lang) },
    { role: 'user', content: userPrompt(lang, batch) },
  ]);
  const items = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];
  const byLemma = new Map();
  for (const item of items) {
    const lemma = String(item.lemma || '').toLowerCase().trim();
    const example = String(item.example || '').trim().replace(/\s+/g, ' ');
    const translate = String(item.translate || '').trim().replace(/\s+/g, ' ');
    if (!lemma || !example || !translate) continue;
    if (example.length > 160 || translate.length > 180) continue;
    if (!hasCyrillic(translate)) continue;
    byLemma.set(lemma, { example, translate });
  }
  const missing = [];
  const ok = {};
  for (const w of batch) {
    const hit = byLemma.get(w.lemma.toLowerCase().trim());
    if (hit && lemmaUsed(w.lemma, hit.example, lang)) ok[w.lemma.toLowerCase()] = hit;
    else missing.push(w);
  }
  if (!missing.length) return ok;

  const retry = await chat(apiKey, model, [
    { role: 'system', content: systemPrompt(lang) },
    {
      role: 'user',
      content: `${userPrompt(lang, missing)}\n\nThese failed last time. Use the lemma naturally. Russian must be a full sentence.`,
    },
  ]);
  const retryItems = Array.isArray(retry.items) ? retry.items : [];
  for (const item of retryItems) {
    const lemma = String(item.lemma || '').toLowerCase().trim();
    const example = String(item.example || '').trim().replace(/\s+/g, ' ');
    const translate = String(item.translate || '').trim().replace(/\s+/g, ' ');
    if (!lemma || !example || !translate || !hasCyrillic(translate)) continue;
    if (example.length > 160) continue;
    const word = missing.find((w) => w.lemma.toLowerCase() === lemma);
    if (word && lemmaUsed(word.lemma, example, lang)) ok[lemma] = { example, translate };
  }
  return ok;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function mapPool(items, limit, fn) {
  const ret = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      ret[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return ret;
}

function loadExistingExamples(lang) {
  const path = join(dataRoot, `vocabulary-${lang}`, 'examples.csv');
  try {
    const rows = parseCsvFile(readFileSync(path, 'utf8'));
    const byId = new Map();
    for (const row of rows) {
      if (row.example && row.translate) {
        byId.set(String(row.word_id), { example: row.example, translate: row.translate });
      }
    }
    return byId;
  } catch {
    return new Map();
  }
}

function writeExamplesCsv(lang, words, cache) {
  const existing = loadExistingExamples(lang);
  const lines = ['id,word_id,example,translate'];
  let missing = 0;
  words.forEach((w, i) => {
    const hit = cache[w.lemma.toLowerCase().trim()] || existing.get(String(w.id || i + 1));
    if (!hit?.example) missing++;
    lines.push(csvRow([i + 1, w.id || i + 1, hit?.example || '', hit?.translate || '']));
  });
  writeFileSync(join(dataRoot, `vocabulary-${lang}`, 'examples.csv'), `${lines.join('\n')}\n`, 'utf8');
  return missing;
}

async function runLang(apiKey, model, lang, opts) {
  const words = loadWords(lang);
  const cache = loadCache(lang);
  let pending = words.filter((w) => !cache[w.lemma.toLowerCase().trim()]);
  if (opts.limit) pending = pending.slice(0, opts.limit);
  const cachedCount = words.filter((w) => cache[w.lemma.toLowerCase().trim()]).length;
  console.log(`${lang}: ${words.length} words, cached ${cachedCount}, pending ${pending.length}`);

  const batches = chunk(pending, opts.batch);
  let done = 0;
  await mapPool(batches, opts.concurrency, async (batch) => {
    try {
      const got = await generateBatch(apiKey, model, lang, batch);
      Object.assign(cache, got);
      done += batch.length;
      saveCache(lang, cache);
      const gotN = Object.keys(got).length;
      console.log(`${lang}: ${done}/${pending.length} attempted, +${gotN} this batch (cache ${Object.keys(cache).length})`);
    } catch (err) {
      console.error(`${lang} batch failed:`, err.message);
      await sleep(2000);
    }
  });

  const missing = writeExamplesCsv(lang, words, cache);
  const filled = words.length - missing;
  console.log(`${lang}: wrote examples.csv (${filled}/${words.length} filled)`);
  return { filled, total: words.length, missing };
}

const args = parseArgs(process.argv.slice(2));
if (!args.envFile) {
  console.error('Pass --env-file with OPENAI_API_KEY (do not copy the key into LangApp).');
  process.exit(1);
}
const fileEnv = loadEnvFile(args.envFile);
const apiKey = process.env.OPENAI_API_KEY || fileEnv.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || fileEnv.OPENAI_MODEL || 'gpt-4o-mini';
if (!apiKey) {
  console.error('OPENAI_API_KEY not found in env file.');
  process.exit(1);
}

const langs = args.lang === 'all' ? ['en', 'es'] : [args.lang];
for (const lang of langs) {
  if (lang !== 'en' && lang !== 'es') {
    console.error('lang must be en, es, or all');
    process.exit(1);
  }
  await runLang(apiKey, model, lang, args);
}
