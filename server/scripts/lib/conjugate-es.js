const PERSONS = [
  { person: 'yo', idx: 0 },
  { person: 'tú', idx: 1 },
  { person: 'él/ella', idx: 2 },
  { person: 'nosotros', idx: 3 },
  { person: 'vosotros', idx: 4 },
  { person: 'ellos', idx: 5 },
];

const GUSTAR_TYPE = new Set(['gustar', 'encantar', 'interesar', 'doler', 'quedar', 'importar', 'parecer']);

const IRREGULAR = {
  ser: {
    present: ['soy', 'eres', 'es', 'somos', 'sois', 'son'],
    preterite: ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'],
    future: ['seré', 'serás', 'será', 'seremos', 'seréis', 'serán'],
  },
  ir: {
    present: ['voy', 'vas', 'va', 'vamos', 'vais', 'van'],
    preterite: ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'],
    future: ['iré', 'irás', 'irá', 'iremos', 'iréis', 'irán'],
  },
  estar: {
    present: ['estoy', 'estás', 'está', 'estamos', 'estáis', 'están'],
    preterite: ['estuve', 'estuviste', 'estuvo', 'estuvimos', 'estuvisteis', 'estuvieron'],
    future: ['estaré', 'estarás', 'estará', 'estaremos', 'estaréis', 'estarán'],
  },
  haber: {
    present: ['he', 'has', 'ha', 'hemos', 'habéis', 'han'],
    preterite: ['hube', 'hubiste', 'hubo', 'hubimos', 'hubisteis', 'hubieron'],
    future: ['habré', 'habrás', 'habrá', 'habremos', 'habréis', 'habrán'],
  },
  tener: {
    present: ['tengo', 'tienes', 'tiene', 'tenemos', 'tenéis', 'tienen'],
    preterite: ['tuve', 'tuviste', 'tuvo', 'tuvimos', 'tuvisteis', 'tuvieron'],
    future: ['tendré', 'tendrás', 'tendrá', 'tendremos', 'tendréis', 'tendrán'],
  },
  hacer: {
    present: ['hago', 'haces', 'hace', 'hacemos', 'hacéis', 'hacen'],
    preterite: ['hice', 'hiciste', 'hizo', 'hicimos', 'hicisteis', 'hicieron'],
    future: ['haré', 'harás', 'hará', 'haremos', 'haréis', 'harán'],
  },
  decir: {
    present: ['digo', 'dices', 'dice', 'decimos', 'decís', 'dicen'],
    preterite: ['dije', 'dijiste', 'dijo', 'dijimos', 'dijisteis', 'dijeron'],
    future: ['diré', 'dirás', 'dirá', 'diremos', 'diréis', 'dirán'],
  },
  poder: {
    present: ['puedo', 'puedes', 'puede', 'podemos', 'podéis', 'pueden'],
    preterite: ['pude', 'pudiste', 'pudo', 'pudimos', 'pudisteis', 'pudieron'],
    future: ['podré', 'podrás', 'podrá', 'podremos', 'podréis', 'podrán'],
  },
  querer: {
    present: ['quiero', 'quieres', 'quiere', 'queremos', 'queréis', 'quieren'],
    preterite: ['quise', 'quisiste', 'quiso', 'quisimos', 'quisisteis', 'quisieron'],
    future: ['querré', 'querrás', 'querrá', 'querremos', 'querréis', 'querrán'],
  },
  venir: {
    present: ['vengo', 'vienes', 'viene', 'venimos', 'venís', 'vienen'],
    preterite: ['vine', 'viniste', 'vino', 'vinimos', 'vinisteis', 'vinieron'],
    future: ['vendré', 'vendrás', 'vendrá', 'vendremos', 'vendréis', 'vendrán'],
  },
  poner: {
    present: ['pongo', 'pones', 'pone', 'ponemos', 'ponéis', 'ponen'],
    preterite: ['puse', 'pusiste', 'puso', 'pusimos', 'pusisteis', 'pusieron'],
    future: ['pondré', 'pondrás', 'pondrá', 'pondremos', 'pondréis', 'pondrán'],
  },
  ver: {
    present: ['veo', 'ves', 've', 'vemos', 'veis', 'ven'],
    preterite: ['vi', 'viste', 'vio', 'vimos', 'visteis', 'vieron'],
    future: ['veré', 'verás', 'verá', 'veremos', 'veréis', 'verán'],
  },
  dar: {
    present: ['doy', 'das', 'da', 'damos', 'dais', 'dan'],
    preterite: ['di', 'diste', 'dio', 'dimos', 'disteis', 'dieron'],
    future: ['daré', 'darás', 'dará', 'daremos', 'daréis', 'darán'],
  },
  saber: {
    present: ['sé', 'sabes', 'sabe', 'sabemos', 'sabéis', 'saben'],
    preterite: ['supe', 'supiste', 'supo', 'supimos', 'supisteis', 'supieron'],
    future: ['sabré', 'sabrás', 'sabrá', 'sabremos', 'sabréis', 'sabrán'],
  },
  salir: {
    present: ['salgo', 'sales', 'sale', 'salimos', 'salís', 'salen'],
    preterite: ['salí', 'saliste', 'salió', 'salimos', 'salisteis', 'salieron'],
    future: ['saldré', 'saldrás', 'saldrá', 'saldremos', 'saldréis', 'saldrán'],
  },
  traer: {
    present: ['traigo', 'traes', 'trae', 'traemos', 'traéis', 'traen'],
    preterite: ['traje', 'trajiste', 'trajo', 'trajimos', 'trajisteis', 'trajeron'],
    future: ['traeré', 'traerás', 'traerá', 'traeremos', 'traeréis', 'traerán'],
  },
  caer: {
    present: ['caigo', 'caes', 'cae', 'caemos', 'caéis', 'caen'],
    preterite: ['caí', 'caíste', 'cayó', 'caímos', 'caísteis', 'cayeron'],
    future: ['caeré', 'caerás', 'caerá', 'caeremos', 'caeréis', 'caerán'],
  },
  oír: {
    present: ['oigo', 'oyes', 'oye', 'oímos', 'oís', 'oyen'],
    preterite: ['oí', 'oíste', 'oyó', 'oímos', 'oísteis', 'oyeron'],
    future: ['oiré', 'oirás', 'oirá', 'oiremos', 'oiréis', 'oirán'],
  },
  valer: {
    present: ['valgo', 'vales', 'vale', 'valemos', 'valéis', 'valen'],
    preterite: ['valí', 'valiste', 'valió', 'valimos', 'valisteis', 'valieron'],
    future: ['valdré', 'valdrás', 'valdrá', 'valdremos', 'valdréis', 'valdrán'],
  },
  caber: {
    present: ['quepo', 'cabes', 'cabe', 'cabemos', 'cabéis', 'caben'],
    preterite: ['cupe', 'cupiste', 'cupo', 'cupimos', 'cupisteis', 'cupieron'],
    future: ['cabré', 'cabrás', 'cabrá', 'cabremos', 'cabréis', 'cabrán'],
  },
  andar: {
    present: ['ando', 'andas', 'anda', 'andamos', 'andáis', 'andan'],
    preterite: ['anduve', 'anduviste', 'anduvo', 'anduvimos', 'anduvisteis', 'anduvieron'],
    future: ['andaré', 'andarás', 'andará', 'andaremos', 'andaréis', 'andarán'],
  },
};

