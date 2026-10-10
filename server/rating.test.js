import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  compareRank,
  languageBoard,
  finishPlayedSession,
  noteRatingSwipe,
  ratingDeckMeta,
  swipeInstant,
  settleSession,
  weekDates,
  weekSummary,
} from './rating.js';

const NOW = new Date('2026-10-03T12:00:00.000Z');

test('week starts on Monday in UTC', () => {
  assert.deepEqual(weekDates('2026-10-03'), [
    '2026-09-28',
    '2026-09-29',
    '2026-09-30',
    '2026-10-01',
    '2026-10-02',
    '2026-10-03',
    '2026-10-04',
  ]);
});

test('deck meta marks due reviews and same-day returns', () => {
  const meta = ratingDeckMeta(
    [
      { word_id: 1, next_review_at: '2026-10-03T08:00:00.000Z', interval_days: 6 },
      { word_id: 2, next_review_at: '2026-10-01T08:00:00.000Z', interval_days: 21 },
      { word_id: 3, next_review_at: '2026-10-05T08:00:00.000Z', interval_days: 6 },
    ],
    [1, 2, 3, 4],
    NOW,
  );
  assert.deepEqual(meta, [
    { id: 1, due: true, scheduled: true, interval: 6 },
    { id: 2, due: true, scheduled: false, interval: 21 },
    { id: 3, due: false, scheduled: false, interval: 6 },
    { id: 4, due: false, scheduled: false, interval: 0 },
  ]);
});

test('swipe instant keeps a recent client time', () => {
  const now = new Date('2026-10-06T12:00:00.000Z');
  assert.equal(swipeInstant('2026-10-06T11:59:58.500Z', now).toISOString(), '2026-10-06T11:59:58.500Z');
  assert.equal(swipeInstant('2026-10-06T12:00:01.000Z', now).toISOString(), '2026-10-06T12:00:01.000Z');
  assert.equal(swipeInstant('2026-10-06T12:00:05.000Z', now).getTime(), now.getTime());
  assert.equal(swipeInstant('2026-10-06T11:57:00.000Z', now).getTime(), now.getTime());
  assert.equal(swipeInstant('nope', now).getTime(), now.getTime());
});

test('rating swipes ignore words outside the deck and still count a fast follow-up', () => {
  const session = { rating_deck: [{ id: 1 }, { id: '2' }], rating_hits: [], rating_last_at: null };
  assert.equal(noteRatingSwipe(session, 1, NOW), true);
  assert.equal(noteRatingSwipe(session, 2, new Date(NOW.getTime() + 400)), true);
  assert.equal(noteRatingSwipe(session, 9, new Date(NOW.getTime() + 1200)), false);
  assert.deepEqual(session.rating_hits, [1, 2]);
  assert.equal(noteRatingSwipe(session, '1', new Date(NOW.getTime() + 5000)), false);
});

function sessionWith(deck, hits) {
  return { lang_pair: 'tr-ru', rating_deck: deck, rating_hits: hits, rating_last_at: null };
}

test('a full slow deck closes the day once and awards a same-day hold', () => {
  const user = { id: 1, lang_pair: 'tr-ru', rating_days: [] };
  const progress = [{ user_id: 1, word_id: 1, interval_days: 6 }];
  const deck = [
    { id: 1, due: true, scheduled: true, interval: 6 },
    { id: 2, due: true, scheduled: false, interval: 1 },
  ];
  const open = settleSession(user, sessionWith(deck, [1]), progress, NOW);
  assert.equal(open.counted, false);
  assert.equal(open.dayClosed, false);
  assert.equal(user.rating_days.length, 0);
  assert.equal(progress[0].held_6, undefined);

  const closed = settleSession(user, sessionWith(deck, [1, 2]), progress, NOW);
  assert.equal(closed.counted, true);
  assert.equal(closed.dayClosed, true);
  assert.equal(closed.weekDays, 1);
  assert.equal(closed.reviews, 2);
  assert.equal(closed.returns, 1);
  assert.deepEqual(closed.holds, [{ wordId: 1, threshold: 6 }]);
  assert.equal(progress[0].held_6, true);

  const again = settleSession(user, sessionWith(deck, [1, 2]), progress, new Date(NOW.getTime() + 60_000));
  assert.equal(again.counted, false);
  assert.equal(again.dayClosed, true);
  assert.equal(again.weekDays, 1);
  assert.equal(user.rating_days.length, 1);
  assert.equal(user.rating_days[0].reviews, 2);
});

test('an overdue review does not count as a return or a hold', () => {
  const user = { id: 1, lang_pair: 'tr-ru' };
  const progress = [{ user_id: 1, word_id: 2, interval_days: 21 }];
  const deck = [{ id: 2, due: true, scheduled: false, interval: 21 }];
  const closed = settleSession(user, sessionWith(deck, [2]), progress, NOW);
  assert.equal(closed.reviews, 1);
  assert.equal(closed.returns, 0);
  assert.deepEqual(closed.holds, []);
  assert.equal(progress[0].held_21, undefined);
});

