/** SM-2 inspired SRS for swipe left (know) / right (learn) */

const MIN_EASE = 1.3;

/**
 * Leech insurance. `ease` drops on every miss, but it does not say how many
 * times a word was *forgotten after being known*. `lapses` counts exactly that:
 * a swipe right on a card that was already `known` / `mature` (reset back into
 * `learning`). A swipe right on a `new` or still-`learning` card is not a lapse.
 *
 * At LEECH_LAPSES_THRESHOLD lapses the word gets an extra short cycle: the next
 * miss makes it due again in LEECH_RETRY_MINUTES instead of tomorrow, and the
 * session builder shows it once more at the end of the deck. The SM-2 state
 * (ease / interval_days / repetitions) is not touched by this.
 */
export const LEECH_LAPSES_THRESHOLD = 3;
export const LEECH_RETRY_MINUTES = 10;

export function applySwipe(progress, direction) {
  const now = new Date();
  const row = progress ?? defaultProgress();

  if (direction === 'left') {
    return applyKnown(row, now);
  }
  if (direction === 'right') {
    return applyLearning(row, now);
  }
  throw new Error(`Unknown direction: ${direction}`);
}

function defaultProgress() {
  return {
    status: 'new',
    ease: 2.5,
    interval_days: 0,
    repetitions: 0,
    next_review_at: null,
    lapses: 0,
  };
}

/** Rows written before the counter existed have no `lapses` — read them as 0. */
export function lapsesOf(row) {
  const n = Math.floor(Number(row?.lapses));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** True once the word reached the leech threshold. */
export function isLeech(row) {
  return lapsesOf(row) >= LEECH_LAPSES_THRESHOLD;
}

/** A lapse is a miss on a card that had already graduated to known / mature. */
function isLapse(row) {
  return row.status === 'known' || row.status === 'mature';
}

function applyKnown(row, now) {
  const repetitions = row.repetitions + 1;
  let interval = row.interval_days;
  let ease = row.ease;

  if (repetitions === 1) {
    interval = 1;
  } else if (repetitions === 2) {
    interval = 6;
  } else {
    interval = Math.round(row.interval_days * ease);
    ease = Math.max(MIN_EASE, ease + 0.1);
  }

  const next = new Date(now);
  next.setDate(next.getDate() + interval);

  return {
    status: interval >= 21 ? 'mature' : 'known',
    ease,
    interval_days: interval,
    repetitions,
    next_review_at: next.toISOString(),
    lapses: lapsesOf(row),
  };
}

function applyLearning(row, now) {
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  const lapses = lapsesOf(row) + (isLapse(row) ? 1 : 0);

  const result = {
    status: 'learning',
    ease: Math.max(MIN_EASE, row.ease - 0.2),
    interval_days: 1,
    repetitions: 0,
    next_review_at: next.toISOString(),
    lapses,
  };
  return isLeech(result) ? scheduleLeechRetry(result, now) : result;
}

/**
 * Extra short cycle for a leech that was just missed: due again in about ten
 * minutes so a follow-up session can catch it today. Only `next_review_at`
 * moves; the normal learning step (interval 1 day) resumes after that review.
 */
function scheduleLeechRetry(result, now) {
  const retry = new Date(now.getTime() + LEECH_RETRY_MINUTES * 60 * 1000);
  return { ...result, next_review_at: retry.toISOString() };
}

export function isDue(nextReviewAt, now = new Date()) {
  if (!nextReviewAt) return false;
  return new Date(nextReviewAt) <= now;
}
