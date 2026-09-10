import { expandPos } from '../lib/csv-util.js';

function pack(cefr, unit, pos, pairs) {
  return pairs.map(([lemma, translation]) => ({
    cefr, unit, lemma, translation, pos: expandPos(pos), example: '', translate: '',
  }));
}

export function aulaFill() {
  return [
    ...pack('A1', 'UNIDAD1', 'N', [
      ['uno', 'один'], ['dos', 'два'], ['tres', 'три'], ['cuatro', 'четыре'],
      ['cinco', 'пять'], ['seis', 'шесть'], ['siete', 'семь'], ['ocho', 'восемь'],
      ['nueve', 'девять'], ['diez', 'десять'], ['veinte', 'двадцать'], ['cien', 'сто'],
      ['año', 'год'], ['mes', 'месяц'], ['semana', 'неделя'], ['día', 'день'],
    ]),
    ...pack('A1', 'UNIDAD2', 'N', [
      ['Portugal', 'Португалия'], ['Marruecos', 'Марокко'], ['Chile', 'Чили'],
      ['Colombia', 'Колумбия'], ['Perú', 'Перу'], ['Cuba', 'Куба'],
      ['arquitecto', 'архитектор'], ['informático', 'айтишник'], ['traductor', 'переводчик'],
      ['peluquero', 'парикмахер'], ['mecánico', 'механик'], ['bombero', 'пожарный'],
    ]),
    ...pack('A1', 'UNIDAD3', 'N', [
      ['panadería', 'булочная'], ['carnicería', 'мясная'], ['pescadería', 'рыбный магазин'],
      ['frutería', 'фруктовый магазин'], ['librería', 'книжный'], ['kiosco', 'киоск'],
      ['estanco', 'табачный киоск'], ['gasolinera', 'заправка'], ['comisaría', 'полиция'],
      ['ayuntamiento', 'мэрия'], ['estadio', 'стадион'], ['piscina', 'бассейн'],
    ]),
    ...pack('A1', 'UNIDAD4', 'N', [
      ['ajedrez', 'шахматы'], ['videojuego', 'видеоигра'], ['senderismo', 'пеший туризм'],
      ['ciclismo', 'велоспорт'], ['yoga', 'йога'], ['lectura', 'чтение'],
      ['jardinería', 'садоводство'], ['manualidades', 'рукоделие'],
    ]),
    ...pack('A1', 'UNIDAD5', 'N', [
      ['enero', 'январь'], ['febrero', 'февраль'], ['marzo', 'март'], ['abril', 'апрель'],
      ['mayo', 'май'], ['junio', 'июнь'], ['julio', 'июль'], ['agosto', 'август'],
      ['septiembre', 'сентябрь'], ['octubre', 'октябрь'], ['noviembre', 'ноябрь'], ['diciembre', 'декабрь'],
    ]),
    ...pack('A1', 'UNIDAD6', 'N', [
      ['jamón', 'хамон'], ['chorizo', 'чоризо'], ['tortilla', 'тортилья'], ['paella', 'паэлья'],
      ['gazpacho', 'гаспачо'], ['tapas', 'тапас'], ['churros', 'чуррос'], ['flan', 'флан'],
      ['aceituna', 'оливка'], ['garbanzo', 'нут'], ['lenteja', 'чечевица'], ['atún', 'тунец'],
    ]),
    ...pack('A1', 'UNIDAD7', 'N', [
      ['pendientes', 'серьги'], ['collar', 'ожерелье'], ['anillo', 'кольцо'], ['pulsera', 'браслет'],
      ['moño', 'пучок'], ['trenza', 'коса'], ['maquillaje', 'макияж'], ['perfume', 'духи'],
    ]),
    ...pack('A1', 'UNIDAD8', 'N', [
      ['cejas', 'брови'], ['pestañas', 'ресницы'], ['mejilla', 'щека'], ['mentón', 'подбородок'],
      ['frente', 'лоб'], ['labios', 'губы'], ['pecas', 'веснушки'], ['arrugas', 'морщины'],
    ]),
    ...pack('A1', 'UNIDAD9', 'N', [
      ['museo', 'музей'], ['castillo', 'замок'], ['catedral', 'собор'], ['mercado', 'рынок'],
      ['playa', 'пляж'], ['isla', 'остров'], ['lago', 'озеро'], ['bosque', 'лес'],
    ]),
    ...pack('A1', 'UNIDAD1', 'V', [
      ['contar', 'считать, рассказывать'], ['preguntar', 'спрашивать'], ['contestar', 'отвечать'],
      ['presentar', 'представлять'], ['saludarse', 'здороваться'], ['despedirse', 'прощаться'],
    ]),
    ...pack('A1', 'UNIDAD3', 'V', [
      ['caminar', 'идти пешком'], ['coger', 'брать, садиться на (транспорт)'],
      ['bajar', 'спускаться, выходить'], ['subir', 'подниматься'],
      ['cruzar', 'переходить'], ['seguir', 'следовать'], ['parar', 'останавливаться'],
    ]),
    ...pack('A1', 'UNIDAD6', 'V', [
      ['cocinar', 'готовить'], ['probar', 'пробовать'], ['pedir', 'заказывать'],
      ['invitar', 'приглашать'], ['compartir', 'делиться'], ['probar', 'пробовать'],
    ]),
    ...pack('A2', 'UNIDAD1', 'A', [
      ['frustrado', 'расстроенный'], ['motivado', 'мотивированный'], ['confundido', 'сбитый с толку'],
      ['orgulloso', 'гордый'], ['avergonzado', 'пристыженный'], ['celoso', 'ревнивый'],
    ]),
    ...pack('A2', 'UNIDAD2', 'N', [
      ['guerra', 'война'], ['paz', 'мир'], ['descubrimiento', 'открытие'], ['invento', 'изобретение'],
      ['independencia', 'независимость'], ['revolución', 'революция'],
    ]),
    ...pack('A2', 'UNIDAD3', 'N', [
      ['ático', 'мансарда'], ['dúplex', 'двухуровневая квартира'], ['adosado', 'таунхаус'],
      ['chalet', 'коттедж'], ['estudio', 'студия'], ['trastero', 'кладовка'],
    ]),
    ...pack('A2', 'UNIDAD4', 'N', [
      ['caldo', 'бульон'], ['salsa', 'соус'], ['rebozado', 'в кляре'], ['al horno', 'запечённый'],
      ['a la plancha', 'на гриле'], ['crudo', 'сырой'],
    ]),
    ...pack('A2', 'UNIDAD5', 'N', [
      ['tensión', 'давление'], ['mareo', 'головокружение'], ['náuseas', 'тошнота'],
      ['esguince', 'растяжение'], ['fractura', 'перелом'], ['alergia', 'аллергия'],
    ]),
    ...pack('A2', 'UNIDAD7', 'N', [
      ['albergue', 'хостел'], ['camping', 'кемпинг'], ['pensión', 'пансион'],
      ['habitación individual', 'одноместный номер'], ['vista al mar', 'вид на море'],
    ]),
    ...pack('A2', 'UNIDAD8', 'V', [
      ['abrazar', 'обнимать'], ['besar', 'целовать'], ['sonreír', 'улыбаться'],
      ['llorar', 'плакать'], ['gritar', 'кричать'], ['suspirar', 'вздыхать'],
    ]),
    ...pack('A2', 'UNIDAD9', 'N', [
      ['videoconsola', 'игровая приставка'], ['casete', 'кассета'], ['walkman', 'плейер'],
      ['carta', 'письмо'], ['cabina', 'телефонная будка'], ['disco de vinilo', 'виниловая пластинка'],
    ]),
    ...pack('A2', 'UNIDAD10', 'V', [
      ['tropezar', 'спотыкаться'], ['caerse', 'падать'], ['perderse', 'теряться'],
      ['encontrarse', 'встречать(ся)'], ['descubrirse', 'обнаруживать себя'],
    ]),
    ...pack('B1', 'UNIDAD1', 'N', [
      ['currículum vitae', 'резюме'], ['carta de presentación', 'сопроводительное письмо'],
      ['jornada completa', 'полный день'], ['media jornada', 'полставки'],
      ['horas extra', 'сверхурочные'], ['baja por maternidad', 'декрет'],
    ]),
    ...pack('B1', 'UNIDAD2', 'N', [
      ['jubilación', 'пенсия'], ['hipoteca', 'ипотека'], ['ahorro', 'накопление'],
      ['inversión', 'инвестиция'], ['emprendimiento', 'предпринимательство'],
    ]),
    ...pack('B1', 'UNIDAD4', 'V', [
      ['exagerar', 'преувеличивать'], ['resumir', 'кратко излагать'],
      ['matizar', 'вносить нюанс'], ['aclarar', 'прояснять'],
    ]),
    ...pack('B1', 'UNIDAD5', 'V', [
      ['calentar', 'разогревать'], ['estirar', 'растягивать'], ['hidratarse', 'пить воду'],
      ['calmarse', 'успокаиваться'], ['respirar', 'дышать'],
    ]),
    ...pack('B1', 'UNIDAD6', 'N', [
      ['ilusión', 'радость ожидания'], ['decepción', 'разочарование'],
      ['orgullo', 'гордость'], ['vergüenza', 'стыд'], ['envidia', 'зависть'], ['celos', 'ревность'],
    ]),
    ...pack('B1', 'UNIDAD7', 'N', [
      ['asa', 'ручка'], ['tapa', 'крышка'], ['rueda', 'колесо'], ['pantalla', 'экран'],
      ['botón', 'кнопка'], ['cable', 'кабель'], ['pila', 'батарейка'], ['enchufe', 'розетка'],
    ]),
    ...pack('B1', 'UNIDAD8', 'N', [
      ['huelga', 'забастовка'], ['sindicato', 'профсоюз'], ['manifestante', 'демонстрант'],
      ['urna', 'урна для голосования'], ['escaño', 'депутатское место'],
    ]),
    ...pack('B1', 'UNIDAD9', 'A', [
      ['introvertido', 'интроверт'], ['extrovertido', 'экстраверт'],
      ['empático', 'эмпатичный'], ['narcisista', 'нарциссический'],
      ['resolutivo', 'решительный'], ['indeciso', 'нерешительный'],
    ]),
    ...pack('B1', 'UNIDAD10', 'N', [
      ['plástico de un solo uso', 'одноразовый пластик'], ['contenedor', 'контейнер'],
      ['punto limpio', 'пункт вторсырья'], ['huella ecológica', 'экологический след'],
    ]),
    ...pack('B1', 'UNIDAD11', 'F', [
      ['en primer lugar', 'во-первых'], ['en segundo lugar', 'во-вторых'],
      ['por último', 'наконец'], ['dicho esto', 'сказав это'],
      ['ahora bien', 'однако'], ['en definitiva', 'в итоге'],
    ]),
    ...pack('B1', 'UNIDAD12', 'V', [
      ['asegurar', 'заверять'], ['negar', 'отрицать'], ['admitir', 'признавать'],
      ['sugerir', 'предлагать'], ['ordenar', 'приказывать'],
    ]),
    ...pack('B2', 'UNIDAD1', 'N', [
      ['acento regional', 'региональный акцент'], ['costumbre local', 'местный обычай'],
      ['fiesta nacional', 'национальный праздник'], ['himno', 'гимн'],
    ]),
    ...pack('B2', 'UNIDAD2', 'N', [
      ['titular clickbait', 'кликбейт-заголовок'], ['periodismo de investigación', 'расследовательская журналистика'],
      ['libertad de prensa', 'свобода прессы'], ['censura', 'цензура'],
    ]),
    ...pack('B2', 'UNIDAD3', 'N', [
      ['obsolescencia programada', 'запланированное устаревание'], ['consumo responsable', 'ответственное потребление'],
      ['comercio justo', 'справедливая торговля'], ['economía colaborativa', 'шеринг-экономика'],
    ]),
    ...pack('B2', 'UNIDAD4', 'N', [
      ['emisiones', 'выбросы'], ['deshielo', 'таяяние льдов'], ['escasez de agua', 'нехватка воды'],
      ['residuos nucleares', 'ядерные отходы'], ['vehículo eléctrico', 'электромобиль'],
    ]),
    ...pack('B2', 'UNIDAD5', 'N', [
      ['turismo de masas', 'массовый туризм'], ['gentrificación', 'джентрификация'],
      ['alquiler vacacional', 'посуточная аренда'], ['tasa turística', 'туристический сбор'],
    ]),
    ...pack('B2', 'UNIDAD6', 'N', [
      ['juego limpio', 'честная игра'], ['apuesta', 'ставка'], ['violencia en el deporte', 'насилие в спорте'],
      ['deporte adaptado', 'адаптивный спорт'],
    ]),
    ...pack('B2', 'UNIDAD7', 'N', [
      ['convivencia', 'совместная жизнь'], ['espacio personal', 'личное пространство'],
      ['dependencia emocional', 'эмоциональная зависимость'], ['límite', 'граница'],
    ]),
    ...pack('B2', 'UNIDAD8', 'N', [
      ['educación pública', 'государственное образование'], ['universidad privada', 'частный вуз'],
      ['notas', 'оценки'], ['selectividad', 'вступительные экзамены'],
    ]),
    ...pack('B2', 'UNIDAD9', 'N', [
      ['platea', 'партер'], ['palco', 'ложа'], ['telón', 'занавес'], ['tramoya', 'кулисы'],
      ['entrada agotada', 'аншлаг'],
    ]),
    ...pack('B2', 'UNIDAD10', 'N', [
      ['tercera vía', 'третья сторона'], ['acuerdo', 'соглашение'], ['impasse', 'тупик'],
      ['buena fe', 'добросовестность'],
    ]),
    ...pack('B2', 'UNIDAD11', 'N', [
      ['lead', 'лид, зачин'], ['entradilla', 'вводка'], ['cierre', 'концовка'],
      ['fuente anónima', 'анонимный источник'],
    ]),
    ...pack('B2', 'UNIDAD12', 'F', [
      ['como si nada', 'как ни в чём не бывало'], ['ni que decir tiene', 'само собой'],
      ['puesto que', 'поскольку'], ['a condición de que', 'при условии что'],
    ]),
    ...pack('A1', 'UNIDAD2', 'A', [
      ['portugués', 'португальский'], ['árabe', 'арабский'], ['turco', 'турецкий'],
      ['griego', 'греческий'], ['polaco', 'польский'], ['sueco', 'шведский'],
    ]),
    ...pack('A1', 'UNIDAD5', 'D', [
      ['temprano', 'рано'], ['tarde', 'поздно'], ['luego', 'потом'], ['después', 'после'],
      ['antes', 'до'], ['ahora', 'сейчас'],
    ]),
    ...pack('A2', 'UNIDAD3', 'A', [
      ['céntrico', 'в центре'], ['residencial', 'жилой'], ['industrial', 'промышленный'],
      ['turístico', 'туристический'], ['universitario', 'университетский'],
    ]),
    ...pack('B1', 'UNIDAD3', 'V', [
      ['multar', 'штрафовать'], ['denunciar', 'заявлять'], ['cumplir', 'соблюдать'],
      ['infringir', 'нарушать'], ['regular', 'регулировать'],
    ]),
  ];
}