test('interval 21 awards both holds once', () => {
  const user = { id: 1, lang_pair: 'tr-ru' };
  const progress = [{ user_id: 1, word_id: 5, interval_days: 21 }];
  const deck = [{ id: 5, due: true, scheduled: true, interval: 21 }];
  const closed = settleSession(user, sessionWith(deck, [5]), progress, NOW);
  assert.deepEqual(closed.holds, [
    { wordId: 5, threshold: 6 },
    { wordId: 5, threshold: 21 },
  ]);
  const repeat = settleSession(
    user,
    sessionWith(deck, [5]),
    progress,
    new Date('2026-10-04T12:00:00.000Z'),
  );
  assert.deepEqual(repeat.holds, []);
});

test('a finished session closes the day when hits were saved on another open session', () => {
  const user = { id: 1, lang_pair: 'tr-ru', rating_days: [] };
  const played = {
    id: 2,
    user_id: 1,
    lang_pair: 'tr-ru',
    started_at: '2026-10-03T12:00:00.000Z',
    ended_at: null,
    cards_reviewed: 2,
    rating_deck: [
      { id: 1, due: false, scheduled: false, interval: 0 },
      { id: 2, due: false, scheduled: false, interval: 0 },
    ],
    rating_hits: [1],
  };
  const prefetch = {
    id: 3,
    user_id: 1,
    lang_pair: 'tr-ru',
    started_at: '2026-10-03T12:05:00.000Z',
    ended_at: null,
    cards_reviewed: 0,
    rating_deck: [{ id: 9, due: false, scheduled: false, interval: 0 }],
    rating_hits: [],
  };
  const settled = finishPlayedSession(
    user,
    [played, prefetch],
    { sessionId: 3, reviewed: 0, wordIds: [1, 2] },
    [],
    NOW,
  );
  assert.equal(settled.dayClosed, true);
  assert.equal(settled.counted, true);
  assert.equal(user.rating_days.length, 1);
  assert.equal(user.rating_days[0].lang_pair, 'tr-ru');
  assert.equal(played.ended_at != null, true);
  assert.equal(prefetch.ended_at != null, true);
});

test('one recorded swipe still closes the day when the deck list is short', () => {
  const user = { id: 1, lang_pair: 'tr-ru', rating_days: [] };
  const session = {
    id: 1,
    user_id: '1',
    lang_pair: 'tr-ru',
    started_at: NOW.toISOString(),
    ended_at: null,
    cards_reviewed: 1,
    rating_deck: [
      { id: 1, due: true, scheduled: true, interval: 6 },
      { id: 2, due: false, scheduled: false, interval: 0 },
    ],
    rating_hits: [1],
  };
  const settled = finishPlayedSession(user, [session], { sessionId: 1, reviewed: 0, wordIds: [] }, [], NOW);
  assert.equal(settled.counted, true);
  assert.equal(user.rating_days.length, 1);
  const again = finishPlayedSession(user, [session], { sessionId: 1, reviewed: 1, wordIds: [1, 2] }, [], NOW);
  assert.equal(again.counted, false);
  assert.equal(again.dayClosed, true);
  assert.equal(user.rating_days.length, 1);
});

test('complete with no swipes leaves the day open', () => {
  const user = { id: 1, lang_pair: 'tr-ru', rating_days: [] };
  const session = {
    id: 1,
    user_id: 1,
    lang_pair: 'tr-ru',
    started_at: NOW.toISOString(),
    ended_at: null,
    cards_reviewed: 0,
    rating_deck: [{ id: 1, due: false, scheduled: false, interval: 0 }],
    rating_hits: [],
  };
  const settled = finishPlayedSession(user, [session], { sessionId: 1, reviewed: 0, wordIds: [] }, [], NOW);
  assert.equal(settled.dayClosed, false);
  assert.equal(user.rating_days?.length ?? 0, 0);
});

test('more days outrank more reviews', () => {
  const lowDays = { id: 1, name: 'Аня', days: 4, reviews: 40, returns: 10, closedToday: false };
  const highDays = { id: 2, name: 'Борис', days: 5, reviews: 1, returns: 0, closedToday: false };
  assert.ok(compareRank(highDays, lowDays) < 0);
});

test('language board hides empty weeks and pins the viewer', () => {
  const db = {
    data: {
      users: [
        { id: 1, name: 'Аня', lang_pair: 'tr-ru', rating_days: [{ date: '2026-10-03', lang_pair: 'tr-ru', reviews: 2, returns: 1, closed_at: '2026-10-03T10:00:00.000Z' }] },
        { id: 2, name: '', lang_pair: 'tr-ru' },
        { id: 3, name: 'Карл', lang_pair: 'en-ru', rating_days: [{ date: '2026-10-03', lang_pair: 'en-ru', reviews: 9, returns: 9, closed_at: '2026-10-03T09:00:00.000Z' }] },
      ],
    },
  };
  const board = languageBoard(db, 2, NOW);
  assert.equal(board.langPair, 'tr-ru');
  assert.deepEqual(board.rows.map((row) => row.name), ['Аня']);
  assert.equal(board.me.pinned, true);
  assert.equal(board.me.days, 0);
  assert.equal(board.me.name, 'Участник');
  assert.equal(weekSummary(db.data.users[2], 'en-ru', NOW).dayCount, 1);
});
