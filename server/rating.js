import { userLangPair, wordLangPair } from './lang-pairs.js';

/** Minimum gap between swipes that count toward the weekly rating. */
export const RATING_SWIPE_GAP_MS = 1000;

/**
 * Gesture time from the client, when it is close to the server clock.
 * A queued swipe can arrive late; the gap should follow the finger, not the queue.
 * Times far in the future or older than two minutes fall back to the server clock.
 */
export function swipeInstant(clientIso, now = new Date()) {
  const nowMs = now.getTime();
  const clientMs = Date.parse(clientIso ?? '');
  if (!Number.isFinite(clientMs)) return now;
  if (clientMs > nowMs + 2000) return now;
  if (nowMs - clientMs > 120000) return now;
  return new Date(clientMs);
}

const WEEKDAY_LABELS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

export function utcDay(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

/** Monday-first dates of the UTC week that contains `day` (YYYY-MM-DD). */
export function weekDates(day) {
  const [year, month, date] = day.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, date));
  const dow = utc.getUTCDay();
  const delta = dow === 0 ? 6 : dow - 1;
  utc.setUTCDate(utc.getUTCDate() - delta);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const next = new Date(utc);
    next.setUTCDate(utc.getUTCDate() + i);
    dates.push(next.toISOString().slice(0, 10));
  }
  return dates;
}

function publicName(user) {
  const name = String(user?.name ?? '').trim();
  return name || 'Участник';
}

/**
 * Snapshot of the issued deck for rating. `due` cards were already scheduled.
 * `scheduled` cards are due on this UTC day, not carried over from earlier.
 */
export function ratingDeckMeta(progressRows, wordIds, now = new Date()) {
  const today = utcDay(now);
  const nowIso = now.toISOString();
  const byWord = new Map((progressRows ?? []).map((row) => [row.word_id, row]));
  return wordIds.map((id) => {
    const row = byWord.get(id);
    const dueAt = row?.next_review_at || null;
    const due = Boolean(dueAt && dueAt <= nowIso);
    return {
      id,
      due,
      scheduled: Boolean(due && dueAt.slice(0, 10) === today),
      interval: Number(row?.interval_days) || 0,
    };
  });
}

/** Records a deck card toward the rating when the previous counted swipe is old enough. */
export function noteRatingSwipe(session, wordId, now = new Date()) {
  const id = Number(wordId);
  const deck = session?.rating_deck;
  if (!Array.isArray(deck) || !deck.some((card) => card.id === id)) return false;
  if (!Array.isArray(session.rating_hits)) session.rating_hits = [];
  if (session.rating_hits.includes(id)) return false;
  const at = now.getTime();
  if (session.rating_last_at != null && at - session.rating_last_at < RATING_SWIPE_GAP_MS) return false;
  session.rating_hits.push(id);
  session.rating_last_at = at;
  return true;
}

export function weekSummary(user, pair, now = new Date()) {
  const today = utcDay(now);
  const dates = weekDates(today);
  const open = new Set(dates);
  const rows = (user?.rating_days ?? []).filter((day) => day.lang_pair === pair && open.has(day.date));
  const byDate = new Map(rows.map((day) => [day.date, day]));
  const todayRow = byDate.get(today);
  return {
    dates,
    marks: dates.map((date) => byDate.has(date)),
    dayCount: rows.length,
    reviews: rows.reduce((sum, day) => sum + (Number(day.reviews) || 0), 0),
    returns: rows.reduce((sum, day) => sum + (Number(day.returns) || 0), 0),
    closedToday: Boolean(todayRow),
    closedTodayAt: todayRow?.closed_at ?? null,
  };
}

/**
 * Closes today's rating when every issued card was swiped slowly enough,
 * and this language does not already have a closed day.
 * A second session still updates SRS elsewhere; it does not add points.
 */
