import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildHardDeck, pickHardWordIds, HARD_SESSION_SIZE, HARD_SESSION_MIN } from './hard-session.js';
import { DEFAULT_LANG_PAIR } from './lang-pairs.js';

function word(id, extra = {}) {
  return {
    id,
    lemma: `w${id}`,
    translation: `t${id}`,
    pos: 'n',
    cefr_level: 'A1',
    lang_pair: DEFAULT_LANG_PAIR,
    examples: '[]',
    ...extra,
  };
}

function row(wordId, lapses, next = '2026-01-10T00:00:00.000Z', extra = {}) {
  return { user_id: 1, word_id: wordId, status: 'learning', lapses, next_review_at: next, ...extra };
}

function mockDb({ words, progress, cefr = 'A1', user = {} }) {
  return {
    data: {
      users: [{ id: 1, cefr_level: cefr, ...user }],
      words,
      user_word_progress: progress,
      study_sessions: [],
    },
  };
}

test('hard session size is within 10-12 and minimum is 4', () => {
  assert.ok(HARD_SESSION_SIZE >= 10 && HARD_SESSION_SIZE <= 12);
  assert.equal(HARD_SESSION_MIN, 4);
});

test('orders by lapses desc, then oldest next_review_at', () => {
  const db = mockDb({
    words: [1, 2, 3, 4].map((id) => word(id)),
    progress: [
      row(1, 1, '2026-01-05T00:00:00.000Z'),
      row(2, 3, '2026-01-09T00:00:00.000Z'),
      row(3, 1, '2026-01-02T00:00:00.000Z'),
      row(4, 2, '2026-01-01T00:00:00.000Z'),
    ],
  });
  assert.deepEqual(pickHardWordIds(db, 1), [2, 4, 3, 1]);
});

test('ignores words without lapses and legacy rows without the field', () => {
  const db = mockDb({
    words: [1, 2, 3].map((id) => word(id)),
    progress: [row(1, 0), row(2, undefined), row(3, 1)],
  });
  assert.deepEqual(pickHardWordIds(db, 1), [3]);
});

test('caps the deck at HARD_SESSION_SIZE', () => {
  const ids = Array.from({ length: 20 }, (_, i) => i + 1);
  const db = mockDb({
    words: ids.map((id) => word(id)),
    progress: ids.map((id) => row(id, 1 + (id % 5))),
  });
  const picked = pickHardWordIds(db, 1);
  assert.equal(picked.length, HARD_SESSION_SIZE);
  const lapses = picked.map((id) => 1 + (id % 5));
  assert.deepEqual(lapses, [...lapses].sort((a, b) => b - a));
});

test('scope: other users, other language pair and higher CEFR are excluded', () => {
  const db = mockDb({
    words: [
      word(1),
      word(2, { lang_pair: 'en-ru' }),
      word(3, { cefr_level: 'B1' }),
      word(4),
      word(5),
    ],
    progress: [
      row(1, 2),
      row(2, 9),
      row(3, 9),
      row(4, 1, undefined, { user_id: 2 }),
      row(5, 1),
      row(99, 5), // progress for a word that no longer exists
    ],
  });
  assert.deepEqual(pickHardWordIds(db, 1), [1, 5]);
});

test('higher CEFR words are included once the user level reaches them', () => {
  const db = mockDb({
    cefr: 'B1',
    words: [word(1), word(2, { cefr_level: 'B1' })],
    progress: [row(1, 1), row(2, 2)],
  });
  assert.deepEqual(pickHardWordIds(db, 1), [2, 1]);
});

test('buildHardDeck refuses fewer than the minimum', () => {
  const db = mockDb({
    words: [1, 2, 3].map((id) => word(id)),
    progress: [row(1, 1), row(2, 2), row(3, 3)],
  });
  const result = buildHardDeck(db, 1);
  assert.equal(result.enough, false);
  assert.equal(result.count, 3);
  assert.deepEqual(result.cards, []);
});

test('buildHardDeck returns formatted cards at the minimum', () => {
  const db = mockDb({
    words: [1, 2, 3, 4].map((id) => word(id)),
    progress: [row(1, 1), row(2, 4), row(3, 2), row(4, 3)],
  });
  const result = buildHardDeck(db, 1);
  assert.equal(result.enough, true);
  assert.deepEqual(result.cards.map((c) => c.id), [2, 4, 3, 1]);
  assert.equal(result.cards[0].lemma, 'w2');
  assert.equal(result.cards[0].translation, 't2');
});
