import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyRecordedSwipes, normalizeSwipeBatch } from './session-swipe.js';
import { finishPlayedSession } from './rating.js';

const NOW = new Date('2026-10-03T12:00:00.000Z');

function sessionData() {
  return {
    _seq: { user_word_progress: 0 },
    user_word_progress: [],
    study_sessions: [
      {
        id: 7,
        user_id: 1,
        ended_at: null,
        cards_reviewed: 0,
        cards_learned: 0,
        rating_deck: [
          { id: 11, due: false, scheduled: false, interval: 0 },
          { id: 12, due: false, scheduled: false, interval: 0 },
        ],
        rating_hits: [],
      },
    ],
  };
}

test('normalizeSwipeBatch accepts one swipe or a batch', () => {
  assert.deepEqual(normalizeSwipeBatch({ wordId: 4, direction: 'left' }), [
    { wordId: 4, direction: 'left', swipedAt: null },
  ]);
  assert.equal(normalizeSwipeBatch({ wordId: 4, direction: 'up' }), null);
  assert.equal(normalizeSwipeBatch({ swipes: [] }), null);
});

test('applyRecordedSwipes records a batch once and ignores a retry', () => {
  const data = sessionData();
  const first = applyRecordedSwipes(data, {
    userId: 1,
    sessionId: 7,
    swipes: [
      { wordId: 11, direction: 'left', swipedAt: null },
      { wordId: 12, direction: 'right', swipedAt: null },
    ],
  });
  assert.equal(first.reviewed, 2);
  assert.equal(first.learned, 1);
  assert.equal(data.study_sessions[0].cards_reviewed, 2);
  assert.equal(data.study_sessions[0].cards_learned, 1);
  assert.equal(data.user_word_progress.length, 2);
  const known = data.user_word_progress.find((row) => row.word_id === 11);
  assert.equal(known.repetitions, 1);

  const again = applyRecordedSwipes(data, {
    userId: 1,
    sessionId: 7,
    swipes: [
      { wordId: 11, direction: 'left', swipedAt: null },
      { wordId: 12, direction: 'right', swipedAt: null },
    ],
  });
  assert.equal(again.reviewed, 0);
  assert.equal(again.learned, 0);
  assert.equal(data.study_sessions[0].cards_reviewed, 2);
  assert.equal(known.repetitions, 1);
  assert.equal(data.user_word_progress.length, 2);
});

test('applyRecordedSwipes persists lapses on existing rows and starts new rows at 0', () => {
  const data = sessionData();
  data.user_word_progress.push({
    id: 1, user_id: 1, word_id: 11, status: 'known', ease: 2.5, interval_days: 6, repetitions: 3, next_review_at: null,
  });
  applyRecordedSwipes(data, {
    userId: 1,
    sessionId: 7,
    swipes: [
      { wordId: 11, direction: 'right', swipedAt: null },
      { wordId: 12, direction: 'right', swipedAt: null },
    ],
  });
  const lapsed = data.user_word_progress.find((row) => row.word_id === 11);
  assert.equal(lapsed.lapses, 1);
  assert.equal(lapsed.status, 'learning');
  assert.equal(data.user_word_progress.find((row) => row.word_id === 12).lapses, 0);
});

