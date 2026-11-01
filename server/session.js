import { getLevelProgress, levelsUpTo } from './progress.js';
import { DEFAULT_LANG_PAIR, userLangPair, wordMatchesPair } from './lang-pairs.js';
import { isLeech, lapsesOf } from './srs.js';

const SESSION_SIZE = 18;
const REVIEW_RATIO = 0.3;
/**
 * Review debt. When more than REVIEW_DEBT_THRESHOLD × SESSION_SIZE words are
 * due (more than 14 of 18), the fixed 30 % share lets the backlog grow faster
 * than it is cleared. For that session only, reviews take
 * ELEVATED_REVIEW_RATIO of the deck instead (floor(18 × 0.55) = 9 cards, 50 %).
 * SESSION_SIZE never changes — the micro-session stays 18 cards.
 */
const REVIEW_DEBT_THRESHOLD = 0.8;
const ELEVATED_REVIEW_RATIO = 0.55;
/**
 * Cap on end-of-deck leech repeats. 18 cards ≈ 5 minutes; three extra swipes
 * keep the micro-session under about six minutes even on a bad day.
 */
const LEECH_EXTRA_CARDS_MAX = 3;

function inScope(word, levels, pair) {
  return Boolean(word) && levels.includes(word.cefr_level) && wordMatchesPair(word, pair);
}

