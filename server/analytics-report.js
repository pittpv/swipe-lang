/** Product analytics — classic D1/D7 retention, funnel, events.
 *
 * Retention is classic N-day, not rolling. A user is retained when they finish
 * a session on the calendar day exactly N days after signup. The signup-day
 * session does not count. Days are Europe/Moscow, the calendar learners use.
 */

export const ANALYTICS_TIMEZONE = 'Europe/Moscow';

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: ANALYTICS_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function calendarDay(input) {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  return dayFormatter.format(date);
}

export function shiftCalendarDay(day, delta) {
  const [y, m, d] = String(day).split('-').map(Number);
  if (!y || !m || !d) return null;
  const utc = new Date(Date.UTC(y, m - 1, d + delta));
  const yyyy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(utc.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function classicRetention(users, activeByDay, signupDay, returnDay) {
  const cohort = users.filter((u) => calendarDay(u.created_at) === signupDay);
  const retained = cohort.filter((u) => activeByDay.get(returnDay)?.has(u.id)).length;
  return {
    cohortDay: signupDay,
    returnDay,
    cohortSize: cohort.length,
    retained,
    rate: cohort.length ? Math.round((retained / cohort.length) * 100) : null,
  };
}

export function buildAnalyticsDashboard(db, options = {}) {
  const now = options.now instanceof Date ? options.now : new Date(options.now ?? Date.now());
  const today = calendarDay(now);
  const users = (db.data.users ?? []).filter((u) => calendarDay(u.created_at));
  const sessions = (db.data.study_sessions ?? []).filter((s) => calendarDay(s.ended_at));
  const events = db.data.analytics ?? [];

  const usersByDay = {};
  for (const u of users) {
    const d = calendarDay(u.created_at);
    usersByDay[d] = (usersByDay[d] ?? 0) + 1;
  }

  const activeByDay = new Map();
  for (const s of sessions) {
    const d = calendarDay(s.ended_at);
    if (!activeByDay.has(d)) activeByDay.set(d, new Set());
    activeByDay.get(d).add(s.user_id);
  }

  const eventCounts = {};
  for (const e of events) {
    if (!e?.event) continue;
    eventCounts[e.event] = (eventCounts[e.event] ?? 0) + 1;
  }

  const allUsers = db.data.users ?? [];
  const funnel = {
    registrations: allUsers.length,
    onboarded: allUsers.filter((u) => u.goal).length,
    completedSession: new Set(sessions.map((s) => s.user_id)).size,
    referrals: allUsers.filter((u) => u.referred_by).length,
  };

  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = shiftCalendarDay(today, -i);
    last7Days.push({
      date: d,
      signups: usersByDay[d] ?? 0,
      activeUsers: activeByDay.get(d)?.size ?? 0,
      sessions: sessions.filter((s) => calendarDay(s.ended_at) === d).length,
    });
  }

  return {
    generatedAt: now.toISOString(),
    timezone: ANALYTICS_TIMEZONE,
    totals: {
      users: allUsers.length,
      words: db.data.words?.length ?? 0,
      sessions: sessions.length,
      events: events.length,
    },
    retention: {
      method: 'classic',
      timezone: ANALYTICS_TIMEZONE,
      d1: classicRetention(users, activeByDay, shiftCalendarDay(today, -1), today),
      d7: classicRetention(users, activeByDay, shiftCalendarDay(today, -7), today),
    },
    funnel,
    eventCounts,
    last7Days,
  };
}

export function formatWeeklyReport(dashboard) {
  const { d1, d7 } = dashboard.retention;
  const lines = [
    `# LangSwipe Weekly Report`,
    ``,
    `Generated: ${dashboard.generatedAt}`,
    ``,
    `## Totals`,
    `- Users: ${dashboard.totals.users}`,
    `- Sessions: ${dashboard.totals.sessions}`,
    `- Dictionary: ${dashboard.totals.words} words`,
    ``,
    `## Retention`,
    `Classic N-day, calendar ${dashboard.retention.timezone ?? ANALYTICS_TIMEZONE}. A finished session on the signup day does not count.`,
    `- D1: ${d1.rate ?? 'n/a'}% (${d1.retained}/${d1.cohortSize}) — signed up ${d1.cohortDay}, returned ${d1.returnDay}`,
    `- D7: ${d7.rate ?? 'n/a'}% (${d7.retained}/${d7.cohortSize}) — signed up ${d7.cohortDay}, returned ${d7.returnDay}`,
    ``,
    `## Funnel`,
    `- Registrations → ${dashboard.funnel.registrations}`,
    `- Onboarded → ${dashboard.funnel.onboarded}`,
    `- Users with ≥1 session → ${dashboard.funnel.completedSession}`,
    `- Referral signups → ${dashboard.funnel.referrals}`,
    ``,
    `## Last 7 days`,
    `| Date | Signups | Active | Sessions |`,
    `|------|---------|--------|----------|`,
  ];
  for (const row of dashboard.last7Days) {
    lines.push(`| ${row.date} | ${row.signups} | ${row.activeUsers} | ${row.sessions} |`);
  }
  lines.push('', '## Top events', '');
  for (const [event, count] of Object.entries(dashboard.eventCounts).sort((a, b) => b[1] - a[1])) {
    lines.push(`- ${event}: ${count}`);
  }
  return lines.join('\n');
}