const STEM_IE = new Set([
  'cerrar', 'empezar', 'comenzar', 'pensar', 'perder', 'entender', 'querer', 'sentar',
  'despertar', 'nevar', 'calentar', 'negar', 'acertar', 'confesar', 'recomendar',
  'sentir', 'preferir', 'mentir', 'herir', 'advertir', 'convertir', 'divertir',
]);
const STEM_UE = new Set([
  'poder', 'volver', 'encontrar', 'costar', 'recordar', 'contar', 'mostrar',
  'almorzar', 'soñar', 'volar', 'probar', 'acostar', 'doler', 'llover', 'mover',
  'soler', 'resolver', 'devolver', 'jugar', 'morir', 'dormir',
]);
const STEM_I = new Set([
  'pedir', 'servir', 'repetir', 'seguir', 'conseguir', 'reír', 'sonreír',
  'competir', 'medir', 'vestir', 'elegir', 'freír',
]);
const GO_YO = {
  hacer: 'hago',
  poner: 'pongo',
  salir: 'salgo',
  tener: 'tengo',
  venir: 'vengo',
  valer: 'valgo',
  caer: 'caigo',
  traer: 'traigo',
  oír: 'oigo',
};
const ZC_YO = new Set(['conocer', 'traducir', 'conducir', 'producir', 'aparecer', 'ofrecer', 'parecer', 'nacer', 'crecer', 'agradecer']);

function splitLemma(lemma) {
  const raw = lemma.toLowerCase().trim();
  const reflexive = raw.endsWith('se') && !['cose', 'pase', 'base'].includes(raw);
  const core = reflexive ? raw.slice(0, -2) : raw;
  const parts = core.split(/\s+/);
  return { verb: parts[0], extra: parts.slice(1).join(' '), reflexive };
}

