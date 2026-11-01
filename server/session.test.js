import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSessionDeck,
  formatWord,
  leechExtraCards,
  reviewRatioFor,
  SESSION_SIZE,
  REVIEW_RATIO,
  REVIEW_DEBT_THRESHOLD,
  ELEVATED_REVIEW_RATIO,
  LEECH_EXTRA_CARDS_MAX,
} from './session.js';

function mockDb({ cefr = 'A1', words, progress = [] }) {
  return {
    data: {
      users: [{ id: 1, cefr_level: cefr }],
      words,
      user_word_progress: progress,
      study_sessions: [],
    },
  };
}

const words = [
  { id: 1, lemma: 'a', translation: 'а', pos: 'n', cefr_level: 'A1', lang_pair: 'tr-ru', examples: '[]' },
  { id: 2, lemma: 'b', translation: 'б', pos: 'n', cefr_level: 'A1', lang_pair: 'tr-ru', examples: '[]' },
  { id: 3, lemma: 'hello', translation: 'привет', pos: 'n', cefr_level: 'A1', lang_pair: 'en-ru', examples: '[]' },
];

test('buildSessionDeck is empty when level known and nothing due', () => {
  const past = new Date(Date.now() + 86400000).toISOString();
  const db = mockDb({
    words,
    progress: [
      { user_id: 1, word_id: 1, status: 'known', next_review_at: past },
      { user_id: 1, word_id: 2, status: 'mature', next_review_at: past },
    ],
  });
  assert.equal(buildSessionDeck(db, 1).length, 0);
});

test('buildSessionDeck returns due reviews when level complete', () => {
  const due = new Date(Date.now() - 1000).toISOString();
  const db = mockDb({
    words,
    progress: [
      { user_id: 1, word_id: 1, status: 'known', next_review_at: due },
      { user_id: 1, word_id: 2, status: 'known', next_review_at: due },
    ],
  });
  const deck = buildSessionDeck(db, 1);
  assert.equal(deck.length, 2);
});

test('buildSessionDeck stays on the user language pair', () => {
  const db = mockDb({ words });
  const deck = buildSessionDeck(db, 1);
  assert.ok(deck.length >= 2);
  assert.ok(deck.every((card) => card.langPair === 'tr-ru'));
  assert.ok(deck.every((card) => card.lemma !== 'hello'));
});

test('formatWord parses a keyword association', () => {
  const card = formatWord({
    id: 7,
    lemma: 'kitap',
    translation: 'книга',
    pos: 'noun',
    cefr_level: 'A1',
    examples: '[]',
    forms: '[]',
    lang_pair: 'tr-ru',
    association: JSON.stringify({
      kind: 'keyword',
      phonetic: 'кита́п',
      hooks: ['кит'],
      image: 'Кит читает толстую книгу у окна.',
    }),
  });
  assert.equal(card.association.kind, 'keyword');
  assert.equal(card.association.phonetic, 'кита́п');
  assert.deepEqual(card.association.hooks, ['кит']);
  assert.match(card.association.image, /книг/);
});

test('formatWord drops empty and broken associations', () => {
  const base = { id: 1, lemma: 'ev', translation: 'дом', pos: 'noun', examples: '[]' };
  assert.equal(formatWord(base).association, null);
  assert.equal(formatWord({ ...base, association: '' }).association, null);
  assert.equal(formatWord({ ...base, association: 'null' }).association, null);
  assert.equal(formatWord({ ...base, association: '{' }).association, null);
  assert.equal(formatWord({ ...base, association: '{"kind":"note"}' }).association, null);
  assert.equal(
    formatWord({ ...base, association: '{"kind":"keyword","phonetic":"ев","hooks":[],"image":"x"}' }).association,
    null,
  );
});

test('leechExtraCards repeats leeches once at the end, worst first, capped at three', () => {
  const deck = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }];
  const progress = [
    { word_id: 1, lapses: 3 },
    { word_id: 2, lapses: 2 },
    { word_id: 3, lapses: 5 },
    { word_id: 4 },
    { word_id: 5, lapses: 4 },
    { word_id: 6, lapses: 9 },
  ];
  const extra = leechExtraCards(deck, progress);
  assert.deepEqual(extra.map((w) => w.id), [3, 5, 1]);
  assert.deepEqual(leechExtraCards([{ id: 1 }, { id: 2 }], [{ word_id: 1, lapses: 1 }]), []);
  assert.deepEqual(leechExtraCards([], progress), []);
});

test('leechExtraCards skips a leech that is already the last card', () => {
  const deck = [{ id: 1 }, { id: 2 }];
  assert.deepEqual(leechExtraCards(deck, [{ word_id: 2, lapses: 3 }]), []);
  assert.deepEqual(leechExtraCards(deck, [{ word_id: 1, lapses: 3 }]).map((w) => w.id), [1]);
});

