/** Level progress + rough ETA for finishing the current CEFR scope. */

export const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1'];

/** Keep in sync with server/session.js */
const SESSION_SIZE = 18;
const REVIEW_RATIO = 0.3;
/** New cards targeted per session while unseen words remain. */
export const NEW_PER_SESSION = SESSION_SIZE - Math.floor(SESSION_SIZE * REVIEW_RATIO);
/** Buffer for wrong swipes and review pressure. */
const ETA_BUFFER = 1.3;
const PACE_WINDOW_DAYS = 14;

export function levelsUpTo(level) {
  const idx = CEFR_ORDER.indexOf(level);
  return CEFR_ORDER.slice(0, idx >= 0 ? idx + 1 : 1);
}

export function nextCefrLevel(level) {
  const idx = CEFR_ORDER.indexOf(level);
  if (idx < 0 || idx >= CEFR_ORDER.length - 1) return null;
  return CEFR_ORDER[idx + 1];
}

export function wordsInScope(db, cefrLevel) {
  const levels = levelsUpTo(cefrLevel);
  return db.data.words.filter(
    (w) => levels.includes(w.cefr_level) && (w.lang_pair === 'tr-ru' || !w.lang_pair),
  );
}

/**
 * Progress for words available at the user's selected CEFR
 * (selected level and all below it).
 */
export function getLevelProgress(db, userId) {
  const user = db.data.users.find((u) => u.id === userId);
  const cefrLevel = user?.cefr_level ?? 'A1';
  const words = wordsInScope(db, cefrLevel);
  const byWord = new Map(
    db.data.user_word_progress
      .filter((p) => p.user_id === userId)
      .map((p) => [p.word_id, p]),
  );

  let wordsKnown = 0;
  let wordsLearning = 0;
  let wordsNew = 0;

  for (const w of words) {
    const p = byWord.get(w.id);
    if (!p) {
      wordsNew += 1;
    } else if (['known', 'mature'].includes(p.status)) {
      wordsKnown += 1;
    } else {
      wordsLearning += 1;
    }
  }

  const wordsTotal = words.length;
  const remaining = wordsTotal - wordsKnown;
  const next = nextCefrLevel(cefrLevel);
  const complete = wordsTotal > 0 && remaining === 0;

  return {
    cefrLevel,
    nextCefrLevel: next,
    atMaxLevel: next == null,
    wordsTotal,
    wordsKnown,
    wordsLearning,
    wordsNew,
    remaining,
    percent: wordsTotal ? Math.round((wordsKnown / wordsTotal) * 100) : 0,
    complete,
  };
}

export function estimateEta(db, userId, levelProgress = null) {
  const lp = levelProgress ?? getLevelProgress(db, userId);

  if (lp.complete || lp.remaining <= 0) {
    return {
      remainingWords: 0,
      sessionsNeeded: 0,
      daysEstimate: 0,
      sessionsPerDay: null,
      assumedPace: false,
      label: lp.atMaxLevel
        ? 'Все слова словаря изучены'
        : 'Уровень освоен — можно перейти дальше',
    };
  }

  const sessionsNeeded = Math.max(1, Math.ceil((lp.remaining / NEW_PER_SESSION) * ETA_BUFFER));
  const { sessionsPerDay, assumedPace } = estimateSessionsPerDay(db, userId);
  const daysEstimate = Math.max(1, Math.ceil(sessionsNeeded / sessionsPerDay));

  return {
    remainingWords: lp.remaining,
    sessionsNeeded,
    daysEstimate,
    sessionsPerDay: Math.round(sessionsPerDay * 10) / 10,
    assumedPace,
    label: formatEtaLabel(daysEstimate, sessionsNeeded, assumedPace),
  };
}

function estimateSessionsPerDay(db, userId) {
  const since = Date.now() - PACE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const recent = db.data.study_sessions.filter(
    (s) =>
      s.user_id === userId &&
      s.ended_at &&
      new Date(s.ended_at).getTime() >= since,
  ).length;

  if (recent <= 0) {
    return { sessionsPerDay: 1, assumedPace: true };
  }
  return { sessionsPerDay: recent / PACE_WINDOW_DAYS, assumedPace: false };
}

function formatEtaLabel(days, sessions, assumedPace) {
  const paceNote = assumedPace ? 'при 1 сессии/день' : 'по вашему темпу';
  if (days <= 1) return `≈ 1 день · ${sessions} сессий (${paceNote})`;
  if (days < 14) return `≈ ${days} дн. · ${sessions} сессий (${paceNote})`;
  if (days < 60) {
    const weeks = Math.max(1, Math.round(days / 7));
    return `≈ ${weeks} нед. · ${sessions} сессий (${paceNote})`;
  }
  const months = Math.max(1, Math.round(days / 30));
  return `≈ ${months} мес. · ${sessions} сессий (${paceNote})`;
}
