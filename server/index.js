import express from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { createECDH } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import {
  securityHeaders,
  authRateLimit,
  validateEmail,
  validatePassword,
  sanitizeText,
  ensureCsrfToken,
  csrfProtection,
  attachSession,
  setSessionCookie,
  clearSessionCookie,
} from './security.js';
import { db, dbMode } from './database.js';
import { applySwipe } from './srs.js';
import { buildSessionDeck, SESSION_SIZE } from './session.js';
import {
  generateReferralCode,
  findUserByReferralCode,
  ensureReferralCode,
} from './referral.js';
import { buildAnalyticsDashboard } from './analytics-report.js';
import {
  getVapidKeys,
  createReminderSchedule,
  deleteReminderSchedule,
  sendReminderPush,
} from './reminders.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const app = express();

if (!db.data.words.length) {
  const { importVocabulary } = await import('./import-vocabulary.js');
  const stats = importVocabulary({ replace: true });
  console.log(`Seeded ${stats.total} words into ${dbMode === 'postgres' ? 'Neon Postgres' : dbMode === 'redis' ? 'Redis' : 'file store'}`);
  await db.flush();
}

app.use(securityHeaders);
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());
app.use(attachSession);
app.use(ensureCsrfToken);
app.use(csrfProtection);

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

function findUser(id) {
  return db.data.users.find((u) => u.id === id);
}

/**
 * Deletes one QStash schedule. On failure the id is queued on the user row
 * (`orphan_schedule_ids`) so a later subscribe/unsubscribe can retry —
 * otherwise an old schedule would keep firing alongside the new one.
 * Returns true only when QStash confirmed the deletion.
 */
async function removeScheduleOrQueue(user, scheduleId) {
  try {
    const ok = await deleteReminderSchedule(scheduleId);
    if (ok) return true;
    console.error(`[reminders] DELETE /schedules/${scheduleId} rejected by QStash`);
  } catch (e) {
    console.error(`[reminders] DELETE /schedules/${scheduleId} failed: ${e?.message ?? e}`);
  }
  if (!Array.isArray(user.orphan_schedule_ids)) user.orphan_schedule_ids = [];
  if (!user.orphan_schedule_ids.includes(scheduleId)) user.orphan_schedule_ids.push(scheduleId);
  return false;
}

/** Best-effort retry of previously failed schedule deletions. Never throws. */
async function purgeOrphanSchedules(user) {
  const orphans = Array.isArray(user.orphan_schedule_ids) ? [...user.orphan_schedule_ids] : [];
  if (!orphans.length) return;
  const stillStuck = [];
  await Promise.all(
    orphans.map(async (scheduleId) => {
      try {
        const ok = await deleteReminderSchedule(scheduleId);
        if (!ok) stillStuck.push(scheduleId);
      } catch {
        stillStuck.push(scheduleId);
      }
    }),
  );
  user.orphan_schedule_ids = stillStuck;
  if (stillStuck.length) {
    console.error(`[reminders] orphan QStash schedules still active for user ${user.id}: ${stillStuck.join(', ')}`);
  }
}

app.post('/api/auth/register', authRateLimit, (req, res) => {
  const { email, password, referralCode } = req.body ?? {};
  if (!validateEmail(email) || !validatePassword(password)) {
    return res.status(400).json({ error: 'Valid email and password (8–128 chars) required' });
  }
  const normalized = email.toLowerCase().trim();
  if (db.data.users.some((u) => u.email === normalized)) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const referrer = findUserByReferralCode(db, referralCode);
  const user = {
    id: db.nextId('users'),
    email: normalized,
    password_hash: bcrypt.hashSync(password, 10),
    name: null,
    goal: null,
    cefr_level: 'A1',
    streak: 0,
    last_session_date: null,
    referral_code: generateReferralCode(),
    referred_by: referrer?.id ?? null,
    referrals_count: 0,
    orphan_schedule_ids: [],
    created_at: new Date().toISOString(),
  };
  if (referrer) referrer.referrals_count = (referrer.referrals_count ?? 0) + 1;
  db.data.users.push(user);
  db.persist();
  req.session.userId = user.id;
  setSessionCookie(res, req.session);
  res.json({ id: user.id, email: user.email, needsOnboarding: true });
});

