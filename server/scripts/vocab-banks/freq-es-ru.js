import { mergeGloss } from './parse-gloss.js';

/**
 * Russian glosses for RAE CREA lemmas (rank ≤ 3500) missing from Aula Plus banks.
 * Source ranks: Real Academia Española, Corpus de Referencia del Español Actual (CREA) 10 000 lemas.
 * Translations are original pedagogical glosses. Do not copy Aula Internacional example sentences.
 * POS: N noun, V verb, A adjective, D adverb, R pronoun, C prep/conjunction, F phrase, O other (articles).
 */
export const ES_RU = mergeGloss(`
el|O|определённый артикль (м.р.)|El libro está aquí.|Книга здесь.
de|C|из, от, родительный падеж|Café de Colombia.|Кофе из Колумбии.
a|C|в, к, на (направление)|Voy a casa.|Я иду домой.
un|O|неопределённый артикль|Hay un perro.|Есть собака.
se|R|возвратная частица|Se llama Ana.|Её зовут Ана.
que|C|что, который|Creo que sí.|Думаю, что да.
del|C|слитный артикль (de+el)|Viene del norte.|Он с севера.
por|C|по, из-за, за|Lo hago por ti.|Делаю это ради тебя.
con|C|с, вместе с|Café con leche.|Кофе с молоком.
para|C|для, чтобы|Esto es para ti.|Это для тебя.
al|C|слитный артикль (a+el)|Voy al mercado.|Иду на рынок.
lo|R|это; средний род / прямое дополнение|Lo veo ahora.|Я это вижу сейчас.
como|C|как|Es alto como su padre.|Он высокий, как отец.
le|R|ему, ей (дат. падеж)|Le doy el libro.|Даю ему книгу.
más|D|больше|Quiero más agua.|Хочу больше воды.
todo|R|весь, всё|Todo está bien.|Всё хорошо.
me|R|меня, мне (энклитика)|Me gusta el café.|Мне нравится кофе.
ese|R|тот, этот|Ese libro es mío.|Та книга моя.
otro|R|другой|Quiero otro café.|Хочу другой кофе.
haber|V|вспомогательный «иметь» (hay / he)|Ha llovido mucho.|Прошёл сильный дождь.
sobre|C|о, на, поверх|Hablo sobre el tema.|Говорю на эту тему.
entre|C|между, среди|Está entre nosotros.|Это между нами.
sin|C|без|Café sin azúcar.|Кофе без сахара.
mismo|R|сам, тот же|El mismo día.|В тот же день.
primero|N|первый|El primero de la lista.|Первый в списке.
muy|D|очень|Es muy fácil.|Это очень легко.
alguno|R|какой-то, некоторый|¿Hay alguno más?|Есть ещё кто-то?
nos|R|нас, нам (энклитика)|Nos vemos mañana.|Увидимся завтра.
porque|C|потому что|Me quedo porque llueve.|Остаюсь, потому что дождь.
solo|D|только, лишь|Solo quiero agua.|Хочу только воду.
nuevo|A|новый|Tengo un coche nuevo.|У меня новая машина.
te|R|тебя, тебе (энклитика)|Te llamo luego.|Позвоню тебе потом.
ni|C|ни|No tengo ni idea.|Понятия не имею.
aquel|R|тот (далёкий)|Aquel día fue largo.|Тот день был долгим.
donde|D|где (относит.)|El pueblo donde vivo.|Город, где я живу.
último|A|последний|El último tren.|Последний поезд.
cada|R|каждый|Cada día estudio.|Каждый день учусь.
tan|D|так, настолько|Es tan fácil.|Это так просто.
así|D|так, таким образом|Así se hace.|Так это делается.
bueno|A|хороший|Es un buen amigo.|Он хороший друг.
presidente|N|президент|El presidente habla hoy.|Президент говорит сегодня.
estado|N|государство, состояние|El estado de salud.|Состояние здоровья.
bien|D|хорошо|Está muy bien.|Всё очень хорошо.
sino|C|а, но (после отрицания)|No es rojo, sino azul.|Не красный, а синий.
político|A|политический|Un problema político.|Политическая проблема.
tratar|V|пытаться; касаться; обращаться|Trato de ayudar.|Пытаюсь помочь.
nacional|A|национальный, государственный|El equipo nacional.|Национальная сборная.
millón|N|миллион|Un millón de personas.|Миллион человек.
contra|C|против|Juego contra ti.|Играю против тебя.
ante|C|перед, перед лицом|Ante el juez.|Перед судьёй.
ayer|D|вчера|Ayer llovió mucho.|Вчера сильно дождило.
hacia|C|к, по направлению к|Camina hacia casa.|Идёт к дому.
social|A|социальный, общественный|Un problema social.|Социальная проблема.
realizar|V|осуществлять, проводить|Realizan un estudio.|Проводят исследование.
pues|C|итак, ведь, ну|Pues no lo sé.|Ну, я не знаю.
menos|D|меньше, кроме|Cuesta menos ahora.|Сейчас дешевле.
hoy|D|сегодня|Hoy no trabajo.|Сегодня не работаю.
producir|V|производить, вызывать|Producen más vino.|Производят больше вина.
casi|D|почти|Casi nunca llega tarde.|Почти никогда не опаздывает.
crear|V|создавать|Crean un nuevo plan.|Создают новый план.
cómo|D|как (вопросит.)|¿Cómo estás hoy?|Как ты сегодня?
ninguno|R|никакой, никто|No hay ninguno.|Нет никого.
económico|A|экономический|La crisis económica.|Экономический кризис.
segundo|N|второй; секунда|El segundo intento.|Вторая попытка.
señor|N|господин, сеньор|El señor García.|Господин Гарсия.
noche|N|ночь, вечер|Buena noche a todos.|Доброй ночи всем.
mejor|A|лучший|Es la mejor idea.|Это лучшая идея.
historia|N|история|Me gusta la historia.|Мне нравится история.
político|N|политик|Un político famoso.|Известный политик.
tras|C|после, за|Tras la reunión.|После встречи.
largo|A|длинный, долгий|Un camino largo.|Длинная дорога.
varios|R|несколько, различные|Varios amigos vinieron.|Пришли несколько друзей.
fuerza|N|сила|No tengo fuerza.|У меня нет сил.
hecho|N|факт, дело|Es un hecho claro.|Это очевидный факт.
mí|R|меня, мне (после предлога)|A mí me gusta.|Мне нравится.
tanto|D|столько, так сильно|Come tanto pan.|Ест столько хлеба.
único|A|единственный, уникальный|Es su único hijo.|Это его единственный сын.
cualquiera|R|любой|Cualquiera puede hacerlo.|Любой может это сделать.
aún|D|ещё|Aún no ha llegado.|Он ещё не пришёл.
comenzar|V|начинать|Comenzamos a las diez.|Начинаем в десять.
más|R|больше (местоимение)|No quiero más.|Больше не хочу.
tal|R|такой|Tal vez mañana.|Может быть, завтра.
siglo|N|век, столетие|El siglo XXI.|Двадцать первый век.
ministro|N|министр|El ministro de salud.|Министр здравоохранения.
aparecer|V|появляться|Aparece en la foto.|Появляется на фото.
convertir|V|превращать, обращать|Se convierte en hielo.|Превращается в лёд.
acción|N|действие, акция|Una acción importante.|Важное действие.
lado|N|сторона, бок|Al otro lado.|На другой стороне.
nadie|R|никто|Nadie está en casa.|Никого нет дома.
utilizar|V|использовать|Utilizo el tren.|Пользуюсь поездом.
próximo|A|следующий, ближайший|El próximo mes.|В следующем месяце.
humano|A|человеческий|El cuerpo humano.|Человеческое тело.
realidad|N|реальность, действительность|Esa es la realidad.|Такова реальность.
programa|N|программа|Un programa de radio.|Радиопрограмма.
cierto|R|некий, некоторый|Cierta gente no viene.|Некоторые люди не приходят.
tierra|N|земля, страна|La tierra es fértil.|Земля плодородная.
acabar|V|заканчивать; только что|Acabo de llegar.|Я только что приехал.
idea|N|идея, мысль|Tengo una idea.|У меня есть идея.
mostrar|V|показывать|Muéstrame el mapa.|Покажи мне карту.
zona|N|зона, район|Vivo en esa zona.|Живу в том районе.
formar|V|формировать, образовывать|Forman un equipo.|Формируют команду.
tema|N|тема|El tema es difícil.|Тема сложная.
muerte|N|смерть|La muerte del rey.|Смерть короля.
principio|N|начало, принцип|Al principio cuesta.|Сначала трудно.
ya que|C|поскольку, так как|Me quedo, ya que llueve.|Остаюсь, так как дождь.
interés|N|интерес|Tiene mucho interés.|У него большой интерес.
distinto|A|различный, иной|Es muy distinto.|Это совсем иное.
internacional|A|международный|Un vuelo internacional.|Международный рейс.
solo|A|один, одинокий|Está solo en casa.|Он один дома.
sector|N|сектор, отрасль|El sector público.|Государственный сектор.
paso|N|шаг, проход|Da un paso más.|Сделай ещё шаг.
incluso|D|даже, включая|Incluso él vino.|Даже он пришёл.
tanto|R|столько|Tanto esfuerzo inútil.|Столько напрасных усилий.
información|N|информация|Necesito más información.|Мне нужна ещё информация.
voz|N|голос|Tiene una voz suave.|У неё мягкий голос.
valor|N|ценность, мужество|El valor del oro.|Ценность золота.
figura|N|фигура, личность|Una figura clave.|Ключевая фигура.
establecer|V|устанавливать, учреждать|Establecen una regla.|Устанавливают правило.
ambos|R|оба|Ambos están de acuerdo.|Оба согласны.
verdad|N|правда, истина|Dime la verdad.|Скажи мне правду.
movimiento|N|движение|Un movimiento fuerte.|Сильное движение.
anterior|A|предыдущий, прежний|El año anterior.|Предыдущий год.
a través de|C|через, посредством|A través de la ventana.|Через окно.
puerta|N|дверь|Cierra la puerta.|Закрой дверь.
obtener|V|получать, добывать|Obtengo un resultado.|Получаю результат.
posibilidad|N|возможность|Hay una posibilidad.|Есть возможность.
frente a|C|перед, напротив|Frente a la iglesia.|Напротив церкви.
alcanzar|V|достигать|Alcanza su meta.|Достигает цели.
caer|V|падать|Cae la lluvia.|Идёт дождь.
fondo|N|дно, фон, суть|El fondo del mar.|Дно моря.
imagen|N|изображение, образ|Una imagen clara.|Чёткое изображение.
orden|N|порядок, приказ|Pon orden aquí.|Наведи порядок.
luz|N|свет|Hay mucha luz.|Много света.
final|N|конец, финал|Al final del día.|В конце дня.
siguiente|A|следующий|El día siguiente.|Следующий день.
policía|N|полиция, полицейский|Llama a la policía.|Вызови полицию.
peseta|N|песета (старая валюта)|Cuesta mil pesetas.|Стоит тысячу песет.
miembro|N|член (организации)|Es miembro del club.|Он член клуба.
modo|N|способ, образ|De este modo.|Таким образом.
oír|V|слышать|No oigo nada.|Ничего не слышу.
necesidad|N|необходимость, нужда|Hay necesidad de agua.|Нужна вода.
estados unidos|N|Соединённые Штаты|Viaja a Estados Unidos.|Едет в США.
comisión|N|комиссия, комиссионные|La comisión decide.|Комиссия решает.
diferente|A|другой, различный|Es muy diferente.|Это совсем другое.
campo|N|поле, сельская местность|Trabaja en el campo.|Работает в поле.
organización|N|организация|Una organización grande.|Большая организация.
don|N|дон (титул); дар|Don Miguel llega.|Дон Мигель приходит.
camino|N|дорога, путь|El camino es largo.|Дорога длинная.
sentar|V|сажать(ся)|Siéntate aquí ahora.|Садись сюда сейчас.
constituir|V|составлять, являться|Constituye un problema.|Это составляет проблему.
referir|V|ссылаться, рассказывать
mayoría|N|большинство
sacar|V|доставать, вынимать
decisión|N|решение
función|N|функция, должность
etcétera|R|и так далее
espacio|N|пространство, место
continuar|V|продолжать
europeo|A|европейский
base|N|база, основа
seguridad|N|безопасность
a partir de|C|начиная с
desarrollar|V|развивать
popular|A|народный, популярный
militar|A|военный
autor|N|автор
real|A|королевский; реальный
malo|A|плохой
iniciar|V|начинать
investigación|N|исследование
juego|N|игра
ciento|N|сто (por ciento)
capital|N|столица; капитал
libertad|N|свобода
caso de|C|в случае
amor|N|любовь
arte|N|искусство
viejo|A|старый
dinero|N|деньги
producción|N|производство
levantar|V|поднимать
rey|N|король
ocasión|N|случай, оказия
población|N|население
méxico|N|Мексика
duda|N|сомнение
falta|N|нехватка, отсутствие
línea|N|линия
aspecto|N|аспект, вид
ahí|D|там
ocupar|V|занимать
diverso|A|различный, разнообразный
informar|V|сообщать, информировать
autoridad|N|власть, авторитет
acto|N|акт, поступок
presencia|N|присутствие
tercero|N|третий
fuerte|A|сильный
dato|N|данные, факт
vista|N|вид, зрение
asunto|N|дело, вопрос
elemento|N|элемент
a pesar de|C|несмотря на
resto|N|остаток, остальные
ex|N|бывший, экс-
demás|R|остальные
consecuencia|N|последствие
comprender|V|понимать, включать
posición|N|положение, позиция
observar|V|наблюдать
sufrir|V|страдать
artículo|N|статья; изделие
peso|N|вес; песо
junto a|C|рядом с
dólar|N|доллар
dedicar|V|посвящать
aire|N|воздух
unir|V|соединять
técnico|N|техник, специалист
congreso|N|конгресс
mañana|N|утро
natural|A|естественный, природный
serie|N|серия
pronto|D|скоро, быстро
época|N|эпоха, период
menor|A|меньший, младший
anunciar|V|объявлять
civil|A|гражданский
región|N|регион
uso|N|использование, употребление
mediante|C|посредством
comunicación|N|общение, связь
enfermedad|N|болезнь
capacidad|N|способность, ёмкость
diferencia|N|различие
secretario|N|секретарь
dicho|A|упомянутый, сказанный
detener|V|останавливать, задерживать
provocar|V|вызывать, провоцировать
manifestar|V|проявлять, заявлять
así como|D|а также
declarar|V|заявлять, объявлять
superior|A|высший, верхний
término|N|термин, срок, конец
contrario|A|противоположный
ministerio|N|министерство
participar|V|участвовать
expresar|V|выражать
operación|N|операция
control|N|контроль
cargo|N|должность, обвинение
defensa|N|защита
cara|N|лицо
celebrar|V|праздновать; проводить
juez|N|судья
prueba|N|доказательство, тест
crisis|N|кризис
tocar|V|трогать; играть (на инструменте)
afectar|V|затрагивать, влиять
cuadro|N|картина; кадр
televisión|N|телевидение
oficial|A|официальный
europa|N|Европа
institución|N|учреждение
doctor|N|доктор
mejor|D|лучше
privado|A|частный, личный
central|A|центральный
echar|V|бросать, лить
justicia|N|правосудие, справедливость
administración|N|администрация, управление
unidad|N|единица, единство
acompañar|V|сопровождать
preparar|V|готовить
actuar|V|действовать
área|N|область, зона
compañía|N|компания
interior|N|внутренность, интерьер
abandonar|V|покидать, оставлять
atención|N|внимание
colocar|V|размещать, ставить
situar|V|располагать
acercar|V|приближать
estructura|N|структура
pretender|V|претендовать, намереваться
histórico|A|исторический
cultural|A|культурный
conjunto|N|совокупность, ансамбль
verdadero|A|истинный, настоящий
dios|N|бог
texto|N|текст
además de|C|помимо, кроме
aplicar|V|применять
apoyo|N|поддержка
modelo|N|модель, образец
mover|V|двигать
apenas|D|едва, лишь
título|N|заголовок, титул
conocimiento|N|знание
esfuerzo|N|усилие
personal|A|личный, кадровый
paciente|N|пациент
cubrir|V|покрывать
entregar|V|вручать, сдавать
importancia|N|важность
meter|V|класть, совать
alguien|R|кто-то
allá|D|там, туда
declaración|N|заявление, декларация
silencio|N|тишина, молчание
disponer|V|располагать, иметь
nación|N|нация, государство
reunir|V|собирать
presente|A|присутствующий, нынешний
grave|A|серьёзный, тяжёлый
suelo|N|пол, почва
mundial|A|мировой
apoyar|V|поддерживать
corresponder|V|соответствовать
el|N|он (él без ударения в корпусе)
fecha|N|дата
capaz|A|способный
ciencia|N|наука
solución|N|решение
cierto|A|верный, истинный
cabo|N|конец; мыс; капрал
sol|N|солнце
andar|V|ходить, идти
lucha|N|борьба
especialmente|D|особенно
ejército|N|армия
naturaleza|N|природа
quizá|D|возможно
citar|V|цитировать; назначать встречу
diputado|N|депутат
norteamericano|A|североамериканский
encuentro|N|встреча, матч
dónde|D|где (вопросит.)
faltar|V|недоставать, отсутствовать
personaje|N|персонаж, личность
materia|N|материя, предмет
definir|V|определять
permanecer|V|оставаться
construir|V|строить
agregar|V|добавлять
sostener|V|поддерживать, утверждать
organismo|N|организм, учреждение
informe|N|доклад, отчёт
ayuda|N|помощь
motivo|N|мотив, причина
concepto|N|понятие
electoral|A|избирательный
reforma|N|реформа
régimen|N|режим
matar|V|убивать
tribunal|N|суд, трибунал
expresión|N|выражение
físico|A|физический
pasado|A|прошлый
interno|A|внутренний
planta|N|растение; этаж; завод
encima|D|сверху, поверх
factor|N|фактор
documento|N|документ
surgir|V|возникать
defender|V|защищать
vuelta|N|оборот, возвращение
hallar|V|находить
demasiado|D|слишком
técnico|A|технический
recoger|V|собирать, подбирать
tratamiento|N|лечение, обращение
construcción|N|строительство
formación|N|образование, формирование
industria|N|промышленность
jugador|N|игрок
asociación|N|ассоциация
regresar|V|возвращаться
cámara|N|палата; камера
funcionario|N|чиновник, служащий
propuesta|N|предложение
arma|N|оружие
existencia|N|существование
grado|N|степень, градус
advertir|V|предупреждать, замечать
total|A|полный, совокупный
representante|N|представитель
muchacho|N|парень, мальчик
período|N|период
líder|N|лидер
tal vez|D|возможно
propiedad|N|собственность, свойство
candidato|N|кандидат
crecimiento|N|рост
dirigente|N|руководитель
adquirir|V|приобретать
amplio|A|широкий
mientras que|C|в то время как
precisamente|D|именно, как раз
impedir|V|препятствовать
vía|N|путь, дорога
izquierda|N|левая сторона, левые
suficiente|A|достаточный
américa|N|Америка
mal|D|плохо
francia|N|Франция
organizar|V|организовывать
desaparecer|V|исчезать
aprobar|V|одобрять; сдавать (экзамен)
local|A|местный
radio|N|радио; радиус
mirada|N|взгляд
curso|N|курс
determinado|A|определённый
contener|V|содержать
poseer|V|обладать
característico|N|характерная черта
práctica|N|практика
directo|A|прямой
crítico|N|критик
contenido|N|содержание
maestro|N|учитель, мастер
enfrentar|V|сталкиваться, противостоять
cuestión|N|вопрос
comercial|A|торговый, коммерческий
animal|N|животное
memoria|N|память
profundo|A|глубокий
socialista|A|социалистический
a|N|буква a
juicio|N|суд, суждение
requerir|V|требовать
lanzar|V|бросать, запускать
salido|N|выход, уход
diario|N|дневник; ежедневная газета
corte|N|суд; двор; разрез
análisis|N|анализ
fundamental|A|основополагающий
mitad|N|половина
conducir|V|вести, водить
marcha|N|ход, марш
sala|N|зал, комната
determinar|V|определять
relacionar|V|связывать
municipal|A|муниципальный
mencionar|V|упоминать
igual|A|равный, одинаковый
financiero|A|финансовый
finalmente|D|наконец
democracia|N|демократия
aumento|N|увеличение
responsabilidad|N|ответственность
venta|N|продажа
oposición|N|оппозиция
visita|N|визит
inmediato|A|немедленный
creación|N|создание
contacto|N|контакт
fuego|N|огонь
científico|A|научный
ti|R|тебя, тебе (после предлога)
teoría|N|теория
bastante|D|довольно, достаточно
quitar|V|снимать, убирать
esposo|N|супруг
terreno|N|участок, почва
confirmar|V|подтверждать
comercio|N|торговля
simple|A|простой
favor|N|одолжение, милость
golpe|N|удар
insistir|V|настаивать
en cuanto a|C|что касается
presión|N|давление
exterior|A|внешний
conciencia|N|совесть, сознание
debido a|C|из-за
integrar|V|включать, объединять
preocupar|V|беспокоить
máximo|A|максимальный
negocio|N|дело, бизнес
concluir|V|заключать, заканчивать
derecha|N|правая сторона, правые
basar|V|основывать
importar|V|быть важным; импортировать
marcar|V|отмечать, забивать
profesional|A|профессиональный
atrás|D|назад, сзади
acordar|V|договариваться
ejercicio|N|упражнение; осуществление
fijar|V|закреплять, устанавливать
puesto|N|место, должность
ingreso|N|доход, поступление
novela|N|роман
aprovechar|V|использовать, воспользоваться
suerte|N|удача, судьба
pensamiento|N|мысль, мышление
numeroso|A|многочисленный
método|N|метод
periódico|N|газета
estilo|N|стиль
club|N|клуб
departamento|N|отдел, департамент
república|N|республика
rostro|N|лицо
voluntad|N|воля
circunstancia|N|обстоятельство
vivo|A|живой
acudir|V|являться, приходить
escena|N|сцена
ni siquiera|D|даже не
absoluto|A|абсолютный
adelante|D|вперёд
agente|N|агент
escritor|N|писатель
pese a|C|несмотря на
altura|N|высота
extender|V|расширять, протягивать
cielo|N|небо
adoptar|V|принимать, усыновлять
dispuesto|A|готовый, расположенный
final|A|конечный, финальный
vestir|V|одевать(ся)
efectuar|V|осуществлять
cuarto|N|комната; четвёртый; четверть
recuperar|V|восстанавливать, возвращать
entidad|N|организация, сущность
sitio|N|место
aplicación|N|применение, приложение
adecuado|A|подходящий, адекватный
aun|D|даже
enorme|A|огромный
contemplar|V|созерцать, рассматривать
capítulo|N|глава
guardar|V|хранить, беречь
provincia|N|провинция
asumir|V|брать на себя
consistir|V|состоять
gracias a|C|благодаря
registrar|V|регистрировать, записывать
coche|N|машина, автомобиль
asistir|V|присутствовать, помогать
controlar|V|контролировать
definitivo|A|окончательный
denominar|V|называть
rápido|A|быстрый
piedra|N|камень
gesto|N|жест
acusar|V|обвинять
someter|V|подчинять, подвергать
distancia|N|расстояние
pintura|N|живопись, краска
instituto|N|институт
caber|V|вмещаться; быть возможным
destino|N|судьба, назначение
demanda|N|спрос, иск
bien|N|благо, имущество
corto|A|короткий
mínimo|A|минимальный
actuación|N|выступление, действия
violencia|N|насилие
parís|N|Париж
separar|V|разделять
introducir|V|вводить
de acuerdo con|C|в соответствии с
reír|V|смеяться
cifra|N|цифра, число
exposición|N|выставка; изложение
solamente|D|только
conversación|N|разговор
mensaje|N|сообщение
generar|V|порождать, генерировать
imposible|A|невозможный
mañana|D|завтра
revista|N|журнал
chico|N|мальчик, парень
asimismo|D|также, равным образом
judicial|A|судебный
valer|V|стоить, годиться
pieza|N|часть, пьеса
discurso|N|речь, дискурс
constitución|N|конституция
década|N|десятилетие
retirar|V|отзывать, убирать
incorporar|V|включать, присоединять
peligro|N|опасность
alcalde|N|мэр
alimento|N|пища, продукт
oro|N|золото
mandar|V|посылать, приказывать
lenguaje|N|язык, речь
convencer|V|убеждать
víctima|N|жертва
empresario|N|предприниматель
primero|D|сначала, во-первых
similar|A|похожий
intervención|N|вмешательство
listo|N|готовый; умный
gestión|N|управление, менеджмент
gasto|N|расход
territorio|N|территория
emplear|V|нанимать, применять
marco|N|рамка, рамки
jornada|N|рабочий день, день
a la que|C|которой, к которой
ambiente|N|обстановка, среда
presupuesto|N|бюджет, смета
comprobar|V|проверять, устанавливать
tradicional|A|традиционный
vehículo|N|транспорт, средство
atender|V|обслуживать, уделять внимание
red|N|сеть
exponer|V|излагать, выставлять
pobre|A|бедный
pleno|A|полный, пленарный
hoja|N|лист
piel|N|кожа
partir|V|отправляться; делить
no obstante|D|тем не менее
individuo|N|индивид, человек
reciente|A|недавний
alma|N|душа
concreto|A|конкретный
abierto|A|открытый
jamás|D|никогда
procedimiento|N|процедура
espíritu|N|дух
positivo|A|положительный
extraño|A|странный, чужой
gusto|N|вкус
sorprender|V|удивлять
flor|N|цветок
causar|V|вызывать, причинять
avanzar|V|продвигаться
armado|A|вооружённый
masa|N|масса, тесто
viento|N|ветер
alrededor|D|вокруг
familiar|A|семейный, знакомый
reacción|N|реакция
conservar|V|сохранять
oficina|N|офис, контора
alumno|N|ученик, студент
propósito|N|цель, намерение
comité|N|комитет
palacio|N|дворец
nota|N|заметка, оценка, нота
versión|N|версия
referencia|N|ссылка, упоминание
disposición|N|расположение, готовность
escaso|A|скудный, редкий
junta|N|совет, хунта
ejercer|V|осуществлять, исполнять
correspondiente|A|соответствующий
coincidir|V|совпадать
religioso|A|религиозный
peor|A|худший, хуже
guardia|N|охрана, гвардия
preciso|A|точный, необходимый
respecto a|C|относительно
influencia|N|влияние
despertar|V|будить, просыпаться
limitar|V|ограничивать
sombra|N|тень
extranjero|A|иностранный
temperatura|N|температура
rodear|V|окружать
pared|N|стена
instalar|V|устанавливать
intervenir|V|вмешиваться, оперировать
pasado|N|прошлое
contribuir|V|вносить вклад
puro|A|чистый, чистейший
identificar|V|опознавать, отождествлять
tirar|V|бросать, тянуть
labor|N|труд, работа
argentina|N|Аргентина
implicar|V|подразумевать, вовлекать
cadena|N|цепь, сеть
unión|N|союз, объединение
visión|N|видение, зрение
conferencia|N|конференция, лекция
urbano|A|городской
detrás|D|сзади
verano|N|лето
representación|N|представление, представительство
superficie|N|поверхность
selección|N|отбор, сборная
ventana|N|окно
prestar|V|давать взаймы; оказывать
componer|V|составлять, сочинять
poeta|N|поэт
temporada|N|сезон
caballo|N|лошадь
ataque|N|атака, приступ
kilómetro|N|километр
colegio|N|школа, колледж
contra|N|минус; контра
jurídico|A|юридический
fase|N|фаза, этап
conducta|N|поведение
soldado|N|солдат
frase|N|фраза, предложение
compromiso|N|обязательство, компромисс
diálogo|N|диалог
realmente|D|действительно
sensación|N|ощущение, сенсация
acceso|N|доступ
facilitar|V|облегчать, предоставлять
regional|A|региональный
dios|N|бог
árbol|N|дерево
frecuencia|N|частота
crédito|N|кредит
bastar|V|хватать, быть достаточным
muestra|N|образец, выставка
droga|N|наркотик, лекарство
parlamento|N|парламент
transporte|N|транспорт
os|R|вас, вам (энклитика, мн.)
delito|N|преступление
merecer|V|заслуживать
específico|A|конкретный, специфический
transformar|V|преобразовывать
victoria|N|победа
instante|N|мгновение
triunfo|N|триумф, победа
ritmo|N|ритм
proceder|V|происходить; приступать
directamente|D|напрямую
tono|N|тон
ámbito|N|сфера, область
intento|N|попытка
legal|A|законный
vivienda|N|жильё
par|N|пара
revelar|V|раскрывать, проявлять
total|N|итог, сумма
perro|N|собака
salvar|V|спасать
apuntar|V|указывать, записывать
tender|V|иметь тенденцию; протягивать
sumar|V|складывать, составлять
debate|N|дебаты, обсуждение
mecanismo|N|механизм
instalación|N|установка, сооружение
destinar|V|предназначать
iniciativa|N|инициатива
frío|A|холодный
sujeto|N|субъект, подлежащее
gracia|N|милость; острота; gracia de
plano|N|план, плоскость
pago|N|платёж
toro|N|бык
comienzo|N|начало
tecnología|N|технология
casar|V|женить(ся)
deudo|N|родственник (умершего)
carretero|N|погонщик; дорожный
acerca de|C|о, относительно
evolución|N|эволюция, развитие
la|N|определённый артикль (ж.р.)
caja|N|коробка, касса
trasladar|V|перемещать, переводить
totalmente|D|полностью
raíz|N|корень
generación|N|поколение
calificar|V|оценивать, квалифицировать
cubano|A|кубинский
interpretar|V|толковать, исполнять
notar|V|замечать
reflejar|V|отражать
eléctrico|A|электрический
en torno a|C|вокруг, около
elaborar|V|разрабатывать, готовить
edición|N|издание
audiencia|N|аудитория, слушание
agencia|N|агентство
previo|A|предварительный
breve|A|краткий
asamblea|N|собрание, ассамблея
cometer|V|совершать (проступок)
recorrer|V|проезжать, обходить
cuarto|N|комната; четвёртый; четверть
presidencia|N|президентство, председательство
costa|N|берег, побережье
volumen|N|объём, том
vencer|V|побеждать, истекать (срок)
protección|N|защита
calor|N|жара, тепло
doble|A|двойной
estrella|N|звезда
laboral|A|трудовой
tasa|N|ставка, тариф
americano|A|американский
cobrar|V|взимать, получать (деньги)
estimar|V|оценивать, считать
externo|A|внешний
amar|V|любить
oferta|N|предложение (оферта)
emitir|V|выпускать, передавать
simplemente|D|просто
clave|N|ключ, код
sonar|V|звучать
el|N|он (él без ударения в корпусе)
avión|N|самолёт
feliz|A|счастливый
escapar|V|сбежать, избежать
gobernador|N|губернатор
aportar|V|вносить, давать
proporcionar|V|предоставлять
artístico|A|художественный
clásico|A|классический
rato|N|время, промежуток
menos|R|минус, меньшее
italia|N|Италия
sonido|N|звук
federal|A|федеральный
perspectivo|N|перспектива
eliminar|V|устранять, удалять
aparato|N|аппарат, прибор
ejecutivo|N|руководитель; исполнительная власть
cercano|A|близкий
convocar|V|созывать, вызывать
si bien|C|хотя
junto|A|вместе, рядом
lector|N|читатель
igual|D|одинаково, всё равно
copa|N|кубок, бокал
cárcel|N|тюрьма
permanente|A|постоянный
sexual|A|сексуальный, половой
opción|N|вариант, опция
velocidad|N|скорость
figurar|V|фигурировать, изображать
mamá|N|мама
gol|N|гол
literatura|N|литература
frente al|C|перед, напротив
respeto|N|уважение
ausencia|N|отсутствие
alemania|N|Германия
posterior|A|последующий, задний
habitante|N|житель
órgano|N|орган
independiente|A|независимый
comportamiento|N|поведение
interesante|A|интересный
signo|N|знак
actualidad|N|современность, новости
firma|N|подпись, фирма
puerto|N|порт
cuidado|N|забота, осторожность
tamaño|N|размер
espectáculo|N|зрелище, спектакль
división|N|деление, дивизия
musical|A|музыкальный
preocupación|N|беспокойство
discutir|V|обсуждать, спорить
habitual|A|привычный, обычный
muerto|N|покойник, мёртвый
comunicar|V|сообщать
accidente|N|несчастный случай
constitucional|A|конституционный
otorgar|V|предоставлять, жаловать
modificar|V|изменять
personal|N|персонал
impresión|N|впечатление; печать
fórmula|N|формула
banda|N|группа, лента, банда
convenir|V|подходить, договариваться
inferior|A|нижний, низший
enseñanza|N|обучение, преподавание
deportivo|A|спортивный
quizás|D|возможно
delante|D|спереди, впереди
británico|A|британский
categoría|N|категория
fiscal|N|прокурор
femenino|A|женский
mil|N|тысяча
conclusión|N|вывод, заключение
viejo|N|старик
prácticamente|D|практически
género|N|род, жанр
príncipe|N|принц, князь
distinguir|V|различать, отличать
dominar|V|господствовать, владеть
bolsa|N|сумка; биржа
sustituir|V|заменять
nombrar|V|назначать, называть
estatal|A|государственный
durar|V|длиться
recién|D|только что
intenso|A|интенсивный, сильный
individual|A|индивидуальный
misión|N|миссия
catalán|A|каталонский
elevado|A|высокий, возвышенный
presentación|N|презентация, представление
pronunciar|V|произносить
portavoz|N|представитель, спикер
moral|A|моральный
enemigo|N|враг
explicación|N|объяснение
luchar|V|бороться
frecuente|A|частый
por supuesto|D|конечно
colectivo|A|коллективный
seco|A|сухой
disminuir|V|уменьшать
condenar|V|осуждать, приговаривать
lluvia|N|дождь
precisar|V|уточнять, нуждаться
entero|A|целый
hacienda|N|казначейство; усадьба
frontera|N|граница
incremento|N|прирост
margen|N|край, маржа, поле
relativo|A|относительный
justificar|V|оправдывать, обосновывать
por lo menos|D|по крайней мере
venezuela|N|Венесуэла
dueño|N|хозяин, владелец
grito|N|крик
percibir|V|воспринимать, получать
tal|D|так
canal|N|канал
manejar|V|управлять, обращаться
vasco|A|баскский
regla|N|правило, линейка
corriente|N|течение, ток
extremo|N|край, конец
dimensión|N|измерение, масштаб
marchar|V|идти, уходить
daño|N|вред, ущерб
activo|A|активный
destruir|V|разрушать
tratado|N|договор, трактат
atravesar|V|пересекать
semejante|A|подобный
señal|N|сигнал, знак
distribución|N|распределение
aparición|N|появление
federación|N|федерация
segundo|N|второй; секунда
máquina|N|машина, механизм
carga|N|груз, нагрузка
negativo|A|отрицательный
elevar|V|поднимать, повышать
amenazar|V|угрожать
profesional|N|профессионал
sede|N|штаб-квартира, резиденция
sencillo|A|простой
alianza|N|союз, альянс
fiscal|A|налоговый, фискальный
caracterizar|V|характеризовать
militar|N|военный (сущ.)
acontecimiento|N|событие
temor|N|страх
diario|A|ежедневный
pecho|N|грудь
pintor|N|художник
llegada|N|прибытие
ruido|N|шум
enterar|V|узнавать, извещать
liga|N|лига, связь
resolución|N|резолюция, разрешение
hermoso|A|красивый
esconder|V|прятать
operar|V|оперировать, действовать
literario|A|литературный
extraordinario|A|чрезвычайный, необычный
matrimonio|N|брак, супружество
debajo|D|внизу, под
supremo|A|верховный
interpretación|N|толкование, исполнение
alternativa|N|альтернатива
ubicar|V|располагать, находить
atribuir|V|приписывать
célula|N|клетка
junto con|C|вместе с
complejo|A|сложный
esencial|A|существенный
anual|A|годовой
obligación|N|обязанность, обязательство
inicial|A|начальный
devolver|V|возвращать
investigar|V|расследовать, исследовать
constante|A|постоянный
bello|A|прекрасный
doce|N|двенадцать
revolucionario|A|революционный
perfecto|A|совершенный
testigo|N|свидетель
fe|N|вера
atrever|V|осмеливаться
probablemente|D|вероятно
sección|N|раздел, секция
disco|N|диск, пластинка
labio|N|губа
decreto|N|указ, декрет
favorecer|V|способствовать, благоприятствовать
administrativo|A|административный
dividir|V|делить
pegar|V|клеить, бить
reclamar|V|требовать, жаловаться
encargar|V|поручать, заказывать
herido|N|раненый
occidental|A|западный
capitán|N|капитан
posteriormente|D|впоследствии
funcionamiento|N|функционирование, работа
brasil|N|Бразилия
igualmente|D|равным образом
registro|N|реестр, запись
buenos aires|N|Буэнос-Айрес
peligroso|A|опасный
pacto|N|пакт, соглашение
saltar|V|прыгать
secreto|N|секрет, тайна
extranjero|N|иностранец; заграница
filosofía|N|философия
empleado|N|служащий, работник
comunista|A|коммунистический
excelente|A|отличный
reducción|N|сокращение
costo|N|стоимость, издержка
caído|N|падение; павший
mente|N|ум, разум
inmediatamente|D|немедленно
búsqueda|N|поиск
concentración|N|концентрация
derivar|V|происходить, выводить
sustancia|N|вещество
presidir|V|председательствовать
ciclo|N|цикл
gas|N|газ
ocultar|V|скрывать
conmigo|R|со мной
componente|N|компонент
nueva york|N|Нью-Йорк
índice|N|индекс, указатель
crimen|N|преступление
educativo|A|образовательный
interior|A|внутренний
mal|N|зло, вред
latino|A|латинский, латиноамериканский
protesta|N|протест
resistencia|N|сопротивление
comentario|N|комментарий
facultad|N|факультет; способность
cuidar|V|заботиться
existente|A|существующий
nada más|C|только, ничего больше
apreciar|V|ценить, замечать
gonzález|N|Гонсалес
espejo|N|зеркало
consultar|V|консультироваться, справляться
experto|N|эксперт
asesinato|N|убийство
continuación|N|продолжение
huir|V|бежать, спасаться
colaboración|N|сотрудничество
avance|N|продвижение
por lo tanto|D|поэтому, следовательно
prisión|N|тюрьма
crítico|A|критический
transmitir|V|передавать
papa|N|папа (римский); картофель
confiar|V|доверять
partida|N|партия; отъезд
secreto|A|тайный
alejar|V|отдалять
parlamentario|A|парламентский
seguido|A|подряд, непрерывный
medir|V|измерять
culpa|N|вина
sindical|A|профсоюзный
preso|N|заключённый
realización|N|осуществление
incrementar|V|увеличивать
indio|N|индеец; индийский
virtud|N|добродетель; en virtud de
discusión|N|обсуждение, спор
sexo|N|пол, секс
fundación|N|фонд, основание
postura|N|позиция, поза
poesía|N|поэзия
lento|A|медленный
ignorar|V|не знать, игнорировать
loco|A|сумасшедший
ingresar|V|поступать, вносить
barco|N|корабль, судно
denuncia|N|жалоба, донос
únicamente|D|исключительно
mil|N|тысяча
luna|N|луна
compra|N|покупка
como|D|как (наречие)
espectador|N|зритель
soñar|V|мечтать, видеть сны
vicepresidente|N|вице-президент
presidencial|A|президентский
batalla|N|битва
concepción|N|зачатие; концепция
carecer|V|быть лишённым
comprometer|V|компрометировать; обязывать
localidad|N|населённый пункт
pasión|N|страсть
código|N|кодекс, код
principalmente|D|главным образом
montar|V|монтировать, садиться (на)
municipio|N|муниципалитет
equilibrio|N|равновесие
efectivo|A|действенный, эффективный
arrastrar|V|тащить, увлекать
porcentaje|N|процент
clima|N|климат
gana|N|желание, охота
acaso|D|разве, случайно
encender|V|зажигать
perseguir|V|преследовать
senador|N|сенатор
mental|A|умственный, психический
atacar|V|атаковать
consideración|N|рассмотрение, уважение
continuo|A|непрерывный
moneda|N|монета, валюта
lógico|A|логичный
quince|N|пятнадцать
negociar|V|вести переговоры
múltiple|A|множественный
generalmente|D|обычно, как правило
por fin|D|наконец
promover|V|продвигать, поощрять
publicación|N|публикация
establecimiento|N|заведение, установление
callar|V|молчать
disfrutar|V|наслаждаться
recurrir|V|прибегать, обжаловать
hogar|N|дом, очаг
automóvil|N|автомобиль
vincular|V|связывать
composición|N|состав, сочинение
diseño|N|дизайн, чертёж
londres|N|Лондон
recuperación|N|восстановление
inicio|N|начало
fruto|N|плод
paisaje|N|пейзаж
belleza|N|красота
notable|A|заметный, выдающийся
depresión|N|депрессия, впадина
corrupción|N|коррупция
esquema|N|схема
oponer|V|противопоставлять
encerrar|V|запирать, заключать
religión|N|религия
reconocimiento|N|признание, осмотр
experimentar|V|испытывать, экспериментировать
sentencia|N|приговор, сентенция
autonomía|N|автономия
planeta|N|планета
aproximadamente|D|приблизительно
confesar|V|признаваться
caliente|A|горячий
honor|N|честь
católico|A|католический
completar|V|завершать
embajador|N|посол
criticar|V|критиковать
calcular|V|вычислять, рассчитывать
tabla|N|таблица, доска
roma|N|Рим
intelectual|A|интеллектуальный
socio|N|партнёр, член
oficial|N|офицер, чиновник
círculo|N|круг
plata|N|серебро; деньги
colgar|V|вешать
ii|N|II (второй)
perfectamente|D|совершенно, идеально
dominio|N|господство, владение
interrumpir|V|прерывать
poderoso|A|могущественный
claramente|D|ясно
socialista|N|социалист
apertura|N|открытие
periodo|N|период
campeón|N|чемпион
despacho|N|кабинет, отправка
petición|N|просьба, ходатайство
reflexión|N|размышление, отражение
cuento|N|рассказ, сказка
cristiano|A|христианский
observación|N|наблюдение, замечание
investigador|N|исследователь
garantía|N|гарантия
policial|A|полицейский
respecto|N|отношение, уважение
arrancar|V|вырывать, заводить (мотор)
recientemente|D|недавно
vuelo|N|полёт, рейс
pista|N|дорожка, след, подсказка
transformación|N|преобразование
juzgar|V|судить
tardar|V|занимать время, опаздывать
ah|F|ах, а
universal|A|всеобщий, универсальный
rama|N|ветвь, отрасль
modificación|N|изменение
fino|A|тонкий, изысканный
aéreo|A|воздушный, авиа-
santiago|N|Сантьяго
moda|N|мода
atentado|N|покушение, теракт
guatemala|N|Гватемала
soportar|V|выдерживать, терпеть
preparación|N|подготовка
equivocar|V|ошибаться
washington|N|Вашингтон
químico|A|химический
subrayar|V|подчёркивать
a través del|C|через, посредством
productor|N|производитель
inteligencia|N|ум, разведка
cadáver|N|труп
perdonar|V|прощать
bien|C|либо, или же
significado|N|значение
al igual que|C|так же как
global|A|глобальный
olor|N|запах
penal|A|уголовный
resistir|V|сопротивляться
tecnológico|A|технологический
festival|N|фестиваль
telefónico|A|телефонный
placer|N|удовольствие
renunciar|V|отказываться
papá|N|папа, отец
influir|V|влиять
punta|N|кончик, остриё
disparar|V|стрелять
golpear|V|ударять
inmenso|A|огромный
definición|N|определение
acusación|N|обвинение
auto|N|авто; постановление суда
desde luego|D|разумеется
coronel|N|полковник
firme|A|твёрдый, стойкий
soltar|V|отпускать, ронять
detectar|V|обнаруживать
en relación con|C|в связи с
presunto|A|предполагаемый
cargar|V|грузить, заряжать
suspender|V|приостанавливать
ejecutar|V|исполнять, казнить
especialista|N|специалист
útil|A|полезный
finalizar|V|завершать
alcohol|N|алкоголь
conformar|V|составлять, формировать
tren|N|поезд
orgánico|A|органический
utilización|N|использование
mando|N|командование, пульт
potencia|N|держава, мощность
invertir|V|инвестировать; переворачивать
menudo|A|мелкий; a menudo — часто
alzar|V|поднимать
gozar|V|наслаждаться
progreso|N|прогресс
salvo|A|кроме, за исключением
patria|N|родина
acceder|V|получать доступ; соглашаться
padecer|V|страдать
campesino|N|крестьянин
anuncio|N|объявление, реклама
residencia|N|резиденция, проживание
seguramente|D|наверняка
eficaz|A|эффективный
consciente|A|сознательный, осознающий
nuevamente|D|вновь
cultivo|N|выращивание, культура
infantil|A|детский
conocido|A|известный
envolver|V|оборачивать, вовлекать
solidaridad|N|солидарность
instancia|N|инстанция; заявление
cooperación|N|сотрудничество
exportación|N|экспорт
hambre|N|голод
consejero|N|советник
oficio|N|ремесло, должность
rápidamente|D|быстро
lejano|A|далёкий
brillante|A|блестящий
llamada|N|звонок, призыв
entorno|N|окружение
poema|N|стихотворение, поэма
columna|N|колонка, колонна
originar|V|порождать, происходить
en cuanto|D|как только; поскольку
local|N|помещение, заведение
intensidad|N|интенсивность
asesinar|V|убивать
héroe|N|герой
risa|N|смех
capa|N|слой, плащ
aventura|N|приключение
violento|A|насильственный, яростный
polvo|N|пыль, порошок
tropa|N|войско
pausa|N|пауза
seleccionar|V|отбирать
quemar|V|жечь
elaboración|N|разработка, изготовление
liberación|N|освобождение
robar|V|красть
creciente|A|растущий
procurar|V|стараться, обеспечивать
nicaragua|N|Никарагуа
miami|N|Майами
correcto|A|правильный
izquierdo|A|левый
amistad|N|дружба
motor|N|двигатель
acostumbrar|V|приучать, привыкать
girar|V|вращать(ся), поворачивать
con respecto a|C|относительно
curioso|A|любопытный, странный
liberal|A|либеральный
formular|V|формулировать
gobernar|V|управлять, править
exterior|N|внешность, заграница
colombiano|A|колумбийский
exceso|N|избыток
madrugada|N|раннее утро, рассвет
ejecutivo|A|исполнительный
cumbre|N|вершина, саммит
nuclear|A|ядерный
dibujo|N|рисунок
derrota|N|поражение
desplazar|V|смещать, перемещать
orientar|V|ориентировать
quinto|N|пятый
propietario|N|собственник
repartir|V|раздавать, распределять
torneo|N|турнир
proyectar|V|проектировать, проецировать
símbolo|N|символ
arrojar|V|бросать, давать (результат)
respectivo|A|соответствующий
geografía|N|география
suma|N|сумма
consulta|N|консультация, запрос
limpio|A|чистый
rural|A|сельский
pobre|N|бедняк
concurso|N|конкурс
práctico|A|практический
herir|V|ранить
borde|N|край, кромка
variar|V|меняться, варьировать
exigencia|N|требование
comandante|N|командир, комендант
asociar|V|ассоциировать, объединять
obispo|N|епископ
liberar|V|освобождать
cerebro|N|мозг
ideológico|A|идеологический
volar|V|летать
asistencia|N|помощь, присутствие
designar|V|назначать, обозначать
variedad|N|разнообразие
completamente|D|полностью
procedente|A|происходящий, прибывающий
impulso|N|импульс, толчок
tiro|N|выстрел, бросок
colección|N|коллекция
fresco|A|свежий, прохладный
bandera|N|флаг
concentrar|V|концентрировать
encabezar|V|возглавлять
legislativo|A|законодательный
monetario|A|денежный, валютный
cuándo|D|когда (вопросит.)
entrega|N|сдача, доставка
secretaría|N|секретариат, канцелярия
suceso|N|происшествие, событие
en lugar de|C|вместо
proporción|N|пропорция, доля
núcleo|N|ядро
humor|N|настроение, юмор
descender|V|спускаться, происходить
frío|N|холод
débil|A|слабый
hundir|V|топить, погружать
dependencia|N|зависимость; ведомство
sanitario|A|санитарный, здравоохранительный
laboratorio|N|лаборатория
felipe gonzález|N|Фелипе Гонсалес
patio|N|двор, патио
inclinar|V|наклонять
delegación|N|делегация
saludar|V|здороваться, приветствовать
gubernamental|A|правительственный
paseo|N|прогулка, бульвар
bomba|N|бомба; насос
directivo|N|руководитель
avenida|N|проспект
desnudo|A|голый
espera|N|ожидание
a partir del|C|начиная с
transcurrir|V|протекать (о времени)
extremo|A|крайний
demasiado|R|слишком многое
petróleo|N|нефть
cuanto|D|сколько; en cuanto
comunitario|A|общинный; ЕС-
fallecer|V|скончаться
especializar|V|специализировать(ся)
coste|N|стоимость, затрата
radical|A|радикальный
dictar|V|диктовать, издавать (закон)
terrible|A|ужасный
contemporáneo|A|современный
excesivo|A|чрезмерный
acumular|V|накапливать
familiar|N|родственник
extensión|N|протяжение, расширение
atraer|V|привлекать
bloque|N|блок
disputar|V|оспаривать, проводить (матч)
ambiental|A|экологический, окружающей среды
productivo|A|продуктивный
seno|N|грудь, лоно, синус
emisión|N|выпуск, передача
déficit|N|дефицит
primario|A|первичный
treinta|N|тридцать
latinoamericano|A|латиноамериканский
absolutamente|D|абсолютно
soledad|N|одиночество
presente|N|настоящее; подарок
emisor|N|эмитент, передатчик
asomar|V|показываться, выглядывать
patrón|N|хозяин; образец; патрон
retrato|N|портрет
clasificación|N|классификация, рейтинг
emprender|V|предпринимать
invierno|N|зима
lesión|N|травма, повреждение
empresarial|A|предпринимательский
definitivamente|D|окончательно
de modo que|C|так что
adaptar|V|приспосабливать
busca|N|поиск
tanto|N|такое количество
remedio|N|средство, лекарство
duración|N|продолжительность
descartar|V|отбрасывать, исключать
agrícola|A|сельскохозяйственный
concebir|V|зачатие; задумывать
ejecución|N|исполнение, казнь
humanidad|N|человечество
santo|A|святой
totalidad|N|совокупность, целое
academia|N|академия
exactamente|D|точно
dictadura|N|диктатура
desconocer|V|не знать, игнорировать
junto al|C|рядом с
mezcla|N|смесь
distribuir|V|распределять
favorable|A|благоприятный
nacimiento|N|рождение
agricultura|N|сельское хозяйство
vital|A|жизненный, насущный
eje|N|ось
orquesta|N|оркестр
testimonio|N|свидетельство
enfrentamiento|N|столкновение
cotidiano|A|повседневный
alteración|N|изменение, нарушение
diagnóstico|N|диагноз
optar|V|выбирать
fundamentalmente|D|в основном
arreglar|V|чинить, устраивать
ceremonia|N|церемония
estatuto|N|устав, статут
proteína|N|белок
decisivo|A|решающий
colaborar|V|сотрудничать
encuesta|N|опрос
combatir|V|бороться, сражаться
botella|N|бутылка
universo|N|вселенная
chileno|A|чилийский
traje|N|костюм
alimentar|V|кормить, питать
madrileño|A|мадридский
fila|N|ряд, очередь
estrecho|A|узкий; пролив
escándalo|N|скандал
pendiente|A|ожидающий; склон
tejido|N|ткань
inglaterra|N|Англия
muro|N|стена, ограда
respecto de|C|относительно
fábrica|N|фабрика, завод
naturalmente|D|естественно
institucional|A|институциональный
fabricar|V|изготавливать
desempeñar|V|исполнять (роль, должность)
hierro|N|железо
desconocido|A|неизвестный
rival|N|соперник
apartar|V|отстранять, откладывать
acoger|V|принимать, приютить
inaugurar|V|открывать, торжественно открывать
oreja|N|ухо
alterar|V|изменять, нарушать
escoger|V|выбирать
taller|N|мастерская, семинар
regreso|N|возвращение
revisar|V|проверять, пересматривать
agradecer|V|благодарить
ruta|N|маршрут, путь
rayo|N|молния, луч
sólido|A|твёрдый, прочный
dosis|N|доза
inflación|N|инфляция
soviético|A|советский
muerto|A|мёртвый
examen|N|экзамен, обследование
geográfico|A|географический
toma|N|съёмка; захват; приём
angustia|N|тоска, тревога
teórico|A|теоретический
beneficiar|V|приносить пользу
orientación|N|ориентация, направление
explotación|N|эксплуатация, разработка
formal|A|формальный
cáncer|N|рак (болезнь)
cálculo|N|расчёт
coalición|N|коалиция
sacerdote|N|священник
científico|N|учёный
bancario|A|банковский
constar|V|состоять; быть зафиксированным
eficacia|N|эффективность
exclusivamente|D|исключительно
difundir|V|распространять
estancia|N|пребывание, комната
reforzar|V|укреплять
templo|N|храм
fortuna|N|удача, состояние
techo|N|крыша, потолок
continente|N|континент
japón|N|Япония
grabar|V|записывать, гравировать
promoción|N|продвижение, акция
facilidad|N|лёгкость, удобство
iluminar|V|освещать
animar|V|воодушевлять
evaluación|N|оценка
brindar|V|предлагать, чокаться
transición|N|переход
ópera|N|опера
homenaje|N|дань уважения
tesis|N|тезис, диссертация
novedad|N|новинка, новость
ay|F|ай, ой
respectivamente|D|соответственно
galería|N|галерея
lavar|V|мыть
afirmación|N|утверждение
imaginación|N|воображение
mas|C|но, однако
descenso|N|спуск, снижение
pasear|V|гулять
satisfacción|N|удовлетворение
lentamente|D|медленно
empujar|V|толкать
clínico|A|клинический
limpiar|V|чистить
informativo|A|информационный
apagar|V|гасить, выключать
promedio|N|среднее
redacción|N|редакция, формулировка
rendir|V|сдавать; приносить (результат)
anciano|N|пожилой человек
obedecer|V|повиноваться
autonómico|A|автономный (адм.)
comunicado|N|сообщение, коммюнике
danza|N|танец
obrero|A|рабочий
episodio|N|эпизод
estabilidad|N|стабильность
consumidor|N|потребитель
diferenciar|V|различать
inútil|A|бесполезный
solar|A|солнечный; участок
campeonato|N|чемпионат
apretar|V|сжимать, нажимать
combate|N|бой, сражение
canto|N|пение, песнь
central|N|централь, штаб
localizar|V|обнаруживать, локализовать
solicitud|N|заявление, просьба
manejo|N|обращение, управление
difusión|N|распространение
cuestión de|C|вопрос (о)
asustar|V|пугать
típico|A|типичный
mero|A|простой, сущий
nube|N|облако
diseñar|V|проектировать
biológico|A|биологический
arena|N|песок; арена
fumar|V|курить
gastar|V|тратить
legislación|N|законодательство
psicológico|A|психологический
destacado|A|выдающийся
pato|N|утка
abundante|A|обильный
imperio|N|империя
claridad|N|ясность
mentira|N|ложь
anotar|V|записывать, отмечать
profundidad|N|глубина
escolar|A|школьный
defensor|N|защитник
reflejo|N|отражение, рефлекс
rechazo|N|отказ, неприятие
remitir|V|отправлять; ослабевать
piloto|N|пилот
autorizar|V|разрешать, уполномочивать
entrevistar|V|интервьюировать
conveniente|A|удобный, уместный
mantenimiento|N|обслуживание, содержание
centrar|V|центрировать, сосредоточивать
estímulo|N|стимул
recorrido|N|маршрут, пробег
archivo|N|архив, файл
incidente|N|инцидент
delegado|N|делегат
en vez de|C|вместо
efe|N|EFE (агентство)
obrero|N|рабочий (сущ.)
indígena|A|коренной, туземный
molestar|V|беспокоить, мешать
satisfacer|V|удовлетворять
conservador|A|консервативный
hipótesis|N|гипотеза
aspirar|V|стремиться; вдыхать
alrededor|N|окрестности
convocatoria|N|созыв, объявление конкурса
ambiente|A|окружающий
sida|N|СПИД
lágrima|N|слеза
listo|A|готовый, умный
salto|N|прыжок
digno|A|достойный
examinar|V|исследовать, осматривать
desprender|V|отделять, испускать
trato|N|обращение, сделка
reproducir|V|воспроизводить
penetrar|V|проникать
íntimo|A|интимный, близкий
extraer|V|извлекать
renta|N|доход, рента
valle|N|долина
roca|N|скала, камень
baja|N|снижение; потеря; увольнение
evidencia|N|очевидность, доказательство
gabinete|N|кабинет (министров)
amante|N|любовник, любитель
reino|N|королевство
arquitectura|N|архитектура
ácido|N|кислота, кислый
variación|N|вариация, изменение
colonia|N|колония; одеколон
provincial|A|провинциальный
hilo|N|нить
olímpico|A|олимпийский
mejora|N|улучшение
once|N|одиннадцать
dama|N|дама
cesar|V|прекращать
misterio|N|тайна, мистерия
paquete|N|пакет, посылка
santo|N|святой (сущ.)
eterno|A|вечный
senado|N|сенат
engañar|V|обманывать
circulación|N|обращение, движение
medicamento|N|лекарство
expectativa|N|ожидание, перспектива
trastorno|N|расстройство, беспорядок
electrónico|A|электронный
atmósfera|N|атмосфера
cocer|V|варить, печь
colega|N|коллега
alimentación|N|питание
apartado|N|раздел; абонентский ящик
caballero|N|кавалер, господин
gato|N|кот
pájaro|N|птица
magistrado|N|магистрат, судья
ejemplar|N|экземпляр; образцовый
comando|N|команда, спецназ
agarrar|V|хватать
exacto|A|точный
máximo|N|максимум
camión|N|грузовик
emperador|N|император
intercambio|N|обмен
xix|N|XIX (девятнадцатый)
celebración|N|празднование
banesto|N|Banesto (банк)
entusiasmo|N|энтузиазм
miguel|N|Мигель
prestigio|N|престиж
ampliación|N|расширение
ilegal|A|незаконный
cumplimiento|N|выполнение, соблюдение
sospechar|V|подозревать
masivo|A|массовый
peruano|A|перуанский
consolidar|V|укреплять, консолидировать
sobrevivir|V|выживать
juzgado|N|суд (инстанция)
combinar|V|сочетать
bolsillo|N|карман
conectar|V|соединять
generalizar|V|обобщать
solitario|A|одинокий, уединённый
aprobación|N|одобрение
renovar|V|обновлять, продлевать
reaccionar|V|реагировать
particularmente|D|в особенности
cualquiera|N|любой человек
ideología|N|идеология
derrotar|V|наносить поражение
grasa|N|жир
masculino|A|мужской
exhibir|V|выставлять, демонстрировать
concejal|N|муниципальный советник
anoche|D|вчера вечером
anteriormente|D|ранее
china|N|Китай
teniente|N|лейтенант
humo|N|дым
delicado|A|деликатный, хрупкий
reglamento|N|регламент, правила
dramático|A|драматический
aparte de|C|помимо
infección|N|инфекция
polémica|N|полемика, спор
virgen|N|дева, девственный
de|N|предлог «de» (как единица корпуса)
agudo|A|острый
venezolano|A|венесуэльский
vigente|A|действующий
cura|N|лечение; священник
guerrilla|N|партизанская война
rincón|N|угол, уголок
a medida que|C|по мере того как
característico|A|характерный
lima|N|Лима; лайм; напильник
feria|N|ярмарка, праздник
agrario|A|аграрный
manifiesto|N|манифест; явный
reiterar|V|повторять
sagrado|A|священный
provenir|V|происходить, прибывать
imprescindible|A|необходимый, незаменимый
proseguir|V|продолжать
previamente|D|предварительно
confusión|N|путаница
banca|N|банковский сектор; скамья
cantante|N|певец
candidatura|N|кандидатура
depositar|V|класть, вносить
editorial|N|издательство; передовица
israel|N|Израиль
ideal|A|идеальный
verso|N|стих
tabaco|N|табак
vacación|N|каникулы, отпуск
infraestructura|N|инфраструктура
opuesto|A|противоположный
regalar|V|дарить
expulsar|V|изгонять
aislado|A|изолированный
complicado|A|сложный, запутанный
circular|V|циркулировать; циркуляр
juvenil|A|юношеский
escrito|N|письменный текст, документ
aprendizaje|N|обучение, усвоение
visitante|N|посетитель
horizonte|N|горизонт
expansión|N|экспансия, расширение
estrenar|V|впервые использовать, премьера
distrito|N|округ, район
dignidad|N|достоинство
académico|A|академический
aguantar|V|выдерживать, терпеть
corredor|N|коридор; бегун; брокер
genético|A|генетический
sensibilidad|N|чувствительность
prolongar|V|продлевать
magnífico|A|великолепный
sucio|A|грязный
oriental|A|восточный
tonelada|N|тонна
por cierto|D|кстати
entrenador|N|тренер
acostar|V|укладывать спать
bolivia|N|Боливия
promesa|N|обещание
torre|N|башня
aludir|V|намекать, упоминать
quejar|V|жаловаться
efectivamente|D|действительно
programación|N|программирование, программа
fácilmente|D|легко
felicidad|N|счастье
depósito|N|вклад, склад, отложение
estimular|V|стимулировать
estallar|V|взрываться, вспыхивать
regir|V|править, действовать (о законе)
fiel|A|верный
limitación|N|ограничение
esclavo|N|раб
afuera|D|снаружи
terrorismo|N|терроризм
corregir|V|исправлять
la habana|N|Гавана
bastante|R|достаточное количество
primavera|N|весна
panorama|N|панорама, обзор
avanzado|A|продвинутый
oscuridad|N|темнота
detención|N|задержание, арест
obstáculo|N|препятствие
grueso|A|толстый; основная часть
embajada|N|посольство
percepción|N|восприятие
importación|N|импорт
esencia|N|сущность, эссенция
cola|N|хвост, очередь
diplomático|A|дипломатический
sabor|N|вкус
energético|A|энергетический
lamentar|V|сожалеть
secuestro|N|похищение, угон
clinton|N|Клинтон
apariencia|N|внешний вид, видимость
nacionalista|A|националистический
zapato|N|туфля, ботинок
expediente|N|дело (документ)
señorito|N|молодой господин
doméstico|A|домашний
acariciar|V|ласкать
parcial|A|частичный, пристрастный
espacial|A|космический, пространственный
gloria|N|слава
turno|N|очередь, смена
cuarenta|N|сорок
oculto|A|скрытый
diablo|N|дьявол
excluir|V|исключать
contradicción|N|противоречие
amo|N|хозяин; люблю (форма)
mandato|N|мандат, полномочие
proyección|N|проекция, прогноз
húmedo|A|влажный
circuito|N|цепь, контур, трасса
conductor|N|водитель; проводник
corresponsal|N|корреспондент
incendio|N|пожар
posesión|N|владение
antecedente|N|предшествующее, судимость
panamá|N|Панама
agotar|V|исчерпывать, утомлять
espectacular|A|эффектный, зрелищный
gravedad|N|серьёзность; гравитация
modalidad|N|вид, форма
sucesivo|A|последовательный
variado|A|разнообразный
admirar|V|восхищаться
ecuador|N|Эквадор; экватор
financiar|V|финансировать
republicano|A|республиканский
tapar|V|закрывать, прикрывать
arco|N|дуга, арка, лук
invadir|V|вторгаться
estético|A|эстетический
jurar|V|клясться
sacrificio|N|жертва, жертвоприношение
financiación|N|финансирование
nave|N|корабль, неф (храма)
incapaz|A|неспособный
onda|N|волна
raza|N|раса, порода
enterrar|V|хоронить
virus|N|вирус
aportación|N|вклад
curiosidad|N|любопытство
mediano|A|средний
reducido|A|сокращённый, небольшой
involucrar|V|вовлекать
tarifa|N|тариф
romano|A|римский
captar|V|улавливать, привлекать
comisario|N|комиссар, комиссар полиции
espiritual|A|духовный
inspirar|V|вдохновлять, вдыхать
andaluz|A|андалусский
cuerdo|N|здравый, разумный
defecto|N|недостаток, дефект
comparación|N|сравнение
viajero|N|путешественник
cigarrillo|N|сигарета
cuota|N|взнос, квота
residir|V|проживать
disminución|N|уменьшение
territorial|A|территориальный
combinación|N|сочетание
restante|A|остальной
llave|N|ключ
síntesis|N|синтез, резюме
cada vez que|C|каждый раз, когда
efe|N|EFE (агентство)
ancho|A|широкий
mérito|N|заслуга, достоинство
introducción|N|введение
gen|N|ген
desaparición|N|исчезновение
multiplicar|V|умножать, размножать
harina|N|мука
castigo|N|наказание
corona|N|корона
concretar|V|конкретизировать, договариваться
milagro|N|чудо
corporación|N|корпорация
destrucción|N|разрушение
bogotá|N|Богота
continuidad|N|непрерывность
solucionar|V|решать (проблему)
competir|V|соревноваться
entrenamiento|N|тренировка
desgracia|N|несчастье
proclamar|V|провозглашать
martín|N|Мартин
revisión|N|проверка, пересмотр
cualidad|N|качество, свойство
orilla|N|берег, край
forzar|V|заставлять, форсировать
vigilancia|N|надзор
exclusivo|A|исключительный
fantasía|N|фантазия
conjunto|A|совместный, совокупный
afrontar|V|противостоять, встречаться с
armar|V|вооружать, собирать
comprensión|N|понимание
pesar|V|весить; a pesar
publicitario|A|рекламный
vigilar|V|следить, охранять
asignar|V|назначать, выделять
abarcar|V|охватывать
multitud|N|множество, толпа
extrañar|V|скучать; казаться странным
pri|N|PRI (партия Мексики)
mágico|A|магический
jesús|N|Иисус
posiblemente|D|возможно
estratégico|A|стратегический
adolescente|N|подросток
compositor|N|композитор
puesta|N|постановка; ставка; закат
retener|V|удерживать
mediodía|N|полдень
cansar|V|утомлять
evento|N|событие
físico|N|физик; телосложение
a|N|буква a
precisión|N|точность
puerto rico|N|Пуэрто-Рико
semilla|N|семя
pasajero|N|пассажир
corriente|A|обычный, текущий
una vez que|C|как только, после того как
huella|N|след
condicionar|V|обусловливать
disponible|A|доступный, свободный
indispensable|A|незаменимый
placa|N|табличка, номерной знак
monte|N|гора, лес
centenar|N|сотня
emergencia|N|чрезвычайная ситуация
atar|V|связывать
absurdo|A|абсурдный
lujo|N|роскошь
asesor|N|советник, консультант
reservar|V|резервировать
gallo|N|петух
tesoro|N|сокровище, казна
imprimir|V|печатать
ordenador|N|компьютер
normalmente|D|обычно
doctrina|N|доктрина, учение
inevitable|A|неизбежный
mínimo|N|минимум
doler|V|болеть
cinta|N|лента
líquido|N|жидкость
oler|V|нюхать, пахнуть
tragedia|N|трагедия
moderado|A|умеренный
fallar|V|терпеть неудачу; выносить приговор
anticipar|V|предвосхищать
visible|A|видимый
conexión|N|связь, соединение
colaborador|N|сотрудник
ligar|V|связывать
cartero|N|почтальон
convicción|N|убеждение
conservación|N|сохранение, охрана
singular|A|единственный, своеобразный
inquietud|N|беспокойство
relativamente|D|относительно
castigar|V|наказывать
dado que|C|поскольку
identificación|N|опознание, идентификация
cabello|N|волосы
conquistar|V|завоёвывать
disparo|N|выстрел
bienestar|N|благополучие
mina|N|шахта, мина
castellano|N|кастильский, испанский
iii|N|III (третий)
moscú|N|Москва
estadístico|N|статистический
rigor|N|строгость, точность
igualdad|N|равенство
ajustar|V|подгонять, регулировать
administrar|V|управлять, назначать (лекарство)
clasificar|V|классифицировать
utilidad|N|полезность, утилита
conquista|N|завоевание
habitar|V|обитать
cincuenta|N|пятьдесят
cinematográfico|A|кинематографический
integrante|N|участник, составная часть
satisfecho|A|удовлетворённый
considerable|A|значительный
mito|N|миф
explosión|N|взрыв
beso|N|поцелуй
aparentemente|D|по-видимому
estructural|A|структурный
fundamento|N|основание, фундамент
válido|A|действительный, веский
transportar|V|перевозить
avisar|V|предупреждать, извещать
maniobra|N|манёвр
urgente|A|срочный
subida|N|подъём, повышение
marino|N|моряк
extenso|A|обширный
incidencia|N|случай, влияние
pelota|N|мяч
intelectual|N|интеллектуал
monje|N|монах
adulto|N|взрослый
estricto|A|строгий
explotar|V|эксплуатировать; взрываться
paralelo|A|параллельный
boda|N|свадьба
leve|A|лёгкий, незначительный
varón|N|мужчина, самец
nocturno|A|ночной
agitar|V|трясти, волновать
vos|R|ты (в LatAm)
escultura|N|скульптура
fama|N|слава, известность
ahora que|C|теперь, когда
necesariamente|D|обязательно, непременно
real madrid|N|Реал Мадрид
corporal|A|телесный
fantasma|N|призрак
adaptación|N|адаптация
síndrome|N|синдром
inscribir|V|записывать, регистрировать
creencia|N|убеждение, вера
primitivo|A|первобытный, примитивный
borrar|V|стирать, удалять
de manera que|C|так что
terrorista|A|террористический
gota|N|капля
cultivar|V|возделывать, культивировать
maravilloso|A|замечательный
atlético|A|атлетический; «Атлетико»
ratificar|V|ратифицировать
aguardar|V|ожидать
de acuerdo a|C|согласно
fallo|N|сбой; судебное решение
ocasionar|V|вызывать, причинять
intérprete|N|переводчик, исполнитель
cruz|N|крест
librar|V|избавлять; выдавать (чек)
sexto|N|шестой
ala|N|крыло
dotar|V|наделять, оснащать
contraste|N|контраст
licenciado|N|дипломированный специалист
carro|N|повозка, машина (LatAm)
socialismo|N|социализм
lección|N|урок
votación|N|голосование
préstamo|N|заём, ссуда
oportuno|A|своевременный, уместный
suficientemente|D|достаточно
agresión|N|агрессия, нападение
pleno|N|пленум
pistola|N|пистолет
narcotráfico|N|наркоторговля
dorado|A|золотой
trayectoria|N|траектория, карьера
satélite|N|спутник
ocupación|N|занятие, оккупация
ajuste|N|настройка, корректировка
debilidad|N|слабость
habilidad|N|умение, навык
transmisión|N|передача
sospecha|N|подозрение
comerciante|N|торговец
aproximar|V|приближать
miseria|N|нищета, горе
misa|N|месса
domicilio|N|место жительства
ciego|A|слепой
adicional|A|дополнительный
finalidad|N|цель, предназначение
hecho|A|сделанный, совершённый
pecado|N|грех
mientras tanto|D|тем временем
unión europea|N|Европейский союз
separación|N|разделение, разлука
mentir|V|лгать
conde|N|граф
idéntico|A|идентичный
a lo mejor|D|может быть
mundial|N|чемпионат мира
lógico|N|логическое; логик
pnv|N|PNV (баскская партия)
planificación|N|планирование
obligado|A|обязанный, вынужденный
leyenda|N|легенда
vigor|N|сила, действие (закона)
suscribir|V|подписывать(ся)
encargado|A|отвечающий, уполномоченный
suspensión|N|приостановка, подвеска
determinación|N|решимость, определение
talento|N|талант
batir|V|бить, взбивать, побивать (рекорд)
vidrio|N|стекло
frenar|V|тормозить
herramienta|N|инструмент
verdaderamente|D|воистину, действительно
vitamina|N|витамин
severo|A|суровый
vanguardia|N|авангард
abuso|N|злоупотребление
coro|N|хор
complejo|N|комплекс
ave|N|птица
enamorar|V|влюблять(ся)
excepcional|A|исключительный
cuartel|N|казарма
trámite|N|формальность, процедура
conversar|V|беседовать
tramo|N|участок, отрезок
xx|N|XX (двадцатый)
nieve|N|снег
resaltar|V|выделять, подчёркивать
caracas|N|Каракас
visual|A|зрительный
cm|N|см (сантиметр)
esfera|N|сфера
agrupar|V|группировать
secuencia|N|последовательность
prisa|N|спешка
asesino|N|убийца
palo|N|палка
copia|N|копия
escritura|N|письмо, писание
caso del|C|в случае
odio|N|ненависть
cristo|N|Христос
coordinador|N|координатор
propiciar|V|способствовать
lucir|V|блистать, выглядеть
internet|N|интернет
regulación|N|регулирование
tránsito|N|движение, транзит
profundamente|D|глубоко
clínico|N|клиницист
moral|N|мораль, нравственность
doblar|V|сгибать, дублировать
militante|N|активист, боевик
en cualquier caso|D|в любом случае
onu|N|ООН
culminar|V|завершать(ся), достигать пика
artificial|A|искусственный
gerente|N|управляющий, менеджер
observador|N|наблюдатель
agrupación|N|группировка, объединение
pedazo|N|кусок
combustible|N|топливо
limitado|A|ограниченный
llama|N|пламя; лама
medalla|N|медаль
párrafo|N|абзац
curvo|N|изгиб, кривая
locura|N|безумие
dominante|A|господствующий
calma|N|спокойствие
respaldo|N|поддержка, спинка
divino|A|божественный
violar|V|нарушать, насиловать
renovación|N|обновление, продление
protagonizar|V|играть главную роль
contigo|R|с тобой
al tiempo que|C|в то время как
ugt|N|UGT (профсоюз)
acentuar|V|подчёркивать, ставить ударение
progresivo|A|постепенный, прогрессивный
sonoro|A|звучный
rodar|V|катиться; снимать (фильм)
ángulo|N|угол
sorprendente|A|удивительный
eco|N|эхо
temblar|V|дрожать
empeñar|V|закладывать; empeñarse: настаивать
ola|N|волна
inocente|A|невинный
incorporación|N|включение, вступление
terrestre|A|земной, наземный
magnitud|N|величина, магнитуда
vocación|N|призвание
cerdo|N|свинья
humedad|N|влажность
violación|N|нарушение; изнасилование
presionar|V|давить, оказывать давление
menor|N|несовершеннолетний
atractivo|A|привлекательный
asistente|N|помощник, ассистент
jurado|N|жюри, присяжные
africano|A|африканский
sembrar|V|сеять
coordinación|N|координация
comportar|V|влечь за собой; вести себя
partidario|A|сторонник
decidido|A|решительный
invitado|N|гость
absorber|V|поглощать
poético|A|поэтический
apostar|V|ставить (на), делать ставку
rezar|V|молиться
filme|N|фильм
valioso|A|ценный
vengar|V|мстить
torero|N|тореро, матадор
disolver|V|растворять, распускать
infinito|A|бесконечный
deducir|V|выводить, удерживать
así como|C|а также
relatar|V|рассказывать
creador|N|создатель
acá|D|здесь, сюда
nombramiento|N|назначение
privilegio|N|привилегия
aspiración|N|стремление
siquiera|D|хотя бы
enseguida|D|сразу, тотчас
documentación|N|документация
fibra|N|волокно
encargado|N|управляющий, ответственный
decena|N|десяток
trazar|V|чертить, намечать
misterioso|A|таинственный
oh|F|о, ох
tronco|N|ствол, туловище
occidente|N|Запад
adivinar|V|угадывать
afán|N|рвение, стремление
muñeco|N|кукла, манекен
renuncia|N|отставка, отказ
vegetal|A|растительный
exclamar|V|восклицать
espada|N|меч, шпага
ganador|N|победитель
ligeramente|D|слегка
pluma|N|перо, ручка
ansiedad|N|тревога, беспокойство
fusión|N|слияние, ядерный синтез
país vasco|N|Страна Басков
grano|N|зерно
obvio|A|очевидный
mancha|N|пятно
viudo|N|вдовец
relieve|N|рельеф; выделяться
personalmente|D|лично
ciertamente|D|конечно, несомненно
colonial|A|колониальный
recomendación|N|рекомендация
aparente|A|кажущийся, видимый
valoración|N|оценка
otoño|N|осень
asalto|N|штурм, нападение
nervio|N|нерв
fotógrafo|N|фотограф
infierno|N|ад
maíz|N|кукуруза
sacudir|V|трясти
fernando|N|Фернандо
barra|N|брус, стойка, полоса
sujeto|A|подверженный
suscitar|V|вызывать, возбуждать
tv|N|ТВ, телевидение
tercio|N|треть; тертио (коррида)
integral|A|полный, комплексный
teatral|A|театральный
centímetro|N|сантиметр
broma|N|шутка
prioridad|N|приоритет
agradable|A|приятный
funcional|A|функциональный
civilización|N|цивилизация
represión|N|репрессии, подавление
noble|A|благородный, дворянин
sierra|N|горный хребет; пила
adquisición|N|приобретение
tranquilidad|N|спокойствие
sanidad|N|здравоохранение
precioso|A|драгоценный, прекрасный
balón|N|мяч
transferencia|N|перевод, трансфер
aniversario|N|годовщина
demandar|V|требовать, предъявлять иск
robo|N|кража, ограбление
xviii|N|XVIII (восемнадцатый)
repente|N|внезапность (de repente)
aliado|N|союзник
aporte|N|вклад
ideal|N|идеал
giro|N|поворот, перевод (денежный)
doloroso|A|болезненный, горестный
condena|N|приговор, осуждение
parlamentario|N|парламентарий
herencia|N|наследство, наследие
programar|V|программировать, планировать
villa|N|городок, вилла
editar|V|издавать, редактировать
km|N|км (километр)
licencia|N|лицензия, отпуск
rescatar|V|спасать, выкупать
experimento|N|эксперимент
fortalecer|V|укреплять
exilio|N|изгнание, эмиграция
modesto|A|скромный
ganancia|N|прибыль, выигрыш
aceptación|N|принятие, признание
adentro|D|внутри
daniel|N|Даниэль
prevenir|V|предотвращать, предупреждать
limpieza|N|чистота, уборка
desierto|N|пустыня
privatización|N|приватизация
tremendo|A|огромный, страшный
pelear|V|драться, ссориться
clavar|V|вбивать, вонзать
deshacer|V|разбирать, отменять
elegante|A|элегантный
fuga|N|побег, утечка
cancha|N|площадка, корт
célebre|A|знаменитый
radicar|V|заключаться, корениться
israelí|A|израильский
recinto|N|помещение, огороженная территория
restar|V|вычитать, оставаться
crema|N|крем
plenamente|D|в полной мере
contribución|N|вклад, взнос
respecto al|C|относительно
canadá|N|Канада
preferencia|N|предпочтение
cardenal|N|кардинал
prestación|N|пособие, услуга
gramo|N|грамм
caza|N|охота
uniforme|N|форма, мундир
elemental|A|элементарный
fiscalía|N|прокуратура
configurar|V|настраивать, формировать
plataforma|N|платформа
filosófico|A|философский
canciller|N|канцлер, министр иностранных дел
fracasar|V|терпеть неудачу
gran bretaña|N|Великобритания
ruina|N|руина, разорение
ronda|N|раунд, обход
terapéutico|A|терапевтический
selva|N|сельва, джунгли
casco|N|шлем; корпус (города)
proveer|V|снабжать, обеспечивать
romántico|A|романтический
convención|N|конвенция, съезд
fragmento|N|фрагмент
apropiado|A|подходящий
intermedio|A|промежуточный
península|N|полуостров
pez|N|рыба
mandatario|N|глава государства
ángel|N|ангел
traslado|N|перевод, перевозка
minoría|N|меньшинство
barrera|N|барьер
refugio|N|убежище
legislador|N|законодатель
desplazamiento|N|перемещение, смещение
metálico|A|металлический
uruguay|N|Уругвай
soporte|N|опора, поддержка
duque|N|герцог
resumen|N|резюме, сводка
animal|A|животный
filósofo|N|философ
récord|N|рекорд
accionista|N|акционер
inspección|N|инспекция, проверка
secar|V|сушить
reparar|V|чинить; замечать
limón|N|лимон
longitud|N|длина, долгота
abandono|N|заброшенность, отказ
cementerio|N|кладбище
finca|N|ферма, поместье
en cuanto al|C|что касается
prevención|N|профилактика, предотвращение
judío|N|еврей
racional|A|рациональный
complementario|A|дополнительный
tormenta|N|буря, гроза
alejado|A|удалённый
consigo|R|с собой
desempleo|N|безработица
tumba|N|могила
deterioro|N|ухудшение, износ
retorno|N|возврат, возвращение
buque|N|судно, корабль
en tanto que|C|в то время как, поскольку
honduras|N|Гондурас
refugiado|N|беженец
brillar|V|сиять
argumentar|V|аргументировать
soberanía|N|суверенитет
oficialmente|D|официально
ordinario|A|обычный, ординарный
triunfar|V|торжествовать
inspector|N|инспектор
perteneciente|A|принадлежащий
disimular|V|скрывать, притворяться
evidentemente|D|очевидно
prolongado|A|продолжительный
cariño|N|ласка, привязанность
editor|N|издатель, редактор
caribe|N|Карибы, Карибский
e|N|и (перед i/hi)
guiar|V|вести, направлять
psicología|N|психология
imitar|V|подражать
pretensión|N|притязание, претензия
embarazo|N|беременность
vela|N|свеча; парус
aviso|N|извещение, предупреждение
acelerar|V|ускорять
emocional|A|эмоциональный
simbólico|A|символический
paciencia|N|терпение
paralizar|V|парализовать
monumento|N|памятник
enviado|N|посланник, отправленный
ap|N|AP (агентство)
historiador|N|историк
delincuente|N|преступник
tubo|N|труба, тюбик
catalán|N|каталонец; каталанский язык
representativo|A|представительный
pisar|V|ступать, наступать
periodismo|N|журналистика
carencia|N|нехватка
secuestrar|V|похищать
perjudicar|V|наносить ущерб
perdido|A|потерянный
rumbo|N|курс, направление
plantilla|N|штат, шаблон
abc|N|ABC (газета)
noción|N|понятие, представление
mixto|A|смешанный
horror|N|ужас
contraer|V|сокращать; заключать (брак, долг)
flujo|N|поток
el salvador|N|Сальвадор
autorización|N|разрешение
convencional|A|условный, обычный
olvido|N|забвение
acomodar|V|приспосабливать, размещать
gal|N|GAL; галисийский
calendario|N|календарь
probabilidad|N|вероятность
excelencia|N|превосходство, превосходительство
muscular|A|мышечный
rapidez|N|быстрота
rol|N|роль
periodístico|A|журналистский
comunista|N|коммунист
urss|N|СССР
jugo|N|сок
participante|N|участник
respiración|N|дыхание
lingüístico|A|лингвистический
prender|V|зажигать; хватать, арестовывать
creativo|A|творческий
vigencia|N|действие, актуальность
desviar|V|отклонять, сворачивать
tragar|V|глотать
inconveniente|N|неудобство, препятствие
aparte|D|отдельно, кроме того
mortal|A|смертельный, смертный
legítimo|A|законный, легитимный
encaminar|V|направлять
cero|N|ноль
trágico|A|трагический
desplegar|V|развёртывать
directivo|A|руководящий
marino|A|морской
reemplazar|V|заменять
vaca|N|корова
pasaje|N|пассаж, проезд, отрывок
invasión|N|вторжение
capturar|V|захватывать
bañar|V|купать
montaje|N|монтаж, постановка
agresivo|A|агрессивный
razonable|A|разумный
salarial|A|зарплатный
judío|A|еврейский
sufrimiento|N|страдание
receptor|N|приёмник, получатель
miel|N|мёд
constantemente|D|постоянно
justamente|D|как раз, справедливо
desastre|N|катастрофа
remoto|A|далёкий, удалённый
maldito|A|проклятый
fabricación|N|изготовление, производство
film|N|фильм
bolo|N|кегля; кусок (пищи)
`);
