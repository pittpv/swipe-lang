import { levelsUpTo } from './progress.js';
import { userLangPair, wordMatchesPair } from './lang-pairs.js';
import { lapsesOf } from './srs.js';
import { formatWord } from './session.js';

/**
 * Optional "hard words" session. It never replaces the daily deck
 * (buildSessionDeck): it is an extra entry point the user starts on purpose.
 * Signal: `lapses` only (misses on words that were already known / mature).
 */
export const HARD_SESSION_SIZE = 12;
/** Below this many lapsed words the deck is not offered. */
export const HARD_SESSION_MIN = 4;

function inScope(word, levels, pair) {
  return Boolean(word) && levels.includes(word.cefr_level) && wordMatchesPair(word, pair);
}

/**
 * Word ids for a hard session. Progress rows with lapses >= 1 in the user's
 * language pair and CEFR scope, most lapses first, then oldest next_review_at
 * (rows without a date last), then word id for a stable order.
 */
export function pickHardWordIds(db, userId, size = HARD_SESSION_SIZE) {
  const user = db.data.users.find((u) => u.id === userId);
  const levels = levelsUpTo(user?.cefr_level ?? 'A1');
  const pair = userLangPair(user);
  const wordsById = new Map(db.data.words.map((w) => [w.id, w]));
  const seen = new Set();

  return db.data.user_word_progress
    .filter((p) => {
      if (p.user_id !== userId || lapsesOf(p) < 1 || seen.has(p.word_id)) return false;
      if (!inScope(wordsById.get(p.word_id), levels, pair)) return false;
      seen.add(p.word_id);
      return true;
    })
    .sort((a, b) => {
      const byLapses = lapsesOf(b) - lapsesOf(a);
      if (byLapses) return byLapses;
      const aDate = a.next_review_at || '';
      const bDate = b.next_review_at || '';
      if (aDate !== bDate) {
        if (!aDate) return 1;
        if (!bDate) return -1;
        return aDate.localeCompare(bDate);
      }
      return a.word_id - b.word_id;
    })
    .slice(0, size)
    .map((p) => p.word_id);
}

/** Cards for the hard session, or `enough: false` when there are too few. */
export function buildHardDeck(db, userId) {
  const ids = pickHardWordIds(db, userId);
  if (ids.length < HARD_SESSION_MIN) return { enough: false, count: ids.length, cards: [] };
  const wordsById = new Map(db.data.words.map((w) => [w.id, w]));
  return { enough: true, count: ids.length, cards: ids.map((id) => formatWord(wordsById.get(id))) };
}
