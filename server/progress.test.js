import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  levelsUpTo,
  nextCefrLevel,
  getLevelProgress,
  estimateEta,
  NEW_PER_SESSION,
} from './progress.js';

function mockDb({ cefr = 'A1', words, progress = [], sessions = [] }) {
  return {
    data: {
      users: [{ id: 1, cefr_level: cefr }],
      words,
      user_word_progress: progress,
      study_sessions: sessions,
    },
  };
}

const tinyWords = [
  { id: 1, cefr_level: 'A1', lang_pair: 'tr-ru' },
  { id: 2, cefr_level: 'A1', lang_pair: 'tr-ru' },
  { id: 3, cefr_level: 'A2', lang_pair: 'tr-ru' },
];

test('levelsUpTo includes selected and below', () => {
  assert.deepEqual(levelsUpTo('A1'), ['A1']);
  assert.deepEqual(levelsUpTo('B1'), ['A1', 'A2', 'B1']);
});

test('nextCefrLevel advances until C1', () => {
  assert.equal(nextCefrLevel('A1'), 'A2');
  assert.equal(nextCefrLevel('B2'), 'C1');
  assert.equal(nextCefrLevel('C1'), null);
});

test('getLevelProgress counts known / learning / new in scope', () => {
  const db = mockDb({
    cefr: 'A1',
    words: tinyWords,
    progress: [
      { user_id: 1, word_id: 1, status: 'known' },
      { user_id: 1, word_id: 2, status: 'learning' },
    ],
  });
  const lp = getLevelProgress(db, 1);
  assert.equal(lp.wordsTotal, 2);
  assert.equal(lp.wordsKnown, 1);
  assert.equal(lp.wordsLearning, 1);
  assert.equal(lp.wordsNew, 0);
  assert.equal(lp.complete, false);
  assert.equal(lp.nextCefrLevel, 'A2');
});

test('getLevelProgress complete when all in scope known', () => {
  const db = mockDb({
    cefr: 'A1',
    words: tinyWords,
    progress: [
      { user_id: 1, word_id: 1, status: 'known' },
      { user_id: 1, word_id: 2, status: 'mature' },
    ],
  });
  const lp = getLevelProgress(db, 1);
  assert.equal(lp.complete, true);
  assert.equal(lp.remaining, 0);
  assert.equal(lp.percent, 100);
});

test('estimateEta returns sessions and days for remaining words', () => {
  const db = mockDb({
    cefr: 'A1',
    words: tinyWords,
    progress: [],
  });
  const eta = estimateEta(db, 1);
  assert.equal(eta.remainingWords, 2);
  assert.ok(eta.sessionsNeeded >= 1);
  assert.ok(eta.daysEstimate >= 1);
  assert.match(eta.label, /сесс/);
});

test('estimateEta complete label when level done', () => {
  const db = mockDb({
    cefr: 'A1',
    words: tinyWords,
    progress: [
      { user_id: 1, word_id: 1, status: 'known' },
      { user_id: 1, word_id: 2, status: 'known' },
    ],
  });
  const eta = estimateEta(db, 1);
  assert.equal(eta.daysEstimate, 0);
  assert.match(eta.label, /освоен|дальше/i);
});

test('NEW_PER_SESSION is 13 for session size 18', () => {
  assert.equal(NEW_PER_SESSION, 13);
});
