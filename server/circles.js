import { generateReferralCode } from './referral.js';
import { normalizeLangPair, userLangPair } from './lang-pairs.js';

export const CIRCLE_MAX_MEMBERS = 8;
export const CIRCLE_NAME_MIN = 2;
export const CIRCLE_NAME_MAX = 40;
const SUGGESTION_LIMIT = 6;
const SHARED_PREVIEW = 12;

export class CircleError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function circlesOf(db) {
  return Array.isArray(db.data.study_circles) ? db.data.study_circles : [];
}

function pairByWordId(db) {
  const map = new Map();
  for (const word of db.data.words ?? []) {
    if (word?.id == null) continue;
    map.set(word.id, normalizeLangPair(word.lang_pair));
  }
  return map;
}

/** Word ids this user has swiped in the given language pair. */
export function progressWordIds(db, userId, langPair, pairIndex = pairByWordId(db)) {
  const pair = normalizeLangPair(langPair);
  const ids = new Set();
  for (const row of db.data.user_word_progress ?? []) {
    if (row.user_id !== userId) continue;
    if (pairIndex.get(row.word_id) === pair) ids.add(row.word_id);
  }
  return ids;
}

export function jaccard(left, right) {
  if (!left.size && !right.size) return 0;
  let shared = 0;
  for (const id of left) if (right.has(id)) shared += 1;
  const union = left.size + right.size - shared;
  return union ? shared / union : 0;
}

/**
 * Words present in every member who already has progress.
 * A member with an empty deck does not wipe the intersection.
 * Returns empty until at least two members have words.
 */
export function sharedWordIds(sets) {
  const filled = sets.filter((set) => set.size > 0);
  if (filled.length < 2) return new Set();
  const [first, ...rest] = filled;
  const shared = new Set();
  for (const id of first) {
    if (rest.every((set) => set.has(id))) shared.add(id);
  }
  return shared;
}

function memberSets(db, circle, pairIndex) {
  return (circle.member_ids ?? []).map((id) => progressWordIds(db, id, circle.lang_pair, pairIndex));
}

export function circleForUser(db, userId, langPair) {
  const pair = normalizeLangPair(langPair);
  return circlesOf(db).find((circle) => circle.lang_pair === pair && circle.member_ids?.includes(userId)) ?? null;
}

function displayName(db, userId) {
  const user = db.data.users?.find((row) => row.id === userId);
  const name = String(user?.name ?? '').trim();
  return name || 'Участник';
}

function wordPreview(db, ids) {
  const byId = new Map((db.data.words ?? []).map((word) => [word.id, word]));
  return [...ids]
    .map((id) => byId.get(id))
    .filter(Boolean)
    .sort((a, b) => String(a.lemma).localeCompare(String(b.lemma), 'ru'))
    .slice(0, SHARED_PREVIEW)
    .map((word) => ({ id: word.id, lemma: word.lemma, translation: word.translation }));
}

function suggestionsFor(db, userId, pair, mine, pairIndex) {
  return circlesOf(db)
    .filter(
      (circle) =>
        circle.lang_pair === pair &&
        !circle.member_ids?.includes(userId) &&
        (circle.member_ids?.length ?? 0) < CIRCLE_MAX_MEMBERS,
    )
    .map((circle) => {
      const union = new Set();
      for (const set of memberSets(db, circle, pairIndex)) {
        for (const id of set) union.add(id);
      }
      let overlapCount = 0;
      for (const id of mine) if (union.has(id)) overlapCount += 1;
      return {
        id: circle.id,
        name: circle.name,
        memberCount: circle.member_ids.length,
        maxMembers: CIRCLE_MAX_MEMBERS,
        overlapCount,
        overlapPct: Math.round(jaccard(mine, union) * 100),
      };
    })
    .filter((row) => row.overlapCount > 0)
    .sort((a, b) => b.overlapPct - a.overlapPct || b.overlapCount - a.overlapCount || b.memberCount - a.memberCount)
    .slice(0, SUGGESTION_LIMIT);
}

export function circleState(db, userId) {
  const user = db.data.users?.find((row) => row.id === userId);
  const pair = userLangPair(user);
  const pairIndex = pairByWordId(db);
  const mine = progressWordIds(db, userId, pair, pairIndex);
  const circle = circleForUser(db, userId, pair);
  if (!circle) {
    return { circle: null, langPair: pair, suggestions: suggestionsFor(db, userId, pair, mine, pairIndex) };
  }
  const shared = sharedWordIds(memberSets(db, circle, pairIndex));
  return {
    circle: {
      id: circle.id,
      name: circle.name,
      langPair: circle.lang_pair,
      inviteCode: circle.invite_code,
      members: (circle.member_ids ?? []).map((id) => ({ id, name: displayName(db, id) })),
      memberCount: circle.member_ids.length,
      maxMembers: CIRCLE_MAX_MEMBERS,
      sharedCount: shared.size,
      sharedPreview: wordPreview(db, shared),
      canStart: shared.size > 0,
    },
    langPair: pair,
    suggestions: [],
  };
}

