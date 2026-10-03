/** Warn when the daily streak is within this long of resetting. */
export const STREAK_WARN_MS = 3 * 60 * 60 * 1000;

/**
 * UTC instant when the streak can no longer be continued.
 * A session on `lastSessionDate` (YYYY-MM-DD, UTC) keeps the streak through
 * the end of the next UTC day — the same window the server uses.
 * @param {string | null | undefined} lastSessionDate
 * @returns {number | null}
 */
export function streakResetDeadlineMs(lastSessionDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lastSessionDate ?? '')) return null;
  const [y, m, d] = lastSessionDate.split('-').map(Number);
  const deadline = Date.UTC(y, m - 1, d + 2);
  return Number.isNaN(deadline) ? null : deadline;
}

/**
 * @param {{ streak?: number, lastSessionDate?: string | null } | null | undefined} user
 * @param {number} [now]
 * @returns {{ deadline: number, remainingMs: number } | null}
 */
export function streakResetRisk(user, now = Date.now()) {
  if (!user?.streak) return null;
  const deadline = streakResetDeadlineMs(user.lastSessionDate);
  if (deadline == null) return null;
  const remainingMs = deadline - now;
  if (remainingMs <= 0 || remainingMs > STREAK_WARN_MS) return null;
  return { deadline, remainingMs };
}

/**
 * Milliseconds until the warning window opens. Negative once it has opened
 * or the deadline has passed. Null when there is nothing to count down.
 * @param {{ streak?: number, lastSessionDate?: string | null } | null | undefined} user
 * @param {number} [now]
 * @returns {number | null}
 */
export function msUntilStreakWarning(user, now = Date.now()) {
  if (!user?.streak) return null;
  const deadline = streakResetDeadlineMs(user.lastSessionDate);
  if (deadline == null) return null;
  return deadline - STREAK_WARN_MS - now;
}

/**
 * @param {{ deadline: number, remainingMs: number }} risk
 */
export function formatStreakRiskHint(risk) {
  const when = new Date(risk.deadline).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const totalMin = Math.max(1, Math.ceil(risk.remainingMs / 60000));
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  let left;
  if (hours > 0 && minutes > 0) left = `${hours} ч ${minutes} мин`;
  else if (hours > 0) left = `${hours} ч`;
  else left = `${minutes} мин`;
  return `Серия сбросится в ${when}, если не завершить сессию. Осталось ${left}.`;
}
