import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadPackWords, normalizeLemmaText } from './import-vocabulary.js';

test('dotted Turkish i loses the extra combining dot and capital İ stays put', () => {
  assert.equal(normalizeLemmaText('i\u0307skele'), 'iskele');
  assert.equal(normalizeLemmaText('i\u0307lgilenmek'), 'ilgilenmek');
  assert.equal(normalizeLemmaText('i\u0307ç'), 'iç');
  assert.equal(normalizeLemmaText('iskele'), 'iskele');
  assert.equal(normalizeLemmaText('İstanbul'), 'İstanbul');
  assert.equal(normalizeLemmaText('İstanbul').toLowerCase(), 'İstanbul'.toLowerCase());
});

test('dotted A1 copies collapse into the plain lemma and stay on A1', () => {
  const { words } = loadPackWords({
    lang_pair: 'tr-ru',
    dir: 'vocabulary',
    files: [
      { file: 'vocabulary-Eski.csv', source: 'eski' },
      { file: 'vocabulary-Yeni.csv', source: 'yeni' },
    ],
  });
  for (const lemma of ['iskele', 'ilgilenmek', 'iç']) {
    const hits = words.filter((word) => word.lemma === lemma);
    assert.equal(hits.length, 1, lemma);
    assert.equal(hits[0].lemma.includes('\u0307'), false);
    assert.equal(hits[0].cefr_level, 'A1', lemma);
  }
  assert.equal(words.some((word) => word.lemma.includes('\u0307')), false);
});
