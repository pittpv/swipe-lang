import { expandPos } from '../lib/csv-util.js';

/** Extra high-frequency lexis mapped onto English File files, original examples generated later. */
function rows(cefr, unit, list) {
  return list.map(([lemma, translation, pos]) => ({
    cefr, unit, lemma, translation, pos: expandPos(pos), example: '', translate: '',
  }));
}

const n = (items) => items.map((x) => [...x, 'N']);
const v = (items) => items.map((x) => [...x, 'V']);
const a = (items) => items.map((x) => [...x, 'A']);
const d = (items) => items.map((x) => [...x, 'D']);
const f = (items) => items.map((x) => [...x, 'F']);

export function englishCoreExtra() {
  return [
    ...rows('A1', 'FILE1', n([
      ['world', 'мир'], ['language', 'язык'], ['word', 'слово'], ['sentence', 'предложение'],
      ['person', 'человек'], ['place', 'место'], ['year', 'год'], ['today', 'сегодня'],
      ['night', 'ночь'], ['morning', 'утро'], ['friend', 'друг'], ['home', 'дом'],
      ['school', 'школа'], ['work', 'работа'], ['shop', 'магазин'], ['street', 'улица'],
      ['city', 'город'], ['town', 'городок'], ['country', 'страна'], ['map', 'карта'],
    ]).concat(v([
      ['say', 'говорить'], ['see', 'видеть'], ['know', 'знать'], ['think', 'думать'],
      ['come', 'приходить'], ['give', 'давать'], ['take', 'брать'], ['make', 'делать'],
      ['find', 'находить'], ['tell', 'рассказывать'], ['feel', 'чувствовать'], ['leave', 'уходить'],
    ])).concat(a([
      ['first', 'первый'], ['last', 'последний'], ['next', 'следующий'], ['same', 'тот же'],
      ['other', 'другой'], ['right', 'правильный, правый'], ['wrong', 'неправильный'],
      ['true', 'верный'], ['false', 'ложный'], ['ready', 'готовый'],
    ]))),
    ...rows('A1', 'FILE2', n([
      ['address', 'адрес'], ['age', 'возраст'], ['job', 'работа'], ['email', 'эл. почта'],
      ['website', 'сайт'], ['photo', 'фото'], ['picture', 'картинка'], ['form', 'бланк'],
      ['card', 'карточка'], ['paper', 'бумага'], ['page', 'страница'], ['line', 'строка'],
      ['class', 'класс'], ['lesson', 'урок'], ['homework', 'домашнее задание'], ['test', 'тест'],
      ['question', 'вопрос'], ['answer', 'ответ'], ['example', 'пример'], ['mistake', 'ошибка'],
    ]).concat(v([
      ['ask', 'спрашивать'], ['answer', 'отвечать'], ['spell', 'произносить по буквам'],
      ['repeat', 'повторять'], ['understand', 'понимать'], ['mean', 'значить'],
      ['translate', 'переводить'], ['practise', 'практиковаться'], ['learn', 'учить'], ['teach', 'учить (кого-то)'],
    ])).concat(d([
      ['here', 'здесь'], ['there', 'там'], ['now', 'сейчас'], ['then', 'тогда'],
      ['well', 'хорошо'], ['too', 'тоже, слишком'], ['also', 'также'], ['very', 'очень'],
    ]))),
    ...rows('A1', 'FILE3', n([
      ['box', 'коробка'], ['bottle', 'бутылка'], ['cup', 'чашка'], ['glass', 'стакан, стекло'],
      ['plate', 'тарелка'], ['bowl', 'миска'], ['knife', 'нож'], ['fork', 'вилка'],
      ['spoon', 'ложка'], ['bag', 'сумка'], ['wallet', 'кошелёк'], ['coin', 'монета'],
      ['money', 'деньги'], ['present', 'подарок'], ['toy', 'игрушка'], ['ball', 'мяч'],
      ['bike', 'велосипед'], ['car', 'машина'], ['door', 'дверь'], ['window', 'окно'],
    ]).concat(a([
      ['empty', 'пустой'], ['full', 'полный'], ['clean', 'чистый'], ['dirty', 'грязный'],
      ['open', 'открытый'], ['closed', 'закрытый'], ['broken', 'сломанный'], ['heavy', 'тяжёлый'],
      ['light', 'лёгкий, светлый'], ['long', 'длинный'], ['short', 'короткий'], ['wide', 'широкий'],
    ]))),
    ...rows('A1', 'FILE4', n([
      ['baby', 'малыш'], ['teenager', 'подросток'], ['adult', 'взрослый'], ['neighbour', 'сосед'],
      ['guest', 'гость'], ['host', 'хозяин'], ['owner', 'владелец'], ['member', 'член'],
      ['group', 'группа'], ['team', 'команда'], ['couple', 'пара'], ['single', 'холостой / одна'],
    ]).concat(a([
      ['married', 'женатый, замужем'], ['single', 'неженатый'], ['young', 'молодой'],
      ['old', 'старый'], ['strong', 'сильный'], ['weak', 'слабый'], ['rich', 'богатый'],
      ['poor', 'бедный'], ['lucky', 'везучий'], ['famous', 'известный'],
    ])).concat(f([
      ['nice to meet you', 'приятно познакомиться'], ['how are you', 'как дела'],
      ['see you later', 'увидимся позже'], ['take care', 'береги себя'],
    ]))),
    ...rows('A1', 'FILE5', n([
      ['soup', 'суп'], ['pizza', 'пицца'], ['burger', 'бургер'], ['chips', 'картофель фри'],
      ['ice cream', 'мороженое'], ['cake', 'торт'], ['chocolate', 'шоколад'], ['biscuit', 'печенье'],
      ['honey', 'мёд'], ['salt', 'соль'], ['pepper', 'перец'], ['oil', 'масло растительное'],
      ['soup', 'суп'], ['yogurt', 'йогурт'], ['cereal', 'хлопья'], ['toast', 'тост'],
    ]).concat(v([
      ['cook', 'готовить'], ['bake', 'печь'], ['boil', 'варить'], ['cut', 'резать'],
      ['mix', 'смешивать'], ['pour', 'наливать'], ['serve', 'подавать'], ['taste', 'пробовать'],
    ]))),
    ...rows('A1', 'FILE6', n([
      ['factory', 'завод'], ['farm', 'ферма'], ['bank', 'банк'], ['post office', 'почта'],
      ['library', 'библиотека'], ['museum', 'музей'], ['cinema', 'кинотеатр'], ['theatre', 'театр'],
      ['park', 'парк'], ['gym', 'спортзал'], ['pool', 'бассейн'], ['beach', 'пляж'],
      ['station', 'станция'], ['airport', 'аэропорт'], ['hospital', 'больница'], ['pharmacy', 'аптека'],
    ]).concat(v([
      ['start', 'начинать'], ['finish', 'заканчивать'], ['arrive', 'прибывать'], ['leave', 'уходить'],
      ['stay', 'оставаться'], ['wait', 'ждать'], ['call', 'звонить'], ['send', 'отправлять'],
    ]))),
    ...rows('A1', 'FILE7', n([
      ['guitar', 'гитара'], ['piano', 'пианино'], ['song', 'песня'], ['band', 'группа'],
      ['dancer', 'танцор'], ['actor', 'актёр'], ['film star', 'кинозвезда'], ['book', 'книга'],
      ['magazine', 'журнал'], ['newspaper', 'газета'], ['radio', 'радио'], ['TV', 'телевизор'],
      ['game', 'игра'], ['puzzle', 'головоломка'], ['hobby', 'хобби'], ['club', 'клуб'],
    ]).concat(v([
      ['listen to', 'слушать'], ['watch', 'смотреть'], ['play', 'играть'], ['collect', 'коллекционировать'],
      ['draw', 'рисовать'], ['paint', 'писать красками'], ['sing', 'петь'], ['dance', 'танцевать'],
    ]))),
    ...rows('A1', 'FILE8', n([
      ['skill', 'навык'], ['ability', 'способность'], ['problem', 'проблема'], ['idea', 'идея'],
      ['plan', 'план'], ['help', 'помощь'], ['advice', 'совет'], ['information', 'информация'],
    ]).concat(v([
      ['try', 'пытаться'], ['help', 'помогать'], ['show', 'показывать'], ['explain', 'объяснять'],
      ['check', 'проверять'], ['choose', 'выбирать'], ['use', 'использовать'], ['change', 'менять'],
    ])).concat(a([
      ['possible', 'возможный'], ['impossible', 'невозможный'], ['important', 'важный'],
      ['useful', 'полезный'], ['dangerous', 'опасный'], ['safe', 'безопасный'],
    ]))),
    ...rows('A1', 'FILE9', n([
      ['sweater', 'свитер'], ['hoodie', 'худи'], ['cap', 'кепка'], ['belt', 'ремень'],
      ['pocket', 'карман'], ['button', 'пуговица'], ['size', 'размер'], ['pair', 'пара'],
      ['cotton', 'хлопок'], ['wool', 'шерсть'], ['leather', 'кожа',], ['silk', 'шёлк'],
    ]).concat(a([
      ['tight', 'тесный'], ['loose', 'свободный'], ['comfortable', 'удобный'], ['smart', 'элегантный'],
      ['casual', 'повседневный'], ['fashionable', 'модный'], ['warm', 'тёплый'], ['cool', 'прохладный, крутой'],
    ]))),
    ...rows('A1', 'FILE10', n([
      ['pillow', 'подушка'], ['blanket', 'одеяло'], ['sheet', 'простыня'], ['alarm clock', 'будильник'],
      ['toothbrush', 'зубная щётка'], ['soap', 'мыло'], ['shampoo', 'шампунь'], ['towel', 'полотенце'],
      ['key', 'ключ'], ['lift', 'лифт'], ['stairs', 'лестница'], ['corridor', 'коридор'],
    ]).concat(v([
      ['sleep', 'спать'], ['wake up', 'просыпаться'], ['get dressed', 'одеваться'], ['have a shower', 'принимать душ'],
      ['have a bath', 'принимать ванну'], ['clean', 'убирать'], ['tidy', 'приводить в порядок'], ['rest', 'отдыхать'],
    ]))),
    ...rows('A1', 'FILE11', v([
      ['become', 'становиться'], ['begin', 'начинать'], ['bring', 'приносить'], ['build', 'строить'],
      ['catch', 'ловить, успевать'], ['cost', 'стоить'], ['cut', 'резать'], ['draw', 'рисовать'],
      ['fall', 'падать'], ['feel', 'чувствовать'], ['fight', 'драться, бороться'], ['forget', 'забывать'],
      ['grow', 'расти'], ['keep', 'хранить'], ['let', 'позволять'], ['lose', 'терять'],
      ['mean', 'значить'], ['meet', 'встречать'], ['pay', 'платить'], ['put', 'класть'],
      ['run', 'бегать'], ['sell', 'продавать'], ['send', 'отправлять'], ['sit', 'сидеть'],
      ['speak', 'говорить'], ['spend', 'тратить, проводить время'], ['stand', 'стоять'], ['swim', 'плавать'],
      ['teach', 'преподавать'], ['think', 'думать'], ['understand', 'понимать'], ['win', 'побеждать'],
      ['write', 'писать'], ['break', 'ломать'], ['choose', 'выбирать'], ['drive', 'водить'],
    ])),
    ...rows('A1', 'FILE12', n([
      ['road', 'дорога'], ['bridge', 'мост'], ['river', 'река'], ['sea', 'море'],
      ['mountain', 'гора'], ['hill', 'холм'], ['island', 'остров'], ['forest', 'лес'],
      ['tree', 'дерево'], ['flower', 'цветок'], ['animal', 'животное'], ['dog', 'собака'],
      ['cat', 'кошка'], ['bird', 'птица'], ['horse', 'лошадь'], ['fish', 'рыба'],
    ]).concat(a([
      ['near', 'близкий'], ['far', 'далёкий'], ['high', 'высокий'], ['low', 'низкий'],
      ['deep', 'глубокий'], ['dark', 'тёмный'], ['bright', 'яркий'], ['quiet', 'тихий'],
    ])).concat(f([
      ['over there', 'вон там'], ['this way', 'сюда'], ['that way', 'туда'],
      ['on the left', 'слева'], ['on the right', 'справа'], ['straight on', 'прямо'],
    ]))),
    ...rows('A2', 'FILE1', n([
      ['application', 'заявление'], ['candidate', 'кандидат'], ['experience', 'опыт'],
      ['qualification', 'квалификация'], ['training', 'обучение'], ['career', 'карьера'],
      ['industry', 'отрасль'], ['staff', 'персонал'], ['department', 'отдел'], ['project', 'проект'],
    ]).concat(v([
      ['apply for', 'подавать заявку на'], ['look for', 'искать'], ['fill in', 'заполнять'],
      ['hand in', 'сдавать'], ['take on', 'брать на работу'], ['get on', 'ладить, продвигаться'],
    ]))),
    ...rows('A2', 'FILE2', n([
      ['skin', 'кожа'], ['hair', 'волосы'], ['eye', 'глаз'], ['nose', 'нос'],
      ['mouth', 'рот'], ['ear', 'ухо'], ['face', 'лицо'], ['smile', 'улыбка'],
      ['voice', 'голос'], ['height', 'рост'], ['weight', 'вес'], ['looks', 'внешность'],
    ]).concat(a([
      ['cheerful', 'жизнерадостный'], ['serious', 'серьёзный'], ['patient', 'терпеливый'],
      ['impatient', 'нетерпеливый'], ['brave', 'храбрый'], ['cowardly', 'трусливый'],
      ['organised', 'организованный'], ['disorganised', 'неорганизованный'],
    ]))),
    ...rows('A2', 'FILE3', n([
      ['ceiling', 'потолок'], ['wall', 'стена'], ['floor', 'пол'], ['roof', 'крыша'],
      ['fence', 'забор'], ['gate', 'калитка'], ['path', 'дорожка'], ['driveway', 'подъезд к дому'],
      ['basement', 'подвал'], ['attic', 'чердак'], ['chimney', 'дымоход'], ['doorbell', 'дверной звонок'],
    ]).concat(a([
      ['modern', 'современный'], ['traditional', 'традиционный'], ['cosy', 'уютный'],
      ['tiny', 'крошечный'], ['huge', 'огромный'], ['bright', 'светлый'],
    ]))),
    ...rows('A2', 'FILE4', n([
      ['invitation', 'приглашение'], ['guest list', 'список гостей'], ['host', 'принимающая сторона'],
      ['festival', 'фестиваль'], ['parade', 'парад'], ['firework', 'фейерверк'],
      ['ticket office', 'билетная касса'], ['booking', 'бронь'], ['review', 'отзыв'], ['rating', 'рейтинг'],
    ]).concat(v([
      ['celebrate', 'праздновать'], ['organise', 'организовывать'], ['attend', 'посещать'],
      ['perform', 'выступать'], ['cheer', 'болеть, подбадривать'], ['record', 'записывать'],
    ]))),
    ...rows('A2', 'FILE5', n([
      ['thunder', 'гром'], ['lightning', 'молния'], ['rainbow', 'радуга'], ['ice', 'лёд'],
      ['frost', 'мороз'], ['humidity', 'влажность'], ['breeze', 'бриз'], ['gale', 'штормовой ветер'],
    ]).concat(v([
      ['shine', 'светить'], ['blow', 'дуть'], ['pour', 'лить (о дожде)'], ['melt', 'таять'],
      ['freeze', 'замерзать'], ['clear up', 'проясняться',],
    ]))),
    ...rows('A2', 'FILE6', f([
      ['how about', 'как насчёт'], ['why don\'t we', 'почему бы нам не'],
      ['let\'s', 'давай(те)'], ['I\'d rather', 'я бы предпочёл'],
      ['it depends', 'зависит'], ['I\'m afraid I can\'t', 'боюсь, не могу'],
      ['sounds good', 'звучит хорошо'], ['count me in', 'я с вами'],
    ]).concat(d([
      ['immediately', 'немедленно'], ['eventually', 'в конце концов'],
      ['currently', 'в настоящее время'], ['recently', 'недавно'],
      ['previously', 'ранее'], ['afterwards', 'впоследствии'],
    ]))),
    ...rows('A2', 'FILE7', n([
      ['anniversary', 'годовщина'], ['wedding', 'свадьба'], ['birthday', 'день рождения'],
      ['graduation', 'выпуск'], ['funeral', 'похороны'], ['reunion', 'воссоединение'],
      ['tradition', 'традиция'], ['custom', 'обычай'], ['generation', 'поколение'], ['ancestor', 'предок'],
    ]).concat(v([
      ['celebrate', 'отмечать'], ['remember', 'помнить'], ['forget', 'забывать'],
      ['look back', 'оглядываться'], ['grow up', 'взрослеть'], ['settle down', 'остепениться'],
    ]))),
    ...rows('A2', 'FILE8', n([
      ['lane', 'полоса'], ['pavement', 'тротуар'], ['crossing', 'переход'], ['sign', 'знак'],
      ['speed limit', 'ограничение скорости'], ['seat belt', 'ремень безопасности'],
      ['helmet', 'шлем'], ['breakdown', 'поломка'], ['petrol', 'бензин'], ['diesel', 'дизель'],
    ]).concat(v([
      ['overtake', 'обгонять'], ['brake', 'тормозить'], ['accelerate', 'ускоряться'],
      ['reverse', 'сдавать назад'], ['park', 'парковаться'], ['indicate', 'включать поворотник'],
    ]))),
    ...rows('A2', 'FILE9', n([
      ['ingredient', 'ингредиент'], ['portion', 'порция'], ['recipe', 'рецепт'],
      ['oven', 'духовка'], ['pan', 'сковорода'], ['pot', 'кастрюля'],
      ['fridge', 'холодильник'], ['freezer', 'морозилка'], ['microwave', 'микроволновка'], ['kettle', 'чайник'],
    ]).concat(a([
      ['raw', 'сырой'], ['cooked', 'приготовленный'], ['ripe', 'спелый'],
      ['stale', 'чёрствый'], ['tender', 'нежный'], ['tough', 'жёсткий'],
    ]))),
    ...rows('A2', 'FILE10', n([
      ['goal', 'цель'], ['plan', 'план'], ['future', 'будущее'], ['chance', 'шанс'],
      ['risk', 'риск'], ['reward', 'награда'], ['progress', 'прогресс'], ['result', 'результат'],
    ]).concat(v([
      ['aim', 'целиться, стремиться'], ['intend', 'намереваться'], ['prepare', 'готовить(ся)'],
      ['improve', 'улучшать'], ['develop', 'развивать'], ['achieve', 'достигать'],
    ]))),
    ...rows('A2', 'FILE11', n([
      ['advertisement', 'реклама'], ['poster', 'постер'], ['logo', 'логотип'],
      ['customer service', 'служба поддержки'], ['guarantee', 'гарантия'], ['exchange', 'обмен'],
      ['stock', 'запас товара'], ['shelf', 'полка'], ['aisle', 'проход в магазине'], ['trolley', 'тележка'],
    ]).concat(v([
      ['advertise', 'рекламировать'], ['promote', 'продвигать'], ['launch', 'запускать (продукт)'],
      ['compare', 'сравнивать'], ['choose', 'выбирать'], ['recommend', 'рекомендовать'],
    ]))),
    ...rows('A2', 'FILE12', n([
      ['achievement', 'достижение'], ['failure', 'неудача'], ['success', 'успех'],
      ['attempt', 'попытка'], ['challenge', 'вызов'], ['opportunity', 'возможность'],
      ['talent', 'талант'], ['practice', 'практика'], ['progress', 'прогресс'], ['level', 'уровень'],
    ]).concat(v([
      ['attempt', 'пытаться'], ['manage', 'удаваться, справляться'], ['fail', 'терпеть неудачу'],
      ['succeed', 'добиваться успеха'], ['improve', 'улучшаться'], ['give up', 'сдаваться'],
    ]))),
    ...rows('B1', 'FILE1', n([
      ['priority', 'приоритет'], ['schedule', 'график'], ['habit tracker', 'трекер привычек'],
      ['well-being', 'благополучие'], ['self-care', 'забота о себе'], ['boundary', 'граница'],
    ]).concat(v([
      ['prioritise', 'расставлять приоритеты'], ['multitask', 'делать несколько дел сразу'],
      ['unwind', 'расслабляться'], ['switch off', 'отключаться'], ['keep up with', 'успевать за'],
    ]))),
    ...rows('B1', 'FILE2', n([
      ['overdraft', 'овердрафт'], ['interest rate', 'процентная ставка'], ['installment', 'рассрочка'],
      ['fee', 'комиссия'], ['statement', 'выписка'], ['PIN', 'пин-код'],
    ]).concat(v([
      ['transfer', 'переводить деньги'], ['withdraw', 'снимать наличные'],
      ['deposit', 'вносить на счёт'], ['charge', 'списывать'], ['owe', 'быть должным'],
    ]))),
    ...rows('B1', 'FILE3', n([
      ['bond', 'связь'], ['trust', 'доверие'], ['conflict', 'конфликт'],
      ['compromise', 'компромисс'], ['empathy', 'эмпатия'], ['peer pressure', 'давление сверстников'],
    ]).concat(v([
      ['confide in', 'доверять секреты'], ['stand by', 'поддерживать'],
      ['let down', 'подводить'], ['put up with', 'мириться с'], ['look after', 'заботиться'],
    ]))),
    ...rows('B1', 'FILE4', n([
      ['cybercrime', 'киберпреступление'], ['identity theft', 'кража личности'],
      ['scam', 'мошенничество'], ['phishing', 'фишинг'], ['ransom', 'выкуп'], ['alibi', 'алиби'],
    ]).concat(v([
      ['investigate', 'расследовать'], ['convict', 'осуждать'], ['acquit', 'оправдывать'],
      ['deter', 'сдерживать'], ['prevent', 'предотвращать'],
    ]))),
    ...rows('B1', 'FILE5', n([
      ['immune system', 'иммунитет'], ['side effect', 'побочный эффект'],
      ['checkup', 'медосмотр'], ['first aid', 'первая помощь'], ['mental health', 'психическое здоровье'],
      ['therapy', 'терапия'],
    ]).concat(v([
      ['diagnose', 'диагностировать'], ['prescribe', 'прописывать'],
      ['prevent', 'предотвращать'], ['recover from', 'восстанавливаться после'],
    ]))),
    ...rows('B1', 'FILE6', n([
      ['landfill', 'свалка'], ['compost', 'компост'], ['microplastic', 'микропластик'],
      ['sea level', 'уровень моря'], ['ice cap', 'ледяная шапка'], ['species', 'вид'],
    ]).concat(v([
      ['cut down', 'вырубать'], ['die out', 'вымирать'], ['clean up', 'очищать'],
      ['switch to', 'переходить на'], ['cut emissions', 'сокращать выбросы'],
    ]))),
    ...rows('B1', 'FILE7', n([
      ['literacy', 'грамотность'], ['numeracy', 'счёт, математическая грамотность'],
      ['curriculum', 'учебный план'], ['scholarship', 'стипендия'], ['tuition', 'плата за обучение'],
      ['distance learning', 'дистанционное обучение'],
    ]).concat(v([
      ['enrol on', 'записываться на'], ['sit an exam', 'сдавать экзамен'],
      ['skip class', 'пропускать занятия'], ['hand in', 'сдавать работу'],
    ]))),
    ...rows('B1', 'FILE8', n([
      ['podcast', 'подкаст'], ['livestream', 'прямая трансляция'], ['paywall', 'платный доступ'],
      ['algorithm', 'алгоритм'], ['trending', 'в тренде'], ['hashtag', 'хештег'],
    ]).concat(v([
      ['binge-watch', 'смотреть запоем'], ['fact-check', 'проверять факты'],
      ['go viral', 'разлететься'], ['unfollow', 'отписаться'],
    ]))),
    ...rows('B1', 'FILE9', n([
      ['notification', 'уведомление'], ['settings', 'настройки'], ['storage', 'хранилище'],
      ['bandwidth', 'пропускная способность'], ['bug', 'баг'], ['update', 'обновление'],
    ]).concat(v([
      ['log in', 'входить'], ['log out', 'выходить'], ['sign up', 'регистрироваться'],
      ['back up', 'делать бэкап'], ['wipe', 'стирать данные'],
    ]))),
    ...rows('B1', 'FILE10', n([
      ['layover', 'пересадка'], ['red-eye', 'ночной рейс'], ['aisle', 'проход в самолёте'],
      ['window seat', 'место у окна'], ['all-inclusive', 'всё включено'], ['self-catering', 'самостоятельное питание'],
    ]).concat(v([
      ['stop over', 'делать остановку'], ['check in online', 'регистрироваться онлайн'],
      ['go sightseeing', 'осматривать город'], ['travel light', 'путешествовать налегке'],
    ]))),
    ...rows('B1', 'FILE11', n([
      ['networking', 'нетворкинг'], ['mentorship', 'наставничество'], ['side hustle', 'подработка'],
      ['work ethic', 'трудовая этика'], ['office politics', 'офисные интриги'], ['glass ceiling', 'стеклянный потолок'],
    ]).concat(v([
      ['network', 'налаживать связи'], ['step down', 'уходить с должности'],
      ['take over', 'брать на себя руководство'], ['climb the ladder', 'делать карьеру'],
    ]))),
    ...rows('B1', 'FILE12', n([
      ['warmup', 'разминка'], ['cooldown', 'заминка'], ['endurance', 'выносливость'],
      ['flexibility', 'гибкость'], ['personal best', 'личный рекорд'], ['league', 'лига'],
    ]).concat(v([
      ['warm up', 'разминаться'], ['work out', 'тренироваться'],
      ['knock out', 'нокаутировать'], ['equalise', 'сравнять счёт'],
    ]))),
  ];
}