function ensureCircleStore(db) {
  if (!Array.isArray(db.data.study_circles)) db.data.study_circles = [];
  if (!db.data._seq || typeof db.data._seq !== 'object') db.data._seq = {};
  if (db.data._seq.study_circles == null) {
    db.data._seq.study_circles = db.data.study_circles.reduce((max, circle) => Math.max(max, circle.id || 0), 0);
  }
}

function freshInviteCode(db) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateReferralCode();
    if (!circlesOf(db).some((circle) => circle.invite_code === code)) return code;
  }
  throw new CircleError('Не удалось создать код приглашения', 500);
}

export function createCircle(db, userId, rawName) {
  ensureCircleStore(db);
  const user = db.data.users?.find((row) => row.id === userId);
  if (!user) throw new CircleError('Пользователь не найден', 404);
  const pair = userLangPair(user);
  if (circleForUser(db, userId, pair)) throw new CircleError('Вы уже в кружке этого языка', 409);
  const name = String(rawName ?? '').trim().replace(/\s+/g, ' ').slice(0, CIRCLE_NAME_MAX);
  if (name.length < CIRCLE_NAME_MIN) throw new CircleError('Название — от 2 символов', 400);
  const circle = {
    id: db.nextId('study_circles'),
    name,
    lang_pair: pair,
    invite_code: freshInviteCode(db),
    created_at: new Date().toISOString(),
    member_ids: [userId],
  };
  db.data.study_circles.push(circle);
  return circleState(db, userId);
}

export function joinCircle(db, userId, { code, circleId } = {}) {
  ensureCircleStore(db);
  const user = db.data.users?.find((row) => row.id === userId);
  if (!user) throw new CircleError('Пользователь не найден', 404);
  const pair = userLangPair(user);
  if (circleForUser(db, userId, pair)) throw new CircleError('Сначала выйдите из текущего кружка', 409);

  let circle = null;
  if (code != null && String(code).trim()) {
    const normalized = String(code).trim().toLowerCase();
    circle = circlesOf(db).find((row) => row.invite_code === normalized) ?? null;
    if (!circle) throw new CircleError('Кружок с таким кодом не найден', 404);
  } else if (circleId != null) {
    const id = Number(circleId);
    circle = circlesOf(db).find((row) => row.id === id) ?? null;
    if (!circle) throw new CircleError('Кружок не найден', 404);
  } else {
    throw new CircleError('Нужен код или кружок', 400);
  }

  if (circle.lang_pair !== pair) throw new CircleError('Этот кружок для другого языка', 400);
  if ((circle.member_ids?.length ?? 0) >= CIRCLE_MAX_MEMBERS) throw new CircleError('В кружке больше нет мест', 409);
  if (!circle.member_ids.includes(userId)) circle.member_ids.push(userId);
  return circleState(db, userId);
}

export function leaveCircle(db, userId) {
  ensureCircleStore(db);
  const user = db.data.users?.find((row) => row.id === userId);
  const pair = userLangPair(user);
  const circle = circleForUser(db, userId, pair);
  if (!circle) throw new CircleError('Вы не в кружке', 404);
  circle.member_ids = circle.member_ids.filter((id) => id !== userId);
  if (!circle.member_ids.length) {
    db.data.study_circles = circlesOf(db).filter((row) => row.id !== circle.id);
  }
  return circleState(db, userId);
}

/** Drops the user from every circle and deletes circles left empty. */
export function removeUserFromCircles(db, userId) {
  if (!Array.isArray(db.data.study_circles)) return;
  db.data.study_circles = db.data.study_circles
    .map((circle) => ({
      ...circle,
      member_ids: (circle.member_ids ?? []).filter((id) => id !== userId),
    }))
    .filter((circle) => circle.member_ids.length > 0);
}

/** Stable word ids for a circle practice session. Empty when there is no intersection. */
export function circleSessionWordIds(db, userId, limit) {
  const user = db.data.users?.find((row) => row.id === userId);
  const circle = circleForUser(db, userId, userLangPair(user));
  if (!circle) throw new CircleError('Вы не в кружке', 404);
  const shared = sharedWordIds(memberSets(db, circle, pairByWordId(db)));
  const byId = new Map((db.data.words ?? []).map((word) => [word.id, word]));
  return [...shared]
    .map((id) => byId.get(id))
    .filter(Boolean)
    .sort((a, b) => String(a.lemma).localeCompare(String(b.lemma), 'ru'))
    .slice(0, limit)
    .map((word) => word.id);
}
