/** Product analytics — D1/D7 retention, funnel, events */

function dayKey(iso) {
  return iso.slice(0, 10);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dayKey(d.toISOString());
}

export function buildAnalyticsDashboard(db) {
  const users = db.data.users ?? [];
  const sessions = (db.data.study_sessions ?? []).filter((s) => s.ended_at);
  const events = db.data.analytics ?? [];
  const today = dayKey(new Date().toISOString());

  const usersByDay = {};
  for (const u of users) {
    const d = dayKey(u.created_at);
    usersByDay[d] = (usersByDay[d] ?? 0) + 1;
  }

  const activeByDay = {};
  for (const s of sessions) {
    const d = dayKey(s.ended_at);
    activeByDay[d] = activeByDay[d] ?? new Set();
    activeByDay[d].add(s.user_id);
  }

  const d1Cohort = users.filter((u) => dayKey(u.created_at) === daysAgo(1));
  const d7Cohort = users.filter((u) => dayKey(u.created_at) === daysAgo(7));

  const wasActive = (userId, day) => activeByDay[day]?.has(userId) ?? false;

  const d1Retained = d1Cohort.filter((u) => wasActive(u.id, today) || wasActive(u.id, daysAgo(0))).length;
  const d7Retained = d7Cohort.filter((u) => {
    for (let i = 0; i <= 7; i++) {
      if (wasActive(u.id, daysAgo(i))) return true;
    }
    return false;
  }).length;

  const eventCounts = {};
  for (const e of events) {
    eventCounts[e.event] = (eventCounts[e.event] ?? 0) + 1;
  }

  const funnel = {
    registrations: users.length,
    onboarded: users.filter((u) => u.goal).length,
    completedSession: new Set(sessions.map((s) => s.user_id)).size,
    referrals: users.filter((u) => u.referred_by).length,
  };

  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = daysAgo(i);
    last7Days.push({
      date: d,
      signups: usersByDay[d] ?? 0,
      activeUsers: activeByDay[d]?.size ?? 0,
      sessions: sessions.filter((s) => dayKey(s.ended_at) === d).length,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      users: users.length,
      words: db.data.words?.length ?? 0,
      sessions: sessions.length,
      events: events.length,
    },
    retention: {
      d1: {
        cohortSize: d1Cohort.length,
        retained: d1Retained,
        rate: d1Cohort.length ? Math.round((d1Retained / d1Cohort.length) * 100) : null,
      },
      d7: {
        cohortSize: d7Cohort.length,
        retained: d7Retained,
        rate: d7Cohort.length ? Math.round((d7Retained / d7Cohort.length) * 100) : null,
      },
    },
    funnel,
    eventCounts,
    last7Days,
  };
}

export function formatWeeklyReport(dashboard) {
  const lines = [
    `# LangApp Weekly Report`,
    ``,
    `Generated: ${dashboard.generatedAt}`,
    ``,
    `## Totals`,
    `- Users: ${dashboard.totals.users}`,
    `- Sessions: ${dashboard.totals.sessions}`,
    `- Dictionary: ${dashboard.totals.words} words`,
    ``,
    `## Retention`,
    `- D1: ${dashboard.retention.d1.rate ?? 'n/a'}% (${dashboard.retention.d1.retained}/${dashboard.retention.d1.cohortSize})`,
    `- D7: ${dashboard.retention.d7.rate ?? 'n/a'}% (${dashboard.retention.d7.retained}/${dashboard.retention.d7.cohortSize})`,
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
