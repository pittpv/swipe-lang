import { test } from 'node:test';
import assert from 'node:assert/strict';
import { returnReason, buildReturnReasons, timesLabel, RETURN_REASONS_CAP } from './return-reason.js';
import { DEFAULT_LANG_PAIR } from './lang-pairs.js';

const NOW = new Date('2026-03-10T12:00:00.000Z');
const PAST = '2026-03-09T12:00:00.000Z';
const FUTURE = '2026-03-12T12:00:00.000Z';

const curated = JSON.stringify({ source: 'curated', hooks: ['x'], image: 'y', kind: 'sound' });

function word(id, extra = {}) {
  return { id, lemma: `w${id}`, translation: `t${id}`, lang_pair: DEFAULT_LANG_PAIR, association: curated, ...extra };
}

function row(wordId, extra = {}) {
  return {
    user_id: 1,
    word_id: wordId,
    status: 'known',
    lapses: 0,
    next_review_at: PAST,
    updated_at: '2026-03-01T00:00:00.000Z',
    ...extra,
  };
}

test('timesLabel: Russian plural after the number', () => {
  assert.equal(timesLabel(1), '1 раз');
  assert.equal(timesLabel(2), '2 раза');
  assert.equal(timesLabel(4), '4 раза');
  assert.equal(timesLabel(5), '5 раз');
  assert.equal(timesLabel(11), '11 раз');
  assert.equal(timesLabel(22), '22 раза');
});

test('0 lapses, due review of a known word: plain due', () => {
  assert.equal(returnReason(row(1), word(1), { now: NOW }), 'Подошёл срок повторения.');
});

test('0 lapses, due, still learning: still being learned', () => {
  assert.equal(returnReason(row(1, { status: 'learning' }), word(1), { now: NOW }), 'Слово ещё заучивается.');
});

test('2 lapses: back in learning', () => {
  assert.equal(
    returnReason(row(1, { status: 'learning', lapses: 2 }), word(1), { now: NOW }),
    'Вы забыли это слово 2 раза, поэтому оно снова в обучении.',
  );
  assert.equal(
    returnReason(row(1, { status: 'learning', lapses: 1 }), word(1), { now: NOW }),
    'Вы забыли это слово 1 раз, поэтому оно снова в обучении.',
  );
});

test('3 lapses: leech came back earlier', () => {
  assert.equal(
    returnReason(row(1, { status: 'learning', lapses: 3 }), word(1), { now: NOW }),
    'Вы забыли это слово 3 раза, поэтому оно вернулось раньше.',
  );
});

test('retired association voted down by this user', () => {
  const retired = word(1, { association: 'null', association_retired: curated });
  assert.equal(
    returnReason(row(1), retired, { now: NOW, userVotedDown: true }),
    'Вы отметили ассоциацию как неподходящую — мы предложим другую.',
  );
});

test('retired association without this user\'s vote, or a live one, is not claimed', () => {
  const retired = word(1, { association: 'null', association_retired: curated });
  assert.equal(returnReason(row(1), retired, { now: NOW, userVotedDown: false }), 'Подошёл срок повторения.');
  assert.equal(returnReason(row(1), word(1), { now: NOW, userVotedDown: true }), 'Подошёл срок повторения.');
});

test('not due and not in the latest session: no reason', () => {
  assert.equal(returnReason(row(1, { next_review_at: FUTURE }), word(1), { now: NOW }), null);
  assert.equal(returnReason(row(1, { next_review_at: FUTURE }), word(1), { now: NOW, inLatestSession: true }), null);
  assert.equal(returnReason(row(1, { status: 'new', next_review_at: null }), word(1), { now: NOW }), null);
});

test('latest-session learning word that is not due yet is still explained', () => {
  assert.equal(
    returnReason(row(1, { status: 'learning', next_review_at: FUTURE }), word(1), { now: NOW, inLatestSession: true }),
    'Слово ещё заучивается.',
  );
});

test('buildReturnReasons: caps at 8, most forgotten first, own pair and user only', () => {
  const words = [];
  const progressRows = [];
  for (let id = 1; id <= 12; id += 1) {
    words.push(word(id));
    progressRows.push(row(id, { status: 'learning', lapses: id === 12 ? 3 : 0 }));
  }
  words.push(word(99, { lang_pair: 'other-pair' }));
  progressRows.push(row(99));
  progressRows.push(row(5, { user_id: 2 }));

  const out = buildReturnReasons({ progressRows, words, userId: 1, langPair: DEFAULT_LANG_PAIR, now: NOW });
  assert.equal(RETURN_REASONS_CAP, 8);
  assert.equal(out.length, 8);
  assert.equal(out[0].wordId, 12);
  assert.match(out[0].reason, /вернулось раньше/);
  assert.ok(!out.some((item) => item.wordId === 99));
  assert.deepEqual(Object.keys(out[0]).sort(), ['lemma', 'reason', 'translation', 'wordId']);
});

test('buildReturnReasons: latest session words appear even if not due; retired needs own down vote', () => {
  const sessions = [{ user_id: 1, started_at: '2026-03-10T11:00:00.000Z', ended_at: '2026-03-10T11:10:00.000Z' }];
  const words = [
    word(1),
    word(2),
    word(3, { association: 'null', association_retired: curated }),
  ];
  const progressRows = [
    row(1, { status: 'learning', next_review_at: FUTURE, updated_at: '2026-03-10T11:05:00.000Z' }),
    row(2, { next_review_at: FUTURE, updated_at: '2026-03-10T11:05:00.000Z' }),
    row(3, { updated_at: '2026-03-01T00:00:00.000Z' }),
  ];
  const ratings = [{ user_id: 1, word_id: 3, vote: 'down' }];
  const out = buildReturnReasons({ progressRows, words, ratings, sessions, userId: 1, langPair: DEFAULT_LANG_PAIR, now: NOW });
  const byId = Object.fromEntries(out.map((item) => [item.wordId, item.reason]));
  assert.equal(byId[1], 'Слово ещё заучивается.');
  assert.equal(byId[2], undefined);
  assert.match(byId[3], /ассоциацию как неподходящую/);
});
