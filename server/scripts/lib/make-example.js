import { englishPresentI, conjugateEnglish } from './conjugate-en.js';
import { POS } from './csv-util.js';

function cap(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function gloss(word) {
  return String(word.translation || '').split(/[,;(]/)[0].trim();
}

function hash(s) {
  let h = 2166136261;
  for (const ch of String(s)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick(lemma, frames) {
  return frames[hash(lemma) % frames.length];
}

function apply(frame, vars) {
  return {
    example: frame.example.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? ''),
    translate: frame.translate.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? ''),
  };
}

function set(text) {
  return new Set(String(text).trim().split(/\s+/));
}

function an(lemma) {
  const w = lemma.split(/\s+/)[0].toLowerCase();
  if (['university', 'useful', 'european', 'one', 'unit', 'user', 'euro', 'unique'].includes(w)) return 'a';
  if (['hour', 'honest', 'honour', 'honor', 'heir'].includes(w)) return 'an';
  return /^[aeiou]/i.test(w) ? 'an' : 'a';
}

function enHe(lemma) {
  return conjugateEnglish(lemma).find((f) => f.person === 'he/she' && f.grammar === 'present')?.form || lemma;
}

function enThey(lemma) {
  return conjugateEnglish(lemma).find((f) => f.person === 'they' && f.grammar === 'present')?.form || lemma;
}

const GUSTAR = set('gustar encantar interesar doler importar');

const UNCOUNTABLE = set(
  'water milk bread rice money information advice news furniture weather homework music time traffic luggage research progress luck fun health hair sugar salt butter cheese meat fish fruit coffee tea juice wine beer oil air rain snow ice love peace evidence software equipment staff police work paper food pasta soup salad honey pepper yogurt toast jam flour vinegar mustard ketchup mayonnaise smog electricity gas heat light dust sand soil blood gold silver coal steel wood wool cotton plastic metal glass',
);
UNCOUNTABLE.add('ice cream');

const PLURAL = set(
  'people clothes glasses scissors trousers jeans shorts pants chips news stairs thanks congratulations outskirts surroundings belongings goods customs police cattle scissors headphones crutches',
);

const PEOPLE = set(
  'man woman boy girl child kid baby person friend neighbour neighbor guest host owner member teacher student doctor nurse waiter waitress chef cook driver farmer worker boss manager client customer colleague partner husband wife mother father parent son daughter brother sister uncle aunt cousin grandmother grandfather family couple adult teenager baby twin relative architect accountant translator designer programmer scientist librarian electrician carpenter poet scholar mayor king queen president officer soldier lawyer judge agent investor employer employee director secretary assistant consultant historian immigrant refugee veteran pupil hero winner buyer dealer operator manufacturer producer critic gentleman lady guy fellow neighbour neighbor servant maker holder listener lover fan player',
);

const FOOD = set(
  'apple banana orange grape lemon peach strawberry fruit vegetable carrot onion garlic cucumber pepper mushroom bean pea tomato potato rice pasta meat chicken fish bread butter cheese egg milk sugar salt soup pizza burger chips cake chocolate biscuit honey oil yogurt cereal toast coffee tea juice wine beer water salad ham steak sandwich breakfast lunch dinner meal drink snack dessert wine vinegar mustard ketchup mayonnaise jam flour pea bean',
);
FOOD.add('ice cream');

const FOOD_MASS = set(
  'bread rice milk water cheese butter sugar salt meat fish fruit pasta soup oil honey coffee tea juice wine beer food salad toast yogurt jam flour vinegar mustard ketchup mayonnaise pepper chicken pizza cake chocolate',
);

const ANIMALS = set(
  'dog cat bird fish lion tiger elephant monkey bear wolf fox rabbit cow pig sheep chicken duck mouse snake frog horse animal pet',
);

const PLACE = set(
  'home house school work shop street city town country park hospital bank office hotel restaurant cafe café kitchen bathroom bedroom garden farm factory museum library station airport beach mountain river sea lake island village centre center market supermarket pharmacy cinema theatre theater gym hotel university college church court prison camp territory zone port harbour harbor valley desert border district region',
);

const TIME = set(
  'today yesterday tomorrow morning afternoon evening night week month year hour minute second day weekend monday tuesday wednesday thursday friday saturday sunday january february march april may june july august september october november december moment period century decade season summer winter spring autumn fall calendar birthday holiday vacation',
);

const BODY = set(
  'head face eye ear nose mouth tooth hair neck shoulder arm hand finger leg foot back stomach heart blood brain chest lip tongue throat knee muscle bone breast skin',
);

const FREQ_ADV = set(
  'always usually often sometimes rarely seldom never frequently occasionally regularly normally generally typically constantly',
);

const STATIVE = set(
  'be know like love hate want need seem believe understand remember mean prefer belong contain consist exist depend matter mind wish hope feel see hear smell taste look appear sound',
);

const MOTION = set('come go arrive leave enter return fly drive walk run jump climb travel fall');

const INTRANSITIVE = set(
  'live work sleep wait happen exist remain lie sit stand swim die smile laugh cry rain stay rest grow occur emerge collapse fade wander hesitate pray grin gaze',
);

const MODALS = set('can could would should must may might shall will ought');

const FEM_ES = set(
  'mano foto moto radio noche leche gente clase tarde calle nube sangre flor miel sal nieve luz voz vez pared ciudad universidad libertad verdad edad calidad cantidad universidad televisión canción razón nación estación reunión lección acción reacción atención situación información conversación decisión televisión televisión mujer niña chica casa mesa silla puerta ventana cama cocina playa isla montaña escuela tienda iglesia carta pregunta respuesta historia música comida bebida fruta carne leche agua cerveza sopa ensalada taza botella bolsa llave ropa camisa falda chaqueta bota gorra fiesta boda reunión idea duda pregunta mente alma paz guerra suerte vida muerte parte hora semana mañana tarde noche forma manera causa fuerza tierra mar agua madre hermana hija tía abuela esposa',
);

const MASC_ES = set(
  'día mapa problema sistema tema clima idioma programa planeta poema drama sofá café té pie lunes martes miércoles jueves viernes sábado domingo avión camión corazón orden país autobús tren barco coche metro taxi hotel restaurante cine teatro parque río mar océano monte bosque jardín pueblo barrio centro norte sur este oeste color número nombre apellido trabajo empleo sueldo precio valor grupo equipo partido gobierno estado mundo tiempo lugar caso punto hecho cambio resultado efecto nivel servicio',
);

function esFeminine(lemma) {
  const w = lemma.toLowerCase();
  if (MASC_ES.has(w)) return false;
  if (FEM_ES.has(w)) return true;
  if (/ción$|sión$|dad$|tad$|tud$|umbre$|ez$/.test(w)) return true;
  if (/ma$/.test(w)) return false;
  return w.endsWith('a');
}

function enKind(lemma) {
  const l = lemma.toLowerCase();
  if (PLURAL.has(l)) return 'plural';
  if (FOOD.has(l)) return 'food';
  if (ANIMALS.has(l)) return 'animal';
  if (PEOPLE.has(l)) return 'person';
  if (UNCOUNTABLE.has(l)) return 'mass';
  if (PLACE.has(l)) return 'place';
  if (TIME.has(l)) return 'time';
  if (BODY.has(l)) return 'body';
  if (/tion$|sion$|ment$|ness$|ity$|ance$|ence$|ship$|hood$|ism$|ology$/.test(l)) return 'abstract';
  return 'thing';
}

function enDet(lemma, kind, n) {
  if (kind === 'mass') return ['', 'this ', 'some ', 'the '][n % 4];
  if (kind === 'plural') return ['', 'these ', 'the ', 'my '][n % 4];
  if (kind === 'time') return ['', 'this ', 'the ', ''][n % 4];
  return ['the ', `${an(lemma)} `, 'my ', 'this '][n % 4];
}

function esArt(lemma, n) {
  const fem = esFeminine(lemma);
  if (lemma === 'agua') return ['el ', 'un poco de ', 'esta ', 'mi '][n % 4];
  const opts = fem
    ? ['la ', 'una ', 'mi ', 'esta ']
    : ['el ', 'un ', 'mi ', 'este '];
  return opts[n % 4];
}

const EN_FIXED = {
  the: ['The keys are on the table.', 'Ключи на столе.'],
  a: ['I need a ticket.', 'Мне нужен билет.'],
  an: ['She ate an apple.', 'Она съела яблоко.'],
  and: ['Tea and coffee, please.', 'Чай и кофе, пожалуйста.'],
  or: ['Tea or coffee?', 'Чай или кофе?'],
  but: ['I like tea but not coffee.', 'Я люблю чай, но не кофе.'],
  of: ['A cup of tea, please.', 'Чашку чая, пожалуйста.'],
  to: ['I go to work at eight.', 'Я иду на работу в восемь.'],
  in: ['The keys are in my bag.', 'Ключи в сумке.'],
  on: ['The book is on the table.', 'Книга на столе.'],
  at: ['Meet me at the station.', 'Встретимся на вокзале.'],
  for: ['This gift is for you.', 'Этот подарок для тебя.'],
  from: ['I am from Spain.', 'Я из Испании.'],
  with: ['I live with my sister.', 'Я живу с сестрой.'],
  without: ['Don\'t go without a coat.', 'Не выходи без пальто.'],
  about: ['We talked about the film.', 'Мы говорили о фильме.'],
  into: ['He went into the room.', 'Он вошёл в комнату.'],
  over: ['A plane flew over the city.', 'Самолёт пролетел над городом.'],
  after: ['Call me after lunch.', 'Позвони после обеда.'],
  before: ['Wash your hands before dinner.', 'Вымой руки перед ужином.'],
  between: ['The café is between two shops.', 'Кафе между двумя магазинами.'],
  under: ['The cat is under the chair.', 'Кошка под стулом.'],
  through: ['We walked through the park.', 'Мы прошли через парк.'],
  during: ['Please be quiet during the exam.', 'Тише во время экзамена.'],
  until: ['Wait until tomorrow.', 'Подожди до завтра.'],
  because: ['I stayed because it rained.', 'Я остался, потому что шёл дождь.'],
  if: ['Call me if you need help.', 'Позвони, если нужна помощь.'],
  than: ['She is taller than me.', 'Она выше меня.'],
  as: ['She works as a teacher.', 'Она работает учителем.'],
  so: ['I was tired, so I sat down.', 'Я устал, поэтому сел.'],
  not: ['I am not ready yet.', 'Я ещё не готов.'],
  yes: ['Yes, I am from Spain.', 'Да, я из Испании.'],
  no: ['No, I am not a student.', 'Нет, я не студент.'],
};

const ES_FIXED = {
  el: ['El libro está aquí.', 'Книга здесь.'],
  la: ['La casa es grande.', 'Дом большой.'],
  un: ['Hay un perro en el parque.', 'В парке собака.'],
  una: ['Quiero una manzana.', 'Хочу яблоко.'],
  de: ['Café de Colombia, por favor.', 'Кофе из Колумбии, пожалуйста.'],
  a: ['Voy a casa ahora.', 'Сейчас иду домой.'],
  en: ['Las llaves están en la bolsa.', 'Ключи в сумке.'],
  y: ['Pan y queso, por favor.', 'Хлеб и сыр, пожалуйста.'],
  o: ['¿Té o café?', 'Чай или кофе?'],
  pero: ['Me gusta el té, pero no el café.', 'Люблю чай, но не кофе.'],
  que: ['Creo que sí.', 'Думаю, что да.'],
  por: ['Lo hago por ti.', 'Делаю это ради тебя.'],
  para: ['Esto es para ti.', 'Это для тебя.'],
  con: ['Café con leche, por favor.', 'Кофе с молоком, пожалуйста.'],
  sin: ['Un café sin azúcar.', 'Кофе без сахара.'],
  del: ['Viene del norte.', 'Он с севера.'],
  al: ['Voy al mercado.', 'Иду на рынок.'],
  como: ['Es alto como su padre.', 'Он высокий, как отец.'],
  porque: ['Me quedé porque llovía.', 'Я остался, потому что шёл дождь.'],
  si: ['Llámame si puedes.', 'Позвони, если можешь.'],
  se: ['Se llama Ana.', 'Её зовут Ана.'],
  lo: ['Lo veo ahora.', 'Я это вижу сейчас.'],
  le: ['Le doy el libro.', 'Даю ему книгу.'],
  me: ['Me gusta el café.', 'Мне нравится кофе.'],
  te: ['Te llamo luego.', 'Потом тебе позвоню.'],
  nos: ['Nos vemos mañana.', 'Увидимся завтра.'],
  más: ['Quiero más agua.', 'Хочу ещё воды.'],
  muy: ['Está muy rico.', 'Очень вкусно.'],
  ya: ['Ya está listo.', 'Уже готово.'],
  hoy: ['Hoy no trabajo.', 'Сегодня я не работаю.'],
  ayer: ['Ayer llovió mucho.', 'Вчера сильно дождило.'],
};

const DAYS_EN = {
  monday: ['See you on Monday.', 'Увидимся в понедельник.'],
  tuesday: ['The class is on Tuesday.', 'Занятие во вторник.'],
  wednesday: ['I am free on Wednesday.', 'В среду я свободен.'],
  thursday: ['We meet on Thursday.', 'Мы встречаемся в четверг.'],
  friday: ['Friday is my favourite day.', 'Пятница — мой любимый день.'],
  saturday: ['Let\'s go out on Saturday.', 'Давай выйдем в субботу.'],
  sunday: ['Sunday is for rest.', 'Воскресенье для отдыха.'],
};

const DAYS_ES = {
  lunes: ['Nos vemos el lunes.', 'Увидимся в понедельник.'],
  martes: ['La clase es el martes.', 'Занятие во вторник.'],
  miércoles: ['El miércoles no trabajo.', 'В среду я не работаю.'],
  jueves: ['Quedamos el jueves.', 'Встречаемся в четверг.'],
  viernes: ['El viernes salgo con amigos.', 'В пятницу иду с друзьями.'],
  sábado: ['El sábado hay mercado.', 'В субботу рынок.'],
  domingo: ['El domingo descanso.', 'В воскресенье отдыхаю.'],
};

function pair(example, translate) {
  return { example, translate };
}

function enNoun(word) {
  const l = word.lemma;
  const t = gloss(word);
  const kind = enKind(l);
  const n = hash(l);
  const det = enDet(l, kind, n);
  const Det = cap(det);

  if (DAYS_EN[l]) return pair(DAYS_EN[l][0], DAYS_EN[l][1]);

  if (kind === 'food') {
    const drinks = set('coffee tea juice wine beer water milk drink oil vinegar');
    const meals = set('breakfast lunch dinner meal snack dessert');
    if (drinks.has(l)) {
      const q = l === 'drink' ? `${an(l)} ` : '';
      return apply(pick(l, [
        { example: 'Would you like {q}{l}?', translate: 'Хочешь {t}?' },
        { example: 'I ordered {q}{l}.', translate: 'Я заказал(а) {t}.' },
        { example: 'This {l} is cold.', translate: '{T} холодный.' },
        { example: 'Can I have more {l}?', translate: 'Можно ещё {t}?' },
      ]), { l, t, q, T: cap(t) });
    }
    if (meals.has(l)) {
      return apply(pick(l, [
        { example: 'What\'s for {l}?', translate: 'Что на {t}?' },
        { example: 'I had a late {l}.', translate: 'У меня был поздний {t}.' },
        { example: '{L} is ready.', translate: '{T} готов.' },
        { example: 'Let\'s skip {l} today.', translate: 'Давай сегодня без {t}.' },
      ]), { l, t, L: cap(l), T: cap(t) });
    }
    const q = FOOD_MASS.has(l) ? 'some ' : `${an(l)} `;
    return apply(pick(l, [
      { example: 'Would you like {q}{l}?', translate: 'Хочешь {t}?' },
      { example: 'I had {l} for lunch.', translate: 'На обед у меня был {t}.' },
      { example: 'This {l} is delicious.', translate: 'Как вкусно: {t}.' },
      { example: 'Can I have more {l}?', translate: 'Можно ещё {t}?' },
      { example: 'We bought {l} today.', translate: 'Мы сегодня купили {t}.' },
      { example: 'There is no {l} left.', translate: '{T} уже нет.' },
      { example: 'Add some {l}, please.', translate: 'Добавь {t}, пожалуйста.' },
    ]), { l, t, q, T: cap(t) });
  }
  if (kind === 'animal') {
    return apply(pick(l, [
      { example: 'I saw {a} {l} at the zoo.', translate: 'В зоопарке был {t}.' },
      { example: 'Look, {a} {l}!', translate: 'Смотри, это {t}!' },
      { example: 'The {l} is sleeping.', translate: '{T} спит.' },
      { example: 'We have {a} {l} at home.', translate: 'У нас дома есть {t}.' },
    ]), { l, t, a: an(l), T: cap(t) });
  }
  if (kind === 'person') {
    return apply(pick(l, [
      { example: 'I met {a} {l} yesterday.', translate: 'Вчера я встретил(а) {t}.' },
      { example: 'My {l} lives nearby.', translate: 'Мой {t} живёт рядом.' },
      { example: 'She is {a} {l}.', translate: 'Она — {t}.' },
      { example: 'Ask the {l} for help.', translate: 'Попроси {t} о помощи.' },
      { example: 'The {l} called me back.', translate: '{T} перезвонил(а) мне.' },
    ]), { l, t, a: an(l), T: cap(t) });
  }
  if (kind === 'place') {
    return apply(pick(l, [
      { example: 'Let\'s meet at the {l}.', translate: 'Давай встретимся у {t}.' },
      { example: 'I walked to the {l}.', translate: 'Я дошёл(ла) до {t}.' },
      { example: 'The {l} is closed today.', translate: 'Сегодня {t} закрыт.' },
      { example: 'Is there a {l} near here?', translate: 'Здесь рядом есть {t}?' },
      { example: 'We spent the day at the {l}.', translate: 'Мы провели день у {t}.' },
    ]), { l, t });
  }
  if (kind === 'time') {
    if (['today', 'yesterday', 'tomorrow'].includes(l)) {
      return apply(pick(l, [
        { example: 'See you {l}.', translate: 'Увидимся {t}.' },
        { example: 'I am busy {l}.', translate: '{T} я занят(а).' },
      ]), { l, t, T: cap(t) });
    }
    if (['morning', 'afternoon', 'evening', 'night', 'weekend'].includes(l)) {
      return apply(pick(l, [
        { example: 'Call me in the {l}.', translate: 'Позвони {t}.' },
        { example: 'See you this {l}.', translate: 'Увидимся {t}.' },
      ]), { l, t });
    }
    return apply(pick(l, [
      { example: 'I need one more {l}.', translate: 'Мне нужен ещё один {t}.' },
      { example: 'We met last {l}.', translate: 'Мы виделись в прошлый {t}.' },
      { example: 'It takes a whole {l}.', translate: 'На это уходит целый {t}.' },
    ]), { l, t });
  }
  if (kind === 'body') {
    if (['hand', 'face', 'hair', 'tooth'].includes(l)) {
      return pair(`Wash your ${l}, please.`, `Помой ${t}, пожалуйста.`);
    }
    if (['arm', 'leg', 'finger', 'foot', 'neck', 'back', 'shoulder', 'knee'].includes(l)) {
      return pair(`My ${l} hurts.`, `У меня болит ${t}.`);
    }
    return apply(pick(l, [
      { example: 'My {l} hurts.', translate: 'У меня болит {t}.' },
      { example: 'Take care of your {l}.', translate: 'Береги {t}.' },
      { example: 'The doctor looked at my {l}.', translate: 'Врач посмотрел: {t}.' },
    ]), { l, t });
  }
  if (kind === 'abstract') {
    return apply(pick(l, [
      { example: 'We talked about {det}{l}.', translate: 'Мы говорили про {t}.' },
      { example: '{Det}{l} is important here.', translate: 'Здесь важен {t}.' },
      { example: 'I need more {l}.', translate: 'Мне нужно больше: {t}.' },
      { example: 'This {l} changed my mind.', translate: 'Этот {t} изменил моё мнение.' },
      { example: 'They asked about our {l}.', translate: 'Они спросили про наш {t}.' },
      { example: 'Without {l} we cannot start.', translate: 'Без {t} мы не начнём.' },
    ]), { l, t, det, Det });
  }
  return apply(pick(l, [
    { example: 'Where is {det}{l}?', translate: 'Где {t}?' },
    { example: 'Here is {det}{l}.', translate: 'Вот {t}.' },
    { example: '{Det}{l} is on the table.', translate: '{T} на столе.' },
    { example: 'I need {det}{l} today.', translate: 'Мне бы сегодня {t}.' },
    { example: 'Look at this {l}.', translate: 'Смотри, это {t}.' },
    { example: 'We talked about the {l}.', translate: 'Мы говорили про {t}.' },
    { example: 'I forgot the {l} at home.', translate: '{T} остался дома.' },
    { example: 'Have you seen my {l}?', translate: 'Ты видел(а)? Это {t}.' },
    { example: 'She showed me the {l}.', translate: 'Она показала: {t}.' },
    { example: 'Let\'s take the {l}.', translate: 'Давай возьмём — {t}.' },
    { example: 'This {l} is useful.', translate: '{T} полезен.' },
    { example: 'They asked about the {l}.', translate: 'Они спросили про {t}.' },
  ]), { l, t, det, Det, T: cap(t) });
}

function enVerb(word) {
  const l = word.lemma;
  const t = gloss(word);
  const vI = englishPresentI(l);
  const vHe = enHe(l);
  const vThey = enThey(l);
  const base = l.split(/\s+/)[0];

  if (l.includes(' ')) {
    return apply(pick(l, [
      { example: 'It\'s time to {l}.', translate: 'Пора {t}.' },
      { example: 'I {vI} every morning.', translate: 'Каждое утро я обычно {t}.' },
      { example: 'She had to {l} early.', translate: 'Ей пришлось рано {t}.' },
      { example: 'Don\'t forget to {l}.', translate: 'Не забудь {t}.' },
    ]), { l, t, vI });
  }

  if (base === 'be') {
    return apply(pick(l, [
      { example: 'I am at home now.', translate: 'Я сейчас дома.' },
      { example: 'She is a student.', translate: 'Она студентка.' },
    ]), { l, t });
  }
  if (MODALS.has(base)) {
    return apply(pick(l, [
      { example: 'You {l} try again.', translate: 'Тебе стоит попробовать снова ({t}).' },
      { example: 'I {l} help you with this.', translate: 'Я {t} помочь тебе с этим.' },
      { example: 'We {l} leave now.', translate: 'Нам {t} уходить.' },
    ]), { l, t });
  }
  if (['like', 'love', 'hate', 'prefer'].includes(base)) {
    const rows = {
      like: [['I like this song.', 'Мне нравится эта песня.'], ['She likes coffee.', 'Ей нравится кофе.']],
      love: [['I love this city.', 'Я люблю этот город.'], ['She loves coffee in the morning.', 'Она любит кофе по утрам.']],
      hate: [['I hate this song.', 'Я ненавижу эту песню.'], ['They hate waiting.', 'Они ненавидят ждать.']],
      prefer: [['I prefer tea.', 'Я предпочитаю чай.'], ['She prefers to walk.', 'Она предпочитает ходить пешком.']],
    };
    const [example, translate] = pick(l, rows[base]);
    return pair(example, translate);
  }
  if (MOTION.has(base)) {
    return apply(pick(l, [
      { example: 'It\'s time to {l}.', translate: 'Пора {t}.' },
      { example: 'Let\'s {l} together.', translate: 'Давай {t} вместе.' },
      { example: 'She had to {l} early.', translate: 'Ей пришлось рано {t}.' },
      { example: 'We can {l} after lunch.', translate: 'Можем {t} после обеда.' },
    ]), { l, t });
  }
  if (STATIVE.has(base)) {
    return apply(pick(l, [
      { example: 'Do you {l} this?', translate: 'Ты это чувствуешь: {t}?' },
      { example: 'I {vI} the answer now.', translate: 'Сейчас ясно: {t}.' },
      { example: 'She {vHe} it very well.', translate: 'Она это хорошо умеет: {t}.' },
      { example: 'We {vThey} what you mean.', translate: 'Мы понимаем: {t}.' },
    ]), { l, t, vI, vHe, vThey });
  }
  if (INTRANSITIVE.has(base)) {
    return apply(pick(l, [
      { example: 'I like to {l} in the morning.', translate: 'Утром я люблю {t}.' },
      { example: 'It\'s nice to {l} here.', translate: 'Здесь приятно {t}.' },
      { example: 'She wants to {l} at home.', translate: 'Она хочет {t} дома.' },
      { example: 'They stopped to {l}.', translate: 'Они остановились, чтобы {t}.' },
      { example: 'We need time to {l}.', translate: 'Нам нужно время, чтобы {t}.' },
    ]), { l, t });
  }
  return apply(pick(l, [
    { example: 'I want to {l} this today.', translate: 'Я хочу {t} это сегодня.' },
    { example: 'We decided to {l} together.', translate: 'Мы решили {t} вместе.' },
    { example: 'Can you {l} it for me?', translate: 'Можешь {t} это для меня?' },
    { example: 'She asked me to {l}.', translate: 'Она попросила меня {t}.' },
    { example: 'Don\'t forget to {l}.', translate: 'Не забудь {t}.' },
    { example: 'They started to {l} at once.', translate: 'Они сразу начали {t}.' },
    { example: 'Let\'s {l} after lunch.', translate: 'Давай {t} после обеда.' },
    { example: 'I learned how to {l}.', translate: 'Я научился(ась) {t}.' },
    { example: 'He promised to {l} soon.', translate: 'Он пообещал скоро {t}.' },
    { example: 'It\'s time to {l}.', translate: 'Пора {t}.' },
  ]), { l, t });
}

function enAdj(word) {
  const l = word.lemma;
  const t = gloss(word);
  return apply(pick(l, [
    { example: 'It looks {l} today.', translate: 'Сегодня это выглядит {t}.' },
    { example: 'She seems {l}.', translate: 'Она кажется {t}.' },
    { example: 'That\'s a {l} idea.', translate: 'Идея довольно {t}.' },
    { example: 'I felt {l} after work.', translate: 'После работы я был(а) {t}.' },
    { example: 'It\'s too {l} for me.', translate: 'Для меня это слишком {t}.' },
    { example: 'How {l} is it really?', translate: 'Насколько это {t}?' },
    { example: 'We need something more {l}.', translate: 'Нам нужно что-то более {t}.' },
    { example: 'He is often {l}.', translate: 'Он часто {t}.' },
  ]), { l, t });
}

function enAdv(word) {
  const l = word.lemma;
  const t = gloss(word);
  if (FREQ_ADV.has(l)) {
    return apply(pick(l, [
      { example: 'We {l} eat together.', translate: 'Мы {t} едим вместе.' },
      { example: 'I {l} go there by bus.', translate: 'Я {t} езжу туда на автобусе.' },
      { example: 'She {l} calls in the evening.', translate: 'Она {t} звонит вечером.' },
    ]), { l, t });
  }
  return apply(pick(l, [
    { example: 'Please do it {l}.', translate: 'Пожалуйста, сделай это {t}.' },
    { example: 'She spoke {l}.', translate: 'Она говорила {t}.' },
    { example: 'It happened {l}.', translate: 'Это случилось {t}.' },
    { example: 'Try to answer {l}.', translate: 'Постарайся ответить {t}.' },
    { example: 'He left {l} after dinner.', translate: 'Он ушёл {t} после ужина.' },
  ]), { l, t });
}

function enOther(word) {
  const l = word.lemma;
  const t = gloss(word);
  if (EN_FIXED[l]) return pair(EN_FIXED[l][0], EN_FIXED[l][1]);
  return apply(pick(l, [
    { example: 'Wait {l} me at the door.', translate: 'Подожди {t} меня у двери.' },
    { example: 'I found it {l} the box.', translate: 'Я нашёл(ла) это {t} коробки.' },
    { example: 'Come {l} us after class.', translate: 'Пойди {t} нами после урока.' },
    { example: 'I stayed {l} the end.', translate: 'Я остался {t} конца.' },
  ]), { l, t });
}

function esNoun(word) {
  const l = word.lemma;
  const t = gloss(word);
  const n = hash(l);
  const art = esArt(l, n);
  const Art = cap(art);

  if (DAYS_ES[l]) return pair(DAYS_ES[l][0], DAYS_ES[l][1]);

  const food = set('pan leche agua té café vino cerveza zumo fruta manzana naranja plátano uva fresa tomate patata cebolla ajo lechuga carne pescado pollo arroz pasta sopa ensalada queso aceite sal azúcar huevo mantequilla comida bebida desayuno almuerzo cena verdura');
  if (food.has(l)) {
    const dem = esFeminine(l) ? 'Esta' : 'Este';
    const fresco = esFeminine(l) ? 'fresca' : 'fresco';
    const rico = esFeminine(l) ? 'rica' : 'rico';
    let art = esFeminine(l) ? (hash(l) % 2 ? 'la ' : 'una ') : (hash(l) % 2 ? 'el ' : 'un ');
    if (l === 'agua') art = hash(l) % 2 ? 'el ' : 'un poco de ';
    return apply(pick(l, [
      { example: '¿Quieres más {l}?', translate: 'Хочешь ещё {t}?' },
      { example: 'Pedí {art}{l}.', translate: 'Я заказал(а) {t}.' },
      { example: '{dem} {l} está {rico}.', translate: 'Как вкусно: {t}.' },
      { example: 'Compramos {l} {fresco}.', translate: 'Мы купили {t}.' },
      { example: 'No queda {l}.', translate: '{T} уже нет.' },
      { example: 'Hoy hay {l}.', translate: 'Сегодня есть {t}.' },
      { example: '¿Hay {l} en casa?', translate: 'Дома есть {t}?' },
    ]), { l, t, art, dem, fresco, rico, T: cap(t) });
  }
  if (PEOPLE.has(l) || /ista$|dor$|dora$|ero$|era$|nte$/.test(l)) {
    return apply(pick(l, [
      { example: 'Ayer conocí a {art}{l}.', translate: 'Вчера я познакомился(ась) с {t}.' },
      { example: 'Mi {l} vive cerca.', translate: 'Мой {t} живёт рядом.' },
      { example: 'Ella es {art}{l}.', translate: 'Она — {t}.' },
      { example: 'Pregunta al {l}.', translate: 'Спроси у {t}.' },
    ]), { l, t, art });
  }
  return apply(pick(l, [
    { example: '¿Dónde está {art}{l}?', translate: 'Где {t}?' },
    { example: 'Aquí está {art}{l}.', translate: 'Вот {t}.' },
    { example: '{Art}{l} está en la mesa.', translate: '{T} на столе.' },
    { example: 'Necesito {art}{l} hoy.', translate: 'Мне бы сегодня {t}.' },
    { example: 'Mira {art}{l}.', translate: 'Смотри, это {t}.' },
    { example: 'Hablamos de {art}{l}.', translate: 'Мы говорили про {t}.' },
    { example: 'Me olvidé {art}{l} en casa.', translate: '{T} остался дома.' },
    { example: '¿Has visto {art}{l}?', translate: 'Ты видел(а)? Это {t}.' },
    { example: 'Ayer compré {art}{l}.', translate: 'Вчера купил(а): {t}.' },
    { example: 'Lleva {art}{l} contigo.', translate: 'Возьми с собой — {t}.' },
    { example: 'Busco {art}{l}.', translate: 'Ищу: {t}.' },
    { example: 'Sin {l} no podemos seguir.', translate: 'Без {t} не продолжить.' },
  ]), { l, t, art, Art, T: cap(t) });
}

function esVerb(word) {
  const l = word.lemma;
  const t = gloss(word);
  const base = l.replace(/se$/, '');

  if (['haber'].includes(base)) {
    return pair('Hay mucho trabajo hoy.', 'Сегодня много работы.');
  }
  if (base === 'ser') {
    return apply(pick(l, [
      { example: 'Ella es médica.', translate: 'Она врач.' },
      { example: 'Esto es importante.', translate: 'Это важно.' },
    ]), { l, t });
  }
  if (base === 'estar') {
    return apply(pick(l, [
      { example: 'Estoy en casa.', translate: 'Я дома.' },
      { example: '¿Dónde estás ahora?', translate: 'Где ты сейчас?' },
    ]), { l, t });
  }
  if (GUSTAR.has(base) || base === 'parecer') {
    if (base === 'gustar') return pair('Me gusta el cine.', 'Мне нравится кино.');
    if (base === 'encantar') return pair('Me encanta este libro.', 'Мне очень нравится эта книга.');
    if (base === 'interesar') return pair('Me interesa el tema.', 'Мне интересна тема.');
    if (base === 'doler') return pair('Me duele la cabeza.', 'У меня болит голова.');
    if (base === 'importar') return pair('No me importa.', 'Мне всё равно.');
    return pair('Me parece bien.', 'Мне кажется, всё нормально.');
  }
  return apply(pick(l, [
    { example: 'Quiero {l} esto hoy.', translate: 'Я хочу {t} это сегодня.' },
    { example: 'Vamos a {l} juntos.', translate: 'Давай {t} вместе.' },
    { example: '¿Puedes {l} un momento?', translate: 'Можешь {t} минутку?' },
    { example: 'Me pidió {l}.', translate: 'Он(а) попросил(а) меня {t}.' },
    { example: 'No olvides {l}.', translate: 'Не забудь {t}.' },
    { example: 'Empezaron a {l} enseguida.', translate: 'Они сразу начали {t}.' },
    { example: 'Aprendí a {l}.', translate: 'Я научился(ась) {t}.' },
    { example: 'Es hora de {l}.', translate: 'Пора {t}.' },
    { example: 'Tengo que {l} ahora.', translate: 'Мне нужно {t} сейчас.' },
    { example: '¿Quieres {l} conmigo?', translate: 'Хочешь {t} со мной?' },
  ]), { l, t });
}

function esAdj(word) {
  const l = word.lemma;
  const t = gloss(word);
  return apply(pick(l, [
    { example: 'El día está {l}.', translate: 'День {t}.' },
    { example: 'Me parece {l}.', translate: 'Мне кажется {t}.' },
    { example: 'No es tan {l}.', translate: 'Это не так {t}.' },
    { example: 'Qué {l} es esto.', translate: 'Какое это {t}.' },
    { example: 'Sigue {l} el asunto.', translate: 'Дело по-прежнему {t}.' },
    { example: 'Es bastante {l}.', translate: 'Довольно {t}.' },
    { example: 'Resultó {l} al final.', translate: 'В итоге оказалось {t}.' },
    { example: 'Buscamos algo más {l}.', translate: 'Ищем что-то более {t}.' },
  ]), { l, t });
}

function esAdv(word) {
  const l = word.lemma;
  const t = gloss(word);
  if (l === 'nunca' || l === 'jamás') return pair('Nunca llego tarde.', 'Я никогда не опаздываю.');
  if (l === 'siempre') return pair('Siempre desayunamos juntos.', 'Мы всегда завтракаем вместе.');
  if (l === 'también') return pair('Yo también quiero café.', 'Я тоже хочу кофе.');
  if (l === 'tampoco') return pair('Yo tampoco voy.', 'Я тоже не иду.');
  if (l === 'ya') return pair('Ya está listo.', 'Уже готово.');
  if (l === 'todavía' || l === 'aún') return pair('Todavía no está listo.', 'Ещё не готово.');
  if (FREQ_ADV.has(l) || l === 'a veces') {
    return apply(pick(l, [
      { example: '{L} desayunamos juntos.', translate: 'Мы {t} завтракаем вместе.' },
      { example: 'Yo {l} voy en bus.', translate: 'Я {t} езжу на автобусе.' },
      { example: 'Ella {l} llama por la noche.', translate: 'Она {t} звонит вечером.' },
    ]), { l, t, L: cap(l) });
  }
  return apply(pick(l, [
    { example: 'Hazlo {l}, por favor.', translate: 'Сделай это {t}, пожалуйста.' },
    { example: 'Ella habló {l}.', translate: 'Она говорила {t}.' },
    { example: 'Pasó {l}.', translate: 'Это случилось {t}.' },
    { example: 'Intenta responder {l}.', translate: 'Постарайся ответить {t}.' },
  ]), { l, t });
}

function esOther(word) {
  const l = word.lemma;
  const t = gloss(word);
  if (ES_FIXED[l]) return pair(ES_FIXED[l][0], ES_FIXED[l][1]);
  return apply(pick(l, [
    { example: 'Espérame {l} la puerta.', translate: 'Подожди меня {t} двери.' },
    { example: 'Lo encontré {l} la caja.', translate: 'Я нашёл(ла) это {t} коробки.' },
    { example: 'Ven {l} nosotros después.', translate: 'Приходи {t} нами потом.' },
    { example: 'Me quedé {l} el final.', translate: 'Я остался {t} конца.' },
  ]), { l, t });
}

function phraseExample(word) {
  const l = word.lemma.trim();
  const t = gloss(word);
  const ex = /[.!?]$/.test(l) ? cap(l) : `${cap(l)}.`;
  const tr = /[.!?]$/.test(t) ? cap(t) : `${cap(t)}.`;
  return pair(ex, tr);
}

export function makeEnglishExample(word) {
  if (word.example) return { example: word.example, translate: word.translate || '' };
  switch (word.pos) {
    case POS.V: return enVerb(word);
    case POS.A: return enAdj(word);
    case POS.D: return enAdv(word);
    case POS.N: return enNoun(word);
    case POS.F: return phraseExample(word);
    case POS.R:
      return apply(pick(word.lemma, [
        { example: '{L} is waiting outside.', translate: '{T} ждёт снаружи.' },
        { example: 'I saw {l} yesterday.', translate: 'Я видел(а) {t} вчера.' },
        { example: '{L} can help us.', translate: '{T} может нам помочь.' },
      ]), { l: word.lemma, t: gloss(word), L: cap(word.lemma), T: cap(gloss(word)) });
    default:
      return EN_FIXED[word.lemma] ? pair(EN_FIXED[word.lemma][0], EN_FIXED[word.lemma][1]) : enOther(word);
  }
}

export function makeSpanishExample(word) {
  if (word.example) return { example: word.example, translate: word.translate || '' };
  switch (word.pos) {
    case POS.V: return esVerb(word);
    case POS.A: return esAdj(word);
    case POS.D: return esAdv(word);
    case POS.N: return esNoun(word);
    case POS.F: return phraseExample(word);
    case POS.R:
      return apply(pick(word.lemma, [
        { example: '{L} está fuera.', translate: '{T} снаружи.' },
        { example: 'Ayer vi a {l}.', translate: 'Вчера я видел(а) {t}.' },
        { example: '{L} puede ayudarnos.', translate: '{T} может нам помочь.' },
      ]), { l: word.lemma, t: gloss(word), L: cap(word.lemma), T: cap(gloss(word)) });
    default:
      return ES_FIXED[word.lemma] ? pair(ES_FIXED[word.lemma][0], ES_FIXED[word.lemma][1]) : esOther(word);
  }
}
