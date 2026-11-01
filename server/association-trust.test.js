import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CURATED_TRUST_THRESHOLD,
  applyAssociationTrust,
  crowdMayReplaceCurated,
  tallyAssociationVotes,
} from './association-trust.js';

const curated = JSON.stringify({
  kind: 'keyword',
  phonetic: 'тэ́йбл',
  hooks: ['таблица'],
  image: 'На столе лежит большая таблица.',
  source: 'curated',
});

function word() {
  return { id: 7, lemma: 'table', lang_pair: 'en-ru', association: curated };
}

function votes(up, down, hook = 'таблица') {
  const rows = [];
  let user = 1;
  for (let i = 0; i < up; i += 1) rows.push({ user_id: user++, lemma: 'table', lang_pair: 'en-ru', hook, vote: 'up' });
  for (let i = 0; i < down; i += 1) rows.push({ user_id: user++, lemma: 'table', lang_pair: 'en-ru', hook, vote: 'down' });
  return rows;
}

test('the threshold is conservative: one downvote never retires a curated line', () => {
  assert.ok(CURATED_TRUST_THRESHOLD.minVotes >= 20);
  assert.ok(CURATED_TRUST_THRESHOLD.minDownShare >= 0.7);
  const w = word();
  assert.equal(applyAssociationTrust(w, votes(0, 1)), false);
  assert.equal(w.association, curated);
  assert.equal(applyAssociationTrust(w, votes(0, CURATED_TRUST_THRESHOLD.minVotes - 1)), false);
  assert.equal(w.association, curated);
});

test('a rejection below the share threshold keeps the curated line', () => {
  const total = CURATED_TRUST_THRESHOLD.minVotes + 5;
  const down = Math.floor(total * CURATED_TRUST_THRESHOLD.minDownShare) - 2;
  assert.equal(crowdMayReplaceCurated({ up: total - down, down, total }), false);
});

test('enough voters and a clear majority retire it, and it returns when votes fade', () => {
  const w = word();
  const down = CURATED_TRUST_THRESHOLD.minVotes;
  assert.equal(applyAssociationTrust(w, votes(0, down)), true);
  assert.equal(w.association, 'null');
  assert.equal(w.association_retired, curated);

  // Retired lines stay votable and are re-evaluated from the same curated text.
  assert.equal(applyAssociationTrust(w, votes(0, down)), false);
  assert.equal(applyAssociationTrust(w, votes(down, 0)), true);
  assert.equal(w.association, curated);
  assert.equal(w.association_retired, undefined);
});

test('votes for an older hook do not count against a rewritten line', () => {
  const tally = tallyAssociationVotes(votes(0, 40, 'старый хук'), {
    langPair: 'en-ru',
    lemma: 'table',
    hook: 'таблица',
  });
  assert.equal(tally.total, 0);
  const w = word();
  assert.equal(applyAssociationTrust(w, votes(0, 40, 'старый хук')), false);
});

test('an association without the curated marker is never touched', () => {
  const crowd = JSON.stringify({ kind: 'usage', phonetic: '', hooks: [], image: 'Чья-то строка.' });
  const w = { id: 1, lemma: 'table', lang_pair: 'en-ru', association: crowd };
  assert.equal(applyAssociationTrust(w, votes(0, 40, '')), false);
  assert.equal(w.association, crowd);
});
