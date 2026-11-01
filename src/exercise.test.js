import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EXERCISE_RATE,
  buildExercise,
  findCloze,
  gradeTyped,
  shouldOfferExercise,
  stableUnit,
} from './exercise.js';

const deck = [
  { id: 1, lemma: 'ev', translation: 'дом, жилище', pos: 'noun', langPair: 'tr-ru', examples: [{ example: 'Bu ev çok büyük.', translate: 'Этот дом очень большой.' }] },
  { id: 2, lemma: 'okul', translation: 'школа', pos: 'noun', langPair: 'tr-ru', examples: [{ example: 'Okulda çok öğrenci var.', translate: 'В школе много учеников.' }] },
  { id: 3, lemma: 'kitap', translation: 'книга', pos: 'noun', langPair: 'tr-ru', examples: [] },
  { id: 4, lemma: 'su', translation: 'вода', pos: 'noun', langPair: 'tr-ru', examples: [] },
];

test('gate is deterministic per session and card', () => {
  assert.equal(stableUnit('42:7'), stableUnit('42:7'));
  for (let id = 0; id < 50; id++) {
    assert.equal(shouldOfferExercise(9, id), shouldOfferExercise(9, id));
  }
});

test('gate fires on roughly EXERCISE_RATE of cards', () => {
  assert.ok(EXERCISE_RATE >= 0.05 && EXERCISE_RATE <= 0.07);
  let hits = 0;
  const total = 20000;
  for (let i = 0; i < total; i++) if (shouldOfferExercise(1000 + (i % 200), i)) hits += 1;
  const rate = hits / total;
  assert.ok(rate > 0.05 && rate < 0.07, `rate ${rate}`);
});

test('typed grading is lenient on case, spacing, ё and accepts any listed meaning', () => {
  assert.equal(gradeTyped('  Дом ', 'дом, жилище'), true);
  assert.equal(gradeTyped('жилище', 'дом, жилище'), true);
  assert.equal(gradeTyped('дом, жилище', 'дом, жилище'), true);
  assert.equal(gradeTyped('ЕЛКА', 'ёлка'), true);
  assert.equal(gradeTyped('идти', 'идти (пешком)'), true);
  assert.equal(gradeTyped('дома', 'дом, жилище'), false);
  assert.equal(gradeTyped('   ', 'дом'), false);
});

test('cloze finds whole words and Turkish stems with a visible suffix', () => {
  assert.deepEqual(findCloze('Bu ev çok büyük.', 'ev', 'tr-ru'), { before: 'Bu ', word: 'ev', suffix: '', after: ' çok büyük.' });
  assert.deepEqual(findCloze('Okulda çok öğrenci var.', 'okul', 'tr-ru'), { before: '', word: 'Okul', suffix: 'da', after: ' çok öğrenci var.' });
  assert.equal(findCloze('Evet, geliyorum.', 'ev', 'tr-ru'), null, 'two-letter stems need a whole word');
  assert.equal(findCloze('That is good.', 'go', 'en-ru'), null);
  assert.equal(findCloze('I go home.', 'go', 'en-ru').word, 'go');
  assert.equal(findCloze('', 'go', 'en-ru'), null);
  assert.equal(findCloze('Adın ne?', 'ad (isim)', 'tr-ru'), null, 'two-letter stem still needs a whole word');
  assert.equal(findCloze('Bu ad güzel.', 'ad (isim)', 'tr-ru').word, 'ad');
});

test('cloze options never show the dictionary disambiguator', () => {
  const withSense = [...deck, { id: 5, lemma: 'yüz (sayı)', translation: 'сто', pos: 'noun', langPair: 'tr-ru', examples: [] }];
  for (const sessionId of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const ex = buildExercise(withSense[0], withSense, sessionId, 'cloze');
    assert.ok(ex.options.every((o) => !o.includes('(')), ex.options.join());
  }
});

test('buildExercise falls back to typed without a usable example', () => {
  const typed = buildExercise(deck[2], deck, 5, 'cloze');
  assert.equal(typed.type, 'typed');
  const cloze = buildExercise(deck[0], deck, 5, 'cloze');
  assert.equal(cloze.type, 'cloze');
  assert.equal(cloze.options.length, 3);
  assert.ok(cloze.options.includes('ev'));
  assert.equal(new Set(cloze.options).size, 3);
  assert.equal(cloze.sentenceRu, 'Этот дом очень большой.');
  assert.deepEqual(buildExercise(deck[0], deck, 5).options, buildExercise(deck[0], deck, 5).options);
});

test('cloze needs two distractors from the deck', () => {
  assert.equal(buildExercise(deck[0], deck.slice(0, 2), 5, 'cloze').type, 'typed');
});
