/** SM-2 inspired SRS for swipe left (know) / right (learn) */

const MIN_EASE = 1.3;

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
  };
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
  };
}

function applyLearning(row, now) {
  const next = new Date(now);
  next.setDate(next.getDate() + 1);

  return {
    status: 'learning',
    ease: Math.max(MIN_EASE, row.ease - 0.2),
    interval_days: 1,
    repetitions: 0,
    next_review_at: next.toISOString(),
  };
}

export function isDue(nextReviewAt, now = new Date()) {
  if (!nextReviewAt) return false;
  return new Date(nextReviewAt) <= now;
}
