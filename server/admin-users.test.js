import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listAdminUsers, purgeUserRecords } from './admin-users.js';

function mockDb() {
  return {
    data: {
      users: [
        {
          id: 1,
          email: 'a@test.com',
          name: 'Ann',
          password_hash: 'SECRET',
          goal: 'travel',
          cefr_level: 'A1',
          lang_pair: 'en-ru',
          streak: 3,
          last_session_date: '2026-09-09',
          created_at: '2026-09-01T10:00:00.000Z',
          referrals_count: 1,
          referred_by: null,
          push_subscription: { endpoint: 'https://push.example/secret' },
          reminder_time: '09:00',
        },
        {
          id: 2,
          email: 'b@test.com',
          name: null,
          password_hash: 'SECRET2',
          goal: null,
          cefr_level: 'A2',
          lang_pair: 'tr-ru',
          streak: 0,
          last_session_date: null,
          created_at: '2026-09-08T10:00:00.000Z',
          referrals_count: 0,
          referred_by: 1,
        },
      ],
      study_sessions: [
        { id: 1, user_id: 1, ended_at: '2026-09-09T12:00:00.000Z' },
        { id: 2, user_id: 1, ended_at: null },
      ],
      user_word_progress: [
        { user_id: 1, word_id: 10, status: 'known' },
        { user_id: 1, word_id: 11, status: 'learning' },
        { user_id: 2, word_id: 10, status: 'mature' },
      ],
      analytics: [
        { id: 1, user_id: 1, event: 'session_start' },
        { id: 2, user_id: 2, event: 'landing_view' },
      ],
    },
  };
}

test('listAdminUsers omits secrets and sorts newest first', () => {
  const users = listAdminUsers(mockDb());
  assert.equal(users[0].id, 2);
  assert.equal(users[1].email, 'a@test.com');
  assert.equal(users[1].name, 'Ann');
  assert.equal(users[1].langPair, 'en-ru');
  assert.equal(users[1].sessionsCompleted, 1);
  assert.equal(users[1].wordsKnown, 1);
  assert.equal(users[0].wordsKnown, 1);
  assert.equal(users[1].hasPush, true);
  assert.equal(users[0].hasPush, false);
  assert.ok(!('password_hash' in users[0]));
  assert.ok(!('push_subscription' in users[1]));
  assert.equal(JSON.stringify(users).includes('SECRET'), false);
  assert.equal(JSON.stringify(users).includes('push.example'), false);
});

test('purgeUserRecords removes user and related data', () => {
  const db = mockDb();
  purgeUserRecords(db, 1);
  assert.deepEqual(db.data.users.map((u) => u.id), [2]);
  assert.equal(db.data.users[0].referred_by, null);
  assert.equal(db.data.user_word_progress.length, 1);
  assert.equal(db.data.user_word_progress[0].user_id, 2);
  assert.equal(db.data.study_sessions.length, 0);
  assert.equal(db.data.analytics.length, 1);
  assert.equal(db.data.analytics[0].user_id, 2);
});