export function settleSession(user, session, progressRows, now = new Date()) {
  const pair = session?.lang_pair || (user ? userLangPair(user) : null);
  const summary = weekSummary(user, pair, now);
  const deck = Array.isArray(session?.rating_deck) ? session.rating_deck : [];
  const hits = new Set(session?.rating_hits ?? []);
  const already = summary.closedToday;
  const full = deck.length > 0 && deck.every((card) => hits.has(card.id));
  if (!user || !pair || !full || already) {
    return {
      dayClosed: already,
      counted: false,
      weekDays: summary.dayCount,
      reviews: 0,
      returns: 0,
      holds: [],
    };
  }

  const mine = new Map(
    (progressRows ?? []).filter((row) => row.user_id === user.id).map((row) => [row.word_id, row]),
  );
  let reviews = 0;
  let returns = 0;
  const holds = [];
  for (const card of deck) {
    if (card.due) reviews += 1;
    if (!card.scheduled) continue;
    returns += 1;
    const row = mine.get(card.id);
    if (!row) continue;
    if (card.interval >= 6 && !row.held_6) {
      row.held_6 = true;
      holds.push({ wordId: card.id, threshold: 6 });
    }
    if (card.interval >= 21 && !row.held_21) {
      row.held_21 = true;
      holds.push({ wordId: card.id, threshold: 21 });
    }
  }

  if (!Array.isArray(user.rating_days)) user.rating_days = [];
  user.rating_days.push({
    date: utcDay(now),
    lang_pair: pair,
    reviews,
    returns,
    closed_at: now.toISOString(),
  });
  return {
    dayClosed: true,
    counted: true,
    weekDays: summary.dayCount + 1,
    reviews,
    returns,
    holds,
  };
}

export function countHolds(db, userId, pair) {
  const ids = new Set(
    (db.data.words ?? []).filter((word) => wordLangPair(word) === pair).map((word) => word.id),
  );
  let total = 0;
  for (const row of db.data.user_word_progress ?? []) {
    if (row.user_id !== userId || !ids.has(row.word_id)) continue;
    if (row.held_6) total += 1;
    if (row.held_21) total += 1;
  }
  return total;
}

export function weekPayload(user, pair, holds, now = new Date()) {
  const summary = weekSummary(user, pair, now);
  return {
    dayCount: summary.dayCount,
    closedToday: summary.closedToday,
    holds,
    marks: summary.dates.map((date, index) => ({
      label: WEEKDAY_LABELS[index],
      closed: summary.marks[index],
    })),
  };
}

/** Days first, then due reviews, then same-day returns. Today's earlier close breaks the rest. */
export function compareRank(a, b) {
  if (b.days !== a.days) return b.days - a.days;
  if (b.reviews !== a.reviews) return b.reviews - a.reviews;
  if (b.returns !== a.returns) return b.returns - a.returns;
  if (a.closedToday && b.closedToday && a.closedTodayAt !== b.closedTodayAt) {
    return a.closedTodayAt < b.closedTodayAt ? -1 : 1;
  }
  const byName = String(a.name).localeCompare(String(b.name), 'ru');
  if (byName) return byName;
  return a.id - b.id;
}

export function languageBoard(db, userId, now = new Date()) {
  const viewer = db.data.users?.find((row) => row.id === userId);
  const pair = userLangPair(viewer);
  const ranked = (db.data.users ?? [])
    .filter((user) => userLangPair(user) === pair)
    .map((user) => {
      const week = weekSummary(user, pair, now);
      return {
        id: user.id,
        name: publicName(user),
        days: week.dayCount,
        reviews: week.reviews,
        returns: week.returns,
        closedToday: week.closedToday,
        closedTodayAt: week.closedTodayAt,
      };
    })
    .sort(compareRank);
  const listed = ranked.filter((row) => row.days > 0);
  const rows = listed.map((row, index) => ({
    place: index + 1,
    name: row.name,
    days: row.days,
    closedToday: row.closedToday,
    you: row.id === userId,
  }));
  const mine = ranked.find((row) => row.id === userId);
  const place = rows.find((row) => row.you)?.place ?? null;
  return {
    langPair: pair,
    me: mine
      ? {
          name: mine.name,
          days: mine.days,
          closedToday: mine.closedToday,
          place,
          pinned: place == null,
        }
      : null,
    rows,
  };
}
