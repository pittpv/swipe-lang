import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localTimeToCron, reminderScheduleId } from './reminders.js';

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
