import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  circleSessionWordIds,
  circleState,
  createCircle,
  jaccard,
  joinCircle,
  leaveCircle,
  progressWordIds,
  removeUserFromCircles,
  sharedWordIds,
} from './circles.js';

function word(id, lemma, pair = 'tr-ru') {
  return { id, lemma, translation: lemma, lang_pair: pair, pos: 'noun', examples: '[]', forms: '[]' };
}

function mockDb() {
  const data = {
    users: [
      { id: 1, name: 'Аня', lang_pair: 'tr-ru' },
      { id: 2, name: 'Борис', lang_pair: 'tr-ru' },
      { id: 3, name: '', lang_pair: 'en-ru' },
    ],
    words: [word(1, 'ev'), word(2, 'su'), word(3, 'kalem'), word(4, 'house', 'en-ru')],
    user_word_progress: [
      { user_id: 1, word_id: 1 },
      { user_id: 1, word_id: 2 },
      { user_id: 2, word_id: 2 },
      { user_id: 2, word_id: 3 },
      { user_id: 3, word_id: 4 },
    ],
    study_circles: [],
    _seq: { study_circles: 0 },
  };
  return {
    data,
    nextId(table) {
      data._seq[table] = (data._seq[table] ?? 0) + 1;
      return data._seq[table];
    },
  };
}

test('jaccard is zero for two empty sets and one for identical sets', () => {
  assert.equal(jaccard(new Set(), new Set()), 0);
  assert.equal(jaccard(new Set([1, 2]), new Set([1, 2])), 1);
  assert.equal(jaccard(new Set([1]), new Set([1, 2])), 0.5);
});

test('shared words ignore an empty member and need two filled decks', () => {
  assert.equal(sharedWordIds([new Set([1, 2]), new Set()]).size, 0);
  assert.equal(sharedWordIds([new Set([1, 2])]).size, 0);
  assert.deepEqual([...sharedWordIds([new Set([1, 2]), new Set([2, 3]), new Set()])], [2]);
});

test('progress is limited to the language pair', () => {
  const db = mockDb();
  db.data.user_word_progress.push({ user_id: 1, word_id: 4 });
  assert.deepEqual([...progressWordIds(db, 1, 'tr-ru')], [1, 2]);
});

test('create, suggest by overlap, join, and practice the intersection', () => {
  const db = mockDb();
  const created = createCircle(db, 1, '  Утро   в Анкаре  ');
  assert.equal(created.circle.name, 'Утро в Анкаре');
  assert.equal(created.circle.memberCount, 1);
  assert.equal(created.circle.sharedCount, 0);
  assert.equal(created.circle.canStart, false);
  assert.match(created.circle.inviteCode, /^[0-9a-f]{8}$/);

  const suggestions = circleState(db, 2).suggestions;
  assert.equal(suggestions.length, 1);
  assert.equal(suggestions[0].overlapCount, 1);
  assert.ok(suggestions[0].overlapPct > 0);
  assert.equal(suggestions[0].inviteCode, undefined);

  const joined = joinCircle(db, 2, { circleId: created.circle.id });
  assert.equal(joined.circle.sharedCount, 1);
  assert.equal(joined.circle.sharedPreview[0].lemma, 'su');
  assert.deepEqual(joined.circle.members.map((member) => member.name), ['Аня', 'Борис']);
  assert.deepEqual(circleSessionWordIds(db, 2, 18), [2]);

  assert.throws(() => joinCircle(db, 2, { code: created.circle.inviteCode }), /текущего кружка/);
  assert.throws(() => createCircle(db, 1, 'Второй'), /уже в кружке/);
});

test('invite code joins the circle and a foreign language is rejected', () => {
  const db = mockDb();
  const created = createCircle(db, 1, 'Турция');
  assert.throws(() => joinCircle(db, 3, { code: created.circle.inviteCode }), /другого языка/);
  db.data.users[2].lang_pair = 'tr-ru';
  const joined = joinCircle(db, 3, { code: created.circle.inviteCode.toUpperCase() });
  assert.equal(joined.circle.memberCount, 2);
  assert.equal(joined.circle.members[1].name, 'Участник');
});

test('a full circle rejects the next member and leaving removes an empty circle', () => {
  const db = mockDb();
  const created = createCircle(db, 1, 'Полный');
  db.data.study_circles[0].member_ids = [1, 10, 11, 12, 13, 14, 15, 16];
  assert.throws(() => joinCircle(db, 2, { circleId: created.circle.id }), /нет мест/);

  db.data.study_circles[0].member_ids = [1, 2];
  leaveCircle(db, 2);
  assert.equal(db.data.study_circles[0].member_ids.length, 1);
  leaveCircle(db, 1);
  assert.equal(db.data.study_circles.length, 0);
});

test('removeUserFromCircles drops membership and deletes an empty circle', () => {
  const db = mockDb();
  createCircle(db, 1, 'Один');
  const second = createCircle(db, 2, 'Двое');
  db.data.study_circles.find((circle) => circle.id === second.circle.id).member_ids.push(1);
  removeUserFromCircles(db, 1);
  assert.equal(db.data.study_circles.length, 1);
  assert.deepEqual(db.data.study_circles[0].member_ids, [2]);
});

test('short names are rejected', () => {
  const db = mockDb();
  assert.throws(() => createCircle(db, 1, ' Я '), /2 символов/);
});
