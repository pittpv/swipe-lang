/**
 * Rare productive check after a «знаю» swipe: type the translation, or pick the
 * missing word in the card's example. Practice only — the swipe stays the SRS signal.
 */

/** Share of «знаю» swipes that open a check. */
export const EXERCISE_RATE = 0.06;

/**
 * Cards that must pass before a «знаю» word can be checked.
 * The translation may have been opened on the card itself, so the check
 * is never that same card.
 */
export const EXERCISE_LAG = 3;

const RIGHT_HOLD_MS = 900;
const WRONG_HOLD_MS = 2400;
const CLOZE_OPTIONS = 3;

/** Deterministic value in [0, 1) for a string key (FNV-1a + murmur3 finalizer). */
export function stableUnit(key) {
  let h = 0x811c9dc5;
  for (const ch of String(key)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 0x100000000;
}

/** Same session + card always gives the same answer, so a reload does not reshuffle. */
export function shouldOfferExercise(sessionId, cardId, rate = EXERCISE_RATE) {
  return stableUnit(`${sessionId ?? 'none'}:${cardId}`) < rate;
}

/**
 * Oldest «знаю» card that is far enough behind the one just swiped.
 * `entries` are `{ card, index, used }`. Returns null when nothing qualifies.
 */
export function pickLaggedCard(entries, currentIndex, lag = EXERCISE_LAG) {
  const here = Number(currentIndex);
  let chosen = null;
  for (const entry of entries || []) {
    if (!entry?.card || entry.used) continue;
    if (!Number.isInteger(entry.index) || here - entry.index < lag) continue;
    if (!chosen || entry.index < chosen.index) chosen = entry;
  }
  return chosen;
}

export function normalizeAnswer(text) {
  return String(text ?? '')
    .toLocaleLowerCase('ru')
    .replace(/ё/g, 'е')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The full translation and each comma/semicolon/slash-separated meaning. */
export function acceptedAnswers(translation) {
  const raw = String(translation ?? '');
  const parts = [raw, ...raw.split(/[,;/]/)];
  return [...new Set(parts.map(normalizeAnswer).filter(Boolean))];
}

export function gradeTyped(input, translation) {
  const answer = normalizeAnswer(input);
  return Boolean(answer) && acceptedAnswers(translation).includes(answer);
}

function localeOf(langPair) {
  return String(langPair || 'tr-ru').split('-')[0] || 'tr';
}

const LETTER = /\p{L}/u;

/** «ad (isim)» → «ad»: the dictionary disambiguator never appears in sentences. */
export function bareLemma(lemma) {
  return String(lemma ?? '').replace(/\s*\([^)]*\)/g, '').trim();
}

/**
 * Locate the lemma in a sentence. Turkish is agglutinative, so a trailing suffix
 * stays visible after the blank («___de»); other languages need a whole-word match.
 * @returns {null | { before: string, word: string, suffix: string, after: string }}
 */
export function findCloze(sentence, lemma, langPair) {
  const locale = localeOf(langPair);
  const text = String(sentence ?? '');
  const target = bareLemma(lemma).toLocaleLowerCase(locale);
  if (target.length < 2 || !text) return null;
  const lower = text.toLocaleLowerCase(locale);
  // Index math below assumes lowercasing kept every character's length.
  if (lower.length !== text.length) return null;
  const allowSuffix = locale === 'tr' && target.length >= 3;
  let from = 0;
  while (from <= lower.length - target.length) {
    const idx = lower.indexOf(target, from);
    if (idx < 0) return null;
    const end = idx + target.length;
    const startsWord = idx === 0 || !LETTER.test(lower[idx - 1]);
    let tail = end;
    while (tail < lower.length && LETTER.test(lower[tail])) tail += 1;
    if (startsWord && (tail === end || allowSuffix)) {
      return {
        before: text.slice(0, idx),
        word: text.slice(idx, end),
        suffix: text.slice(end, tail),
        after: text.slice(tail),
      };
    }
    from = idx + 1;
  }
  return null;
}

function pickDistractors(card, deck, key) {
  const locale = localeOf(card.langPair);
  const own = bareLemma(card.lemma).toLocaleLowerCase(locale);
  const seen = new Set([own]);
  const pool = [];
  for (const other of deck || []) {
    if (!other || other.id === card.id || other.langPair !== card.langPair) continue;
    const lemma = bareLemma(other.lemma);
    const lower = lemma.toLocaleLowerCase(locale);
    if (!lemma || seen.has(lower)) continue;
    seen.add(lower);
    pool.push({ lemma, samePos: other.pos === card.pos, rank: stableUnit(`${key}:d:${other.id}`) });
  }
  pool.sort((a, b) => Number(b.samePos) - Number(a.samePos) || a.rank - b.rank);
  return pool.slice(0, CLOZE_OPTIONS - 1).map((item) => item.lemma);
}

function buildCloze(card, deck, key) {
  const examples = Array.isArray(card.examples) ? card.examples : [];
  for (const ex of examples) {
    const gap = findCloze(ex?.example, card.lemma, card.langPair);
    if (!gap) continue;
    const distractors = pickDistractors(card, deck, key);
    if (distractors.length < CLOZE_OPTIONS - 1) return null;
    const answer = bareLemma(card.lemma);
    const options = [answer, ...distractors]
      .map((lemma) => ({ lemma, rank: stableUnit(`${key}:o:${lemma}`) }))
      .sort((a, b) => a.rank - b.rank)
      .map((item) => item.lemma);
    return {
      type: 'cloze',
      gap,
      sentenceRu: String(ex.translate ?? '').trim(),
      options,
      answer,
    };
  }
  return null;
}

/**
 * Pick the check for a card. Cloze needs an example containing the lemma and two
 * other words from the deck; otherwise it falls back to typing the translation.
 * @param {'typed'|'cloze'|null} [force] dev-only override of the type
 */
export function buildExercise(card, deck, sessionId, force = null) {
  const key = `${sessionId ?? 'none'}:${card.id}`;
  const wantCloze = force ? force === 'cloze' : stableUnit(`${key}:type`) < 0.5;
  const cloze = wantCloze ? buildCloze(card, deck, key) : null;
  const base = { cardId: card.id, lemma: card.lemma, translation: String(card.translation ?? '') };
  return { ...base, ...(cloze || { type: 'typed' }), phase: 'ask', value: '', picked: null, timer: null };
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function feedbackHtml(ex) {
  if (ex.phase === 'right') return '<p class="drill-feedback is-right" role="status">Верно</p>';
  if (ex.phase === 'wrong') {
    const correct = ex.type === 'cloze' ? ex.answer : ex.translation;
    return `<p class="drill-feedback is-wrong" role="status">Правильно: <strong>${esc(correct)}</strong></p>`;
  }
  return '<p class="drill-feedback" role="status"></p>';
}

function footerHtml(ex) {
  return ex.phase === 'ask'
    ? '<button type="button" class="btn btn-ghost drill-footer" data-drill="skip">Пропустить</button>'
    : '<button type="button" class="btn btn-ghost drill-footer" data-drill="next">Дальше →</button>';
}

function typedHtml(ex) {
  const done = ex.phase !== 'ask';
  const state = ex.phase === 'right' ? ' is-right' : ex.phase === 'wrong' ? ' is-wrong' : '';
  return `
    <p class="drill-prompt" id="drill-prompt">Знаете? Напишите перевод</p>
    <p class="drill-lemma">${esc(ex.lemma)}</p>
    <form class="drill-form" data-drill="form">
      <input
        class="drill-input${state}"
        type="text"
        name="answer"
        lang="ru"
        value="${esc(ex.value)}"
        placeholder="по-русски"
        autocomplete="off"
        autocapitalize="off"
        autocorrect="off"
        spellcheck="false"
        enterkeyhint="done"
        aria-labelledby="drill-prompt"
        ${done ? 'disabled' : ''}
      >
      ${done ? '' : '<button type="submit" class="btn btn-primary">Проверить</button>'}
    </form>`;
}

function clozeHtml(ex) {
  const { gap } = ex;
  const done = ex.phase !== 'ask';
  const blank = done
    ? `<span class="drill-blank is-filled">${esc(gap.word)}</span>`
    : '<span class="drill-blank" aria-label="пропуск">&nbsp;</span>';
  const options = ex.options
    .map((lemma) => {
      let state = '';
      if (done && lemma === ex.answer) state = ' is-right';
      else if (done && lemma === ex.picked) state = ' is-wrong';
      return `<button type="button" class="btn btn-soft drill-option${state}" data-drill="pick" data-lemma="${esc(lemma)}" ${done ? 'disabled' : ''}>${esc(lemma)}</button>`;
    })
    .join('');
  return `
    <p class="drill-prompt" id="drill-prompt">Знаете? Выберите пропущенное слово</p>
    <p class="drill-sentence">${esc(gap.before)}${blank}${esc(gap.suffix)}${esc(gap.after)}</p>
    ${ex.sentenceRu ? `<p class="drill-sentence-ru">${esc(ex.sentenceRu)}</p>` : ''}
    <div class="drill-options" role="group" aria-labelledby="drill-prompt">${options}</div>`;
}

export function exerciseHtml(ex, enter = false) {
  return `
    <div class="drill-card${enter ? ' drill-enter' : ''}" id="drill-card" role="group" aria-labelledby="drill-prompt">
      ${ex.type === 'cloze' ? clozeHtml(ex) : typedHtml(ex)}
      ${feedbackHtml(ex)}
      ${footerHtml(ex)}
    </div>`;
}

/**
 * Attach handlers to a rendered check. `refresh` re-renders it from `ex`;
 * `done` hands control back to the deck. Safe to call again after a re-render.
 */
export function wireExercise(el, ex, { refresh, done }) {
  if (!el) return;
  const settle = (right) => {
    if (ex.phase !== 'ask') return;
    ex.phase = right ? 'right' : 'wrong';
    ex.timer = setTimeout(done, right ? RIGHT_HOLD_MS : WRONG_HOLD_MS);
    refresh();
    el.ownerDocument.querySelector('#drill-card [data-drill="next"]')?.focus({ preventScroll: true });
  };
  const input = el.querySelector('.drill-input');
  input?.addEventListener('input', () => {
    ex.value = input.value;
  });
  el.querySelector('[data-drill="form"]')?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!normalizeAnswer(ex.value)) {
      input?.focus();
      return;
    }
    settle(gradeTyped(ex.value, ex.translation));
  });
  el.addEventListener('click', (e) => {
    const t = e.target.closest('[data-drill]');
    if (!t) return;
    const action = t.dataset.drill;
    if (action === 'pick') {
      ex.picked = t.dataset.lemma;
      settle(ex.picked === ex.answer);
    }
    if (action === 'skip' || action === 'next') done();
  });
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') done();
  });
  if (ex.phase === 'ask' && input) input.focus({ preventScroll: true });
}
