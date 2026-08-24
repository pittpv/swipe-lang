const SESSION_SIZE = 18;
const REVIEW_RATIO = 0.3;

export function buildSessionDeck(db, userId) {
  const user = db.data.users.find((u) => u.id === userId);
  const level = user?.cefr_level ?? 'A1';
  const levels = levelsUpTo(level);
  const now = new Date().toISOString();

  const reviewCount = Math.floor(SESSION_SIZE * REVIEW_RATIO);
  const newCount = SESSION_SIZE - reviewCount;

  const due = db.data.user_word_progress
    .filter(
      (p) =>
        p.user_id === userId &&
        p.next_review_at &&
        p.next_review_at <= now &&
        db.data.words.find((w) => w.id === p.word_id && levels.includes(w.cefr_level)),
    )
    .sort((a, b) => a.next_review_at.localeCompare(b.next_review_at))
    .slice(0, reviewCount)
    .map((p) => db.data.words.find((w) => w.id === p.word_id))
    .filter(Boolean);

  const seenIds = new Set(due.map((w) => w.id));
  const progressWordIds = new Set(
    db.data.user_word_progress.filter((p) => p.user_id === userId).map((p) => p.word_id),
  );

  const fresh = db.data.words
    .filter((w) => levels.includes(w.cefr_level) && w.lang_pair === 'tr-ru' && !progressWordIds.has(w.id))
    .slice(0, newCount);

  for (const w of fresh) seenIds.add(w.id);

  let deck = [...due, ...fresh];

  if (deck.length < SESSION_SIZE) {
    const extra = db.data.words
      .filter((w) => levels.includes(w.cefr_level) && !seenIds.has(w.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, SESSION_SIZE - deck.length);
    deck = deck.concat(extra);
  }

  return deck.slice(0, SESSION_SIZE).map(formatWord);
}

function levelsUpTo(level) {
  const order = ['A1', 'A2', 'B1', 'B2', 'C1'];
  const idx = order.indexOf(level);
  return order.slice(0, idx >= 0 ? idx + 1 : 1);
}

function formatWord(row) {
  return {
    id: row.id,
    lemma: row.lemma,
    translation: row.translation,
    pos: row.pos,
    examples: JSON.parse(row.examples || '[]'),
    cefrLevel: row.cefr_level,
    unit: row.unit || null,
  };
}

export { SESSION_SIZE };
