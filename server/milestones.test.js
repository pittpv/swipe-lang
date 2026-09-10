import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  collectMilestones,
  knownWordsByPair,
  listMilestones,
  wordsMilestoneMap,
} from './milestones.js';

test('collectMilestones tracks word badges per language', () => {
  const user = { lang_pair: 'tr-ru', milestones: {} };
  const first = collectMilestones(user, { streak: 1, words: 12, langPair: 'tr-ru' });
  assert.deepEqual(
    first.filter((a) => a.type === 'words'),
    [
      { type: 'words', value: 5, langPair: 'tr-ru' },
      { type: 'words', value: 10, langPair: 'tr-ru' },
    ],
  );

  const english = collectMilestones(user, { streak: 1, words: 5, langPair: 'en-ru' });
  assert.deepEqual(english, [{ type: 'words', value: 5, langPair: 'en-ru' }]);
  assert.equal(user.milestones.words['tr-ru'], 10);
  assert.equal(user.milestones.words['en-ru'], 5);
});

test('listMilestones keeps Turkish and English word badges distinct', () => {
  const listed = listMilestones({
    lang_pair: 'en-ru',
    milestones: { streak: 5, words: { 'tr-ru': 20, 'en-ru': 5 } },
  });
  assert.deepEqual(
    listed.filter((a) => a.type === 'words'),
    [
      { type: 'words', value: 5, langPair: 'tr-ru' },
      { type: 'words', value: 10, langPair: 'tr-ru' },
      { type: 'words', value: 20, langPair: 'tr-ru' },
      { type: 'words', value: 5, langPair: 'en-ru' },
    ],
  );
  assert.ok(listed.some((a) => a.type === 'streak' && a.value === 3));
  assert.ok(listed.some((a) => a.type === 'streak' && a.value === 5));
  assert.ok(listed.every((a) => a.type !== 'streak' || a.langPair == null));
});

test('legacy numeric word milestone is attributed to the strongest pair', () => {
  const map = wordsMilestoneMap({ words: 50 }, { 'tr-ru': 80, 'en-ru': 12, 'es-ru': 0 }, 'en-ru');
  assert.deepEqual(map, { 'tr-ru': 50 });
});

test('knownWordsByPair counts only known/mature cards', () => {
  const db = {
    data: {
      words: [
        { id: 1, lang_pair: 'tr-ru' },
        { id: 2, lang_pair: 'en-ru' },
        { id: 3, lang_pair: 'en-ru' },
      ],
      user_word_progress: [
        { user_id: 1, word_id: 1, status: 'known' },
        { user_id: 1, word_id: 2, status: 'learning' },
        { user_id: 1, word_id: 3, status: 'mature' },
        { user_id: 2, word_id: 3, status: 'known' },
      ],
    },
  };
  assert.deepEqual(knownWordsByPair(db, 1), { 'tr-ru': 1, 'en-ru': 1, 'es-ru': 0 });
});