test('a batched session still closes the rating day once and keeps review points', () => {
  const user = { id: 1, lang_pair: 'tr-ru', rating_days: [] };
  const played = {
    id: 7,
    user_id: 1,
    lang_pair: 'tr-ru',
    started_at: '2026-10-03T11:40:00.000Z',
    ended_at: null,
    cards_reviewed: 0,
    cards_learned: 0,
    rating_deck: [
      { id: 1, due: true, scheduled: true, interval: 6 },
      { id: 2, due: true, scheduled: false, interval: 21 },
      { id: 3, due: false, scheduled: false, interval: 0 },
    ],
    rating_hits: [],
    rating_last_at: null,
  };
  const prefetch = {
    id: 8,
    user_id: 1,
    lang_pair: 'tr-ru',
    started_at: '2026-10-03T11:50:00.000Z',
    ended_at: null,
    cards_reviewed: 0,
    cards_learned: 0,
    rating_deck: [{ id: 99, due: true, scheduled: true, interval: 6 }],
    rating_hits: [],
    rating_last_at: null,
  };
  const data = {
    _seq: { user_word_progress: 0 },
    user_word_progress: [{ user_id: 1, word_id: 1, interval_days: 6, ease: 2.5, repetitions: 4, status: 'known' }],
    study_sessions: [played, prefetch],
    users: [user],
  };
  const late = new Date(NOW.getTime() - 10 * 60 * 1000).toISOString();
  const firstBatch = [
    { wordId: 1, direction: 'left', swipedAt: late },
    { wordId: 2, direction: 'right', swipedAt: late },
  ];
  const secondBatch = [{ wordId: 3, direction: 'left', swipedAt: NOW.toISOString() }];

  applyRecordedSwipes(data, { userId: 1, sessionId: 7, swipes: firstBatch, recordedAt: NOW });
  applyRecordedSwipes(data, { userId: 1, sessionId: 7, swipes: secondBatch, recordedAt: NOW });
  applyRecordedSwipes(data, { userId: 1, sessionId: 7, swipes: firstBatch, recordedAt: NOW });
  applyRecordedSwipes(data, { userId: 1, sessionId: 7, swipes: secondBatch, recordedAt: NOW });

  assert.deepEqual(played.rating_hits, [1, 2, 3]);
  assert.equal(prefetch.rating_hits.length, 0);
  assert.equal(user.rating_days.length, 0);
  assert.equal(data.user_word_progress.find((row) => row.word_id === 1).repetitions, 5);
  assert.equal(data.user_word_progress.find((row) => row.word_id === 1).held_6, undefined);

  const settled = finishPlayedSession(
    user,
    data.study_sessions,
    { sessionId: 7, reviewed: 3, wordIds: [1, 2, 3] },
    data.user_word_progress,
    NOW,
  );
  assert.equal(settled.dayClosed, true);
  assert.equal(settled.counted, true);
  assert.equal(settled.reviews, 2);
  assert.equal(settled.returns, 1);
  assert.deepEqual(settled.holds, [{ wordId: 1, threshold: 6 }]);
  assert.equal(user.rating_days.length, 1);
  assert.equal(user.rating_days[0].reviews, 2);
  assert.equal(user.rating_days[0].returns, 1);
  assert.equal(user.rating_days[0].date, '2026-10-03');
  assert.equal(data.user_word_progress.find((row) => row.word_id === 1).held_6, true);
  assert.equal(played.ended_at, NOW.toISOString());
  assert.equal(prefetch.ended_at, NOW.toISOString());
  assert.equal(played.rating_hits, undefined);

  const again = finishPlayedSession(
    user,
    data.study_sessions,
    { sessionId: 7, reviewed: 3, wordIds: [1, 2, 3] },
    data.user_word_progress,
    new Date(NOW.getTime() + 60_000),
  );
  assert.equal(again.counted, false);
  assert.equal(again.dayClosed, true);
  assert.equal(user.rating_days.length, 1);
  assert.equal(data.user_word_progress.find((row) => row.word_id === 1).held_6, true);
  assert.equal(data.user_word_progress.find((row) => row.word_id === 1).repetitions, 5);
});

test('mature_at is stamped once when the interval first reaches 21 days and clears on a miss', () => {
  const data = sessionData();
  data.user_word_progress.push({
    id: 1,
    user_id: 1,
    word_id: 11,
    status: 'known',
    ease: 2.5,
    interval_days: 15,
    repetitions: 5,
    next_review_at: null,
    lapses: 0,
  });
  applyRecordedSwipes(data, {
    userId: 1,
    sessionId: 7,
    swipes: [{ wordId: 11, direction: 'left', swipedAt: null }],
    recordedAt: NOW,
  });
  const row = data.user_word_progress.find((item) => item.word_id === 11);
  assert.equal(row.status, 'mature');
  assert.equal(row.mature_at, NOW.toISOString());

  const later = new Date(NOW.getTime() + 86_400_000);
  applyRecordedSwipes(data, {
    userId: 1,
    sessionId: null,
    swipes: [{ wordId: 11, direction: 'left', swipedAt: null }],
    recordedAt: later,
  });
  assert.equal(row.mature_at, NOW.toISOString());

  applyRecordedSwipes(data, {
    userId: 1,
    sessionId: null,
    swipes: [{ wordId: 11, direction: 'right', swipedAt: null }],
    recordedAt: later,
  });
  assert.equal(row.status, 'learning');
  assert.equal(row.mature_at, null);
});
