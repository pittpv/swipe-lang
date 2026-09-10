import { expandPos } from '../lib/csv-util.js';

function rows(cefr, unit, list) {
  return list.map(([lemma, translation, pos]) => ({
    cefr, unit, lemma, translation, pos: expandPos(pos), example: '', translate: '',
  }));
}

export function aulaCoreExtra() {
  return [
    ...pack('A1', 'UNIDAD1', 'N', [
      ['mundo', 'мир'], ['palabra', 'слово'], ['pregunta', 'вопрос'], ['respuesta', 'ответ'],
      ['ejemplo', 'пример'], ['error', 'ошибка'], ['página', 'страница'], ['letra', 'буква'],
      ['mapa', 'карта'], ['cartel', 'плакат'], ['mochila', 'рюкзак'], ['carpeta', 'папка'],
    ]),
    ...pack('A1', 'UNIDAD1', 'V', [
      ['abrir', 'открывать'], ['cerrar', 'закрывать'], ['escribir', 'писать'], ['leer', 'читать'],
      ['escuchar', 'слушать'], ['mirar', 'смотреть'], ['entrar', 'входить'], ['salir', 'выходить'],
      ['sentarse', 'садиться'], ['levantar la mano', 'поднимать руку'],
    ]),
    ...pack('A1', 'UNIDAD2', 'N', [
      ['pasaporte', 'паспорт'], ['foto', 'фото'], ['formulario', 'бланк'],
      ['número de teléfono', 'номер телефона'], ['web', 'сайт'], ['usuario', 'пользователь'],
      ['contraseña', 'пароль'], ['perfil', 'профиль'],
    ]),
    ...pack('A1', 'UNIDAD2', 'V', [
      ['llenar', 'заполнять'], ['firmar', 'подписывать'], ['enviar', 'отправлять'], ['recibir', 'получать'],
    ]),
    ...pack('A1', 'UNIDAD3', 'N', [
      ['edificio', 'здание'], ['puente', 'мост'], ['semáforo', 'светофор'], ['esquina', 'угол'],
      ['centro', 'центр'], ['afueras', 'окраина'], ['tráfico', 'движение'], ['aparcamiento', 'парковка'],
      ['metro', 'метро'], ['autobús', 'автобус'], ['taxi', 'такси'], ['bici', 'велосипед'],
    ]),
    ...pack('A1', 'UNIDAD3', 'D', [
      ['arriba', 'наверху'], ['abajo', 'внизу'], ['dentro', 'внутри'], ['fuera', 'снаружи'],
    ]),
    ...pack('A1', 'UNIDAD4', 'N', [
      ['instrumento', 'инструмент'], ['guitarra', 'гитара'], ['piano', 'пианино'], ['canción', 'песня'],
      ['concierto', 'концерт'], ['equipo', 'команда'], ['partido', 'матч'], ['aficionado', 'болельщик'],
    ]),
    ...pack('A1', 'UNIDAD5', 'N', [
      ['despertador', 'будильник'], ['ducha', 'душ'], ['cepillo', 'щётка'], ['jabón', 'мыло'],
      ['toalla', 'полотенце'], ['cama', 'кровать'], ['sueño', 'сон'], ['descanso', 'отдых'],
    ]),
    ...pack('A1', 'UNIDAD5', 'V', [
      ['cepillarse', 'чистить зубы'], ['lavarse', 'мыться'], ['afeitarse', 'бриться'], ['maquillarse', 'краситься'],
    ]),
    ...pack('A1', 'UNIDAD6', 'N', [
      ['cucharilla', 'чайная ложка'], ['tenedor', 'вилка'], ['cuchillo', 'нож'], ['plato', 'тарелка'],
      ['vaso', 'стакан'], ['taza', 'чашка'], ['servilleta', 'салфетка'], ['menú', 'меню'],
      ['postre', 'десерт'], ['entrante', 'закуска'],
    ]),
    ...pack('A1', 'UNIDAD7', 'N', [
      ['bolso', 'сумка'], ['cartera', 'кошелёк'], ['reloj', 'часы'], ['gafas de sol', 'солнечные очки'],
      ['paraguas', 'зонт'], ['sudadera', 'толстовка'], ['bañador', 'купальник'], ['cinturón', 'ремень'],
    ]),
    ...pack('A1', 'UNIDAD8', 'A', [
      ['rubio', 'светловолосый'], ['moreno', 'брюнет'], ['pelirrojo', 'рыжий'],
      ['calvo', 'лысый'], ['rizado', 'кудрявый'], ['liso', 'прямой'],
      ['alegre', 'весёлый'], ['triste', 'грустный'], ['grosero', 'грубый'],
    ]),
    ...pack('A1', 'UNIDAD9', 'V', [
      ['aprender', 'учить'], ['enseñar', 'преподавать'], ['decidir', 'решать'],
      ['olvidar', 'забывать'], ['recordar', 'помнить'], ['ayudar', 'помогать'],
      ['necesitar', 'нуждаться'], ['buscar', 'искать'], ['encontrar', 'находить'], ['probar', 'пробовать'],
    ]),
    ...pack('A2', 'UNIDAD1', 'N', [
      ['dialecto', 'диалект'], ['jerga', 'жаргон'], ['traducción', 'перевод'], ['diccionario', 'словарь'],
    ]),
    ...pack('A2', 'UNIDAD1', 'V', [
      ['dudar', 'сомневаться'], ['confundir', 'путать'], ['aclarar', 'прояснять'], ['resumir', 'резюмировать'],
    ]),
    ...pack('A2', 'UNIDAD2', 'N', [
      ['logro', 'достижение'], ['meta', 'цель'], ['etapa', 'этап'], ['legado', 'наследие'],
    ]),
    ...pack('A2', 'UNIDAD2', 'V', [
      ['fundar', 'основывать'], ['publicar', 'публиковать'], ['inventar', 'изобретать'], ['dirigir', 'руководить'],
    ]),
    ...pack('A2', 'UNIDAD3', 'N', [
      ['inquilino', 'арендатор'], ['casero', 'арендодатель'], ['hipoteca', 'ипотека'], ['comunidad', 'ТСЖ'],
    ]),
    ...pack('A2', 'UNIDAD4', 'N', [
      ['horno', 'духовка'], ['sartén', 'сковорода'], ['cazuela', 'кастрюля'], ['microondas', 'микроволновка'],
    ]),
    ...pack('A2', 'UNIDAD4', 'V', [
      ['pelar', 'чистить'], ['picar', 'нарезать'], ['remover', 'помешивать'], ['sazonar', 'приправлять'],
    ]),
    ...pack('A2', 'UNIDAD5', 'N', [
      ['síntoma', 'симптом'], ['cita médica', 'запись к врачу'], ['urgencia', 'неотложка'], ['seguro médico', 'медстраховка'],
    ]),
    ...pack('A2', 'UNIDAD5', 'V', [
      ['toser', 'кашлять'], ['estornudar', 'чихать'], ['sangrar', 'кровоточить'], ['curar', 'лечить'],
    ]),
    ...pack('A2', 'UNIDAD6', 'N', [
      ['taquilla', 'касса'], ['reparto', 'актёрский состав'], ['guion', 'сценарий'], ['estreno', 'премьера'],
    ]),
    ...pack('A2', 'UNIDAD7', 'N', [
      ['escala', 'пересадка'], ['asiento', 'сиденье'], ['pasillo', 'проход'], ['ventanilla', 'иллюминатор'],
      ['aduana', 'таможня'], ['visa', 'виза'], ['seguro de viaje', 'страховка поездки'],
    ]),
    ...pack('A2', 'UNIDAD8', 'N', [
      ['muñeca', 'запястье'], ['tobillo', 'лодыжка'], ['codo', 'локоть'], ['pulmón', 'лёгкое'],
      ['hígado', 'печень'], ['sangre', 'кровь'], ['hueso', 'кость'], ['músculo', 'мышца'],
    ]),
    ...pack('A2', 'UNIDAD9', 'D', [
      ['antiguamente', 'в старину'], ['actualmente', 'в настоящее время'],
      ['habitualmente', 'обычно'], ['raramente', 'редко'],
    ]),
    ...pack('A2', 'UNIDAD10', 'F', [
      ['para colmo', 'в довершение всего'], ['menos mal', 'хорошо хоть'],
      ['por poco', 'едва не'], ['de casualidad', 'случайно'],
    ]),
    ...pack('B1', 'UNIDAD1', 'N', [
      ['nómina', 'расчётный лист'], ['baja laboral', 'больничный'], ['teletrabajo', 'удалёнка'],
      ['convenio', 'коллективный договор'], ['sindicato', 'профсоюз'],
    ]),
    ...pack('B1', 'UNIDAD2', 'V', [
      ['prever', 'предвидеть'], ['plantear', 'ставить (цель)'], ['posponer', 'откладывать'], ['adelantar', 'приближать'],
    ]),
    ...pack('B1', 'UNIDAD3', 'N', [
      ['sanción', 'санкция, штраф'], ['normativa', 'норматив'], ['excepción', 'исключение'], ['requisito', 'требование'],
    ]),
    ...pack('B1', 'UNIDAD8', 'N', [
      ['ciudadano', 'гражданин'], ['impuesto', 'налог'], ['campaña', 'кампания'], ['escaño', 'мандат'],
    ]),
    ...pack('B1', 'UNIDAD10', 'N', [
      ['vertido', 'сброс отходов'], ['sequía', 'засуха'], ['incendio forestal', 'лесной пожар'],
      ['especie en peligro', 'вымирающий вид'],
    ]),
    ...pack('B2', 'UNIDAD1', 'N', [
      ['arraigo', 'укоренённость'], ['diáspora', 'диаспора'], ['convivencia', 'сосуществование'],
    ]),
    ...pack('B2', 'UNIDAD2', 'N', [
      ['algoritmo', 'алгоритм'], ['clickbait', 'кликбейт'], ['filtrado', 'фильтрация'],
    ]),
    ...pack('B2', 'UNIDAD4', 'N', [
      ['economía circular', 'циркулярная экономика'], ['greenwashing', 'гринвошинг'],
      ['transición energética', 'энергопереход'],
    ]),
    ...pack('B2', 'UNIDAD7', 'V', [
      ['coquetear', 'флиртовать'], ['superar', 'преодолевать'], ['apoyarse', 'опираться друг на друга'],
    ]),
    ...pack('B2', 'UNIDAD8', 'N', [
      ['abandono escolar', 'отсев из школы'], ['brecha educativa', 'образовательный разрыв'],
    ]),
  ];
}

function pack(cefr, unit, pos, pairs) {
  return rows(cefr, unit, pairs.map(([lemma, translation]) => [lemma, translation, pos]));
}
