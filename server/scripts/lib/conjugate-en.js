/** Irregular simple-past forms. Unlisted verbs take regular -ed. */
const IRREGULAR_PAST = {
  arise: 'arose',
  awake: 'awoke',
  be: null,
  bear: 'bore',
  beat: 'beat',
  become: 'became',
  begin: 'began',
  bend: 'bent',
  bet: 'bet',
  bind: 'bound',
  bite: 'bit',
  bleed: 'bled',
  blow: 'blew',
  break: 'broke',
  breed: 'bred',
  bring: 'brought',
  build: 'built',
  burn: 'burnt',
  burst: 'burst',
  buy: 'bought',
  catch: 'caught',
  choose: 'chose',
  come: 'came',
  cost: 'cost',
  creep: 'crept',
  cut: 'cut',
  deal: 'dealt',
  dig: 'dug',
  do: 'did',
  draw: 'drew',
  dream: 'dreamt',
  drink: 'drank',
  drive: 'drove',
  eat: 'ate',
  fall: 'fell',
  feed: 'fed',
  feel: 'felt',
  fight: 'fought',
  find: 'found',
  fly: 'flew',
  forget: 'forgot',
  forgive: 'forgave',
  freeze: 'froze',
  get: 'got',
  give: 'gave',
  go: 'went',
  grow: 'grew',
  hang: 'hung',
  have: 'had',
  hear: 'heard',
  hide: 'hid',
  hit: 'hit',
  hold: 'held',
  hurt: 'hurt',
  keep: 'kept',
  kneel: 'knelt',
  know: 'knew',
  lay: 'laid',
  lead: 'led',
  lean: 'leant',
  leap: 'leapt',
  learn: 'learnt',
  leave: 'left',
  lend: 'lent',
  let: 'let',
  lie: 'lay',
  light: 'lit',
  lose: 'lost',
  make: 'made',
  mean: 'meant',
  meet: 'met',
  pay: 'paid',
  put: 'put',
  quit: 'quit',
  read: 'read',
  rid: 'rid',
  ride: 'rode',
  ring: 'rang',
  rise: 'rose',
  run: 'ran',
  say: 'said',
  see: 'saw',
  seek: 'sought',
  sell: 'sold',
  send: 'sent',
  set: 'set',
  sew: 'sewed',
  shake: 'shook',
  shine: 'shone',
  shoot: 'shot',
  show: 'showed',
  shut: 'shut',
  sing: 'sang',
  sink: 'sank',
  sit: 'sat',
  sleep: 'slept',
  slide: 'slid',
  smell: 'smelt',
  speak: 'spoke',
  spend: 'spent',
  spill: 'spilt',
  spin: 'spun',
  split: 'split',
  spoil: 'spoilt',
  spread: 'spread',
  stand: 'stood',
  steal: 'stole',
  stick: 'stuck',
  sting: 'stung',
  strike: 'struck',
  swear: 'swore',
  sweep: 'swept',
  swim: 'swam',
  take: 'took',
  teach: 'taught',
  tear: 'tore',
  tell: 'told',
  think: 'thought',
  throw: 'threw',
  understand: 'understood',
  wake: 'woke',
  wed: 'wed',
  wear: 'wore',
  weep: 'wept',
  win: 'won',
  wind: 'wound',
  write: 'wrote',
};

const MODALS = {
  can: { present: 'can', past: 'could', future: 'will be able to' },
  could: { present: 'could', past: 'could', future: 'will be able to' },
  must: { present: 'must', past: 'had to', future: 'will have to' },
  may: { present: 'may', past: 'might', future: 'may' },
  might: { present: 'might', past: 'might', future: 'might' },
  should: { present: 'should', past: 'should', future: 'should' },
  would: { present: 'would', past: 'would', future: 'would' },
  shall: { present: 'shall', past: 'should', future: 'shall' },
  will: { present: 'will', past: 'would', future: 'will' },
  ought: { present: 'ought to', past: 'ought to', future: 'ought to' },
};

