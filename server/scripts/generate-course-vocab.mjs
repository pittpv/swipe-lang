import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { csvRow } from './lib/csv-util.js';
import { conjugateEnglish } from './lib/conjugate-en.js';
import { conjugateSpanish } from './lib/conjugate-es.js';
import { englishA1 } from './vocab-banks/english-file-a1.js';
import { englishA2 } from './vocab-banks/english-file-a2.js';
import { englishB1 } from './vocab-banks/english-file-b1.js';
import { englishB2 } from './vocab-banks/english-file-b2.js';
import { englishC1, englishC2 } from './vocab-banks/english-file-c1c2.js';
import { englishCoreExtra } from './vocab-banks/english-file-core.js';
import { aulaA1, aulaA2 } from './vocab-banks/aula-a1a2.js';
import { aulaB1, aulaB2 } from './vocab-banks/aula-b1b2.js';
import { aulaCoreExtra } from './vocab-banks/aula-core.js';
import { englishFill } from './vocab-banks/english-file-fill.js';
import { aulaFill } from './vocab-banks/aula-fill.js';
import { aulaFreq } from './vocab-banks/aula-freq.js';
import { englishFrequencyWords, spanishFrequencyWords } from './freq-expansion.js';
import { makeEnglishExample, makeSpanishExample } from './lib/make-example.js';
import { exampleFromLlmOr, loadLlmExamples } from './lib/llm-examples.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', 'data');

function uniqueByLemma(words) {
  const seen = new Set();
  const out = [];
  for (const word of words) {
    const key = word.lemma.toLowerCase().trim().replace(/\s+/g, ' ');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({ ...word, lemma: word.lemma.trim() });
  }
  return out;
}

function writeBundle({ dir, vocabName, words, conjugate, makeExample }) {
  mkdirSync(dir, { recursive: true });
  const vocabLines = ['id,Слово,Перевод,Тип,Курс,Урок'];
  const exampleLines = ['id,word_id,example,translate'];
  const formLines = ['id,word_id,form,grammar,person,tense'];
  let exampleId = 1;
  let formId = 1;
  let verbCount = 0;
  const starters = {};

  words.forEach((word, i) => {
    const id = i + 1;
    vocabLines.push(csvRow([id, word.lemma, word.translation, word.pos, word.cefr, word.unit]));
    const ex = makeExample(word);
    exampleLines.push(csvRow([exampleId++, id, ex.example, ex.translate]));
    const key = String(ex.example || '').split(/\s+/).slice(0, 2).join(' ');
    starters[key] = (starters[key] || 0) + 1;
    if (word.pos === 'FİİLLER') {
      const forms = conjugate(word.lemma);
      verbCount++;
      for (const f of forms) {
        formLines.push(csvRow([formId++, id, f.form, f.grammar, f.person, f.tense]));
      }
    }
  });

  writeFileSync(join(dir, vocabName), `${vocabLines.join('\n')}\n`, 'utf8');
  writeFileSync(join(dir, 'examples.csv'), `${exampleLines.join('\n')}\n`, 'utf8');
  writeFileSync(join(dir, 'forms.csv'), `${formLines.join('\n')}\n`, 'utf8');

  const byCefr = {};
  const byPos = {};
  for (const w of words) {
    byCefr[w.cefr] = (byCefr[w.cefr] || 0) + 1;
    byPos[w.pos] = (byPos[w.pos] || 0) + 1;
  }
  const topStarters = Object.entries(starters).sort((a, b) => b[1] - a[1]).slice(0, 8);
  return { total: words.length, verbs: verbCount, examples: words.length, forms: formId - 1, byCefr, byPos, topStarters };
}

const enCourse = uniqueByLemma([
  ...englishA1(),
  ...englishA2(),
  ...englishB1(),
  ...englishB2(),
  ...englishC1(),
  ...englishC2(),
  ...englishCoreExtra(),
  ...englishFill(),
]);
const enHave = new Set(enCourse.map((w) => w.lemma.toLowerCase().trim()));
const enFreq = englishFrequencyWords(enHave);
const enWords = uniqueByLemma([...enCourse, ...enFreq]);

const esCourse = uniqueByLemma([
  ...aulaA1(),
  ...aulaA2(),
  ...aulaB1(),
  ...aulaB2(),
  ...aulaCoreExtra(),
  ...aulaFill(),
  ...aulaFreq(),
]);
const esHave = new Set(esCourse.map((w) => w.lemma.toLowerCase().trim()));
const esFreq = spanishFrequencyWords(esHave);
const esWords = uniqueByLemma([...esCourse, ...esFreq]);

const enStats = writeBundle({
  dir: join(root, 'vocabulary-en'),
  vocabName: 'vocabulary-EnglishFile.csv',
  words: enWords,
  conjugate: conjugateEnglish,
  makeExample: exampleFromLlmOr(makeEnglishExample, loadLlmExamples('en')),
});

const esStats = writeBundle({
  dir: join(root, 'vocabulary-es'),
  vocabName: 'vocabulary-AulaPlus.csv',
  words: esWords,
  conjugate: conjugateSpanish,
  makeExample: exampleFromLlmOr(makeSpanishExample, loadLlmExamples('es')),
});

console.log('English File (A1–C2):', enStats, { course: enCourse.length, ngslAdded: enFreq.length });
console.log('Aula Internacional Plus (A1–B2):', esStats, { course: esCourse.length, creaAdded: esFreq.length });

function assertForms(lang, words, stats) {
  const verbs = words.filter((w) => w.pos === 'FİİLLER').length;
  if (stats.total !== words.length || stats.examples !== words.length) {
    throw new Error(`${lang}: vocab/example count mismatch`);
  }
  if (stats.verbs !== verbs || stats.forms !== verbs * 18) {
    throw new Error(`${lang}: expected ${verbs * 18} forms for ${verbs} verbs, got ${stats.forms}`);
  }
}

assertForms('EN', enWords, enStats);
assertForms('ES', esWords, esStats);
