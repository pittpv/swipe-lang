import { createHash } from 'node:crypto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  localTimeToCron,
  reminderScheduleId,
  pushEndpointTag,
  revokePushSubscription,
  rejectRevokedPush,
} from './reminders.js';

test('localTimeToCron keeps wall clock when IANA timezone is set', () => {
  assert.equal(
    localTimeToCron('19:00', -180, 'Europe/Moscow'),
    'CRON_TZ=Europe/Moscow 00 19 * * *',
  );
});

test('localTimeToCron falls back to UTC using the JS timezone offset', () => {
  // 19:00 in UTC+3 (getTimezoneOffset === -180) → 16:00 UTC
  assert.equal(localTimeToCron('19:00', -180, ''), '00 16 * * *');
});

test('reminderScheduleId is stable per user so QStash updates in place', () => {
  assert.equal(reminderScheduleId(7), 'langapp-reminder-7');
});

test('pushEndpointTag is a stable sha256 prefix', () => {
  const endpoint = 'https://web.push.apple.com/Q';
  const expected = createHash('sha256').update(endpoint).digest('hex').slice(0, 16);
  assert.equal(pushEndpointTag(endpoint), expected);
  assert.equal(pushEndpointTag(''), null);
});

test('revokePushSubscription keeps the schedule and blocks the same endpoint', () => {
  const user = {
    push_subscription: { endpoint: 'https://push.example/old' },
    push_schedule_id: 'langapp-reminder-1',
    reminder_time: '19:00',
  };
  revokePushSubscription(user);
  assert.equal(user.push_subscription, null);
  assert.equal(user.push_revoked_endpoint, 'https://push.example/old');
  assert.equal(user.push_schedule_id, 'langapp-reminder-1');
  assert.equal(user.reminder_time, '19:00');
  assert.equal(rejectRevokedPush(user, 'https://push.example/old', false), true);
  assert.equal(rejectRevokedPush(user, 'https://push.example/old', true), false);
  assert.equal(rejectRevokedPush(user, 'https://push.example/new', false), false);
});
