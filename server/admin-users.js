import { userLangPair } from './lang-pairs.js';

/** Removes a user and their progress, sessions, and analytics. Mutates db.data. */
export function purgeUserRecords(db, userId) {
  db.data.user_word_progress = (db.data.user_word_progress ?? []).filter((p) => p.user_id !== userId);
  db.data.study_sessions = (db.data.study_sessions ?? []).filter((s) => s.user_id !== userId);
  if (Array.isArray(db.data.analytics)) {
    db.data.analytics = db.data.analytics.filter((a) => a.user_id !== userId);
  }
  for (const u of db.data.users ?? []) {
    if (u.referred_by === userId) u.referred_by = null;
  }
  db.data.users = (db.data.users ?? []).filter((u) => u.id !== userId);
}

/** Public admin DTO — never includes password_hash or push subscription payloads. */
export function listAdminUsers(db) {
  const sessions = db.data.study_sessions ?? [];
  const progress = db.data.user_word_progress ?? [];
  const sessionCount = new Map();
  const knownCount = new Map();

  for (const s of sessions) {
    if (!s.ended_at) continue;
    sessionCount.set(s.user_id, (sessionCount.get(s.user_id) ?? 0) + 1);
  }
  for (const p of progress) {
    if (!['known', 'mature'].includes(p.status)) continue;
    knownCount.set(p.user_id, (knownCount.get(p.user_id) ?? 0) + 1);
  }

  return [...(db.data.users ?? [])]
    .sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')))
    .map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name ?? null,
      goal: u.goal ?? null,
      cefrLevel: u.cefr_level ?? null,
      langPair: userLangPair(u),
      streak: u.streak ?? 0,
      lastSessionDate: u.last_session_date ?? null,
      createdAt: u.created_at ?? null,
      referralsCount: u.referrals_count ?? 0,
      hasPush: Boolean(u.push_subscription),
      reminderTime: u.reminder_time ?? null,
      sessionsCompleted: sessionCount.get(u.id) ?? 0,
      wordsKnown: knownCount.get(u.id) ?? 0,
    }));
}
