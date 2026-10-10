/**
 * Turkish → Russian keyword associations.
 * Phonetic line uses textbook Cyrillic; the hook is a concrete Russian word
 * that shares the stressed syllable, and the image ties that hook to the gloss.
 */

const VOWELS_LAT = 'aeıioöuüâîû';
const CYR_VOWELS = 'аеёиоуыэюя';
const CYR_CONS = 'бвгджзйклмнпрстфхцчшщ';

const CYR = {
  a: 'а', b: 'б', c: 'дж', ç: 'ч', d: 'д', e: 'е', f: 'ф', g: 'г', ğ: '',
  h: 'х', ı: 'ы', i: 'и', j: 'ж', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о',
  ö: 'ё', p: 'п', r: 'р', s: 'с', ş: 'ш', t: 'т', u: 'у', ü: 'ю', v: 'в',
  y: 'й', z: 'з', â: 'а', î: 'и', û: 'у',
};

const DIGRAPHS = [
  ['yö', 'йё'], ['yü', 'йю'], ['yı', 'йы'], ['yi', 'йи'],
  ['yo', 'йо'], ['yu', 'ю'], ['ya', 'я'], ['ye', 'е'],
];

/** Same key as import-vocabulary: plain toLowerCase, not Turkish locale. */
export function normalizeKey(lemma) {
  return String(lemma || '').toLowerCase().trim();
}

