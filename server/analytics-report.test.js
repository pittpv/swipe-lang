import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAnalyticsDashboard, calendarDay, formatWeeklyReport, shiftCalendarDay } from './analytics-report.js';

const NOW = new Date('2026-10-17T00:30:00.000Z');

function db(users, sessions, extras = {}) {
  return { data: { users, study_sessions: sessions, analytics: extras.analytics ?? [], words: extras.words ?? [] } };
}

test('calendar days follow Europe/Moscow, including the UTC midnight boundary', () => {
  assert.equal(calendarDay('2026-10-15T22:00:00.000Z'), '2026-10-16');
  assert.equal(calendarDay('2026-10-16T20:59:00.000Z'), '2026-10-16');
  assert.equal(calendarDay('2026-10-16T21:00:00.000Z'), '2026-10-17');
  assert.equal(calendarDay(NOW), '2026-10-17');
  assert.equal(shiftCalendarDay('2026-10-17', -1), '2026-10-16');
  assert.equal(shiftCalendarDay('2026-10-17', -7), '2026-10-10');
  assert.equal(shiftCalendarDay('2026-03-01', -1), '2026-02-28');
  assert.equal(calendarDay('not-a-date'), null);
});

test('D1 counts a return on the next Moscow day and ignores the signup session', () => {
  const dashboard = buildAnalyticsDashboard(db(
    [
      { id: 1, created_at: '2026-10-15T22:00:00.000Z', goal: 'travel' },
      { id: 2, created_at: '2026-10-15T22:00:00.000Z', goal: null },
      { id: 3, created_at: '2026-10-16T21:30:00.000Z', goal: 'work' },
    ],
    [
      { user_id: 1, ended_at: '2026-10-15T22:10:00.000Z' },
      { user_id: 1, ended_at: '2026-10-16T22:30:00.000Z' },
      { user_id: 2, ended_at: '2026-10-15T23:00:00.000Z' },
      { user_id: 3, ended_at: '2026-10-16T21:40:00.000Z' },
      { user_id: 1, ended_at: null },
    ],
  ), { now: NOW });

  assert.equal(dashboard.retention.d1.cohortDay, '2026-10-16');
  assert.equal(dashboard.retention.d1.returnDay, '2026-10-17');
  assert.equal(dashboard.retention.d1.cohortSize, 2);
  assert.equal(dashboard.retention.d1.retained, 1);
  assert.equal(dashboard.retention.d1.rate, 50);
});

test('D7 counts only the day seven calendar days later', () => {
  const dashboard = buildAnalyticsDashboard(db(
    [
      { id: 3, created_at: '2026-10-09T21:30:00.000Z' },
      { id: 4, created_at: '2026-10-10T12:00:00.000Z' },
      { id: 6, created_at: '2026-10-09T22:00:00.000Z' },
      { id: 5, created_at: '2026-10-09T12:00:00.000Z' },
    ],
    [
      { user_id: 3, ended_at: '2026-10-09T22:00:00.000Z' },
      { user_id: 4, ended_at: '2026-10-16T12:00:00.000Z' },
      { user_id: 6, ended_at: '2026-10-16T22:00:00.000Z' },
      { user_id: 6, ended_at: '2026-10-12T12:00:00.000Z' },
    ],
  ), { now: NOW });

  assert.equal(dashboard.retention.d7.cohortDay, '2026-10-10');
  assert.equal(dashboard.retention.d7.returnDay, '2026-10-17');
  assert.equal(dashboard.retention.d7.cohortSize, 3);
  assert.equal(dashboard.retention.d7.retained, 1);
  assert.equal(dashboard.retention.d7.rate, 33);
});

test('empty cohorts stay null instead of 0%', () => {
  const dashboard = buildAnalyticsDashboard(db([], []), { now: NOW });
  assert.equal(dashboard.retention.d1.rate, null);
  assert.equal(dashboard.retention.d1.cohortSize, 0);
  assert.equal(dashboard.retention.d7.rate, null);
  assert.equal(dashboard.last7Days.length, 7);
  assert.equal(dashboard.last7Days.at(-1).date, '2026-10-17');
});

test('daily activity and the weekly report use the same Moscow days', () => {
  const dashboard = buildAnalyticsDashboard(db(
    [
      { id: 1, created_at: '2026-10-16T21:30:00.000Z', goal: 'travel', referred_by: 9 },
      { id: 2, created_at: 'not-a-date' },
    ],
    [{ user_id: 1, ended_at: '2026-10-16T21:40:00.000Z' }],
    { analytics: [{ event: 'session_complete' }, { event: 'session_complete' }, { event: '' }], words: [{}, {}] },
  ), { now: NOW });

  const today = dashboard.last7Days.at(-1);
  assert.equal(today.date, '2026-10-17');
  assert.equal(today.signups, 1);
  assert.equal(today.activeUsers, 1);
  assert.equal(today.sessions, 1);
  assert.equal(dashboard.totals.users, 2);
  assert.equal(dashboard.totals.sessions, 1);
  assert.equal(dashboard.totals.words, 2);
  assert.equal(dashboard.funnel.registrations, 2);
  assert.equal(dashboard.funnel.onboarded, 1);
  assert.equal(dashboard.funnel.completedSession, 1);
  assert.equal(dashboard.funnel.referrals, 1);
  assert.deepEqual(dashboard.eventCounts, { session_complete: 2 });

  const report = formatWeeklyReport(dashboard);
  assert.match(report, /D1: n\/a% \(0\/0\) — signed up 2026-10-16, returned 2026-10-17/);
  assert.match(report, /Europe\/Moscow/);
  assert.match(report, /session_complete: 2/);
});
