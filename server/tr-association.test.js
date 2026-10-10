import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { parseCsvFile } from './lib/csv-parse.js';
import {
  normalizeKey,
  planAssociation,
  transcribe,
  validateAssociation,
} from './scripts/lib/tr-association.js';

const root = dirname(fileURLToPath(import.meta.url));

test('turkish phonetics keep c, ğ, ı, ö and ü distinct', () => {
  assert.equal(transcribe('kitap'), 'кита́п');
  assert.equal(transcribe('ağaç'), 'аа́ч');
  assert.equal(transcribe('kız'), 'кы́з');
  assert.equal(transcribe('gül'), 'гю́л');
  assert.equal(transcribe('göl'), 'гё́л');
  assert.equal(transcribe('okul'), 'оку́л');
  assert.equal(transcribe('cetvel'), 'джетве́л');
  assert.equal(transcribe('pencere'), 'пенджере́');
  assert.equal(transcribe('gelmek', { verb: true }), 'ге́лмек');
  assert.equal(transcribe('arkadaş'), 'аркада́ш');
  assert.doesNotMatch(transcribe('ağaç'), /г/);
  assert.match(transcribe('kız'), /ы/);
  assert.doesNotMatch(transcribe('kız'), /и/);
});

test('kitap hooks onto кит and gelmek does not collapse to мак', () => {
  const kitap = planAssociation({ lemma: 'kitap', translation: 'книга', type: 'İSİMLER' });
  assert.equal(kitap.errors.length, 0);
  assert.equal(kitap.association.kind, 'keyword');
  assert.equal(kitap.association.phonetic, 'кита́п');
  assert.deepEqual(kitap.association.hooks, ['кит']);

  const gelmek = planAssociation({ lemma: 'gelmek', translation: 'приходить', type: 'FİİLLER' });
  assert.equal(gelmek.errors.length, 0);
  assert.deepEqual(gelmek.association.hooks, ['гель']);
  assert.equal(gelmek.association.phonetic, 'ге́лмек');
});

test('validateAssociation rejects a hook that does not share the sound', () => {
  const word = { lemma: 'kitap', translation: 'книга', type: 'İSİMLER' };
  const errors = validateAssociation({
    kind: 'keyword',
    phonetic: 'кита́п',
    hooks: ['дом'],
    image: 'Дом держит книгу в руках очень крепко.',
  }, word);
  assert.ok(errors.includes('bigram'));
});

test('validateAssociation rejects an abstract image', () => {
  const word = { lemma: 'kitap', translation: 'книга', type: 'İSİMLER' };
  const errors = validateAssociation({
    kind: 'keyword',
    phonetic: 'кита́п',
    hooks: ['кит'],
    image: 'Кит символизирует книгу в тихой комнате.',
  }, word);
  assert.ok(errors.includes('abstract'));
});

test('turkish A1 associations cover the dictionary slice', () => {
  const data = JSON.parse(readFileSync(join(root, 'data', 'vocabulary', 'associations.json'), 'utf8'));
  const merged = new Map();
  for (const file of ['vocabulary-Eski.csv', 'vocabulary-Yeni.csv']) {
    for (const row of parseCsvFile(readFileSync(join(root, 'data', 'vocabulary', file), 'utf8'))) {
      const lemma = (row['Слово'] || '').trim();
      if (!lemma) continue;
      merged.set(normalizeKey(lemma), row);
    }
  }
  const a1 = [...merged.entries()].filter(([, row]) => (row['Курс'] || '').toUpperCase() === 'A1');
  const missing = a1.filter(([key]) => !data[key]).map(([, row]) => row['Слово']);
  assert.deepEqual(missing, []);
  for (const [key, row] of a1) {
    const errors = validateAssociation(data[key], {
      lemma: row['Слово'],
      translation: row['Перевод'],
      type: row['Тип'],
    });
    assert.deepEqual(errors, [], `${row['Слово']}: ${errors.join(',')}`);
  }
  assert.equal(data[normalizeKey('telefon')].kind, 'cognate');
  assert.equal(data[normalizeKey('Merhaba.')].kind, 'usage');
});