function stemChangePresent(verb, stem, ending) {
  const vowels = 'aeiouáéíóú';
  let i = stem.length - 1;
  while (i >= 0 && !vowels.includes(stem[i])) i--;
  if (i < 0) return stem;
  if (STEM_UE.has(verb) && verb === 'jugar') return stem.replace('u', 'ue');
  if (STEM_UE.has(verb) && (stem[i] === 'o' || stem[i] === 'u')) {
    return stem.slice(0, i) + 'ue' + stem.slice(i + 1);
  }
  if ((STEM_IE.has(verb) || STEM_I.has(verb)) && stem[i] === 'e') {
    const repl = STEM_I.has(verb) ? 'i' : 'ie';
    return stem.slice(0, i) + repl + stem.slice(i + 1);
  }
  return stem;
}

function endings(kind) {
  if (kind === 'ar') {
    return {
      present: ['o', 'as', 'a', 'amos', 'áis', 'an'],
      preterite: ['é', 'aste', 'ó', 'amos', 'asteis', 'aron'],
      future: ['aré', 'arás', 'ará', 'aremos', 'aréis', 'arán'],
    };
  }
  if (kind === 'er') {
    return {
      present: ['o', 'es', 'e', 'emos', 'éis', 'en'],
      preterite: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'],
      future: ['eré', 'erás', 'erá', 'eremos', 'eréis', 'erán'],
    };
  }
  return {
    present: ['o', 'es', 'e', 'imos', 'ís', 'en'],
    preterite: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'],
    future: ['iré', 'irás', 'irá', 'iremos', 'iréis', 'irán'],
  };
}

function kindOf(verb) {
  if (verb.endsWith('ar')) return 'ar';
  if (verb.endsWith('er')) return 'er';
  if (verb.endsWith('ir') || verb.endsWith('ír')) return 'ir';
  return 'ar';
}

function yoPresent(verb, stem, kind, e) {
  if (GO_YO[verb]) return GO_YO[verb];
  if (ZC_YO.has(verb)) return `${stem}zco`;
  if (verb === 'seguir' || verb === 'conseguir') return verb === 'seguir' ? 'sigo' : 'consigo';
  if (verb === 'elegir') return 'elijo';
  if (STEM_IE.has(verb) || STEM_UE.has(verb) || STEM_I.has(verb)) {
    return stemChangePresent(verb, stem, kind) + e.present[0];
  }
  return stem + e.present[0];
}

function conjugateTense(verb, tense) {
  if (IRREGULAR[verb]?.[tense]) return IRREGULAR[verb][tense];
  const kind = kindOf(verb);
  const stem = verb.replace(/[aeií]r$/, '');
  const e = endings(kind);

  if (tense === 'future') {
    const irrFuture = IRREGULAR[verb];
    if (irrFuture) return irrFuture.future;
    return e.future.map((suf) => verb.replace(/ír$/, 'ir') + suf.replace(/^[aei]/, ''));
    // future is infinitive + ending: hablaré. endings already include ar/er/ir.
  }

  return [0, 1, 2, 3, 4, 5].map((i) => {
    if (tense === 'present') {
      if (i === 0) return yoPresent(verb, stem, kind, e);
      if (i === 3) return stem + e.present[3];
      if (i === 4) return stem + e.present[4];
      if (STEM_IE.has(verb) || STEM_UE.has(verb) || STEM_I.has(verb)) {
        return stemChangePresent(verb, stem, kind) + e.present[i];
      }
      if (verb === 'seguir' || verb === 'conseguir') {
        const s = verb === 'seguir' ? 'sig' : 'consig';
        return s + e.present[i];
      }
      return stem + e.present[i];
    }
    // preterite
    if (['decir', 'traer'].includes(verb) && IRREGULAR[verb]) return IRREGULAR[verb].preterite[i];
    if (ZC_YO.has(verb) && verb.endsWith('cir')) {
      const pretStem = stem.replace(/c$/, 'j');
      const pret = ['e', 'iste', 'o', 'imos', 'isteis', 'eron'];
      return pretStem + pret[i];
    }
    let pretStem = stem;
    if ((verb === 'dormir' || verb === 'morir' || STEM_I.has(verb)) && (i === 2 || i === 5)) {
      pretStem = stemChangePresent(verb === 'pedir' ? 'pedir' : verb, stem, kind);
      if (verb === 'dormir') pretStem = 'durm';
      if (verb === 'morir') pretStem = 'mur';
      if (STEM_I.has(verb)) pretStem = stemChangePresent(verb, stem, 'ir');
    }
    if (verb === 'leer' || verb === 'creer' || verb === 'oír' || verb === 'caer') {
      const irr = ['í', 'íste', 'yó', 'ímos', 'ísteis', 'yeron'];
      if (verb === 'oír') return ['oí', 'oíste', 'oyó', 'oímos', 'oísteis', 'oyeron'][i];
      if (verb === 'caer') return IRREGULAR.caer.preterite[i];
      return stem + irr[i].replace('í', kind === 'er' ? 'í' : 'í');
    }
    if ((verb.endsWith('car') || verb.endsWith('gar') || verb.endsWith('zar')) && i === 0) {
      if (verb.endsWith('car')) return stem.slice(0, -1) + 'qué';
      if (verb.endsWith('gar')) return stem + 'ué';
      if (verb.endsWith('zar')) return stem.slice(0, -1) + 'cé';
    }
    return pretStem + e.preterite[i];
  });
}

