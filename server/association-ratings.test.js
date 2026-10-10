import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyAssociationVote, summarizeAssociationRatings } from './association-ratings.js';

test('a second tap of the same vote clears it and the other vote replaces it', () => {
  const base = {
    id: 1,
    user_id: 4,
    word_id: 9,
    lemma: 'kitap',
    lang_pair: 'tr-ru',
    hook: 'кит',
    image: 'Кит читает книгу.',
    updated_at: '2026-10-10T10:00:00.000Z',
  };
  let rows = applyAssociationVote([], { ...base, vote: 'up' });
  assert.equal(rows.length, 1);
  rows = applyAssociationVote(rows, { ...base, vote: null, updated_at: '2026-10-10T10:01:00.000Z' });
  assert.equal(rows.length, 0);
  rows = applyAssociationVote([], { ...base, vote: 'up' });
  rows = applyAssociationVote(rows, { ...base, vote: 'down', updated_at: '2026-10-10T10:02:00.000Z' });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].vote, 'down');
});

test('summary surfaces the associations people reject', () => {
  const summary = summarizeAssociationRatings([
    { lemma: 'kitap', lang_pair: 'tr-ru', hook: 'кит', image: 'Кит читает.', vote: 'up', updated_at: '2026-10-10T10:00:00.000Z' },
    { lemma: 'kitap', lang_pair: 'tr-ru', hook: 'кит', image: 'Кит читает.', vote: 'up', updated_at: '2026-10-10T11:00:00.000Z' },
    { lemma: 'ev', lang_pair: 'tr-ru', hook: 'лев', image: 'Лев в доме.', vote: 'down', updated_at: '2026-10-10T12:00:00.000Z' },
    { lemma: 'ev', lang_pair: 'tr-ru', hook: 'лев', image: 'Лев в доме.', vote: 'down', updated_at: '2026-10-10T12:01:00.000Z' },
    { lemma: 'ev', lang_pair: 'tr-ru', hook: 'лев', image: 'Лев в доме.', vote: 'up', updated_at: '2026-10-10T12:02:00.000Z' },
  ]);
  assert.equal(summary.totals.up, 3);
  assert.equal(summary.totals.down, 2);
  assert.equal(summary.rows[0].lemma, 'ev');
  assert.equal(summary.rows[0].likeRate, 33);
  assert.equal(summary.rows[1].lemma, 'kitap');
  assert.equal(summary.rows[1].likeRate, 100);
});
