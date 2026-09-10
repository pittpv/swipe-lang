import { expandPos } from '../lib/csv-util.js';

function pack(cefr, unit, pos, pairs) {
  return pairs.map(([lemma, translation]) => ({
    cefr, unit, lemma, translation, pos: expandPos(pos), example: '', translate: '',
  }));
}

/** Extra CEFR lexis to thicken English File coverage without duplicating unit themes. */
export function englishFill() {
  return [
    ...pack('A1', 'FILE1', 'N', [
      ['zero', 'ноль'], ['eleven', 'одиннадцать'], ['twelve', 'двенадцать'],
      ['student card', 'студенческий билет'], ['first name', 'имя'], ['surname', 'фамилия'],
      ['Mr', 'господин'], ['Mrs', 'госпожа'], ['Ms', 'госпожа (нейтр.)'],
    ]),
    ...pack('A1', 'FILE3', 'N', [
      ['headphones', 'наушники'], ['charger', 'зарядка'], ['notebook', 'блокнот'],
      ['rubber', 'ластик'], ['ruler', 'линейка'], ['scissors', 'ножницы'],
      ['stamp', 'марка'], ['envelope', 'конверт'], ['package', 'посылка'],
    ]),
    ...pack('A1', 'FILE4', 'N', [
      ['twin', 'близнец'], ['only child', 'единственный ребёнок'], ['relative', 'родственник'],
      ['pet', 'питомец'], ['dog', 'собака'], ['cat', 'кошка'], ['bird', 'птица'], ['fish', 'рыба'],
    ]),
    ...pack('A1', 'FILE5', 'N', [
      ['strawberry', 'клубника'], ['grape', 'виноград'], ['lemon', 'лимон'], ['peach', 'персик'],
      ['carrot', 'морковь'], ['onion', 'лук'], ['garlic', 'чеснок'], ['cucumber', 'огурец'],
      ['pepper', 'перец'], ['mushroom', 'гриб'], ['bean', 'фасоль'], ['pea', 'горох'],
    ]),
    ...pack('A1', 'FILE12', 'N', [
      ['lion', 'лев'], ['tiger', 'тигр'], ['elephant', 'слон'], ['monkey', 'обезьяна'],
      ['bear', 'медведь'], ['wolf', 'волк'], ['fox', 'лиса'], ['rabbit', 'кролик'],
      ['cow', 'корова'], ['pig', 'свинья'], ['sheep', 'овца'], ['chicken', 'курица'],
      ['duck', 'утка'], ['mouse', 'мышь'], ['snake', 'змея'], ['frog', 'лягушка'],
    ]),
    ...pack('A1', 'FILE11', 'N', [
      ['head', 'голова'], ['face', 'лицо'], ['eye', 'глаз'], ['ear', 'ухо'],
      ['nose', 'нос'], ['mouth', 'рот'], ['tooth', 'зуб'], ['hair', 'волосы'],
      ['neck', 'шея'], ['shoulder', 'плечо'], ['arm', 'рука'], ['hand', 'кисть'],
      ['finger', 'палец'], ['leg', 'нога'], ['foot', 'ступня'], ['back', 'спина'],
      ['stomach', 'живот'], ['heart', 'сердце'], ['blood', 'кровь'],
    ]),
    ...pack('A2', 'FILE1', 'N', [
      ['architect', 'архитектор'], ['accountant', 'бухгалтер'], ['translator', 'переводчик'],
      ['designer', 'дизайнер'], ['programmer', 'программист'], ['scientist', 'учёный'],
      ['librarian', 'библиотекарь'], ['electrician', 'электрик'], ['carpenter', 'плотник'],
    ]),
    ...pack('A2', 'FILE3', 'N', [
      ['microwave', 'микроволновка'], ['toaster', 'тостер'], ['kettle', 'чайник'],
      ['blender', 'блендер'], ['vacuum cleaner', 'пылесос'], ['iron', 'утюг'],
      ['radiator', 'батарея'], ['plug', 'вилка, розетка'], ['switch', 'выключатель'],
    ]),
    ...pack('A2', 'FILE7', 'V', [
      ['be born', 'рождаться'], ['grow up', 'расти'], ['fall in love', 'влюбляться'],
      ['get engaged', 'помолвиться'], ['have a baby', 'родить ребёнка'], ['pass away', 'умереть'],
    ]),
    ...pack('A2', 'FILE8', 'N', [
      ['passport control', 'паспортный контроль'], ['security', 'досмотр'],
      ['departure', 'вылет, отправление'], ['arrival', 'прибытие'],
      ['delay', 'задержка'], ['cancellation', 'отмена'],
    ]),
    ...pack('A2', 'FILE9', 'N', [
      ['flour', 'мука'], ['yeast', 'дрожжи'], ['vinegar', 'уксус'], ['herb', 'трава'],
      ['spice', 'специя'], ['mustard', 'горчица'], ['ketchup', 'кетчуп'], ['mayonnaise', 'майонез'],
    ]),
    ...pack('B1', 'FILE1', 'A', [
      ['hectic', 'суматошный'], ['sedentary', 'сидячий'], ['mindful', 'осознанный'],
      ['burnt out', 'выгоревший'], ['well-rested', 'выспавшийся'],
    ]),
    ...pack('B1', 'FILE2', 'N', [
      ['cryptocurrency', 'криптовалюта'], ['contactless', 'бесконтактный'],
      ['standing order', 'постоянное поручение'], ['direct debit', 'прямое дебетование'],
    ]),
    ...pack('B1', 'FILE5', 'N', [
      ['vaccine', 'вакцина'], ['antibiotic', 'антибиотик'], ['bandage', 'бинт'],
      ['crutches', 'костыли'], ['wheelchair', 'инвалидная коляска'], ['allergy', 'аллергия'],
    ]),
    ...pack('B1', 'FILE6', 'N', [
      ['smog', 'смог'], ['acid rain', 'кислотный дождь'], ['overfishing', 'перелов рыбы'],
      ['poaching', 'браконьерство'], ['single-use', 'одноразовый'],
    ]),
    ...pack('B1', 'FILE7', 'N', [
      ['kindergarten', 'детский сад'], ['boarding school', 'интернат'],
      ['vocational', 'профессиональный'], ['gap year', 'год перерыва'],
      ['dissertation', 'диссертация'], ['plagiarism', 'плагиат'],
    ]),
    ...pack('B2', 'FILE1', 'N', [
      ['persona', 'публичный образ'], ['self-image', 'представление о себе'],
      ['peer group', 'группа сверстников'], ['role model', 'пример для подражания'],
    ]),
    ...pack('B2', 'FILE4', 'V', [
      ['back up', 'подтверждать, подкреплять'], ['play down', 'преуменьшать'],
      ['play up', 'раздувать'], ['water down', 'размывать (идею)'],
    ]),
    ...pack('B2', 'FILE6', 'N', [
      ['clinical trial', 'клиническое испытание'], ['peer-reviewed', 'рецензируемый'],
      ['sample size', 'размер выборки'], ['control group', 'контрольная группа'],
    ]),
    ...pack('C1', 'FILE1', 'N', [
      ['caveat', 'оговорка'], ['corollary', 'следствие'], ['leitmotif', 'лейтмотив'],
      ['touchstone', 'критерий'], ['yardstick', 'мерка'],
    ]),
    ...pack('C1', 'FILE3', 'N', [
      ['dark pattern', 'тёмный паттерн'], ['attention economy', 'экономика внимания'],
      ['surveillance capitalism', 'капитализм слежки'],
    ]),
    ...pack('C1', 'FILE5', 'N', [
      ['just transition', 'справедливый переход'], ['loss and damage', 'убытки и ущерб'],
      ['carbon budget', 'углеродный бюджет'],
    ]),
    ...pack('C2', 'FILE1', 'A', [
      ['recondite', 'малопонятный'], ['perspicuous', 'ясный'], ['orotund', 'напыщенный'],
      ['lapidary', 'лапидарный'], ['gnomic', 'гномический'],
    ]),
  ];
}
