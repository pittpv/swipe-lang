import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSessionDeck } from './session.js';

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

test('buildSessionDeck serves English when lang_pair is en-ru', () => {
  const db = mockDb({ words });
  db.data.users[0].lang_pair = 'en-ru';
  const deck = buildSessionDeck(db, 1);
  assert.equal(deck.length, 1);
  assert.equal(deck[0].lemma, 'hello');
  assert.equal(deck[0].langPair, 'en-ru');
});