export function phoneticSource(lemma) {
  let s = String(lemma || '').trim();
  s = s.replace(/\(.*?\)/g, ' ');
  s = s.split('/')[0];
  s = s.replace(/[.?!,;:«»"'’]/g, ' ');
  s = s.replace(/\u0307/g, '');
  s = s.replace(/İ/g, 'i').replace(/I/g, 'ı');
  s = s.toLocaleLowerCase('tr');
  s = s.replace(/[^a-zçğıöşüâîû\s-]/g, ' ');
  s = s.replace(/-/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

const LEXICON = [...new Set(`
кит кот тип торт тапок гель глаз гора гитара гусь гараж газ галстук гайка тема пара
бардак баба баян бабушка койка чин доктор
ева евро ель енот еда ерш
суп сумка сухарь
адрес азбука арка арбуз акула аист ангел антенна
дача душ дыня дым дом дорога доктор дверь джем джинсы джунгли дождь джаз пиджак
ложка лампа лимон лес лето лев луна лук лак лапа лиса лист лодка локон
мак мак маска майка масло мама море мост мох мяч мёд мёд метла метр
нос нож нора нота нитка насос
окно окунь очки очаг осёл орёл
парк палка папка паук пень пенёк пчела плов плот
рак рука река роза рот рис ремень редис
сок сом сова супница сыр сыч
чай чашка чемодан чулок чехол часы чум
шар шкаф шапка каша шум шоколад штаны шея мышь
щит щука цирк цифра
хлеб халат хвост хром
юла юбка якорь яма ящик ягода
банка бочка ботинок бутылка барабан банан батон бегемот берёза билет блин
вагон ваза ветка вилка вишня волк
гриб груша грабли гвоздь гном горшок
зонт зеркало замок заяц звезда змея зола
игла икра индюк искра
кабан камень капкан капуста карета каска катер кепка кедр кисть клапан
кнопка ковёр ковш козёл кофе кофейня кольцо комар коробка коса костёр котлета
кошка кружка крыша кран крот куст кушетка кукла кухня
ласточка лестница линейка лопата лось
метеор метель мешок миска монета молоток морковь мороженое мост
насос невод ниша
облако обои обруч огурец одеяло олень осёл
пакет пальто пенал перо перчатка пила пирог питон платок плед плот
подушка подкова пожар полка помпон пончик портфель почта пряник
ракета рамка решётка рояль рубашка руль рюкзак
салат сапоги сарай сахар свеча свёкла седло сетка скала скамейка
скрепка слон смола сокол солнце стакан стая стена стул сундук
таз таз тапки такси танк тарелка телега тень тесто тетрадь тигр топор торт
трава трап трос туфля тыква
утка утюг учебник
флаг фонарь фуражка
хобот холм
цепь цирк
шайба шарф шкатулка шлем шнур штопор шуба
щётка щи щит
яблоко якорёк
ведро веник верёвка весло ветер винт ворона ворота
гвоздика гиря
диван диск
жаба журнал
зебра зонт
камыш каюта кеды кирпич клещ клык кнопка ковёр кожа кокос колба комета
компас конь конверт корзина корка костёр краб кран крем кресло кроссовки
кувшин куст
лёд лента леска лом лыжи
магнит малина матрёшка медаль мел мелкое молоко мост муха
нитка
палатка палач панда паром парус песок пианино пиджак плита плот пломба
повар поднос полка подушка порошок портфель посуда пуговица пузырь
пыль пылесос
рама редис робот рогатка ручка
самовар самолёт сапог свёрток сетка сито скатерть сковорода скрипка
слон сова соска стадо стакан стержень стрела струна
табурет таз танк тарантас телевизор термос тигр трамвай тумба турка
улитка ухо
факел флейта фонарь футболка
хлам хомяк
цемент цепь
чайник чайка чёлка череп чеснок чиж
шалаш шарик швабра шелк шина шкаф шланг шприц штанга штора шуруп
щетка
эскимо эхо
юрта
блог блок блин блины брошь брус бубен булава бусы бык
вата вафля весло вилы вождь волна
гром гроза груз губка
дождь дрозд дрожжи дудка дыра
жакет жёлудь жилет жук
забор замок зефир значок зонд
кадр калач канал капюшон карман карта каток катушка каша кашель
кекс килька кино киоск кирка кисть клад кларнет клей клин клинок
клубника ключ клякса книга? 
колбаса колесо колокол кольчуга коньки копна копыто корабль корень корыто
котёл кофемолка краска креветка кровать крокодил круг крупа крыло крышка
кубик кувшин кулак курица курок куртка
лавка ладонь лассо лезвие лейка лента леопард лиана лифт лиса локон ломтик
лужа лупа
малина мангал мандарин марка матч матрёшка мелок метка мех механик
миксер мина миска монета моток муравей мыло мыс мышь мясо
напёрсток невод носок ножницы
облако обруч овраг огонь огурец одуванчик окно окурок олень орех оса остров
пакля палатка панама паук педаль пелена пельмень перец персик петух печать
пион пирог пистон пластилин плащ плёнка плечо пломбир плот пляж
побег поднос подкова полено полотенце помпа пончик попугай порог поросёнок
портфель почка пояс пряжка пуговица пуля пух пушка
радиола ракушка ранец редька ремень рис робот розетка рубанок рупор
рябина
сабля сазан сайка сало санки сапог саранча сахарница свёкла сейф селёдка
серп сетка скалка скат скворец скрепка скрипка слон смола сова сокол
солнце соска спица спичка стадо стакан стамеска ствол стекло стена
ступка сугроб сундук сухарь
табло табурет таз тайга тапок таран тарелка творог телега тент тень
тепло тесак тесто тетрадь тигр ток толпа томат топор тормоз торт трава
трактор трап треска трос труба тыква тюльпан
удав узда уксус улитка утюг ухо утка
факел фанера фартук фарш флаг флакон флейта фонарь фуражка футляр
халат хвост хлам хобот холм хомяк хрен
цапля цепь циркуль
чайник чайка чёлка череп чеснок чиж чучело чулок
шайба шалаш шарф швабра шёлк шина шишка шкаф шлем шнур штопор шуба шуруп
щетка щит щука
эскимо
яблоко якорь яма яхта ящик
`.replace(/книга\?/g, '').split(/\s+/).map((w) => w.trim().toLowerCase()).filter((w) => w.length >= 3))];

const CURATED = {
  ağaç: {
    kind: 'keyword',
    phonetic: 'аа́ч',
    hooks: ['дача'],
    image: 'Дача стоит прямо возле высокого дерева.',
  },
  kitap: {
    kind: 'keyword',
    phonetic: 'кита́п',
    hooks: ['кит'],
    image: 'Кит читает толстую книгу у окна.',
  },
  ütü: {
    kind: 'cognate',
    phonetic: 'ютю́',
    hooks: ['утюг'],
    image: '',
  },
  asya: {
    kind: 'cognate',
    phonetic: 'ася́',
    hooks: ['Азия'],
    image: '',
  },
};

/** Last-resort hooks whose consonants start the stressed cluster. */
const PAIR_HOOKS = {
  йл: 'кайло', йз: 'кайзер', йф: 'кайф', йс: 'рейс', йк: 'лайк', йр: 'майор',
  нн: 'анна', нк: 'анкета', нз: 'низина', нм: 'нимб', нп: 'конопля',
  лш: 'леший', лл: 'аллея', лр: 'ларь',
  хн: 'хна', хч: 'хач', хс: 'хасан', хз: 'хазар',
  йн: 'январь',
  вп: 'выпь', вч: 'овчарка', вк: 'вокзал',
  фс: 'фаска',
  бх: 'бахрома', бй: 'баян', бф: 'буфет', бш: 'башня', бп: 'субподряд',
  тх: 'тахта', тш: 'тушь', тж: 'этаж',
  мз: 'мазут', мв: 'амвон', мс: 'мясо',
  дз: 'дзюдо', дш: 'душник', дй: 'дайкон', дм: 'дым', дс: 'диск',
  нл: 'ноль', кл: 'клей', рк: 'арка', тч: 'точка',
  зк: 'сказка',
  гч: 'мягче',
  кч: 'качка',
  чт: 'мачта', чф: 'чифирь',
  рр: 'терраса',
};

const USAGE = {
  'affedersiniz.': 'Говорят, когда задевают человека и просят извинить.',
  'bol şanslar.': 'Так желают удачи перед важным делом.',
  'çok yaşa.': 'Так говорят человеку, который чихнул.',
  'geçmiş olsun.': 'Так желают скорее поправиться после болезни.',
  'görüşürüz / görüşmek üzere.': 'Так прощаются, когда ещё увидятся.',
  'güle güle.': 'Так говорят тому, кто уже уходит.',
  'günaydın.': 'Так здороваются утром при встрече.',
  'hoş bulduk.': 'Так отвечают на слова добро пожаловать.',
  'hoş geldin.': 'Так встречают гостя у двери дома.',
  'hoşça kal.': 'Так прощаются с тем, кто остаётся.',
  'lütfen.': 'Ставят в просьбу, когда говорят пожалуйста.',
  'lütfen': 'Ставят в просьбу, когда говорят пожалуйста.',
  'merhaba.': 'Так здороваются при встрече днём.',
  'özür dilerim.': 'Так просят прощения за свою ошибку.',
  'rica ederim.': 'Так отвечают, когда говорят спасибо.',
  'tamam.': 'Так соглашаются: хорошо, ладно, окей.',
  'tebrikler.': 'Так поздравляют человека с удачей.',
  'üzgünüm.': 'Так говорят, когда человеку жаль.',
  'görüşürüz.': 'Так заканчивают разговор: увидимся.',
  'görüşmek üzere.': 'Так обещают скорую новую встречу.',
  'bol bol': 'Ставят перед словом, когда чего-то очень много.',
  'inşallah': 'Так говорят о надежде: дай бог, надеюсь.',
};

function syllablesLatin(word) {
  const chars = [...word];
  const parts = [];
  let i = 0;
  const isV = (ch) => VOWELS_LAT.includes(ch);
  while (i < chars.length) {
    let onset = '';
    while (i < chars.length && !isV(chars[i])) onset += chars[i++];
    if (i >= chars.length) {
      if (parts.length) parts[parts.length - 1] += onset;
      else if (onset) parts.push(onset);
      break;
    }
    const nucleus = chars[i++];
    let j = i;
    while (j < chars.length && !isV(chars[j])) j++;
    const cluster = chars.slice(i, j).join('');
    const hasNextVowel = j < chars.length;
    let coda = '';
    if (!hasNextVowel) {
      coda = cluster;
      i = j;
    } else if (!onset && cluster.length >= 1) {
      coda = cluster[0];
      i += 1;
    } else if (cluster.length >= 2) {
      coda = cluster.slice(0, -1);
      i += coda.length;
    }
    parts.push(onset + nucleus + coda);
  }
  return parts.filter(Boolean);
}

function syllableToCyr(syl) {
  let out = '';
  for (let i = 0; i < syl.length; i++) {
    const two = syl.slice(i, i + 2);
    const hit = DIGRAPHS.find(([lat]) => two === lat);
    if (hit) {
      out += hit[1];
      i += 1;
      continue;
    }
    const mapped = CYR[syl[i]];
    if (mapped) out += mapped;
  }
  return out;
}

function markStress(text) {
  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    if (CYR_VOWELS.includes(chars[i])) {
      chars.splice(i + 1, 0, '\u0301');
      return chars.join('');
    }
  }
  return text;
}

function consOf(text) {
  return [...String(text || '')].filter((ch) => CYR_CONS.includes(ch.toLowerCase()));
}

function vowelsOf(text) {
  return [...String(text || '').toLowerCase().replace(/\u0301/g, '')].filter((ch) => CYR_VOWELS.includes(ch));
}

function isVerbType(type) {
  const t = String(type || '').toUpperCase();
  return t.includes('FİİL') || t.includes('FIIL');
}

function isPhraseType(type) {
  return String(type || '').toUpperCase().includes('KALIP');
}

export function analyze(lemma, verb) {
  const source = phoneticSource(lemma);
  const words = source.split(' ').filter(Boolean);
  if (!words.length) return null;
  const items = [];
  words.forEach((word, wordIndex) => {
    for (const syl of syllablesLatin(word)) {
      items.push({ lat: syl, cyr: syllableToCyr(syl), wordIndex });
    }
  });
  if (!items.length) return null;

  let anchor = items.length - 1;
  const lastWord = words[words.length - 1];
  if (verb && words.length > 1 && /^(etmek|yapmak|olmak|vermek|eylemek)$/.test(lastWord)) {
    const content = items.filter((it) => it.wordIndex < words.length - 1);
    if (content.length) anchor = items.indexOf(content[content.length - 1]);
  } else if (verb && items.length >= 2 && /^(mak|mek)$/.test(items[items.length - 1].lat)) {
    anchor = items.length - 2;
  }

  let consPos = 0;
  const ranges = [];
  let phonetic = '';
  let plain = '';
  let currentWord = -1;
  for (let i = 0; i < items.length; i++) {
    if (items[i].wordIndex !== currentWord) {
      if (currentWord !== -1) {
        phonetic += ' ';
        plain += ' ';
      }
      currentWord = items[i].wordIndex;
    }
    const n = consOf(items[i].cyr).length;
    ranges.push([consPos, consPos + n]);
    consPos += n;
    plain += items[i].cyr;
    phonetic += i === anchor ? markStress(items[i].cyr) : items[i].cyr;
  }
  const range = ranges[anchor] || [0, consPos];
  let anchorStart = range[0];
  const anchorEnd = range[1];
  if (anchorEnd - anchorStart < 2 && anchor > 0) anchorStart = ranges[anchor - 1][0];
  return {
    phonetic,
    plain,
    anchorCyr: items[anchor].cyr,
    anchorStart,
    anchorEnd,
    consonants: consPos,
  };
}

export function transcribe(lemma, { verb = false } = {}) {
  return analyze(lemma, verb)?.phonetic || '';
}

function firstSense(translation) {
  return String(translation || '')
    .split(',')[0]
    .replace(/\(.*?\)/g, '')
    .split('/')[0]
    .trim();
}

function rawTokens(translation) {
  const parts = String(translation || '').split(/[,;/]/);
  const tokens = [];
  for (const part of parts) {
    const cleaned = part.replace(/\(.*?\)/g, '').trim();
    for (const piece of cleaned.split(/\s+/)) {
      const display = piece.replace(/[^а-яёА-ЯЁ-]/g, '');
      if (display) tokens.push({ display, lower: display.toLowerCase() });
    }
  }
  return tokens;
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

function cognateCons(text) {
  return consOf(text).filter((ch) => ch !== 'й').join('');
}

function isCognate(phonetic, gloss) {
  const fullA = consOf(phonetic).join('');
  const fullB = consOf(gloss).join('');
  const a = fullA.replace(/й/g, '');
  const b = fullB.replace(/й/g, '');
  if (fullA.length >= 2 && fullA === fullB) return true;
  if (a.length >= 2 && a === b) return true;
  if (a.startsWith(b) || b.startsWith(a)) {
    const shorter = Math.min(a.length, b.length);
    const longer = Math.max(a.length, b.length);
    if (shorter >= 3 && shorter / longer >= 0.6) return true;
  }
  if (Math.min(a.length, b.length) < 3) return false;
  const dist = levenshtein(a, b);
  return dist / Math.max(a.length, b.length) <= 0.34;
}

function findCognate(phonetic, translation) {
  const parts = String(phonetic || '').split(/\s+/).filter(Boolean);
  const sources = [phonetic, ...parts];
  let best = null;
  for (const source of sources) {
    for (const token of rawTokens(translation)) {
      if (token.lower.length < 3) continue;
      if (!isCognate(source, token.lower)) continue;
      const dist = levenshtein(cognateCons(source), cognateCons(token.lower));
      if (!best || dist < best.dist || (dist === best.dist && token.display.length < best.token.display.length)) {
        best = { token, dist };
      }
    }
  }
  return best?.token.display || null;
}

function glossSet(translation) {
  return new Set(rawTokens(translation).map((t) => t.lower));
}

function vowelPrefix(hook, phonetic) {
  const hv = vowelsOf(hook);
  const pv = vowelsOf(phonetic);
  let n = 0;
  while (n < hv.length && n < pv.length && hv[n] === pv[n]) n += 1;
  return n;
}

function inAnchorOverlap(run, a0, a1) {
  const start = Math.max(run.start, a0);
  const end = Math.min(run.start + run.length, a1);
  return Math.max(0, end - start);
}

function longestRun(hookCons, phonCons, a0, a1) {
  let best = null;
  // The hook has to start with the shared sound, not hide it in the middle.
  for (let j = 0; j < phonCons.length; j++) {
    let k = 0;
    while (hookCons[k] && hookCons[k] === phonCons[j + k]) k += 1;
    if (k < 2) continue;
    const start = j;
    const end = j + k;
    if (end <= a0 || start >= a1) continue;
    if (!best || k > best.length || (k === best.length && start < best.start)) {
      best = { length: k, start };
    }
  }
  return best;
}

function isBetter(next, prev) {
  for (let i = 0; i < next.score.length; i++) {
    if (next.score[i] !== prev.score[i]) return next.score[i] > prev.score[i];
  }
  return next.word.localeCompare(prev.word, 'ru') < 0;
}

function pickHook(analysis, translation) {
  const plain = analysis.plain.replace(/\s/g, '');
  const blocked = glossSet(translation);
  if (analysis.consonants < 2) {
    const hits = LEXICON.filter((w) => w.startsWith(plain) && w.length > plain.length && !blocked.has(w));
    hits.sort((a, b) => a.length - b.length || a.localeCompare(b, 'ru'));
    return hits[0] || null;
  }
  const phonCons = consOf(plain).join('');
  let best = null;
  for (const word of LEXICON) {
    if (word.length < 3 || blocked.has(word)) continue;
    const hookCons = consOf(word).join('');
    if (hookCons.length < 2) continue;
    const run = longestRun(hookCons, phonCons, analysis.anchorStart, analysis.anchorEnd);
    if (!run) continue;
    const coversAll = run.start === 0 && run.length === phonCons.length;
    const startsAtAnchor = run.start === analysis.anchorStart;
    if (!coversAll && !startsAtAnchor) continue;
    const extra = hookCons.length - run.length;
    if (extra > 2) continue;
    const candidate = {
      word,
      score: [
        inAnchorOverlap(run, analysis.anchorStart, analysis.anchorEnd),
        run.length,
        vowelPrefix(word, analysis.anchorCyr),
        -extra,
        -Math.abs(run.start - analysis.anchorStart),
        -word.length,
      ],
    };
    if (!best || isBetter(candidate, best)) best = candidate;
  }
  return best?.word || null;
}

const SHORT_HOOKS = {
  юч: 'ключ',
  ач: 'дача',
  ай: 'май',
  иш: 'шина',
  ич: 'чиж',
  ён: 'клён',
  яз: 'князь',
  боя: 'боярин',
  аыз: 'таз',
  ода: 'мода',
  ийи: 'иней',
  ашаы: 'каша',
  ешя: 'леший',
};

function fallbackHook(analysis, translation) {
  const compact = analysis.plain.replace(/\s/g, '').replace(/\u0301/g, '');
  const phonCons = consOf(compact).join('');
  const blocked = glossSet(translation);
  if (phonCons.length < 2) {
    const chosen = SHORT_HOOKS[compact] || SHORT_HOOKS[analysis.anchorCyr]
      || LEXICON.find((word) => !blocked.has(word) && shortHookOk(word, compact));
    return chosen && !blocked.has(chosen) ? chosen : null;
  }
  let pair = phonCons.slice(analysis.anchorStart, analysis.anchorStart + 2);
  if (pair.length < 2) pair = phonCons.slice(-2);
  const hook = PAIR_HOOKS[pair];
  if (!hook || blocked.has(hook)) return null;
  return hook;
}

function wordCount(s) {
  return String(s || '').trim().split(/\s+/).filter(Boolean).length;
}

function accusative(word) {
  if (/мя$/i.test(word)) return word;
  if (/ия$/i.test(word)) return `${word.slice(0, -1)}ю`;
  if (/а$/i.test(word)) return `${word.slice(0, -1)}у`;
  if (/я$/i.test(word)) return `${word.slice(0, -1)}ю`;
  return word;
}

function cap(word) {
  return word.charAt(0).toLocaleUpperCase('ru') + word.slice(1);
}

function buildImage(hook, translation, verb) {
  const sense = firstSense(translation);
  const head = sense.split(/\s+/)[0] || sense;
  const name = cap(hook);
  let image;
  if (verb) {
    image = `${name} прямо сейчас умеет ${sense}.`;
  } else if (/(ый|ий|ой|ая|ое|ые)$/i.test(head)) {
    image = `${name} сегодня выглядит ${sense}.`;
  } else if (!sense.includes(' ')) {
    image = `${name} держит ${accusative(sense)} в руках.`;
  } else {
    image = `${name} держит ${sense} в руках.`;
  }
  if (wordCount(image) > 14) image = `${name} держит ${sense}.`;
  if (wordCount(image) < 4) image = `${name} крепко держит ${sense} рядом.`;
  return image;
}

function escapeReg(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasWord(text, word) {
  const re = new RegExp(`(^|[^а-яё])${escapeReg(word)}([^а-яё]|$)`, 'i');
  return re.test(text);
}

function stemOf(word) {
  const w = String(word || '').toLowerCase();
  if (w.length <= 2) return w;
  if (/[аяоеёыиу]$/.test(w)) return w.slice(0, -1);
  return w;
}

function senseStem(translation) {
  const sense = firstSense(translation);
  const word = sense.split(/\s+/).find((w) => w.replace(/[^а-яё]/gi, '').length >= 3) || sense.split(/\s+/)[0] || '';
  return stemOf(word.replace(/[^а-яё]/gi, ''));
}

function glideCons(text) {
  let out = '';
  let prevVowel = true;
  for (const ch of [...String(text || '').toLowerCase().replace(/\u0301/g, '')]) {
    if (ch === ' ' || ch === '-') {
      prevVowel = true;
      continue;
    }
    if ('яюёе'.includes(ch)) {
      if (prevVowel) out += 'й';
      prevVowel = true;
      continue;
    }
    if (CYR_VOWELS.includes(ch)) {
      prevVowel = true;
      continue;
    }
    if (CYR_CONS.includes(ch)) {
      out += ch;
      prevVowel = false;
    }
  }
  return out;
}

function hasBigram(hookCons, phonCons) {
  if (hookCons.length < 2 || phonCons.length < 2) return false;
  for (let i = 0; i < hookCons.length - 1; i++) {
    if (phonCons.includes(hookCons.slice(i, i + 2))) return true;
  }
  return false;
}

function sharesBigram(hook, phonetic) {
  return hasBigram(consOf(hook).join(''), consOf(phonetic).join(''))
    || hasBigram(glideCons(hook), glideCons(phonetic));
}

function shortHookOk(hook, phonetic) {
  const p = phonetic.replace(/\u0301/g, '').replace(/\s/g, '').toLowerCase();
  const h = hook.toLowerCase();
  const pCons = consOf(p).join('');
  if (pCons.length >= 2) return false;
  const starts = h.startsWith(p);
  const limit = p.length + (starts ? 5 : 3);
  if (h.length > limit) return false;
  if (pCons && ![...pCons].every((ch) => consOf(h).includes(ch))) return false;
  const pv = vowelsOf(p);
  const hv = vowelsOf(h);
  if (pv.length && !pv.some((v) => hv.includes(v))) return false;
  return starts || p.startsWith(h) || pCons.length <= 1;
}

function usageEntry(translation, formula) {
  const sense = firstSense(translation);
  const image = formula || (sense
    ? `Так говорят, когда имеют в виду: ${sense}.`
    : 'Так говорят в бытовом разговоре.');
  return { kind: 'usage', phonetic: '', hooks: [], image };
}

function draftAssociation(word) {
  const key = normalizeKey(word.lemma);
  if (CURATED[key]) return { ...CURATED[key], hooks: [...CURATED[key].hooks] };
  if (USAGE[key] || isPhraseType(word.type)) return usageEntry(word.translation, USAGE[key]);

  const verb = isVerbType(word.type);
  const analysis = analyze(word.lemma, verb);
  if (!analysis?.plain) return null;

  const like = findCognate(analysis.plain, word.translation);
  if (like) {
    return { kind: 'cognate', phonetic: analysis.phonetic, hooks: [like], image: '' };
  }

  const hook = pickHook(analysis, word.translation) || fallbackHook(analysis, word.translation);
  if (!hook) return null;
  return {
    kind: 'keyword',
    phonetic: analysis.phonetic,
    hooks: [hook],
    image: buildImage(hook, word.translation, verb),
  };
}

export function validateAssociation(entry, word) {
  const errors = [];
  if (!entry || typeof entry !== 'object') return ['empty'];
  const kind = entry.kind;
  if (kind !== 'keyword' && kind !== 'cognate' && kind !== 'usage') errors.push('kind');
  const phonetic = String(entry.phonetic || '');
  const hooks = Array.isArray(entry.hooks) ? entry.hooks : [];
  const image = String(entry.image || '').trim();
  if (kind === 'usage') {
    if (!image) errors.push('image');
    if (image.length > 160) errors.push('image-length');
    if (/символиз|означает|представляет|ассоциац|воплоща/i.test(image)) errors.push('abstract');
    return errors;
  }
  if (kind === 'cognate') {
    if (hooks.length !== 1) errors.push('hooks');
    if (hooks[0] && !/^[а-яё-]+$/i.test(hooks[0])) errors.push('hook-script');
    if (image) errors.push('cognate-image');
    return errors;
  }
  if (hooks.length < 1 || hooks.length > 2) errors.push('hooks');
  const bare = phonetic.replace(/\u0301/g, '');
  if (!bare.trim() || !/^[а-яё\s-]+$/i.test(bare)) errors.push('phonetic');
  if (/[аеёиоуыэюя]/i.test(bare) && !phonetic.includes('\u0301')) errors.push('stress');
  if (/[a-zçğıöşü]/i.test(bare)) errors.push('latin');
  if (kind === 'keyword' && bare.includes('г') && phoneticSource(word?.lemma).includes('ğ') && !phoneticSource(word?.lemma).includes('g')) {
    errors.push('yumusak-g');
  }
  const count = wordCount(image);
  if (count < 4 || count > 14) errors.push('image-words');
  if (/символиз|означает|представляет|ассоциац|воплоща/i.test(image)) errors.push('abstract');
  const phonCons = consOf(bare).join('');
  for (const hook of hooks) {
    if (!/^[а-яё-]+$/i.test(hook)) errors.push('hook-script');
    if (!hasWord(image, hook)) errors.push('hook-in-image');
    const ok = phonCons.length < 2 ? shortHookOk(hook, phonetic) : sharesBigram(hook, bare);
    if (!ok) errors.push('bigram');
  }
  const stem = senseStem(word?.translation);
  if (stem && !image.toLowerCase().includes(stem)) errors.push('gloss');
  return errors;
}

export function planAssociation(word) {
  const draft = draftAssociation(word);
  if (!draft) return { association: null, errors: ['no-match'] };
  const errors = validateAssociation(draft, word);
  return { association: errors.length ? null : draft, errors };
}
