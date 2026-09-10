import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseCsvFile } from '../lib/csv-parse.js';


const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadExisting(csvPath) {
  const rows = parseCsvFile(readFileSync(csvPath, 'utf8'));
  return new Set(rows.map((r) => r['Слово'].toLowerCase().trim()));
}

function parseNgsl() {
  const text = readFileSync(join(__dirname, 'frequency-sources/ngsl-1.01.csv'), 'utf8');
  const lemmas = [];
  for (const line of text.split(/\r?\n/)) {
    const lemma = line.split(',')[0]?.trim().toLowerCase();
    if (!lemma || lemma.startsWith('#')) continue;
    lemmas.push(lemma);
  }
  return lemmas;
}

const CREA_POS = {
  N: 'N',
  V: 'V',
  A: 'A',
  R: 'D',
  P: 'C',
  C: 'C',
  T: 'O',
  D: 'R',
  L: 'R',
  Q: 'R',
  I: 'F',
  M: 'N',
};

function parseCrea() {
  const text = readFileSync(join(__dirname, 'frequency-sources/crea-10000-lemas.txt'), 'utf8');
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([^\s]+(?:\s+[^\s]+)*)\s+([A-Z])\s+(\d+)/);
    if (!m) continue;
    const lemma = m[1].trim().toLowerCase();
    const tag = m[2];
    if (tag === 'Y') continue;
    if (!/^[a-záéíóúüñ ]+$/i.test(lemma)) continue;
    if (lemma.length === 1 && !['a', 'o', 'y', 'e', 'u'].includes(lemma)) continue;
    const pos = CREA_POS[tag];
    if (!pos) continue;
    rows.push({ lemma, pos, tag, rank: rows.length + 1 });
  }
  return rows;
}

const enHave = loadExisting(join(root, 'data/vocabulary-en/vocabulary-EnglishFile.csv'));
const esHave = loadExisting(join(root, 'data/vocabulary-es/vocabulary-AulaPlus.csv'));
const ngsl = parseNgsl();
const crea = parseCrea();

const enMissing = ngsl.filter((w) => !enHave.has(w));
const esMissing = crea.filter((w) => !esHave.has(w.lemma));

writeFileSync(
  join(__dirname, 'frequency-sources/en-missing.txt'),
  enMissing.map((w, i) => `${i + 1}\t${ngsl.indexOf(w) + 1}\t${w}`).join('\n'),
  'utf8',
);
writeFileSync(
  join(__dirname, 'frequency-sources/es-missing.tsv'),
  esMissing.map((w) => `${w.rank}\t${w.pos}\t${w.tag}\t${w.lemma}`).join('\n'),
  'utf8',
);

console.log({
  ngsl: ngsl.length,
  enHave: enHave.size,
  enMissing: enMissing.length,
  enMissingTop1000: enMissing.filter((w) => ngsl.indexOf(w) < 1000).length,
  crea: crea.length,
  esHave: esHave.size,
  esMissing: esMissing.length,
  esMissingTop2000: esMissing.filter((w) => w.rank <= 2000).length,
  esMissingTop4000: esMissing.filter((w) => w.rank <= 4000).length,
});
