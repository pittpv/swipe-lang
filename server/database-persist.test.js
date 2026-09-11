import { test } from 'node:test';
import assert from 'node:assert/strict';
import { persistableState } from './database.js';

const sample = {
  users: [{ id: 1, email: 'a@test.com' }],
  words: [
    { id: 42, lemma: 'ev', lang_pair: 'tr-ru', examples: '[{"example":"x"}]', forms: '[]' },
    { id: 99, lemma: 'House', lang_pair: 'en-ru', examples: '[]', forms: '[]' },
  ],
  user_word_progress: [{ id: 1, user_id: 1, word_id: 42 }],
  study_sessions: [],
  analytics: [{ id: 1, event: 'swipe' }],
  _seq: { users: 1, words: 99 },
  _wordIdMap: {},
  _rev: 12,
};

test('postgres persist omits the dictionary and keeps stable word ids', () => {
  const slim = persistableState(sample, 'postgres');
  assert.equal(slim.words, undefined);
  assert.equal(slim.users.length, 1);
  assert.equal(slim.user_word_progress[0].word_id, 42);
  assert.equal(slim._wordIdMap['tr-ru:ev'], 42);
  assert.equal(slim._wordIdMap['en-ru:house'], 99);
  assert.equal(slim._rev, 12);
});

test('redis persist also omits the dictionary', () => {
  const slim = persistableState(sample, 'redis');
  assert.equal(slim.words, undefined);
  assert.equal(slim._wordIdMap['tr-ru:ev'], 42);
});

test('file persist keeps words for self-contained local backups', () => {
  const file = persistableState(sample, 'file');
  assert.equal(file.words.length, 2);
  assert.equal(file._wordIdMap['tr-ru:ev'], 42);
});
