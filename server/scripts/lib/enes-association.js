/**
 * English and Spanish → Russian associations. Same three kinds as Turkish
 * (keyword, cognate, usage) and the same stored shape, so the import and the
 * «Чтобы запомнить» card need no special case.
 *
 * Banks are hand-written tuples:
 *   [lemma, 'k', phonetic, hook, image]   Russian sound-alike plus a scene
 *   [lemma, 'c', hook]                     real cognate or loanword
 *   [lemma, 'u', formula]                  short usage line
 */

const ABSTRACT = /символиз|означает|представляет|ассоциац|воплоща/i;
const GLOSS_SKIP = new Set(['или', 'для', 'при', 'что', 'как', 'его', 'ее', 'её', 'неодуш', 'мн', 'эл']);

export function normalizeKey(lemma) {
  return String(lemma || '').toLowerCase().trim();
}

function fold(text) {
  return String(text || '').toLowerCase().replace(/ё/g, 'е');
}

function wordCount(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

function hookStem(hook) {
  const h = fold(hook);
  return h.length <= 3 ? h : h.slice(0, Math.max(3, h.length - 2));
}

/** Stems of every Russian gloss word, so the scene may use any inflection. */
export function glossStems(translation) {
  return String(translation || '')
    .split(/[,;/()\s-]+/)
    .map((w) => fold(w).replace(/[^а-я]/g, ''))
    .filter((w) => w.length >= 2 && !GLOSS_SKIP.has(w))
    .map((w) => {
      const stem = w.replace(/(ться|ть|ся|ый|ий|ой|ая|яя|ое|ее|ые|ие|ь|й|а|я|о|е|ы|и)$/, '');
      return stem.length >= 2 ? stem : w;
    });
}

export function tupleToAssociation(tuple) {
  const [, kind, a, b, c] = tuple;
  if (kind === 'k') return { kind: 'keyword', phonetic: a || '', hooks: [b].filter(Boolean), image: c || '' };
  if (kind === 'c') return { kind: 'cognate', phonetic: '', hooks: [a].filter(Boolean), image: '' };
  if (kind === 'u') return { kind: 'usage', phonetic: '', hooks: [], image: a || '' };
  return null;
}

export function validateAssociation(entry, word) {
  const errors = [];
  if (!entry || typeof entry !== 'object') return ['empty'];
  const { kind } = entry;
  const hooks = Array.isArray(entry.hooks) ? entry.hooks : [];
  const image = String(entry.image || '').trim();
  const phonetic = String(entry.phonetic || '');
  if (kind !== 'keyword' && kind !== 'cognate' && kind !== 'usage') return ['kind'];

  if (kind === 'usage') {
    if (!image) errors.push('image');
    if (image.length > 160) errors.push('image-length');
    if (ABSTRACT.test(image)) errors.push('abstract');
    return errors;
  }

  if (hooks.length !== 1 || !/^[а-яё-]+$/i.test(hooks[0] || '')) errors.push('hook');
  const bare = phonetic.replace(/\u0301/g, '');
  if (phonetic && !/^[а-яё\s-]+$/i.test(bare)) errors.push('phonetic-script');

  if (kind === 'cognate') {
    if (image) errors.push('cognate-image');
    return errors;
  }

  if (!bare.trim() || !/^[а-яё\s-]+$/i.test(bare)) errors.push('phonetic');
  else if (!phonetic.includes('\u0301')) errors.push('stress');
  const count = wordCount(image);
  if (count < 4 || count > 14) errors.push('image-words');
  if (ABSTRACT.test(image)) errors.push('abstract');
  if (/[a-z]/i.test(image)) errors.push('latin-in-image');
  const flat = fold(image);
  if (hooks[0] && !flat.includes(hookStem(hooks[0]))) errors.push('hook-in-image');
  const stems = glossStems(word?.translation);
  if (stems.length && !stems.some((stem) => flat.includes(stem))) errors.push('gloss');
  return errors;
}