app.post('/api/auth/login', authRateLimit, (req, res) => {
  const { email, password } = req.body ?? {};
  if (!validateEmail(email) || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid credentials' });
  }
  const user = db.data.users.find((u) => u.email === email?.toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password ?? '', user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  req.session.userId = user.id;
  setSessionCookie(res, req.session);
  res.json({
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    needsOnboarding: !user.goal,
    goal: user.goal,
    cefrLevel: user.cefr_level,
    streak: user.streak,
  });
});

app.post('/api/auth/logout', (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.delete('/api/account', requireAuth, async (req, res) => {
  const userId = req.session.userId;

  // Best-effort: kill the reminders schedule(s) before the user row is gone.
  const user = findUser(userId);
  if (user) {
    const ids = Array.isArray(user.orphan_schedule_ids) ? [...user.orphan_schedule_ids] : [];
    if (user.push_schedule_id) ids.push(user.push_schedule_id);
    await Promise.all(
      ids.map(async (scheduleId) => {
        try {
          const ok = await deleteReminderSchedule(scheduleId);
          if (!ok) console.error(`[reminders] account delete: schedule ${scheduleId} not removed`);
        } catch (e) {
          console.error(`[reminders] account delete: schedule ${scheduleId} failed: ${e?.message ?? e}`);
        }
      }),
    );
  }

  db.data.user_word_progress = db.data.user_word_progress.filter((p) => p.user_id !== userId);
  db.data.study_sessions = db.data.study_sessions.filter((s) => s.user_id !== userId);
  if (Array.isArray(db.data.analytics)) {
    db.data.analytics = db.data.analytics.filter((a) => a.user_id !== userId);
  }
  for (const u of db.data.users) {
    if (u.referred_by === userId) u.referred_by = null;
  }
  db.data.users = db.data.users.filter((u) => u.id !== userId);
  db.persist();

  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  const user = findUser(req.session.userId);
  ensureReferralCode(user, db);
  res.json({
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    goal: user.goal,
    cefrLevel: user.cefr_level,
    streak: user.streak,
    needsOnboarding: !user.goal,
    referralCode: user.referral_code,
    referralsCount: user.referrals_count ?? 0,
  });
});

app.get('/api/referral', requireAuth, (req, res) => {
  const user = findUser(req.session.userId);
  const code = ensureReferralCode(user, db);
  const origin = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  res.json({
    code,
    link: `${origin}/?ref=${code}`,
    referralsCount: user.referrals_count ?? 0,
  });
});

// --- Word pronunciation (free Google TTS, proxied same-origin) ---
// The browser cannot call translate_tts directly: Google rejects requests
// carrying a foreign Referer with 404. The function fetches server-side
// (no Referer) and streams the mp3 from our own domain instead.

const TTS_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

app.get('/api/tts', async (req, res) => {
  const text = sanitizeText(req.query.q, 200);
  if (!text) {
    return res.status(400).json({ error: 'q required' });
  }
  try {
    const upstream = await fetch(
      `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=tr&q=${encodeURIComponent(text)}`,
      { headers: { 'User-Agent': TTS_UA } },
    );
    const type = upstream.headers.get('content-type') ?? '';
    if (!upstream.ok || !type.includes('audio')) {
      return res.status(502).json({ error: 'TTS unavailable' });
    }
    res.setHeader('Content-Type', 'audio/mpeg');
    // A word always sounds the same — let browsers/CDN cache the clip.
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.end(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    res.status(502).json({ error: 'TTS unavailable' });
  }
});

// --- Study reminders (Web Push + QStash schedules) ---

app.get('/api/push/config', requireAuth, (_req, res) => {
  res.json({ publicKey: getVapidKeys().publicKey });
});

app.get('/api/push/status', requireAuth, (req, res) => {
  const user = findUser(req.session.userId);
  res.json({
    enabled: Boolean(user.push_schedule_id),
    time: user.reminder_time ?? null,
  });
});

app.post('/api/push/subscribe', requireAuth, async (req, res) => {
  const { subscription, reminderTime, tzOffsetMinutes } = req.body ?? {};
  if (!subscription?.endpoint || typeof subscription.endpoint !== 'string') {
    return res.status(400).json({ error: 'Valid push subscription required' });
  }
  if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(reminderTime ?? '')) {
    return res.status(400).json({ error: 'reminderTime must be HH:MM' });
  }
  if (!process.env.QSTASH_TOKEN || !process.env.REMINDER_SECRET) {
    return res.status(503).json({ error: 'Reminder scheduling is not configured on the server' });
  }
  try {
    const user = findUser(req.session.userId);
    // Retry cleanup of schedules we failed to delete earlier.
    await purgeOrphanSchedules(user);
    // Replace any previous schedule (time may have changed).
    if (user.push_schedule_id) {
      await removeScheduleOrQueue(user, user.push_schedule_id);
      user.push_schedule_id = null;
    }
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('x-forwarded-host') || req.get('host');
    const callbackUrl = `${proto}://${host}/api/cron/reminders`;
    const scheduleId = await createReminderSchedule({
      callbackUrl,
      userId: user.id,
      reminderTime,
      tzOffsetMinutes: Number(tzOffsetMinutes) || 0,
      timeZone: sanitizeText(req.body?.timeZone, 64),
    });
    user.push_subscription = subscription;
    user.reminder_time = reminderTime;
    user.tz_offset_minutes = Number(tzOffsetMinutes) || 0;
    user.push_schedule_id = scheduleId;
    db.persist();
    res.json({ ok: true, enabled: true, time: reminderTime });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

app.post('/api/push/unsubscribe', requireAuth, async (req, res) => {
  const user = findUser(req.session.userId);
  if (user.push_schedule_id) {
    await removeScheduleOrQueue(user, user.push_schedule_id);
  }
  await purgeOrphanSchedules(user);
  user.push_schedule_id = null;
  user.push_subscription = null;
  user.reminder_time = null;
  db.persist();
  res.json({ ok: true, enabled: false });
});

/** QStash schedule target — authorized via shared secret header. */
app.post('/api/cron/reminders', async (req, res) => {
  if (!process.env.REMINDER_SECRET || req.get('x-internal-secret') !== process.env.REMINDER_SECRET) {
    console.error('[cron] rejected: bad or missing x-internal-secret');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const userId = Number(req.body?.userId);
  const user = db.data.users.find((u) => u.id === userId);
  if (!user) {
    console.warn(`[cron] user ${userId} not found`);
    return res.json({ ok: true, result: 'user-not-found' });
  }
  try {
    const result = await sendReminderPush(db, user);
    console.log(`[cron] reminder for user ${userId}: ${JSON.stringify(result)}`);
    res.json({ ok: true, result });
  } catch (e) {
    console.error(`[cron] reminder for user ${userId} failed:`, e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/onboarding', requireAuth, (req, res) => {
  const goal = sanitizeText(req.body?.goal, 64);
  const cefrLevel = sanitizeText(req.body?.cefrLevel, 8).toUpperCase();
  if (!goal || !['A1', 'A2', 'B1', 'B2', 'C1'].includes(cefrLevel)) {
    return res.status(400).json({ error: 'goal and valid cefrLevel required' });
  }
  const user = findUser(req.session.userId);
  user.goal = goal;
  user.cefr_level = cefrLevel;
  db.persist();
  res.json({ ok: true, goal, cefrLevel });
});

app.patch('/api/profile', requireAuth, (req, res) => {
  const user = findUser(req.session.userId);
  const { cefrLevel, goal, name } = req.body ?? {};
  if (cefrLevel !== undefined) {
    const level = sanitizeText(cefrLevel, 8).toUpperCase();
    if (!['A1', 'A2', 'B1', 'B2'].includes(level)) {
      return res.status(400).json({ error: 'Invalid cefrLevel' });
    }
    user.cefr_level = level;
  }
  if (goal !== undefined) {
    const trimmed = sanitizeText(goal, 64);
    if (!trimmed) return res.status(400).json({ error: 'Invalid goal' });
    user.goal = trimmed;
  }
  if (name !== undefined) {
    const trimmed = sanitizeText(name, 64);
    if (!trimmed) return res.status(400).json({ error: 'Invalid name' });
    user.name = trimmed;
  }
  db.persist();
  res.json({ ok: true, cefrLevel: user.cefr_level, goal: user.goal, name: user.name ?? null });
});

/** Wipes all learning progress for the user: SRS cards, sessions, streak. */
app.post('/api/profile/reset-progress', requireAuth, (req, res) => {
  const userId = req.session.userId;
  db.data.user_word_progress = db.data.user_word_progress.filter((p) => p.user_id !== userId);
  db.data.study_sessions = db.data.study_sessions.filter((s) => s.user_id !== userId);
  const user = findUser(userId);
  if (user) {
    user.streak = 0;
    user.last_session_date = null;
    // Milestones are wiped too so celebrations can replay after a fresh start.
    delete user.milestones;
  }
  db.persist();
  res.json({ ok: true });
});

app.post('/api/session/start', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const deck = buildSessionDeck(db, userId);
  if (!deck.length) {
    return res.status(404).json({ error: 'No words available for your level' });
  }
  const sessionRow = {
    id: db.nextId('study_sessions'),
    user_id: userId,
    started_at: new Date().toISOString(),
    ended_at: null,
    cards_reviewed: 0,
    cards_learned: 0,
  };
  db.data.study_sessions.push(sessionRow);
  db.persist();
  req.session.activeSessionId = sessionRow.id;
  req.session.sessionStats = { reviewed: 0, learned: 0 };
  setSessionCookie(res, req.session);
  res.json({ sessionId: sessionRow.id, sessionSize: SESSION_SIZE, cards: deck });
});

app.post('/api/session/swipe', requireAuth, (req, res) => {
  const { wordId, direction } = req.body ?? {};
  if (!wordId || !['left', 'right'].includes(direction)) {
    return res.status(400).json({ error: 'wordId and direction (left|right) required' });
  }
  const userId = req.session.userId;
  const existing = db.data.user_word_progress.find(
    (p) => p.user_id === userId && p.word_id === wordId,
  );

  const updated = applySwipe(existing, direction);

  if (existing) {
    Object.assign(existing, {
      status: updated.status,
      ease: updated.ease,
      interval_days: updated.interval_days,
      repetitions: updated.repetitions,
      next_review_at: updated.next_review_at,
      updated_at: new Date().toISOString(),
    });
  } else {
    db.data.user_word_progress.push({
      id: db.nextId('user_word_progress'),
      user_id: userId,
      word_id: wordId,
      ...updated,
      updated_at: new Date().toISOString(),
    });
  }
  db.persist();

  if (req.session.sessionStats) {
    req.session.sessionStats.reviewed += 1;
    if (direction === 'right') req.session.sessionStats.learned += 1;
    setSessionCookie(res, req.session);
  }

  res.json({ ok: true, progress: updated });
});

/** Milestone thresholds that unlock a fullscreen celebration. */
const MILESTONES = {
  streak: [3, 5, 7, 10, 14, 20, 30, 50, 75, 100, 150, 200, 365],
  words: [5, 10, 20, 30, 50, 75, 100, 200, 300, 500, 1000],
};

/**
 * Returns newly reached milestones and remembers them on the user row so each
 * achievement is celebrated exactly once, even across sessions and devices.
 */
function collectMilestones(user, values) {
  if (!user.milestones || typeof user.milestones !== 'object') user.milestones = {};
  const unlocked = [];
  for (const [type, thresholds] of Object.entries(MILESTONES)) {
    const value = values[type] ?? 0;
    const reached = thresholds.filter((t) => value >= t);
    if (!reached.length) continue;
    // Celebrate only the highest newly-crossed threshold (e.g. jumping straight
    // from day 1 to day 12 shows "10 дней", not 3, 5 and 10 at once).
    const top = Math.max(...reached);
    if ((user.milestones[type] ?? 0) >= top) continue;
    unlocked.push({ type, value: top });
    user.milestones[type] = top;
  }
  return unlocked;
}

/**
 * All milestones the user has reached so far — every threshold up to the
 * highest celebrated one per category, ascending. Used by the stats page.
 */
function listMilestones(user) {
  const celebrated = user?.milestones ?? {};
  const out = [];
  for (const [type, thresholds] of Object.entries(MILESTONES)) {
    const top = celebrated[type] ?? 0;
    for (const t of thresholds) {
      if (t <= top) out.push({ type, value: t });
    }
  }
  return out.sort((a, b) => (a.type === b.type ? a.value - b.value : a.type === 'streak' ? -1 : 1));
}

app.post('/api/session/complete', requireAuth, async (req, res) => {
  // Sync with the shared store first: the user may have studied on another
  // device, and milestones must be computed and persisted on top of the
  // freshest streak / words data, not a stale in-memory snapshot.
  await db.reload();
  const userId = req.session.userId;
  const sessionId = req.session.activeSessionId;
  const stats = req.session.sessionStats ?? { reviewed: 0, learned: 0 };

  const sessionRow = db.data.study_sessions.find((s) => s.id === sessionId);
  if (sessionRow) {
    sessionRow.ended_at = new Date().toISOString();
    sessionRow.cards_reviewed = stats.reviewed;
    sessionRow.cards_learned = stats.learned;
  }

  const user = findUser(userId);
  const today = new Date().toISOString().slice(0, 10);
  let streak = user.streak ?? 0;
  if (user.last_session_date !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const y = yesterday.toISOString().slice(0, 10);
    streak = user.last_session_date === y ? streak + 1 : 1;
    user.streak = streak;
    user.last_session_date = today;
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowEnd = tomorrow.toISOString().slice(0, 10) + 'T23:59:59.999Z';

  const wordsDueTomorrow = db.data.user_word_progress.filter(
    (p) => p.user_id === userId && p.next_review_at && p.next_review_at <= tomorrowEnd,
  ).length;

  const wordsLearned = db.data.user_word_progress.filter(
    (p) => p.user_id === userId && ['learning', 'known', 'mature'].includes(p.status),
  ).length;

  const achievements = user ? collectMilestones(user, { streak, words: wordsLearned }) : [];

  db.persist();

  delete req.session.activeSessionId;
  delete req.session.sessionStats;
  setSessionCookie(res, req.session);

  res.json({
    cardsReviewed: stats.reviewed,
    cardsLearned: stats.learned,
    streak,
    wordsDueTomorrow,
    wordsLearned,
    achievements,
  });
});

app.get('/api/stats', requireAuth, async (req, res) => {
  // Re-read the shared document so achievements and counters reflect progress
  // synced from any device (warm serverless instances keep stale snapshots).
  await db.reload();
  const userId = req.session.userId;
  const user = findUser(userId);
  const learned = db.data.user_word_progress.filter(
    (p) => p.user_id === userId && ['learning', 'known', 'mature'].includes(p.status),
  ).length;
  const sessions = db.data.study_sessions.filter(
    (s) => s.user_id === userId && s.ended_at,
  ).length;
  res.json({
    streak: user.streak,
    cefrLevel: user.cefr_level,
    goal: user.goal,
    wordsLearned: learned,
    sessionsCompleted: sessions,
    achievements: listMilestones(user),
  });
});

const distPath = join(__dirname, '..', 'dist');
const publicPath = join(__dirname, '..', 'public');
app.use(express.static(publicPath));

function requireAdmin(req, res, next) {
  const key = process.env.ADMIN_API_KEY;
  if (!key) {
    return res.status(503).json({ error: 'Analytics dashboard disabled' });
  }
  if (req.get('x-admin-key') !== key) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.get('/api/health', (_req, res) => res.json({ ok: true, words: db.data.words.length, storage: dbMode }));

app.get('/api/public/stats', (_req, res) => {
  res.json({
    words: db.data.words.length,
    langPair: 'tr-ru',
    sessionSize: SESSION_SIZE,
    tagline: 'Турецкий словарь со свайп-механикой',
  });
});

app.get('/api/analytics/dashboard', requireAdmin, (_req, res) => {
  res.json(buildAnalyticsDashboard(db));
});

/**
 * Diagnostics: verifies the VAPID keypair is internally consistent — the
 * public key must be the P-256 point derived from the private key. A mismatch
 * makes every web-push delivery fail with 401/403. No key material is returned.
 */
app.get('/api/admin/diag/vapid', requireAdmin, (_req, res) => {
  const b64urlToBuf = (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  const pub = process.env.VAPID_PUBLIC_KEY ?? '';
  const priv = process.env.VAPID_PRIVATE_KEY ?? '';
  let pairMatches = false;
  let detail = 'checked';
  try {
    const ecdh = createECDH('prime256v1');
    ecdh.setPrivateKey(b64urlToBuf(priv));
    pairMatches = ecdh.getPublicKey().equals(b64urlToBuf(pub));
  } catch (e) {
    detail = `key decode failed: ${e.message}`;
  }
  res.json({
    publicKeySet: Boolean(pub),
    privateKeySet: Boolean(priv),
    publicKeyLength: pub.length,
    privateKeyLength: priv.length,
    pairMatches,
    detail,
  });
});

const ALLOWED_EVENTS = new Set([
  'landing_view',
  'landing_cta_click',
  'register_complete',
  'onboarding_complete',
  'session_start',
  'swipe_left',
  'swipe_right',
  'tap_translation',
  'tap_audio',
  'session_complete',
  'referral_share',
]);

app.post('/api/analytics', (req, res, next) => {
  if (req.session?.userId) return requireAuth(req, res, next);
  const publicEvents = new Set(['landing_view', 'landing_cta_click']);
  if (!publicEvents.has(req.body?.event)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}, (req, res) => {
  const event = sanitizeText(req.body?.event, 64);
  if (!ALLOWED_EVENTS.has(event)) {
    return res.status(400).json({ error: 'Invalid event' });
  }
  if (!db.data.analytics) db.data.analytics = [];
  db.data.analytics.push({
    id: db.nextId('analytics'),
    user_id: req.session?.userId ?? null,
    event,
    at: new Date().toISOString(),
  });
  if (db.data.analytics.length > 10_000) {
    db.data.analytics = db.data.analytics.slice(-5_000);
  }
  db.persist();
  res.json({ ok: true });
});

if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
    res.sendFile(join(distPath, 'index.html'));
  });
}

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`LangApp API http://localhost:${PORT}`);
  });
}

export default app;
