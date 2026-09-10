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

function pairWithMostKnown(knownByPair, fallbackPair) {
  let best = fallbackPair;
  let top = -1;
  for (const pair of LANG_PAIRS) {
    const n = Number(knownByPair?.[pair]) || 0;
    if (n > top) {
      top = n;
      best = pair;
    }
  }
  return best;
}

/**
 * Normalize stored word milestones to `{ 'tr-ru': 50, 'en-ru': 10 }`.
 * Legacy accounts kept a single number — attribute it to the pair with the
 * most known words (or the user's current pair if none).
 */
export function wordsMilestoneMap(milestones, knownByPair = {}, fallbackPair) {
  const raw = milestones?.words;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const out = {};
    for (const [key, value] of Object.entries(raw)) {
      const n = Number(value);
      if (isLangPair(key) && n > 0) out[key] = n;
    }
    return out;
  }
  if (typeof raw === 'number' && raw > 0) {
    return { [pairWithMostKnown(knownByPair, fallbackPair)]: raw };
  }
  return {};
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

  const map = wordsMilestoneMap(user.milestones, knownByPair, pair);
  const wordValue = values.words ?? 0;
  const previouslyWords = map[pair] ?? 0;
  const newWords = MILESTONES.words.filter((t) => t > previouslyWords && wordValue >= t);
  if (newWords.length) {
    for (const t of newWords) unlocked.push({ type: 'words', value: t, langPair: pair });
    map[pair] = newWords[newWords.length - 1];
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
