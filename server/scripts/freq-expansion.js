/**
 * Frequency-first expansion for English (NGSL 1.01) and Spanish (RAE CREA 10k).
 *
 * Methodology:
 * - English: New General Service List 1.01 (Browne, Culligan & Phillips; CC BY-SA 4.0)
 *   ~2800 lemmas ≈ 92% coverage of general English (Nation / NGSL research).
 * - Spanish: RAE CREA 10 000 lemas; take the most frequent content+function words
 *   through rank 3500 (A1–B2 band in PCIC/CEFR practice).
 * - CEFR bands by frequency rank (Nation 2001; English Profile-style staging).
 * - Course units: English File FILE1–12 / Aula UNIDAD1–12 by rank within the band.
 *
 * Attribution: Browne, C., Culligan, B. (2013). The New General Service List.
 * https://www.newgeneralservicelist.com
 * Real Academia Española. Corpus de Referencia del Español Actual (CREA).
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { expandPos } from './lib/csv-util.js';
import { EN_RU } from './vocab-banks/freq-en-ru.js';
import { ES_RU } from './vocab-banks/freq-es-ru.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseNgsl() {
  const text = readFileSync(join(__dirname, 'frequency-sources/ngsl-1.01.csv'), 'utf8');
  const lemmas = [];
  for (const line of text.split(/\r?\n/)) {
    const lemma = line.split(',')[0]?.trim().toLowerCase();
    if (lemma) lemmas.push(lemma);
  }
  return lemmas;
}

function parseCrea() {
  const text = readFileSync(join(__dirname, 'frequency-sources/crea-10000-lemas.txt'), 'utf8');
  const rows = [];
  const posMap = { N: 'N', V: 'V', A: 'A', R: 'D', P: 'C', C: 'C', T: 'O', D: 'R', L: 'R', Q: 'R', I: 'F', M: 'N' };
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([^\s]+(?:\s+[^\s]+)*)\s+([A-Z])\s+(\d+)/);
    if (!m) continue;
    const lemma = m[1].trim().toLowerCase();
    const tag = m[2];
    if (tag === 'Y' || !/^[a-záéíóúüñ ]+$/i.test(lemma)) continue;
    if (lemma.length === 1 && !['a', 'o', 'y', 'e', 'u'].includes(lemma)) continue;
    const pos = posMap[tag];
    if (!pos) continue;
    rows.push({ lemma, pos, rank: rows.length + 1 });
  }
  return rows;
}

function enCefrUnit(rank) {
  if (rank <= 800) return { cefr: 'A1', unit: `FILE${((rank - 1) % 12) + 1}` };
  if (rank <= 1600) return { cefr: 'A2', unit: `FILE${(((rank - 801) % 12) + 1)}` };
  if (rank <= 2300) return { cefr: 'B1', unit: `FILE${(((rank - 1601) % 12) + 1)}` };
  return { cefr: 'B2', unit: `FILE${(((rank - 2301) % 12) + 1)}` };
}

function esCefrUnit(rank) {
  if (rank <= 700) return { cefr: 'A1', unit: `UNIDAD${((rank - 1) % 9) + 1}` };
  if (rank <= 1500) return { cefr: 'A2', unit: `UNIDAD${(((rank - 701) % 10) + 1)}` };
  if (rank <= 2500) return { cefr: 'B1', unit: `UNIDAD${(((rank - 1501) % 12) + 1)}` };
  return { cefr: 'B2', unit: `UNIDAD${(((rank - 2501) % 12) + 1)}` };
}

function inferEnPos(lemma, hint) {
  if (hint) return hint;
  const entry = EN_RU[lemma];
  if (entry?.pos) return entry.pos;
  return 'N';
}

export function englishFrequencyWords(have = new Set()) {
  const ngsl = parseNgsl();
  const out = [];
  const missingGloss = [];
  ngsl.forEach((lemma, i) => {
    const rank = i + 1;
    if (have.has(lemma)) return;
    const gloss = EN_RU[lemma];
    if (!gloss) {
      missingGloss.push(lemma);
      return;
    }
    const { cefr, unit } = enCefrUnit(rank);
    out.push({
      cefr,
      unit,
      lemma,
      translation: gloss.ru,
      pos: expandPos(inferEnPos(lemma, gloss.pos)),
      example: gloss.example || '',
      translate: gloss.exampleRu || '',
      source: 'ngsl',
      rank,
    });
  });
  if (missingGloss.length) {
    console.warn(`NGSL lemmas without Russian gloss (${missingGloss.length}):`, missingGloss.slice(0, 30).join(', '));
  }
  return out;
}

const SKIP_ES = new Set([
  'madrid', 'barcelona', 'sevilla', 'valencia', 'bilbao', 'zaragoza', 'málaga', 'malaga',
  'murcia', 'palma', 'córdoba', 'cordoba', 'vigo', 'gijón', 'gijon', 'oviedo', 'granada',
  'psoe', 'eta', 'aznar', 'zapatero', 'rajoy', 'franco', 'felipe', 'juan', 'carlos',
  'josé', 'jose', 'maría', 'maria', 'pedro', 'luis', 'antonio', 'francisco', 'manuel',
  'eeuu', 'otan', 'ue', 'pib', 'iva', 'pp', 'ciu', 'iu', 'cataluña', 'catalunya',
  'euskadi', 'galicia', 'andalucía', 'andalucia', 'castilla', 'aragón', 'aragon',
  'navarra', 'asturias', 'cantabria', 'extremadura', 'españa',
  'gonzález', 'clinton', 'banesto', 'felipe gonzález', 'efe', 'pri', 'pnv', 'ugt', 'ap', 'abc',
  'perspectivo', 'csi', 'bildu',
]);

const ROMAN_NUMERAL = /^(i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii|xiii|xiv|xv|xvi|xvii|xviii|xix|xx|xxi)$/;

export function spanishFrequencyWords(have = new Set()) {
  const crea = parseCrea();
  const out = [];
  const missingGloss = [];
  for (const row of crea) {
    if (row.rank > 3500) continue;
    if (have.has(row.lemma) || SKIP_ES.has(row.lemma) || ROMAN_NUMERAL.test(row.lemma)) continue;
    const gloss = ES_RU[row.lemma];
    if (!gloss) {
      missingGloss.push(row.lemma);
      continue;
    }
    const { cefr, unit } = esCefrUnit(row.rank);
    out.push({
      cefr,
      unit,
      lemma: row.lemma,
      translation: gloss.ru,
      pos: expandPos(gloss.pos || row.pos),
      example: gloss.example || '',
      translate: gloss.exampleRu || '',
      source: 'crea',
      rank: row.rank,
    });
  }
  if (missingGloss.length) {
    console.warn(`CREA lemmas without Russian gloss (${missingGloss.length}):`, missingGloss.slice(0, 30).join(', '));
  }
  return out;
}
