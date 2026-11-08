import { applySwipe } from './srs.js';
import { noteRatingSwipe, swipeInstant } from './rating.js';

const MAX_SWIPES = 18;

function wordKey(id) {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * One swipe or a batch of up to 18. A batch is one document write, so the
 * end of a session does not queue 18 full-document updates.
 */
export function normalizeSwipeBatch(body) {
  const raw = Array.isArray(body?.swipes)
    ? body.swipes
    : body?.wordId != null
      ? [{ wordId: body.wordId, direction: body.direction, swipedAt: body.swipedAt }]
      : [];
  if (!raw.length || raw.length > MAX_SWIPES) return null;
  const swipes = [];
  for (const item of raw) {
    const wordId = wordKey(item?.wordId);
    const direction = item?.direction;
    if (wordId == null || !['left', 'right'].includes(direction)) return null;
    swipes.push({ wordId, direction, swipedAt: item?.swipedAt ?? null });
  }
  return swipes;
}

function nextId(data, table) {
  if (!data._seq) data._seq = {};
  data._seq[table] = (data._seq[table] ?? 0) + 1;
  return data._seq[table];
}

function openSession(data, userId, sessionId) {
  if (sessionId == null) return null;
  return (
    data.study_sessions?.find(
      (row) =>
        Number(row.id) === Number(sessionId) &&
        Number(row.user_id) === Number(userId) &&
        !row.ended_at,
    ) ?? null
  );
}

/**
 * First moment a word's interval reaches the mature band (21 days).
 * A later successful review keeps the original stamp. A miss clears it,
 * so the word can count again only when it matures once more.
 * Rows that were already mature before the stamp existed stay unstamped.
 */
function nextMatureAt(existing, next, updatedAt) {
  if (next.status !== 'mature') return null;
  if (existing?.status === 'mature') return existing.mature_at ?? null;
  return updatedAt;
}

function alreadyRecorded(session, wordId) {
  return (session?.rating_hits ?? []).some((hit) => wordKey(hit) === wordKey(wordId));
}

/**
 * Applies each swipe once per open session. A retry after a lost response
 * must not move the SRS schedule a second time.
 */
export function applyRecordedSwipes(data, { userId, sessionId, swipes, recordedAt = new Date() }) {
  if (!Array.isArray(data.user_word_progress)) data.user_word_progress = [];
  let reviewed = 0;
  let learned = 0;
  const progress = [];
  for (const swipe of swipes) {
    const sessionRow = openSession(data, userId, sessionId);
    if (alreadyRecorded(sessionRow, swipe.wordId)) {
      progress.push(null);
      continue;
    }
    const existing = data.user_word_progress.find(
      (row) => row.user_id === userId && row.word_id === swipe.wordId,
    );
    const next = applySwipe(existing, swipe.direction);
    const updatedAt = recordedAt.toISOString();
    const matureAt = nextMatureAt(existing, next, updatedAt);
    if (existing) {
      Object.assign(existing, {
        status: next.status,
        ease: next.ease,
        interval_days: next.interval_days,
        repetitions: next.repetitions,
        next_review_at: next.next_review_at,
        lapses: next.lapses,
        mature_at: matureAt,
        updated_at: updatedAt,
      });
    } else {
      data.user_word_progress.push({
        id: nextId(data, 'user_word_progress'),
        user_id: userId,
        word_id: swipe.wordId,
        ...next,
        mature_at: matureAt,
        updated_at: updatedAt,
      });
    }
    if (sessionRow) {
      noteRatingSwipe(sessionRow, swipe.wordId, swipeInstant(swipe.swipedAt, recordedAt));
      sessionRow.cards_reviewed = (Number(sessionRow.cards_reviewed) || 0) + 1;
      if (swipe.direction === 'right') {
        sessionRow.cards_learned = (Number(sessionRow.cards_learned) || 0) + 1;
      }
    }
    reviewed += 1;
    if (swipe.direction === 'right') learned += 1;
    progress.push(next);
  }
  return { reviewed, learned, progress };
}
