import assert from 'node:assert/strict';
import test from 'node:test';
import {
  STREAK_WARN_MS,
  formatStreakRiskHint,
  msUntilStreakWarning,
  streakResetDeadlineMs,
  streakResetRisk,
} from './streak-risk.js';

const HOUR = 60 * 60 * 1000;

test('deadline is the end of the UTC day after the last session', () => {
  assert.equal(streakResetDeadlineMs('2026-10-02'), Date.UTC(2026, 9, 4));
  assert.equal(streakResetDeadlineMs('2026-10-31'), Date.UTC(2026, 10, 2));
  assert.equal(streakResetDeadlineMs(null), null);
  assert.equal(streakResetDeadlineMs('02-10-2026'), null);
});

test('warning is only inside the last 3 hours before reset', () => {
  const user = { streak: 4, lastSessionDate: '2026-10-02' };
  const deadline = Date.UTC(2026, 9, 4);
  assert.equal(streakResetRisk(user, deadline - STREAK_WARN_MS - 1), null);
  const edge = streakResetRisk(user, deadline - STREAK_WARN_MS);
  assert.equal(edge?.remainingMs, STREAK_WARN_MS);
  const soon = streakResetRisk(user, deadline - 30 * 60 * 1000);
  assert.equal(soon?.deadline, deadline);
  assert.equal(streakResetRisk(user, deadline), null);
  assert.equal(streakResetRisk(user, deadline + 1), null);
});

test('no warning after a session today or without a streak', () => {
  const now = Date.UTC(2026, 9, 3, 22, 0, 0);
  assert.equal(streakResetRisk({ streak: 4, lastSessionDate: '2026-10-03' }, now), null);
  assert.equal(streakResetRisk({ streak: 0, lastSessionDate: '2026-10-02' }, now), null);
  assert.equal(streakResetRisk({ streak: 4, lastSessionDate: null }, now), null);
  assert.equal(streakResetRisk(null, now), null);
});

test('msUntilStreakWarning counts down to the 3-hour mark', () => {
  const user = { streak: 2, lastSessionDate: '2026-10-02' };
  const deadline = Date.UTC(2026, 9, 4);
  assert.equal(msUntilStreakWarning(user, deadline - STREAK_WARN_MS - 2 * HOUR), 2 * HOUR);
  assert.ok(msUntilStreakWarning(user, deadline - HOUR) < 0);
  assert.equal(msUntilStreakWarning({ streak: 0, lastSessionDate: '2026-10-02' }, deadline), null);
});

test('hint names the local deadline and remaining time', () => {
  const deadline = Date.UTC(2026, 9, 4);
  const remainingMs = 2 * HOUR + 15 * 60 * 1000;
  const when = new Date(deadline).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  assert.equal(
    formatStreakRiskHint({ deadline, remainingMs }),
    `Серия сбросится в ${when}, если не завершить сессию. Осталось 2 ч 15 мин.`,
  );
  assert.equal(
    formatStreakRiskHint({ deadline, remainingMs: 45 * 60 * 1000 }),
    `Серия сбросится в ${when}, если не завершить сессию. Осталось 45 мин.`,
  );
  assert.equal(
    formatStreakRiskHint({ deadline, remainingMs: 2 * HOUR }),
    `Серия сбросится в ${when}, если не завершить сессию. Осталось 2 ч.`,
  );
});