const PERSONS = [
  { person: 'I', key: 'I' },
  { person: 'you', key: 'you' },
  { person: 'he/she', key: 'he' },
  { person: 'we', key: 'we' },
  { person: 'you (pl)', key: 'you_pl' },
  { person: 'they', key: 'they' },
];

function baseVerb(lemma) {
  return lemma.toLowerCase().trim().split(/\s+/)[0];
}

function restPhrase(lemma) {
  const parts = lemma.toLowerCase().trim().split(/\s+/);
  return parts.length > 1 ? ` ${parts.slice(1).join(' ')}` : '';
}

function thirdPersonS(verb) {
  if (verb === 'have') return 'has';
  if (verb === 'do') return 'does';
  if (verb === 'go') return 'goes';
  if (verb === 'say') return 'says';
  if (/(s|sh|ch|x|z|o)$/.test(verb)) return `${verb}es`;
  if (/[^aeiou]y$/.test(verb)) return `${verb.slice(0, -1)}ies`;
  return `${verb}s`;
}

function regularPast(verb) {
  if (verb.endsWith('e')) return `${verb}d`;
  if (/[^aeiou]y$/.test(verb)) return `${verb.slice(0, -1)}ied`;
  if (/[^aeiou][aeiou][bdfglmnpst]$/.test(verb) && verb.length <= 5 && !/(ee|ea|oo|ai|oa)$/.test(verb.slice(0, -1))) {
    const last = verb[verb.length - 1];
    if ('bcdfgklmnpst'.includes(last) && !['need', 'wait', 'visit', 'open', 'listen', 'happen', 'offer', 'enter', 'remember'].includes(verb)) {
      if (/^[b-df-hj-np-tv-z]+[aeiou][bdfgklmnpst]$/.test(verb)) return `${verb}${last}ed`;
    }
  }
  return `${verb}ed`;
}

function presentForm(verb, key) {
  if (verb === 'be') {
    if (key === 'I') return 'am';
    if (key === 'he') return 'is';
    return 'are';
  }
  if (key === 'he') return thirdPersonS(verb);
  return verb;
}

function pastForm(verb, key) {
  if (verb === 'be') return key === 'I' || key === 'he' ? 'was' : 'were';
  if (IRREGULAR_PAST[verb]) return IRREGULAR_PAST[verb];
  return regularPast(verb);
}

/**
 * 18 forms: 6 persons × present / past / future, matching the Turkish CSV shape.
 * tense keys stay şimdi/di/gelecek so the existing overlay titles work.
 */
export function conjugateEnglish(lemma) {
  const verb = baseVerb(lemma);
  const extra = restPhrase(lemma);
  const modal = MODALS[verb];
  const rows = [];

  if (modal) {
    for (const { person } of PERSONS) {
      rows.push({ form: `${modal.present}${extra}`, grammar: 'present', person, tense: 'şimdi' });
    }
    for (const { person } of PERSONS) {
      rows.push({ form: `${modal.past}${extra}`, grammar: 'past', person, tense: 'di' });
    }
    for (const { person } of PERSONS) {
      rows.push({ form: `${modal.future}${extra}`, grammar: 'future', person, tense: 'gelecek' });
    }
    return rows;
  }

  for (const { person, key } of PERSONS) {
    rows.push({
      form: `${presentForm(verb, key)}${extra}`,
      grammar: 'present',
      person,
      tense: 'şimdi',
    });
  }
  for (const { person, key } of PERSONS) {
    rows.push({
      form: `${pastForm(verb, key)}${extra}`,
      grammar: 'past',
      person,
      tense: 'di',
    });
  }
  for (const { person } of PERSONS) {
    rows.push({
      form: `will ${verb}${extra}`,
      grammar: 'future',
      person,
      tense: 'gelecek',
    });
  }
  return rows;
}

export function englishPresentI(lemma) {
  const verb = baseVerb(lemma);
  const extra = restPhrase(lemma);
  if (verb === 'be') return `am${extra}`;
  return `${verb}${extra}`;
}
