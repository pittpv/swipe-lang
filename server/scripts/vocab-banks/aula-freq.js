import { expandPos } from '../lib/csv-util.js';

function pack(cefr, unit, pos, pairs) {
  return pairs.map(([lemma, translation]) => ({
    cefr, unit, lemma, translation, pos: expandPos(pos), example: '', translate: '',
  }));
}

/** High-frequency Spanish filler mapped onto Aula Plus units. */
export function aulaFreq() {
  const nounsA1 = pack('A1', 'UNIDAD1', 'N', [
    ['tiempo', 'время, погода'], ['vez', 'раз'], ['parte', 'часть'], ['vida', 'жизнь'],
    ['momento', 'момент'], ['forma', 'форма'], ['cosa', 'вещь'], ['lugar', 'место'],
    ['hombre', 'мужчина'], ['mujer', 'женщина'], ['niño', 'ребёнок'], ['niña', 'девочка'],
    ['gente', 'люди'], ['problema', 'проблема'], ['mano', 'рука'], ['ojo', 'глаз'],
    ['caso', 'случай'], ['punto', 'точка'], ['grupo', 'группа'], ['cuenta', 'счёт'],
  ]);
  const verbsA1 = pack('A1', 'UNIDAD9', 'V', [
    ['poder', 'мочь'], ['deber', 'должен'], ['querer', 'хотеть'], ['saber', 'знать'],
    ['poner', 'класть'], ['dar', 'давать'], ['decir', 'говорить'], ['venir', 'приходить'],
    ['traer', 'приносить'], ['llevar', 'нести, носить'], ['seguir', 'продолжать, следовать'],
    ['quedar', 'оставаться, договариваться'], ['pasar', 'проходить'], ['creer', 'верить, считать'],
    ['sentir', 'чувствовать'], ['pensar', 'думать'], ['parecer', 'казаться'], ['dejar', 'оставлять, позволять'],
    ['llamar', 'звать'], ['tomar', 'брать, принимать'], ['mirar', 'смотреть'], ['esperar', 'ждать, надеяться'],
    ['usar', 'использовать'], ['entrar', 'входить'], ['salir', 'выходить'], ['volver', 'возвращаться'],
  ]);
  const nounsA2 = pack('A2', 'UNIDAD1', 'N', [
    ['razón', 'причина, правота'], ['sentido', 'смысл, чувство'], ['manera', 'способ'],
    ['nivel', 'уровень'], ['cambio', 'изменение'], ['desarrollo', 'развитие'],
    ['resultado', 'результат'], ['efecto', 'эффект'], ['causa', 'причина'], ['fin', 'конец, цель'],
    ['medio', 'средство, среда'], ['sistema', 'система'], ['proceso', 'процесс'], ['tipo', 'тип'],
    ['servicio', 'услуга'], ['actividad', 'деятельность'], ['relación', 'отношение'], ['situación', 'ситуация'],
  ]);
  const verbsA2 = pack('A2', 'UNIDAD10', 'V', [
    ['conseguir', 'добиваться'], ['ofrecer', 'предлагать'], ['aceptar', 'принимать'],
    ['rechazar', 'отклонять'], ['elegir', 'выбирать'], ['cambiar', 'менять'],
    ['aumentar', 'увеличивать'], ['reducir', 'сокращать'], ['mantener', 'поддерживать'],
    ['incluir', 'включать'], ['evitar', 'избегать'], ['permitir', 'позволять'],
    ['exigir', 'требовать'], ['proponer', 'предлагать'], ['resolver', 'решать'],
    ['ocurrir', 'происходить'], ['existir', 'существовать'], ['depender', 'зависеть'],
  ]);
  const nounsB1 = pack('B1', 'UNIDAD8', 'N', [
    ['sociedad', 'общество'], ['cultura', 'культура'], ['economía', 'экономика'],
    ['empresa', 'компания'], ['mercado', 'рынок'], ['producto', 'продукт'],
    ['calidad', 'качество'], ['cantidad', 'количество'], ['precio', 'цена'],
    ['cliente', 'клиент'], ['usuario', 'пользователь'], ['recurso', 'ресурс'],
    ['ventaja', 'преимущество'], ['desventaja', 'недостаток'], ['riesgo', 'риск'],
    ['beneficio', 'выгода'], ['pérdida', 'потеря'], ['inversión', 'инвестиция'],
    ['impuesto', 'налог'], ['salario', 'зарплата'], ['pobreza', 'бедность'], ['riqueza', 'богатство'],
  ]);
  const verbsB1 = pack('B1', 'UNIDAD4', 'V', [
    ['analizar', 'анализировать'], ['comparar', 'сравнивать'], ['demostrar', 'доказывать'],
    ['indicar', 'указывать'], ['señalar', 'отмечать'], ['destacar', 'выделять'],
    ['suponer', 'предполагать'], ['significar', 'значить'], ['representar', 'представлять'],
    ['considerar', 'считать'], ['reconocer', 'признавать'], ['negar', 'отрицать'],
    ['afirmar', 'утверждать'], ['dudar', 'сомневаться'], ['comentar', 'комментировать'],
  ]);
  const adjB1 = pack('B1', 'UNIDAD9', 'A', [
    ['importante', 'важный'], ['necesario', 'необходимый'], ['posible', 'возможный'],
    ['difícil', 'трудный'], ['fácil', 'лёгкий'], ['claro', 'ясный'],
    ['oscuro', 'тёмный'], ['principal', 'главный'], ['básico', 'базовый'],
    ['general', 'общий'], ['particular', 'частный'], ['especial', 'особый'],
    ['normal', 'обычный'], ['raro', 'редкий'], ['común', 'общий, обычный'],
    ['propio', 'собственный'], ['ajeno', 'чужой'], ['actual', 'актуальный'],
    ['antiguo', 'старинный'], ['moderno', 'современный'], ['completo', 'полный'],
    ['vacío', 'пустой'], ['lleno', 'полный'], ['libre', 'свободный'],
  ]);
  const nounsB2 = pack('B2', 'UNIDAD2', 'N', [
    ['impacto', 'воздействие'], ['alcance', 'охват'], ['enfoque', 'подход'],
    ['criterio', 'критерий'], ['planteamiento', 'постановка'], ['balance', 'баланс'],
    ['tendencia', 'тенденция'], ['fenómeno', 'явление'], ['contexto', 'контекст'],
    ['perspectiva', 'перспектива'], ['escenario', 'сценарий'], ['reto', 'вызов'],
    ['amenaza', 'угроза'], ['oportunidad', 'возможность'], ['estrategia', 'стратегия'],
    ['medida', 'мера'], ['política pública', 'госполитика'], ['transparencia', 'прозрачность'],
    ['rendición de cuentas', 'подотчётность'], ['participación', 'участие'],
  ]);
  const verbsB2 = pack('B2', 'UNIDAD10', 'V', [
    ['abordar', 'поднимать, подходить к'], ['fomentar', 'поощрять'],
    ['impulsar', 'стимулировать'], ['garantizar', 'гарантировать'],
    ['cuestionar', 'ставить под вопрос'], ['reivindicar', 'требовать, отстаивать'],
    ['pactar', 'договариваться'], ['ceder', 'уступать'], ['imponer', 'навязывать'],
    ['matizar', 'вносить нюанс'], ['relativizar', 'релятивизировать'],
    ['profundizar', 'углублять'], ['ampliar', 'расширять'], ['restringir', 'ограничивать'],
  ]);
  const adjB2 = pack('B2', 'UNIDAD1', 'A', [
    ['relevante', 'релевантный'], ['significativo', 'значимый'], ['crucial', 'ключевой'],
    ['secundario', 'второстепенный'], ['evidente', 'очевидный'], ['dudoso', 'сомнительный'],
    ['viable', 'жизнеспособный'], ['insostenible', 'несостоятельный'],
    ['innovador', 'инновационный'], ['obsoleto', 'устаревший'],
    ['equitativo', 'справедливый'], ['desigual', 'неравный'],
    ['plural', 'плюральный'], ['homogéneo', 'однородный'], ['heterogéneo', 'разнородный'],
  ]);
  return [
    ...nounsA1, ...verbsA1, ...nounsA2, ...verbsA2,
    ...nounsB1, ...verbsB1, ...adjB1, ...nounsB2, ...verbsB2, ...adjB2,
  ];
}
