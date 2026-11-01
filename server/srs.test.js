import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applySwipe, isLeech, lapsesOf, LEECH_LAPSES_THRESHOLD, LEECH_RETRY_MINUTES } from './srs.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

function dueInMs(result) {
  return new Date(result.next_review_at).getTime() - Date.now();
}

function knownRow(extra = {}) {
  return { status: 'known', ease: 2.5, interval_days: 6, repetitions: 3, next_review_at: null, ...extra };
}

test('swipe right sets learning with 1 day review', () => {
  const result = applySwipe(null, 'right');
  assert.equal(result.status, 'learning');
  assert.equal(result.interval_days, 1);
  assert.ok(result.next_review_at);
});

test('first swipe left sets 1 day interval', () => {
  const result = applySwipe(null, 'left');
  assert.equal(result.repetitions, 1);
  assert.equal(result.interval_days, 1);
});

test('second swipe left sets 6 day interval', () => {
  const result = applySwipe(
    { status: 'new', ease: 2.5, interval_days: 1, repetitions: 1, next_review_at: null },
    'left',
  );
  assert.equal(result.repetitions, 2);
  assert.equal(result.interval_days, 6);
});

test('swipe left on mature word increases interval', () => {
  const result = applySwipe(
    { status: 'known', ease: 2.5, interval_days: 6, repetitions: 2, next_review_at: null },
    'left',
  );
  assert.equal(result.interval_days, 15);
});

test('swipe right reduces ease', () => {
  const result = applySwipe(
    { status: 'known', ease: 2.5, interval_days: 6, repetitions: 3, next_review_at: null },
    'right',
  );
  assert.equal(result.status, 'learning');
  assert.equal(result.ease, 2.3);
});

test('lapses start at 0 and legacy rows without the field read as 0', () => {
  assert.equal(applySwipe(null, 'right').lapses, 0);
  assert.equal(applySwipe(null, 'left').lapses, 0);
  assert.equal(lapsesOf({ status: 'known' }), 0);
  assert.equal(lapsesOf({ lapses: 'oops' }), 0);
  assert.equal(lapsesOf({ lapses: -2 }), 0);
  assert.equal(applySwipe(knownRow(), 'right').lapses, 1);
});

test('a lapse is a miss on a known or mature card, not a miss while still learning', () => {
  assert.equal(applySwipe(knownRow({ lapses: 1 }), 'right').lapses, 2);
  assert.equal(applySwipe(knownRow({ status: 'mature', interval_days: 30, lapses: 1 }), 'right').lapses, 2);
  const learning = { status: 'learning', ease: 2.1, interval_days: 1, repetitions: 0, next_review_at: null, lapses: 1 };
  assert.equal(applySwipe(learning, 'right').lapses, 1);
  assert.equal(applySwipe({ ...learning, status: 'new' }, 'right').lapses, 1);
});

test('a successful review keeps lapses and does not increment them', () => {
  const result = applySwipe(knownRow({ lapses: 2 }), 'left');
  assert.equal(result.lapses, 2);
  assert.equal(result.repetitions, 4);
  const graduated = applySwipe(
    { status: 'learning', ease: 2.1, interval_days: 1, repetitions: 0, next_review_at: null, lapses: 4 },
    'left',
  );
  assert.equal(graduated.lapses, 4);
  assert.equal(graduated.status, 'known');
});

test('below the leech threshold a lapse keeps the normal SM-2 learning step', () => {
  const result = applySwipe(knownRow({ lapses: LEECH_LAPSES_THRESHOLD - 2 }), 'right');
  assert.equal(result.lapses, LEECH_LAPSES_THRESHOLD - 1);
  assert.equal(result.status, 'learning');
  assert.equal(result.ease, 2.3);
  assert.equal(result.interval_days, 1);
  assert.equal(result.repetitions, 0);
  assert.equal(isLeech(result), false);
  const due = dueInMs(result);
  assert.ok(due > DAY_MS - 5 * MINUTE_MS && due <= DAY_MS + 5 * MINUTE_MS, `due in ${due}ms`);
});

test('crossing the leech threshold schedules a short retry and leaves SM-2 state alone', () => {
  const result = applySwipe(knownRow({ lapses: LEECH_LAPSES_THRESHOLD - 1 }), 'right');
  assert.equal(result.lapses, LEECH_LAPSES_THRESHOLD);
  assert.equal(isLeech(result), true);
  assert.equal(result.status, 'learning');
  assert.equal(result.ease, 2.3);
  assert.equal(result.interval_days, 1);
  assert.equal(result.repetitions, 0);
  const due = dueInMs(result);
  const retry = LEECH_RETRY_MINUTES * MINUTE_MS;
  assert.ok(due > retry - MINUTE_MS && due <= retry, `due in ${due}ms`);
});

test('a leech missed again while learning gets the short retry without a new lapse', () => {
  const leech = { status: 'learning', ease: 1.9, interval_days: 1, repetitions: 0, next_review_at: null, lapses: 3 };
  const result = applySwipe(leech, 'right');
  assert.equal(result.lapses, 3);
  assert.ok(Math.abs(result.ease - 1.7) < 1e-9);
  assert.ok(dueInMs(result) <= LEECH_RETRY_MINUTES * MINUTE_MS);
});

test('a leech answered correctly follows the normal SM-2 interval', () => {
  const result = applySwipe(knownRow({ lapses: 5 }), 'left');
  assert.equal(result.interval_days, 15);
  assert.equal(result.ease, 2.6);
  assert.equal(result.lapses, 5);
  const due = dueInMs(result);
  assert.ok(due > 14 * DAY_MS, `due in ${due}ms`);
});
