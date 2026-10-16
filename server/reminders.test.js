import { createHash } from 'node:crypto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  localTimeToCron,
  reminderScheduleId,
  isAllowedPushEndpoint,
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

test('push endpoints are limited to known browser push services', () => {
  assert.equal(isAllowedPushEndpoint('https://fcm.googleapis.com/fcm/send/abc'), true);
  assert.equal(isAllowedPushEndpoint('https://updates.push.services.mozilla.com/wpush/v2/x'), true);
  assert.equal(isAllowedPushEndpoint('https://web.push.apple.com/Q'), true);
  assert.equal(isAllowedPushEndpoint('https://wns2-pn1p.notify.windows.com/w/?token=1'), true);
  assert.equal(isAllowedPushEndpoint('https://evil.example/collect'), false);
  assert.equal(isAllowedPushEndpoint('http://fcm.googleapis.com/fcm/send/abc'), false);
  assert.equal(isAllowedPushEndpoint('https://user:pass@fcm.googleapis.com/fcm/send/abc'), false);
  assert.equal(isAllowedPushEndpoint('not a url'), false);
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
