import { wordLangPair } from './lang-pairs.js';

/**
 * Curated associations ship with the dictionary. Crowd votes («подходит /
 * не подходит») may only pull a curated line once enough different people
 * have voted AND most of them rejected it. One downvote never does.
 */
export const CURATED_TRUST_THRESHOLD = Object.freeze({
  /** Distinct voters (one vote per user per word) before the crowd counts. */
  minVotes: 25,
  /** Share of those voters that must say «не подходит». */
  minDownShare: 0.75,
});

export const CURATED_SOURCE = 'curated';

function lemmaKey(lemma) {
  return String(lemma || '').toLowerCase().replace(/\u0307/g, '').trim();
}

function parseStored(raw) {
  if (raw == null || raw === '' || raw === 'null') return null;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isCuratedAssociation(raw) {
  return parseStored(raw)?.source === CURATED_SOURCE;
}

function hookOf(raw) {
  const hooks = parseStored(raw)?.hooks;
  return Array.isArray(hooks) ? hooks.join(' + ') : '';
}

/**
 * Count votes for one word. Votes are tied to the hook that was on screen,
 * so rewriting a curated line starts its tally from zero.
 */
export function tallyAssociationVotes(rows, { langPair, lemma, hook }) {
  const key = lemmaKey(lemma);
  let up = 0;
  let down = 0;
  for (const row of rows ?? []) {
    if (row.vote !== 'up' && row.vote !== 'down') continue;
    if ((row.lang_pair || '') !== (langPair || '')) continue;
    if (lemmaKey(row.lemma) !== key) continue;
    if ((row.hook || '') !== (hook || '')) continue;
    if (row.vote === 'up') up += 1;
    else down += 1;
  }
  return { up, down, total: up + down };
}

/** The single gate: may the crowd displace a curated association yet? */
export function crowdMayReplaceCurated(tally, threshold = CURATED_TRUST_THRESHOLD) {
  if (!tally || tally.total < threshold.minVotes) return false;
  return tally.down / tally.total >= threshold.minDownShare;
}

/**
 * Hide or restore a word's curated association from the current votes.
 * The curated row is parked in `association_retired`, so it comes back if
 * the votes drop under the threshold. Returns true when the row changed.
 */
export function applyAssociationTrust(word, voteRows, threshold = CURATED_TRUST_THRESHOLD) {
  if (!word) return false;
  const curated = word.association_retired ?? word.association;
  if (!isCuratedAssociation(curated)) return false;
  const tally = tallyAssociationVotes(voteRows, {
    langPair: wordLangPair(word),
    lemma: word.lemma,
    hook: hookOf(curated),
  });
  const retire = crowdMayReplaceCurated(tally, threshold);
  if (retire && word.association_retired == null) {
    word.association_retired = word.association;
    word.association = 'null';
    return true;
  }
  if (!retire && word.association_retired != null) {
    word.association = word.association_retired;
    delete word.association_retired;
    return true;
  }
  return false;
}