function futureForms(verb) {
  if (IRREGULAR[verb]) return IRREGULAR[verb].future;
  const base = verb.replace(/ír$/, 'ir');
  const suf = ['é', 'ás', 'á', 'emos', 'éis', 'án'];
  return suf.map((s) => base + s);
}

function withPronoun(form, reflexive, idx) {
  if (!reflexive) return form;
  const clitics = ['me', 'te', 'se', 'nos', 'os', 'se'];
  return `${clitics[idx]} ${form}`;
}

export function conjugateSpanish(lemma) {
  const { verb, extra, reflexive } = splitLemma(lemma);
  const suffix = extra ? ` ${extra}` : '';

  if (GUSTAR_TYPE.has(verb)) {
    const third = verb.endsWith('ar') ? verb.slice(0, -2) + 'a' : verb.slice(0, -2) + 'e';
    const thirdPl = third + 'n';
    const clitics = ['me', 'te', 'le', 'nos', 'os', 'les'];
    const pret = verb.endsWith('ar') ? verb.slice(0, -2) + 'ó' : verb.slice(0, -2) + 'ió';
    const pretPl = verb.endsWith('ar') ? verb.slice(0, -2) + 'aron' : verb.slice(0, -2) + 'ieron';
    const fut = verb.replace(/ír$/, 'ir') + 'á';
    const futPl = verb.replace(/ír$/, 'ir') + 'án';
    const rows = [];
    for (let i = 0; i < PERSONS.length; i++) {
      rows.push({ form: `${clitics[i]} ${third}${suffix}`, grammar: 'present', person: PERSONS[i].person, tense: 'şimdi' });
    }
    for (let i = 0; i < PERSONS.length; i++) {
      rows.push({ form: `${clitics[i]} ${pret}${suffix}`, grammar: 'past', person: PERSONS[i].person, tense: 'di' });
    }
    for (let i = 0; i < PERSONS.length; i++) {
      rows.push({ form: `${clitics[i]} ${fut}${suffix}`, grammar: 'future', person: PERSONS[i].person, tense: 'gelecek' });
    }
    // Keep plural 3rd as extra cue on ellos row only — already les + singular; acceptable for swipe cards.
    rows[5].form = `les ${thirdPl}${suffix}`;
    rows[11].form = `les ${pretPl}${suffix}`;
    rows[17].form = `les ${futPl}${suffix}`;
    return rows;
  }
  const present = conjugateTense(verb, 'present');
  const preterite = conjugateTense(verb, 'preterite');
  const future = futureForms(verb);
  const rows = [];
  for (const { person, idx } of PERSONS) {
    rows.push({
      form: `${withPronoun(present[idx], reflexive, idx)}${suffix}`,
      grammar: 'present',
      person,
      tense: 'şimdi',
    });
  }
  for (const { person, idx } of PERSONS) {
    rows.push({
      form: `${withPronoun(preterite[idx], reflexive, idx)}${suffix}`,
      grammar: 'past',
      person,
      tense: 'di',
    });
  }
  for (const { person, idx } of PERSONS) {
    rows.push({
      form: `${withPronoun(future[idx], reflexive, idx)}${suffix}`,
      grammar: 'future',
      person,
      tense: 'gelecek',
    });
  }
  return rows;
}

export function spanishPresentYo(lemma) {
  const { verb, extra, reflexive } = splitLemma(lemma);
  const present = conjugateTense(verb, 'present');
  const suffix = extra ? ` ${extra}` : '';
  return `${withPronoun(present[0], reflexive, 0)}${suffix}`;
}
