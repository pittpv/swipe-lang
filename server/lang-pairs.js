/** Study language → Russian UI. Default keeps existing accounts on Turkish. */

export const DEFAULT_LANG_PAIR = 'tr-ru';

export const LANG_PAIRS = ['tr-ru', 'en-ru', 'es-ru'];

export const LANG_PAIR_META = {
  'tr-ru': {
    study: 'tr',
    tts: 'tr',
    ttsBcp: 'tr-TR',
    label: 'Турецкий',
    labelAccusative: 'турецкий',
    eyebrow: 'TR → RU',
    tagline: 'Турецкий словарь со свайп-механикой',
    flag: '🇹🇷',
    cefr: ['A1', 'A2', 'B1', 'B2', 'C1'],
  },
  'en-ru': {
    study: 'en',
    tts: 'en',
    ttsBcp: 'en-US',
    label: 'Английский',
    labelAccusative: 'английский',
    eyebrow: 'EN → RU',
    tagline: 'Английский словарь со свайп-механикой',
    flag: '🇬🇧',
    cefr: ['A1', 'A2', 'B1', 'B2', 'C1'],
  },
  'es-ru': {
    study: 'es',
    tts: 'es',
    ttsBcp: 'es-ES',
    label: 'Испанский',
    labelAccusative: 'испанский',
    eyebrow: 'ES → RU',
    tagline: 'Испанский словарь со свайп-механикой',
    flag: '🇪🇸',
    cefr: ['A1', 'A2', 'B1', 'B2'],
  },
};

export function isLangPair(value) {
  return LANG_PAIRS.includes(String(value || '').toLowerCase().trim());
}

export function normalizeLangPair(value) {
  const v = String(value || '').toLowerCase().trim();
  return LANG_PAIRS.includes(v) ? v : DEFAULT_LANG_PAIR;
}

export function userLangPair(user) {
  return normalizeLangPair(user?.lang_pair);
}

export function wordLangPair(word) {
  return normalizeLangPair(word?.lang_pair);
}

export function wordMatchesPair(word, pair) {
  return wordLangPair(word) === normalizeLangPair(pair);
}

export function cefrLevelsForPair(pair) {
  return LANG_PAIR_META[normalizeLangPair(pair)].cefr;
}

export function clampCefrToPair(level, pair) {
  const order = cefrLevelsForPair(pair);
  const lv = String(level || 'A1').toUpperCase();
  if (order.includes(lv)) return lv;
  return order[order.length - 1];
}

export function nextCefrForPair(level, pair) {
  const order = cefrLevelsForPair(pair);
  const idx = order.indexOf(level);
  if (idx < 0 || idx >= order.length - 1) return null;
  return order[idx + 1];
}

/** Google TTS `tl` from `tr` / `en` / `es` or a lang_pair. */
export function ttsLangFromQuery(value) {
  const v = String(value || '').toLowerCase().trim();
  if (v === 'tr' || v === 'en' || v === 'es') return v;
  if (isLangPair(v)) return LANG_PAIR_META[v].tts;
  return LANG_PAIR_META[DEFAULT_LANG_PAIR].tts;
}