export function buildSessionDeck(db, userId) {
  const user = db.data.users.find((u) => u.id === userId);
  const level = user?.cefr_level ?? 'A1';
  const pair = userLangPair(user);
  const levels = levelsUpTo(level);
  const now = new Date().toISOString();
  const levelProgress = getLevelProgress(db, userId);

  const dueRows = db.data.user_word_progress
    .filter(
      (p) =>
        p.user_id === userId &&
        p.next_review_at &&
        p.next_review_at <= now &&
        inScope(db.data.words.find((w) => w.id === p.word_id), levels, pair),
    )
    .sort((a, b) => a.next_review_at.localeCompare(b.next_review_at));

  const reviewCount = Math.floor(SESSION_SIZE * reviewRatioFor(dueRows.length));
  const newCount = SESSION_SIZE - reviewCount;

  const due = dueRows
    .slice(0, reviewCount)
    .map((p) => db.data.words.find((w) => w.id === p.word_id))
    .filter((w) => inScope(w, levels, pair));

  const seenIds = new Set(due.map((w) => w.id));
  const progressWordIds = new Set(
    db.data.user_word_progress.filter((p) => p.user_id === userId).map((p) => p.word_id),
  );

  const fresh = db.data.words
    .filter((w) => inScope(w, levels, pair) && !progressWordIds.has(w.id))
    .slice(0, newCount);

  for (const w of fresh) seenIds.add(w.id);

  let deck = [...due, ...fresh];

  // When the level is fully known, do not pad with random already-known cards —
  // an empty deck signals celebration / level-up on the client.
  if (deck.length < SESSION_SIZE && !levelProgress.complete) {
    const extra = db.data.words
      .filter((w) => inScope(w, levels, pair) && !seenIds.has(w.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, SESSION_SIZE - deck.length);
    deck = deck.concat(extra);
  }

  // Review-only when level complete but words are due: fill up to SESSION_SIZE from due queue.
  if (levelProgress.complete && deck.length < SESSION_SIZE) {
    const moreDue = db.data.user_word_progress
      .filter(
        (p) =>
          p.user_id === userId &&
          p.next_review_at &&
          p.next_review_at <= now &&
          !seenIds.has(p.word_id) &&
          inScope(db.data.words.find((w) => w.id === p.word_id), levels, pair),
      )
      .sort((a, b) => a.next_review_at.localeCompare(b.next_review_at))
      .slice(0, SESSION_SIZE - deck.length)
      .map((p) => db.data.words.find((w) => w.id === p.word_id))
      .filter((w) => inScope(w, levels, pair));
    deck = deck.concat(moreDue);
  }

  const main = deck.slice(0, SESSION_SIZE);
  const progressRows = db.data.user_word_progress.filter((p) => p.user_id === userId);
  return main.concat(leechExtraCards(main, progressRows)).map(formatWord);
}

/**
 * Review share for one session from the number of due words in scope.
 * Two tiers only: the normal REVIEW_RATIO, or ELEVATED_REVIEW_RATIO while the
 * due count exceeds REVIEW_DEBT_THRESHOLD × SESSION_SIZE.
 */
export function reviewRatioFor(dueCount) {
  return dueCount > SESSION_SIZE * REVIEW_DEBT_THRESHOLD ? ELEVATED_REVIEW_RATIO : REVIEW_RATIO;
}

/**
 * Leech insurance (see server/srs.js): a word forgotten LEECH_LAPSES_THRESHOLD
 * times after being known is shown once more at the end of the deck it is in.
 * One extra card per word, worst lapses first, at most LEECH_EXTRA_CARDS_MAX,
 * and never right after itself when the leech is already the last card.
 * A second swipe on the same word is a pure repeat: the swipe handler records
 * each word once per session, so SM-2 is not moved twice.
 */
export function leechExtraCards(deck, progressRows) {
  if (!deck.length) return [];
  const byWord = new Map((progressRows ?? []).map((row) => [row.word_id, row]));
  const lastId = deck[deck.length - 1].id;
  const seen = new Set();
  return deck
    .filter((word) => {
      if (seen.has(word.id) || word.id === lastId) return false;
      seen.add(word.id);
      return isLeech(byWord.get(word.id));
    })
    .sort((a, b) => lapsesOf(byWord.get(b.id)) - lapsesOf(byWord.get(a.id)))
    .slice(0, LEECH_EXTRA_CARDS_MAX);
}

function parseJsonArray(raw) {
  try {
    const value = JSON.parse(raw || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

/** Normalize legacy string examples and structured {example, translate} rows. */
function formatExamples(raw) {
  return parseJsonArray(raw)
    .map((item) => {
      if (item && typeof item === 'object') {
        const example = String(item.example ?? item.tr ?? '').trim();
        const translate = String(item.translate ?? item.ru ?? '').trim();
        if (!example) return null;
        return { example, translate };
      }
      const example = String(item ?? '').trim();
      return example ? { example, translate: '' } : null;
    })
    .filter(Boolean);
}

const ASSOCIATION_KINDS = new Set(['keyword', 'cognate', 'usage']);

/** Parse a stored association. Empty and broken values become null. */
export function formatAssociation(raw) {
  if (raw == null || raw === '' || raw === 'null') return null;
  let value = raw;
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const kind = value.kind;
  if (!ASSOCIATION_KINDS.has(kind)) return null;
  const phonetic = String(value.phonetic || '').trim();
  const hooks = (Array.isArray(value.hooks) ? value.hooks : [])
    .map((hook) => String(hook || '').trim())
    .filter(Boolean)
    .slice(0, 2);
  const image = String(value.image || '').trim();
  if (kind === 'keyword' && (!phonetic || !hooks.length || !image)) return null;
  if (kind === 'cognate' && !hooks.length) return null;
  if (kind === 'usage' && !image) return null;
  return { kind, phonetic, hooks, image };
}

export function formatWord(row) {
  const examples = formatExamples(row.examples);
  const forms = row.pos === 'verb' ? parseJsonArray(row.forms) : [];
  return {
    id: row.id,
    lemma: row.lemma,
    translation: row.translation,
    pos: row.pos,
    examples,
    forms,
    association: formatAssociation(row.association),
    cefrLevel: row.cefr_level,
    unit: row.unit || null,
    langPair: row.lang_pair || DEFAULT_LANG_PAIR,
  };
}

export { SESSION_SIZE, REVIEW_RATIO, REVIEW_DEBT_THRESHOLD, ELEVATED_REVIEW_RATIO, LEECH_EXTRA_CARDS_MAX };
