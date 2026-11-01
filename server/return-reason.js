import { isDue, lapsesOf, LEECH_LAPSES_THRESHOLD } from './srs.js';
import { isCuratedAssociation } from './association-trust.js';
import { wordLangPair } from './lang-pairs.js';

/**
 * Plain-language «why did this word come back». Every line maps to a signal
 * that is already stored: `lapses`, `status`, `next_review_at`, and a curated
 * association parked in `association_retired`. No new scheduling math.
 */

export const RETURN_REASONS_CAP = 8;

/** «1 раз», «2 раза», «5 раз», «11 раз», «22 раза». */
export function timesLabel(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} раз`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} раза`;
  return `${n} раз`;
}

/** True when the crowd retired the curated line AND this user voted «не подходит» on it. */
export function userRetiredAssociation(word, userVotedDown) {
  if (!userVotedDown || !word?.association_retired) return false;
  return isCuratedAssociation(word.association_retired);
}

/**
 * One reason for one progress row, or null when nothing here is worth saying
 * (e.g. a known word that is not due yet).
 *
 * @param {object} row progress row (status, lapses, next_review_at)
 * @param {object} word dictionary row
 * @param {{ now?: Date, userVotedDown?: boolean, inLatestSession?: boolean }} ctx
 */
export function returnReason(row, word, { now = new Date(), userVotedDown = false, inLatestSession = false } = {}) {
  if (!row || row.status === 'new') return null;
  const lapses = lapsesOf(row);
  const due = isDue(row.next_review_at, now);
  if (!due && !inLatestSession) return null;

  if (lapses >= LEECH_LAPSES_THRESHOLD) {
    return `Вы забыли это слово ${timesLabel(lapses)}, поэтому оно вернулось раньше.`;
  }
  if (lapses >= 1) {
    return `Вы забыли это слово ${timesLabel(lapses)}, поэтому оно снова в обучении.`;
  }
  if (userRetiredAssociation(word, userVotedDown)) {
    return 'Вы отметили ассоциацию как неподходящую — мы предложим другую.';
  }
  if (row.status === 'learning') return 'Слово ещё заучивается.';
  if (due) return 'Подошёл срок повторения.';
  return null;
}

/**
 * Reasons for the Stats screen: words that are due now or were touched since
 * the latest finished session began. Most-forgotten first, capped.
 */
export function buildReturnReasons(
  { progressRows = [], words = [], ratings = [], sessions = [], userId, langPair, now = new Date() },
  cap = RETURN_REASONS_CAP,
) {
  const byId = new Map(words.map((w) => [w.id, w]));
  const lastSession = sessions
    .filter((s) => s.user_id === userId && s.ended_at && s.started_at)
    .sort((a, b) => new Date(b.ended_at) - new Date(a.ended_at))[0];
  const sinceMs = lastSession ? new Date(lastSession.started_at).getTime() : null;
  const votedDown = new Set(
    ratings.filter((r) => r.user_id === userId && r.vote === 'down').map((r) => r.word_id),
  );

  const items = [];
  for (const row of progressRows) {
    if (row.user_id !== userId) continue;
    const word = byId.get(row.word_id);
    if (!word || (langPair && wordLangPair(word) !== langPair)) continue;
    const updatedMs = row.updated_at ? new Date(row.updated_at).getTime() : NaN;
    const inLatestSession = sinceMs != null && Number.isFinite(updatedMs) && updatedMs >= sinceMs;
    const reason = returnReason(row, word, {
      now,
      userVotedDown: votedDown.has(row.word_id),
      inLatestSession,
    });
    if (!reason) continue;
    items.push({
      wordId: word.id,
      lemma: word.lemma,
      translation: word.translation,
      reason,
      lapses: lapsesOf(row),
      due: isDue(row.next_review_at, now),
      nextMs: row.next_review_at ? new Date(row.next_review_at).getTime() : Infinity,
    });
  }

  items.sort((a, b) => b.lapses - a.lapses || Number(b.due) - Number(a.due) || a.nextMs - b.nextMs);
  return items
    .slice(0, Math.max(0, cap))
    .map(({ wordId, lemma, translation, reason }) => ({ wordId, lemma, translation, reason }));
}
