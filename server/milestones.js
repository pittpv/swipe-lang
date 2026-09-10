import { LANG_PAIRS, isLangPair, userLangPair, wordLangPair } from './lang-pairs.js';

/** Milestone thresholds that unlock a fullscreen celebration. */
export const MILESTONES = {
  streak: [3, 5, 7, 10, 14, 20, 30, 50, 75, 100, 150, 200, 365],
  words: [5, 10, 20, 30, 50, 75, 100, 200, 300, 500, 1000],
};

/** Known/mature word counts keyed by lang_pair. */
export function knownWordsByPair(db, userId) {
  const ids = new Map(db.data.words.map((w) => [w.id, wordLangPair(w)]));
  const counts = Object.fromEntries(LANG_PAIRS.map((pair) => [pair, 0]));
  for (const row of db.data.user_word_progress) {
    if (row.user_id !== userId) continue;
    if (!['known', 'mature'].includes(row.status)) continue;
    const pair = ids.get(row.word_id);
    if (pair) counts[pair] += 1;
  }
  return counts;
}

function highestThresholdAtMost(n, thresholds) {
  const value = Number(n) || 0;
  let top = 0;
  for (const t of thresholds) {
    if (t <= value) top = t;
  }
  return top;
}

function asLangPairKey(key) {
  const v = String(key || '').toLowerCase().trim();
  return isLangPair(v) ? v : null;
}

/** Parse `{ 'tr-ru': 10 }` from storage. Ignores leftover scalar-shaped junk. */
export function storedWordsMap(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    const pair = asLangPairKey(key);
    const n = Number(value);
    if (pair && n > 0) out[pair] = Math.max(out[pair] ?? 0, n);
  }
  return out;
}

/**
 * Split a pre-0.5.1 scalar `words: 50` across languages using actual known
 * counts, so one number cannot be moved onto whichever dictionary is current.
 */
function migrateLegacyNumber(n, knownByPair = {}) {
  const map = {};
  const legacy = Number(n) || 0;
  if (legacy <= 0) return map;
  for (const pair of LANG_PAIRS) {
    const known = Number(knownByPair?.[pair]) || 0;
    const top = highestThresholdAtMost(Math.min(legacy, known), MILESTONES.words);
    if (top) map[pair] = top;
  }
  return map;
}

function fillFromKnown(map, knownByPair = {}, skipPair = null) {
  for (const pair of LANG_PAIRS) {
    if (pair === skipPair) continue;
    if (map[pair]) continue;
    const fromKnown = highestThresholdAtMost(knownByPair?.[pair], MILESTONES.words);
    if (fromKnown) map[pair] = fromKnown;
  }
  return map;
}

/**
 * Effective per-language word milestones for display.
 * Stored map wins; missing languages are restored from «Знаю» counts so a
 * later session cannot hide badges already earned in another dictionary.
 */
export function wordsMilestoneMap(milestones, knownByPair = {}, fallbackPair) {
  const raw = milestones?.words;
  const map = storedWordsMap(raw);
  if (typeof raw === 'number' && raw > 0) {
    Object.assign(map, migrateLegacyNumber(raw, knownByPair));
    if (!Object.keys(map).length) {
      const top = highestThresholdAtMost(raw, MILESTONES.words);
      if (top && fallbackPair) map[fallbackPair] = top;
    }
  }
  fillFromKnown(map, knownByPair);
  return map;
}

function mapsEqual(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if ((a[key] ?? 0) !== (b[key] ?? 0)) return false;
  }
  return true;
}

/** Persist recovered per-language tops. Returns true when storage changed. */
export function repairWordMilestones(user, knownByPair = {}) {
  if (!user) return false;
  if (!user.milestones || typeof user.milestones !== 'object') user.milestones = {};
  const next = wordsMilestoneMap(user.milestones, knownByPair, userLangPair(user));
  const prev = storedWordsMap(user.milestones.words);
  const wasScalar = typeof user.milestones.words === 'number';
  user.milestones.words = next;
  return wasScalar || !mapsEqual(prev, next);
}

/**
 * Returns every newly reached milestone (ascending) and remembers the highest
 * on the user row so each threshold is celebrated exactly once per language
 * (word counts) or once per account (streak). Jumping past several thresholds
 * (e.g. 0 → 12 words) unlocks a chat of several bubbles.
 */
export function collectMilestones(user, values, knownByPair = {}) {
  if (!user.milestones || typeof user.milestones !== 'object') user.milestones = {};
  const pair = values.langPair || userLangPair(user);
  const unlocked = [];

  const streakValue = values.streak ?? 0;
  const previouslyStreak = Number(user.milestones.streak) || 0;
  const newStreak = MILESTONES.streak.filter((t) => t > previouslyStreak && streakValue >= t);
  if (newStreak.length) {
    for (const t of newStreak) unlocked.push({ type: 'streak', value: t });
    user.milestones.streak = newStreak[newStreak.length - 1];
  }

  const raw = user.milestones.words;
  const map = storedWordsMap(raw);
  if (typeof raw === 'number' && raw > 0) {
    const inferred = migrateLegacyNumber(raw, knownByPair);
    for (const other of LANG_PAIRS) {
      if (other === pair) continue;
      if ((inferred[other] ?? 0) > (map[other] ?? 0)) map[other] = inferred[other];
    }
  }
  fillFromKnown(map, knownByPair, pair);

  const wordValue = values.words ?? 0;
  const previouslyWords = map[pair] ?? 0;
  const newWords = MILESTONES.words.filter((t) => t > previouslyWords && wordValue >= t);
  if (newWords.length) {
    for (const t of newWords) unlocked.push({ type: 'words', value: t, langPair: pair });
    map[pair] = newWords[newWords.length - 1];
  } else if (previouslyWords > 0) {
    map[pair] = previouslyWords;
  }
  user.milestones.words = map;

  return unlocked;
}

/**
 * All milestones the user has reached so far — every threshold up to the
 * highest celebrated one per category (and per language for words), ascending.
 */
export function listMilestones(user, knownByPair = {}) {
  const celebrated = user?.milestones ?? {};
  const out = [];
  const streakTop = Number(celebrated.streak) || 0;
  for (const t of MILESTONES.streak) {
    if (t <= streakTop) out.push({ type: 'streak', value: t });
  }
  const map = wordsMilestoneMap(celebrated, knownByPair, userLangPair(user));
  for (const pair of LANG_PAIRS) {
    const top = map[pair] ?? 0;
    for (const t of MILESTONES.words) {
      if (t <= top) out.push({ type: 'words', value: t, langPair: pair });
    }
  }
  return out.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'streak' ? -1 : 1;
    if (a.type === 'words' && a.langPair !== b.langPair) {
      return LANG_PAIRS.indexOf(a.langPair) - LANG_PAIRS.indexOf(b.langPair);
    }
    return a.value - b.value;
  });
}