test('buildSessionDeck appends a due leech once more after the main deck', () => {
  const due = new Date(Date.now() - 1000).toISOString();
  const db = mockDb({
    words,
    progress: [
      { user_id: 1, word_id: 1, status: 'learning', next_review_at: due, lapses: 3 },
      { user_id: 1, word_id: 2, status: 'learning', next_review_at: due, lapses: 0 },
    ],
  });
  const deck = buildSessionDeck(db, 1);
  const ids = deck.map((card) => card.id);
  assert.deepEqual(ids, [1, 2, 1]);
  assert.equal(deck[2].lemma, 'a');
});

/** 40 A1 tr-ru words; the first `dueCount` are due (oldest first), the rest unseen. */
function debtDb(dueCount, { lapses = {} } = {}) {
  const many = Array.from({ length: 40 }, (_, i) => ({
    id: i + 1,
    lemma: `w${i + 1}`,
    translation: `п${i + 1}`,
    pos: 'n',
    cefr_level: 'A1',
    lang_pair: 'tr-ru',
    examples: '[]',
  }));
  const progress = Array.from({ length: dueCount }, (_, i) => ({
    user_id: 1,
    word_id: i + 1,
    status: 'learning',
    next_review_at: new Date(Date.now() - (dueCount - i) * 60000).toISOString(),
    lapses: lapses[i + 1] ?? 0,
  }));
  return mockDb({ words: many, progress });
}

const DEBT_LIMIT = Math.floor(SESSION_SIZE * REVIEW_DEBT_THRESHOLD);

test('reviewRatioFor keeps 0.3 up to the debt threshold and one elevated tier above it', () => {
  assert.equal(REVIEW_RATIO, 0.3);
  assert.ok(ELEVATED_REVIEW_RATIO >= 0.5 && ELEVATED_REVIEW_RATIO <= 0.6);
  assert.equal(reviewRatioFor(0), REVIEW_RATIO);
  assert.equal(reviewRatioFor(DEBT_LIMIT), REVIEW_RATIO);
  assert.equal(reviewRatioFor(DEBT_LIMIT + 1), ELEVATED_REVIEW_RATIO);
  assert.equal(reviewRatioFor(SESSION_SIZE), ELEVATED_REVIEW_RATIO);
  assert.equal(reviewRatioFor(500), ELEVATED_REVIEW_RATIO);
});

test('buildSessionDeck keeps the 30 % review share while due reviews are within the threshold', () => {
  const deck = buildSessionDeck(debtDb(DEBT_LIMIT), 1);
  assert.equal(SESSION_SIZE, 18);
  assert.equal(deck.length, SESSION_SIZE);
  const reviews = deck.filter((card) => card.id <= DEBT_LIMIT).length;
  assert.equal(reviews, Math.floor(SESSION_SIZE * 0.3));
  assert.equal(reviews, 5);
});

test('buildSessionDeck raises the review share to the elevated ratio under review debt', () => {
  const dueCount = DEBT_LIMIT + 1;
  const deck = buildSessionDeck(debtDb(dueCount), 1);
  assert.equal(deck.length, SESSION_SIZE, 'main slice is still SESSION_SIZE');
  const reviews = deck.filter((card) => card.id <= dueCount).length;
  assert.equal(reviews, Math.floor(SESSION_SIZE * ELEVATED_REVIEW_RATIO));
  const share = reviews / SESSION_SIZE;
  assert.ok(share >= 0.5 && share <= 0.6, `review share ${share} outside 50–60 %`);
  assert.ok(reviews > Math.floor(SESSION_SIZE * REVIEW_RATIO));
  // Oldest due words come first; the rest of the deck is new words.
  assert.deepEqual(
    deck.slice(0, reviews).map((card) => card.id),
    Array.from({ length: reviews }, (_, i) => i + 1),
  );
  assert.ok(deck.slice(reviews).every((card) => card.id > dueCount));
});

test('buildSessionDeck still appends capped leech extras after the elevated main slice', () => {
  const dueCount = DEBT_LIMIT + 1;
  const deck = buildSessionDeck(debtDb(dueCount, { lapses: { 1: 3, 2: 4, 3: 3, 4: 5, 5: 3 } }), 1);
  assert.equal(deck.length, SESSION_SIZE + LEECH_EXTRA_CARDS_MAX);
  assert.equal(LEECH_EXTRA_CARDS_MAX, 3);
  const main = deck.slice(0, SESSION_SIZE);
  const extra = deck.slice(SESSION_SIZE);
  assert.equal(new Set(main.map((card) => card.id)).size, SESSION_SIZE, 'no repeats inside the main slice');
  assert.deepEqual(extra.map((card) => card.id), [4, 2, 1]);
});

test('buildSessionDeck serves English when lang_pair is en-ru', () => {
  const db = mockDb({ words });
  db.data.users[0].lang_pair = 'en-ru';
  const deck = buildSessionDeck(db, 1);
  assert.equal(deck.length, 1);
  assert.equal(deck[0].lemma, 'hello');
  assert.equal(deck[0].langPair, 'en-ru');
});
