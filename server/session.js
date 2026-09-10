import { getLevelProgress, levelsUpTo } from './progress.js';
import { DEFAULT_LANG_PAIR, userLangPair, wordMatchesPair } from './lang-pairs.js';

const SESSION_SIZE = 18;
const REVIEW_RATIO = 0.3;

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

  const reviewCount = Math.floor(SESSION_SIZE * REVIEW_RATIO);
  const newCount = SESSION_SIZE - reviewCount;

  const due = db.data.user_word_progress
    .filter(
      (p) =>
        p.user_id === userId &&
        p.next_review_at &&
        p.next_review_at <= now &&
        inScope(db.data.words.find((w) => w.id === p.word_id), levels, pair),
    )
    .sort((a, b) => a.next_review_at.localeCompare(b.next_review_at))
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

  return deck.slice(0, SESSION_SIZE).map(formatWord);
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

function formatWord(row) {
  const examples = formatExamples(row.examples);
  const forms = row.pos === 'verb' ? parseJsonArray(row.forms) : [];
  return {
    id: row.id,
    lemma: row.lemma,
    translation: row.translation,
    pos: row.pos,
    examples,
    forms,
    cefrLevel: row.cefr_level,
    unit: row.unit || null,
    langPair: row.lang_pair || DEFAULT_LANG_PAIR,
  };
}

export { SESSION_SIZE };
