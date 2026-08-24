import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applySwipe } from './srs.js';

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
