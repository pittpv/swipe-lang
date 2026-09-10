import { mergeGloss } from './parse-gloss.js';

/**
 * Russian glosses for NGSL 1.01 lemmas missing from the course banks.
 * Source lemmas: New General Service List 1.01 (Browne, Culligan & Phillips; CC BY-SA 4.0).
 * Translations are original pedagogical glosses for TR→RU-style study (EN lemma + Russian meaning).
 * POS: N noun, V verb, A adjective, D adverb, R pronoun, C prep/conjunction, F phrase, O other.
 */
export const EN_RU = mergeGloss(`
of|C|из, от|A cup of tea.|Чашка чая.
to|C|к; чтобы|I go to work.|Я иду на работу.
not|D|не|I am not ready.|Я не готов.
with|C|с, вместе с|I live with my sister.|Я живу с сестрой.
as|C|как; в качестве|She works as a teacher.|Она работает учителем.
but|C|но|I like tea but not coffee.|Я люблю чай, но не кофе.
by|C|кем-то; при помощи; около|This book is by a poet.|Эту книгу написал поэт.
or|C|или|Tea or coffee?|Чай или кофе?
so|D|так, поэтому|I was tired, so I sat.|Я устал, поэтому сел.
all|R|все, весь|All students are here.|Все студенты здесь.
if|C|если|Call me if you need help.|Позвони, если нужна помощь.
would|V|бы (условн.)|I would like some water.|Я бы хотел воды.
about|C|о, около|We talked about the film.|Мы говорили о фильме.
which|R|который|Which book do you want?|Какую книгу ты хочешь?
more|D|больше|I need more time.|Мне нужно больше времени.
up|D|вверх, наверх|Please stand up.|Пожалуйста, встаньте.
out|D|наружу, вне|She went out.|Она вышла.
because|C|потому что|I stayed because it rained.|Я остался, потому что шёл дождь.
could|V|мог, мог бы|Could you help me?|Не могли бы вы помочь?
than|C|чем|She is taller than me.|Она выше меня.
into|C|в (внутрь)|He went into the room.|Он вошёл в комнату.
only|D|только|I have only one ticket.|У меня только один билет.
way|N|путь, способ|This is the best way.|Это лучший способ.
over|C|над, свыше|The lamp is over the table.|Лампа над столом.
after|C|после|We met after class.|Мы встретились после урока.
most|D|наиболее, большинство|Most people agree.|Большинство людей согласны.
should|V|следует, должен|You should sleep more.|Тебе следует больше спать.
even|D|даже|Even a child knows this.|Даже ребёнок это знает.
such|R|такой|I have never seen such rain.|Я никогда не видел такого дождя.
really|D|действительно, очень|I really like this song.|Мне очень нравится эта песня.
before|C|до, перед|Wash your hands before lunch.|Мой руки перед обедом.
through|C|через, сквозь|We walked through the park.|Мы прошли через парк.
down|D|вниз|Please sit down.|Пожалуйста, садитесь.
still|D|всё ещё|It is still raining.|Дождь всё ещё идёт.
lot|N|много, уйма|I have a lot of work.|У меня много работы.
great|A|отличный, великий|That was a great idea.|Это была отличная идея.
both|R|оба|Both answers are correct.|Оба ответа верны.
own|A|собственный|She has her own room.|У неё своя комната.
part|N|часть|This is part of the story.|Это часть истории.
point|N|точка, смысл|That is a good point.|Это хорошее замечание.
little|A|маленький, мало|I have little time.|У меня мало времени.
something|R|что-то|I heard something.|Я что-то услышал.
another|R|другой, ещё один|Can I have another cup?|Можно ещё одну чашку?
each|R|каждый|Each student has a book.|У каждого студента есть книга.
different|A|разный, другой|We have different ideas.|У нас разные идеи.
off|D|прочь, выключено|Please turn the light off.|Пожалуйста, выключи свет.
end|N|конец|This is the end of the film.|Это конец фильма.
while|C|пока, в то время как|Wait here while I cook.|Подожди здесь, пока я готовлю.
must|V|должен|You must wear a helmet.|Ты должен носить шлем.
include|V|включать|The price includes tax.|Цена включает налог.
report|N|отчёт, доклад|I wrote a short report.|Я написал короткий отчёт.
case|N|случай, дело|In this case, wait.|В этом случае подожди.
around|C|вокруг, около|We walked around the lake.|Мы гуляли вокруг озера.
seem|V|казаться|You seem tired today.|Ты сегодня кажешься усталым.
again|D|снова|Please say that again.|Пожалуйста, повтори.
system|N|система|The system is simple.|Система простая.
every|R|каждый|Every day I walk.|Каждый день я гуляю.
during|C|во время|Be quiet during the test.|Тихо во время теста.
set|V|ставить, устанавливать|Please set the table.|Пожалуйста, накрой на стол.
few|R|немного, мало|Few people came.|Пришло мало людей.
state|N|государство, штат|This state is large.|Этот штат большой.
fact|N|факт|This is an important fact.|Это важный факт.
area|N|область, район|This area is quiet.|Этот район тихий.
provide|V|предоставлять|They provide free water.|Они дают бесплатную воду.
large|A|большой|They live in a large house.|Они живут в большом доме.
without|C|без|Do not go without a coat.|Не выходи без пальто.
believe|V|верить, считать|I believe you.|Я тебе верю.
second|A|второй; секунда|This is my second visit.|Это мой второй визит.
though|C|хотя|Though it rained, we walked.|Хотя шёл дождь, мы гуляли.
away|D|прочь, далеко|Please go away.|Пожалуйста, уходи.
happen|V|происходить|What happened here?|Что здесь произошло?
program|N|программа|This program is useful.|Эта программа полезная.
lead|V|вести, лидировать|She will lead the team.|Она будет вести команду.
thank|V|благодарить|I thank you for this.|Я благодарю вас за это.
less|D|меньше|I need less sugar.|Мне нужно меньше сахара.
until|C|до тех пор пока|Wait until I return.|Подожди, пока я вернусь.
reason|N|причина|What is the reason?|В чём причина?
able|A|способный|She is able to swim.|Она умеет плавать.
whether|C|ли|Ask whether he is home.|Спроси, дома ли он.
side|N|сторона|Stand on this side.|Встань с этой стороны.
quite|D|вполне, довольно|The room is quite small.|Комната довольно маленькая.
sure|A|уверенный|I am sure about this.|Я в этом уверен.
least|D|наименее, по крайней мере|At least try it.|По крайней мере попробуй.
within|C|внутри, в пределах|Stay within the park.|Оставайся в пределах парка.
process|N|процесс|The process is slow.|Процесс медленный.
public|A|общественный, публичный|This is a public park.|Это общественный парк.
actually|D|на самом деле|I actually like it.|На самом деле мне это нравится.
rather|D|скорее, довольно|I would rather wait.|Я предпочёл бы подождать.
together|D|вместе|We work together.|Мы работаем вместе.
consider|V|рассматривать, считать|Please consider my idea.|Пожалуйста, рассмотри мою идею.
hard|A|трудный, твёрдый|This test is hard.|Этот тест трудный.
local|A|местный|I buy local bread.|Я покупаю местный хлеб.
control|N|контроль, управление|Keep the dog under control.|Держи собаку под контролем.
concern|N|беспокойство, касательство|This is a real concern.|Это настоящее беспокойство.
almost|D|почти|I am almost ready.|Я почти готов.
continue|V|продолжать|Please continue reading.|Пожалуйста, продолжай читать.
whole|A|целый, весь|I ate the whole cake.|Я съел весь торт.
rate|N|ставка, уровень|The tax rate is high.|Налоговая ставка высокая.
care|N|забота|Take care of your health.|Береги своё здоровье.
effect|N|эффект, влияние|The effect was small.|Эффект был небольшим.
sort|N|сорт, тип|What sort of tea is this?|Что это за чай?
anything|R|что-нибудь|I do not need anything.|Мне ничего не нужно.
cause|V|вызывать, быть причиной|Rain can cause floods.|Дождь может вызвать наводнение.
deal|V|иметь дело, договариваться|I will deal with this.|Я разберусь с этим.
allow|V|позволять|They allow photos here.|Здесь разрешают фото.
base|N|основа, база|The base is strong.|Основа крепкая.
past|N|прошлое|Forget the past.|Забудь прошлое.
power|N|сила, власть|They have no power.|У них нет власти.
center|N|центр|Meet me in the center.|Встретимся в центре.
nothing|R|ничего|There is nothing here.|Здесь ничего нет.
matter|N|дело, вопрос|This is a serious matter.|Это серьёзный вопрос.
mind|N|ум, разум|Keep this in mind.|Имей это в виду.
value|N|ценность, стоимость|I know the value of time.|Я знаю ценность времени.
force|N|сила|They used too much force.|Они применили слишком много силы.
several|R|несколько|I have several questions.|У меня несколько вопросов.
bit|N|немного, кусочек|Wait a bit, please.|Подожди немного.
real|A|настоящий, реальный|Is this a real story?|Это настоящая история?
figure|N|цифра, фигура|Look at this figure.|Посмотри на эту цифру.
development|N|развитие|The city needs development.|Городу нужно развитие.
half|N|половина|I ate half the apple.|Я съел половину яблока.
clear|A|ясный, чистый|The sky is clear.|Небо ясное.
either|R|любой из двух, тоже|Either way is fine.|Любой вариант подойдёт.
per|C|на, в (расчёт)|It costs ten per kilo.|Это стоит десять за килограмм.
remain|V|оставаться|Please remain seated.|Пожалуйста, оставайтесь на местах.
top|N|верх, вершина|Put it on the top.|Положи это сверху.
among|C|среди|She sat among friends.|Она сидела среди друзей.
color|N|цвет|What color is the car?|Какого цвета машина?
involve|V|вовлекать, включать|The job will involve travel.|Работа будет включать поездки.
reach|V|достигать|We will reach the city soon.|Мы скоро доедем до города.
social|A|социальный, общественный|This is a social event.|Это светское мероприятие.
period|N|период|This period is difficult.|Этот период трудный.
across|C|через, по ту сторону|The shop is across the street.|Магазин через дорогу.
history|N|история|I like world history.|Мне нравится всемирная история.
create|V|создавать|They create new apps.|Они создают новые приложения.
along|C|вдоль|We walked along the river.|Мы шли вдоль реки.
type|N|тип, вид|What type of music is this?|Какая это музыка?
sound|N|звук|I heard a strange sound.|Я услышал странный звук.
political|A|политический|This is a political issue.|Это политический вопрос.
free|A|свободный, бесплатный|The museum is free today.|Музей сегодня бесплатный.
receive|V|получать|I receive letters every week.|Я получаю письма каждую неделю.
moment|N|момент, мгновение|Wait a moment, please.|Подождите минутку.
further|D|далее, дальше|We need further details.|Нам нужны дополнительные сведения.
require|V|требовать|This job requires English.|Эта работа требует английского.
general|A|общий, генеральный|This is a general rule.|Это общее правило.
appear|V|появляться, казаться|Stars appear at night.|Звёзды появляются ночью.
toward|C|к, по направлению к|He walked toward the door.|Он пошёл к двери.
individual|N|индивид, отдельный человек|Each individual is unique.|Каждый человек уникален.
sense|N|смысл, чувство|This makes no sense.|В этом нет смысла.
perhaps|D|возможно, может быть|Perhaps it will rain.|Возможно, будет дождь.
add|V|добавлять|Please add some salt.|Пожалуйста, добавь соли.
rule|N|правило|This is a simple rule.|Это простое правило.
produce|V|производить|They produce good cheese.|Они производят хороший сыр.
everything|R|всё|I packed everything.|Я упаковал всё.
cover|V|покрывать, освещать|Please cover the food.|Пожалуйста, накрой еду.
position|N|положение, должность|What is your position?|Какая у вас должность?
human|A|человеческий|This is a human right.|Это право человека.
situation|N|ситуация|The situation is better now.|Ситуация сейчас лучше.
war|N|война|The war ended years ago.|Война закончилась много лет назад.
major|A|главный, крупный|This is a major problem.|Это серьёзная проблема.
someone|R|кто-то|Someone is at the door.|Кто-то у двери.
above|C|над, выше|The clock is above the door.|Часы над дверью.
design|N|дизайн, проект|I like this design.|Мне нравится этот дизайн.
special|A|особый, специальный|Today is a special day.|Сегодня особый день.
condition|N|состояние, условие|The car is in good condition.|Машина в хорошем состоянии.
carry|V|нести, возить|Can you carry this bag?|Можешь нести эту сумку?
certain|A|определённый, уверенный|I am certain of this.|Я в этом уверен.
forward|D|вперёд|Please step forward.|Пожалуйста, шагните вперёд.
main|A|главный|This is the main road.|Это главная дорога.
describe|V|описывать|Please describe the photo.|Пожалуйста, опиши фото.
himself|R|себя, сам|He did it himself.|Он сделал это сам.
especially|D|особенно|I like tea, especially green.|Я люблю чай, особенно зелёный.
rise|V|подниматься, расти|Prices rise every year.|Цены растут каждый год.
community|N|сообщество, община|Our community is friendly.|Наше сообщество дружелюбное.
else|D|ещё, другой|What else do you need?|Что ещё тебе нужно?
particular|A|конкретный, особенный|I have no particular plan.|У меня нет конкретного плана.
role|N|роль|She has an important role.|У неё важная роль.
detail|N|деталь, подробность|Tell me every detail.|Расскажи все подробности.
difference|N|разница|I see no difference.|Я не вижу разницы.
action|N|действие, поступок|We need action now.|Нам нужны действия сейчас.
step|N|шаг|This is the first step.|Это первый шаг.
themselves|R|себя, сами
model|N|модель
front|N|перед, фасад
outside|C|снаружи, вне
economic|A|экономический
site|N|сайт, место
approach|N|подход
land|N|земля, суша
death|N|смерть
amount|N|количество, сумма
regard|N|отношение, внимание
organization|N|организация
act|V|действовать
range|N|диапазон, ряд
round|C|вокруг; круг
accord|N|согласие, соответствие
list|N|список
wish|V|желать
fund|V|финансировать
kid|N|ребёнок, малыш
kill|V|убивать
likely|A|вероятный
certainly|D|конечно, несомненно
national|A|национальный, государственный
itself|R|сам, само
field|N|поле, область
air|N|воздух
benefit|N|польза, пособие
trade|N|торговля
standard|N|стандарт
percent|N|процент
space|N|пространство, космос
instead|D|вместо этого
realize|V|осознавать, понимать
society|N|общество
mention|V|упоминать
common|A|общий, обычный
culture|N|культура
total|A|общий, полный
demand|V|требовать
material|N|материал
limit|V|ограничивать
due|A|должный, обусловленный
effort|N|усилие
attention|N|внимание
upon|C|на, по
complete|V|завершать
lie|V|лежать, лгать
pick|V|выбирать, поднимать
personal|A|личный
ground|N|земля, основание
current|A|текущий, нынешний
century|N|век, столетие
exist|V|существовать
similar|A|похожий
leader|N|лидер, руководитель
former|A|бывший
contact|V|связываться
particularly|D|в особенности
discuss|V|обсуждать
response|N|ответ, реакция
piece|N|кусок, часть
suppose|V|предполагать
president|N|президент
court|N|суд, корт
police|N|полиция
store|N|магазин, запас
knowledge|N|знание
laugh|V|смеяться
employee|N|сотрудник
simply|D|просто
firm|N|фирма; твёрдый
cell|N|клетка, ячейка
attack|V|атаковать
foreign|A|иностранный
surprise|V|удивлять
feature|N|особенность, черта
factor|N|фактор
affect|V|влиять
drop|V|ронять, падать
recent|A|недавний
relate|V|относиться, связывать
official|A|официальный
financial|A|финансовый
private|A|частный, личный
pause|V|делать паузу
everyone|R|все
worry|V|беспокоиться
represent|V|представлять
inside|C|внутри
international|A|международный
contain|V|содержать
notice|V|замечать
wonder|V|интересоваться, удивляться
nature|N|природа
structure|N|структура
section|N|раздел, секция
myself|R|себя, сам
exactly|D|точно
worker|N|работник
press|V|нажимать, давить
whatever|R|что бы ни, любой
region|N|регион
growth|N|рост
influence|N|влияние
various|A|различный
thus|D|таким образом
simple|A|простой
medium|N|средство; средний
average|A|средний
management|N|управление, менеджмент
establish|V|устанавливать, основывать
indeed|D|действительно
final|A|окончательный, финальный
economy|N|экономика
guy|N|парень
function|N|функция
image|N|изображение, образ
behavior|N|поведение
addition|N|дополнение
determine|V|определять
population|N|население
production|N|производство
contract|N|контракт, договор
player|N|игрок
enter|V|входить
occur|V|происходить
alone|D|один, в одиночестве
significant|A|значительный
drug|N|лекарство, наркотик
direct|A|прямой
director|N|директор, режиссёр
clearly|D|ясно, отчётливо
lack|N|нехватка
depend|V|зависеть
recognize|V|узнавать, признавать
purpose|N|цель, назначение
gain|V|получать, приобретать
church|N|церковь
machine|N|машина, механизм
item|N|пункт, предмет
cent|N|цент
stuff|N|вещи, материал
anyone|R|кто-нибудь
method|N|метод
analysis|N|анализ
military|A|военный
below|C|ниже, под
movie|N|фильм
discussion|N|обсуждение
nation|N|нация, страна
nearly|D|почти
link|N|связь, ссылка
despite|C|несмотря на
introduce|V|представлять, вводить
advantage|N|преимущество
marry|V|жениться, выходить замуж
strike|V|ударять, бастовать
mile|N|миля
seek|V|искать, стремиться
unit|N|единица, блок
quickly|D|быстро
agreement|N|соглашение, согласие
release|N|выпуск, освобождение
solution|N|решение
capital|N|столица, капитал
popular|A|популярный
specific|A|конкретный, особый
fear|N|страх
television|N|телевидение
pull|V|тянуть
access|N|доступ
movement|N|движение
treat|V|обращаться, лечить
identify|V|определять, опознавать
loss|N|потеря
shall|V|должен
pressure|N|давление
yourself|R|себя, сам
supply|V|поставлять
worth|A|стоящий
natural|A|природный, естественный
express|V|выражать
investment|N|инвестиция
organize|V|организовывать
beyond|C|за пределами, помимо
potential|A|потенциальный
energy|N|энергия
trouble|N|проблема, беда
relation|N|отношение, родственник
touch|N|прикосновение
middle|N|середина
bar|N|бар, стойка
suffer|V|страдать
strategy|N|стратегия
except|C|кроме, за исключением
tend|V|иметь тенденцию
advance|N|продвижение, аванс
fill|V|наполнять
star|N|звезда
generally|D|в целом, обычно
task|N|задача
normal|A|нормальный
associate|N|ассоциировать, связывать
positive|A|положительный
option|N|вариант, опция
instance|N|пример, случай
style|N|стиль
refer|V|ссылаться
push|V|толкать
quarter|N|четверть, квартал
assume|V|предполагать
doubt|N|сомнение
competition|N|соревнование, конкуренция
propose|V|предлагать
fly|V|летать
pattern|N|образец, узор
obviously|D|очевидно
unclear|A|неясный
separate|A|отдельный
anyway|D|в любом случае
speech|N|речь
officer|N|офицер, сотрудник
throughout|C|на протяжении, по всему
profit|N|прибыль
guess|V|угадывать, предполагать
resource|N|ресурс
balance|N|баланс, равновесие
damage|N|ущерб, повреждение
basis|N|основа, базис
author|N|автор
basic|A|базовый, основной
encourage|V|поощрять, ободрять
male|A|мужской
operate|V|работать, управлять
reflect|V|отражать
property|N|собственность, свойство
previous|A|предыдущий
imagine|V|представлять, воображать
okay|D|хорошо, ладно
define|V|определять
conclusion|N|вывод, заключение
clock|N|часы
everybody|R|все
professional|A|профессиональный
mine|R|мой
object|N|предмет, объект
maintain|V|поддерживать, сохранять
credit|N|кредит, заслуга
dead|A|мёртвый
extend|V|продлевать, расширять
possibility|N|возможность
direction|N|направление
facility|N|учреждение, объект
variety|N|разнообразие
daily|A|ежедневный
track|N|дорожка, след
completely|D|полностью
female|A|женский
responsibility|N|ответственность
original|A|оригинальный, первоначальный
rock|N|скала, рок
nor|C|ни, и не
easily|D|легко
dollar|N|доллар
fix|V|чинить, исправлять
ahead|D|впереди
cross|V|пересекать
yeah|D|да, ага
proposal|N|предложение
version|N|версия
conversation|N|разговор
somebody|R|кто-то
pound|N|фунт
shape|N|форма
welcome|V|приветствовать
communication|N|общение, связь
agent|N|агент
judge|V|судить
herself|R|себя, сама
estimate|V|оценивать
favorite|A|любимый
difficulty|N|трудность
purchase|V|покупать
shoot|V|стрелять
announce|V|объявлять
unless|C|если не
independent|A|независимый
survey|N|опрос, обзор
majority|N|большинство
stick|V|приклеивать, держаться
request|V|просить, запрашивать
wind|N|ветер; наматывать
none|R|никто, ни один
appropriate|A|подходящий
block|V|блокировать
count|V|считать
scene|N|сцена, место происшествия
content|N|содержание
element|N|элемент
effective|A|эффективный
correct|A|правильный
medical|A|медицинский
admit|V|признавать, допускать
telephone|N|телефон
copy|V|копировать
committee|N|комитет
aware|A|осведомлённый
handle|V|справляться, обрабатывать
administration|N|администрация, управление
complex|A|сложный
context|N|контекст
directly|D|напрямую
remove|V|удалять, снимать
conduct|V|проводить
equipment|N|оборудование
otherwise|D|иначе
title|N|название, титул
extra|A|дополнительный
executive|A|исполнительный
sample|N|образец
sex|N|пол, секс
deliver|V|доставлять
video|N|видео
connection|N|связь, соединение
primary|A|основной, первичный
inform|V|информировать
principle|N|принцип
straight|A|прямой
appeal|V|обращаться, привлекать
highly|D|весьма, высоко
wonderful|A|замечательный
absolutely|D|абсолютно
flow|N|поток
additional|A|дополнительный
responsible|A|ответственный
collection|N|коллекция, сбор
hang|V|вешать, висеть
negative|A|отрицательный
alternative|A|альтернативный
ship|N|корабль
attitude|N|отношение, позиция
double|A|двойной
print|N|печать, оттиск
truth|N|правда
nobody|R|никто
examine|V|изучать, осматривать
lay|V|класть
politics|N|политика
reply|V|отвечать
display|V|показывать, отображать
slightly|D|слегка
overall|D|в целом
user|N|пользователь
respond|V|реагировать, отвечать
regular|A|регулярный, обычный
physical|A|физический
apart|D|отдельно, врозь
federal|A|федеральный
reveal|V|раскрывать
percentage|N|процент, доля
peace|N|мир, спокойствие
status|N|статус
decline|V|снижаться, отклонять
decade|N|десятилетие
favor|V|оказывать предпочтение
dry|A|сухой
institution|N|учреждение, институт
spot|N|пятно, место
heat|N|жара, тепло
excite|V|волновать, возбуждать
reader|N|читатель
importance|N|важность
distance|N|расстояние
guide|V|направлять
grant|V|предоставлять
feed|V|кормить
sector|N|сектор
ensure|V|обеспечивать, гарантировать
satisfy|V|удовлетворять
chief|N|начальник, глава
expert|N|эксперт
wave|N|волна
south|N|юг
labor|N|труд, рабочая сила
surface|N|поверхность
excellent|A|отличный
edge|N|край, кромка
camp|N|лагерь
procedure|N|процедура
global|A|глобальный
struggle|V|бороться
select|V|выбирать
surround|V|окружать
extent|N|степень, протяжённость
annual|A|ежегодный
fully|D|полностью
contrast|N|контраст
roll|V|катить, сворачивать
reality|N|реальность
photograph|N|фотография
entire|A|весь, целый
presence|N|присутствие
corner|N|угол
gas|N|газ, бензин
net|N|сеть, нетто
category|N|категория
secretary|N|секретарь
defense|N|оборона, защита
quick|A|быстрый
spread|V|распространять
nuclear|A|ядерный
scale|N|масштаб, шкала
cry|V|плакать, кричать
introduction|N|введение, представление
requirement|N|требование
north|N|север
confirm|V|подтверждать
senior|A|старший
emerge|V|появляться, возникать
concept|N|понятие, концепция
reform|V|реформировать
neither|R|ни тот ни другой
left|A|левый, оставшийся
solve|V|решать
neighbor|N|сосед
technique|N|техника, метод
improvement|N|улучшение
tool|N|инструмент
consequence|N|последствие
circumstance|N|обстоятельство
smoke|N|дым
reaction|N|реакция
brain|N|мозг
mass|N|масса
contribute|V|вносить вклад
speaker|N|оратор, динамик
bottom|N|низ, дно
adopt|V|принимать, усыновлять
combine|V|объединять
hide|V|прятать
marriage|N|брак
equal|A|равный
expression|N|выражение
plus|C|плюс, а также
extremely|D|чрезвычайно
commercial|A|коммерческий
lady|N|дама, женщина
cultural|A|культурный
arrange|V|организовывать, устраивать
scheme|N|схема, план
payment|N|платёж
unfortunately|D|к сожалению
brief|A|краткий
contribution|N|вклад
chapter|N|глава
secret|N|секрет
apparently|D|по-видимому
union|N|союз, профсоюз
burn|V|жечь, гореть
trend|N|тенденция
initial|A|первоначальный
pleasure|N|удовольствие
suggestion|N|предложение
critical|A|критический, важный
gather|V|собирать
mostly|D|в основном
earth|N|земля
pop|N|поп-музыка
essential|A|существенный, необходимый
desire|N|желание
employ|V|нанимать, применять
topic|N|тема
attract|V|привлекать
engage|V|вовлекать
powerful|A|мощный, влиятельный
crisis|N|кризис
settle|V|улаживать, поселяться
boat|N|лодка, судно
fan|N|фанат, вентилятор
safety|N|безопасность
divide|V|делить
length|N|длина
investigation|N|расследование
somewhere|R|где-то
expand|V|расширять
commit|V|совершать, обязываться
obvious|A|очевидный
weapon|N|оружие
relatively|D|относительно
district|N|район, округ
broad|A|широкий
tire|V|уставать
spirit|N|дух
actual|A|фактический, настоящий
battle|N|битва
hardly|D|едва, вряд ли
award|V|награждать
consideration|N|рассмотрение, внимание
strange|A|странный
code|N|код, кодекс
possibly|D|возможно
threat|N|угроза
accident|N|несчастный случай
revenue|N|доход, выручка
enable|V|давать возможность
afraid|A|испуганный
active|A|активный
religious|A|религиозный
cancer|N|рак
convince|V|убеждать
vary|V|варьироваться
environmental|A|экологический
sun|N|солнце
healthy|A|здоровый
volume|N|объём, том
location|N|местоположение
proceed|V|продолжать, приступать
glad|A|рад
tape|N|лента, скотч
stone|N|камень
sum|N|сумма
monitor|N|монитор
finance|N|финансы
shock|N|шок
usual|A|обычный
carefully|D|осторожно
wine|N|вино
manufacture|V|производить
theater|N|театр
totally|D|полностью
visitor|N|посетитель
freedom|N|свобода
construction|N|строительство
dear|A|дорогой
moreover|D|более того
onto|C|на
historical|A|исторический
oppose|V|противостоять
branch|N|ветвь, филиал
vehicle|N|транспортное средство
route|N|маршрут
bind|V|связывать
danger|N|опасность
bomb|N|бомба
army|N|армия
decrease|V|уменьшать
council|N|совет
normally|D|обычно
sight|N|зрение, вид
generate|V|производить, порождать
deny|V|отрицать
anybody|R|кто-нибудь
quote|V|цитировать
climb|V|карабкаться
basically|D|в основном
violence|N|насилие
minister|N|министр
mainly|D|главным образом
noise|N|шум
manner|N|манера, способ
gun|N|пистолет, оружие
square|N|площадь, квадрат
occasion|N|случай, повод
familiar|A|знакомый
ignore|V|игнорировать
affair|N|дело, роман
locate|V|находить, размещать
gold|N|золото
domestic|A|внутренний, домашний
load|N|нагрузка, груз
belief|N|убеждение, вера
troop|N|войска
technical|A|технический
acquire|V|приобретать
corporate|A|корпоративный
fairly|D|довольно, справедливо
wood|N|дерево, древесина
participate|V|участвовать
tear|V|рвать
representative|N|представитель
capacity|N|ёмкость, способность
border|N|граница
shake|V|трясти
assessment|N|оценка
shoe|N|туфля, ботинок
ought|V|следует
ad|N|реклама
regulation|N|правило, регулирование
escape|V|сбегать
studio|N|студия
proper|A|надлежащий, правильный
component|N|компонент
suspect|V|подозревать
description|N|описание
confidence|N|уверенность
industrial|A|промышленный
perspective|N|перспектива, взгляд
error|N|ошибка
assess|V|оценивать
asset|N|актив, имущество
signal|N|сигнал
relevant|A|уместный
leadership|N|руководство
commitment|N|обязательство
wake|V|просыпаться, будить
necessarily|D|обязательно
frame|N|рамка, каркас
slowly|D|медленно
hole|N|дыра
internal|A|внутренний
chain|N|цепь
literature|N|литература
threaten|V|угрожать
division|N|разделение, дивизия
secure|A|безопасный, надёжный
amaze|V|изумлять
birth|N|рождение
label|N|этикетка, ярлык
root|N|корень
recommendation|N|рекомендация
rank|N|ранг, звание
west|N|запад
resident|N|житель
provision|N|положение, обеспечение
plenty|N|множество, достаточно
export|N|экспорт
entirely|D|полностью
strongly|D|сильно
consist|V|состоять
moral|A|моральный, нравственный
insist|V|настаивать
combination|N|сочетание
abuse|V|злоупотреблять, оскорблять
principal|A|главный
master|N|мастер, хозяин
session|N|сессия, занятие
nevertheless|D|тем не менее
protection|N|защита
largely|D|в значительной степени
wed|V|венчать, жениться
shot|N|выстрел, кадр
reasonable|A|разумный
till|C|до
theme|N|тема
judgment|N|суждение, приговор
odd|A|странный, нечётный
approve|V|одобрять
definition|N|определение
atmosphere|N|атмосфера
comparison|N|сравнение
characteristic|N|черта, характеристика
license|N|лицензия
rely|V|полагаться
narrow|A|узкий
desk|N|письменный стол
permit|V|разрешать
seriously|D|серьёзно
wild|A|дикий
unique|A|уникальный
association|N|ассоциация
instrument|N|инструмент
investor|N|инвестор
practical|A|практический
lovely|A|прелестный
soft|A|мягкий
row|N|ряд
youth|N|молодёжь, юность
lock|V|запирать
fuel|N|топливо
expectation|N|ожидание
employment|N|занятость, работа
sexual|A|сексуальный, половой
breath|N|дыхание
increasingly|D|всё более
import|V|импортировать
ourselves|R|себя, сами
engine|N|двигатель
cast|N|состав исполнителей
notion|N|понятие, представление
conservative|A|консервативный
opposition|N|оппозиция
relief|N|облегчение
honor|N|честь
outcome|N|исход, результат
blame|V|винить
explanation|N|объяснение
arise|V|возникать
musical|A|музыкальный
stretch|V|растягивать
declare|V|заявлять, объявлять
careful|A|осторожный
suitable|A|подходящий
native|A|родной, местный
analyze|V|анализировать
mail|N|почта
terrible|A|ужасный
ordinary|A|обычный
selection|N|выбор, отбор
anywhere|R|где-нибудь
mental|A|умственный, психический
participant|N|участник
vision|N|зрение, видение
specifically|D|конкретно, специально
fat|A|жирный, толстый
entry|N|вход, запись
fellow|N|приятель, коллега
chemical|A|химический
capture|V|захватывать
peak|N|пик, вершина
chairman|N|председатель
proportion|N|пропорция, доля
disappear|V|исчезать
yard|N|двор, ярд
constant|A|постоянный
significantly|D|значительно
considerable|A|значительный
instruction|N|инструкция
ideal|A|идеальный
folk|N|народ, люди
surely|D|несомненно
guard|N|охрана, страж
somewhat|D|несколько, отчасти
kiss|V|целовать
presentation|N|презентация
joint|N|сустав; совместный
poll|N|опрос
faith|N|вера
reduction|N|сокращение
reserve|N|запас, резерв
bore|V|наскучить
mission|N|миссия
somehow|D|как-то
tone|N|тон
neighborhood|N|район, окрестности
justice|N|справедливость, юстиция
phase|N|фаза, этап
rush|V|спешить
religion|N|религия
employer|N|работодатель
reject|V|отклонять
latter|A|последний из двух
index|N|индекс, указатель
frequently|D|часто
circle|N|круг
helpful|A|полезный
command|N|команда, приказ
attractive|A|привлекательный
sick|A|больной
impression|N|впечатление
unable|A|неспособный
joke|N|шутка
sky|N|небо
column|N|колонка, колонна
electronic|A|электронный
impose|V|налагать, навязывать
besides|C|кроме, помимо
properly|D|правильно, как следует
ancient|A|древний
coast|N|побережье
ill|A|больной
closely|D|тесно, внимательно
multiple|A|множественный
yield|V|давать, уступать
via|C|через, посредством
legislation|N|законодательство
county|N|округ
unlike|C|в отличие от
mobile|A|мобильный
assistant|N|помощник
implement|V|осуществлять
chart|N|график, таблица
attach|V|прикреплять
hell|N|ад
everywhere|R|везде
advise|V|советовать
household|N|домохозяйство
acknowledge|V|признавать
east|N|восток
voter|N|избиратель
furthermore|D|кроме того
scientific|A|научный
wage|N|зарплата
absence|N|отсутствие
construct|V|строить
remark|N|замечание
professor|N|профессор
rare|A|редкий
intention|N|намерение
dozen|N|дюжина
settlement|N|поселение, урегулирование
gap|N|разрыв, пробел
widely|D|широко
minimum|N|минимум
northern|A|северный
estate|N|имущество, поместье
equally|D|в равной степени
expose|V|разоблачать, подвергать
alive|A|живой
shut|V|закрывать
victory|N|победа
resolve|V|разрешать, решать
critic|N|критик
variable|N|переменная
enormous|A|огромный
permanent|A|постоянный
pursue|V|преследовать, добиваться
urge|V|настоятельно призывать
enemy|N|враг
appoint|V|назначать
smell|V|нюхать, пахнуть
prior|A|предшествующий
stable|A|стабильный
merely|D|всего лишь
resolution|N|резолюция, решимость
communicate|V|общаться
vast|A|обширный
producer|N|производитель, продюсер
regional|A|региональный
immediate|A|немедленный
incident|N|инцидент
draft|N|черновик, призыв
slip|V|скользить, оступиться
accompany|V|сопровождать
angry|A|сердитый
knock|V|стучать
seed|N|семя
illustrate|V|иллюстрировать
temporary|A|временный
liberal|A|либеральный
truly|D|поистине
disk|N|диск
core|N|ядро, суть
emotional|A|эмоциональный
aircraft|N|самолёт
self|N|я, самость
metal|N|металл
existence|N|существование
bone|N|кость
panel|N|панель, комиссия
prime|A|главный, первоклассный
emphasize|V|подчёркивать
maximum|N|максимум
effectively|D|эффективно
elsewhere|D|в другом месте
bother|V|беспокоить
initiative|N|инициатива
motion|N|движение, ходатайство
gray|A|серый
complicate|V|усложнять
discipline|N|дисциплина
disappoint|V|разочаровывать
extreme|A|крайний, экстремальный
passage|N|проход, отрывок
reputation|N|репутация
forth|D|вперёд, далее
negotiation|N|переговоры
mechanism|N|механизм
democracy|N|демократия
observation|N|наблюдение
deserve|V|заслуживать
unusual|A|необычный
defend|V|защищать
classic|A|классический
king|N|король
interaction|N|взаимодействие
collapse|V|рушиться
fundamental|A|фундаментальный
dish|N|блюдо, тарелка
abroad|D|за границей
soul|N|душа
capable|A|способный
presidential|A|президентский
perfectly|D|совершенно
enhance|V|усиливать, улучшать
proud|A|гордый
educational|A|образовательный
distinguish|V|различать
substantial|A|существенный
nearby|A|близлежащий
manufacturer|N|производитель
slide|V|скользить
valuable|A|ценный
personally|D|лично
breast|N|грудь
approximately|D|приблизительно
highlight|V|выделять
climate|N|климат
exception|N|исключение
corporation|N|корпорация
chip|N|чип, чипс
winner|N|победитель
encounter|V|сталкиваться
excuse|N|оправдание, извинение
partly|D|частично
urban|A|городской
confuse|V|путать
southern|A|южный
output|N|выпуск, продукция
beauty|N|красота
massive|A|массивный
calculate|V|вычислять
mathematics|N|математика
upper|A|верхний
creation|N|создание
occupy|V|занимать
outline|V|намечать
sufficient|A|достаточный
luck|N|удача
preserve|V|сохранять
split|V|разделять
swing|V|качать
sudden|A|внезапный
consistent|A|последовательный
originally|D|первоначально
aside|D|в сторону
comfort|N|комфорт
secondly|D|во-вторых
prospect|N|перспектива
criterion|N|критерий
primarily|D|прежде всего
integrate|V|интегрировать
criticism|N|критика
convention|N|соглашение, съезд
bet|V|держать пари
retain|V|сохранять, удерживать
sequence|N|последовательность
plain|A|простой, равнинный
rural|A|сельский
abandon|V|бросать, покидать
examination|N|экзамен, осмотр
silence|N|тишина
rapidly|D|быстро
efficient|A|эффективный
revolution|N|революция
delight|V|радовать
lean|V|клониться, опираться
dramatic|A|драматичный
differ|V|отличаться
grateful|A|благодарный
distribute|V|распределять
intellectual|A|интеллектуальный
derive|V|получать, происходить
crucial|A|ключевой
wheel|N|колесо
minority|N|меньшинство
origin|N|происхождение
interpretation|N|толкование
gentleman|N|джентльмен
landscape|N|пейзаж
educate|V|обучать
fault|N|вина, недостаток
exhibit|V|выставлять
minor|A|незначительный
hunt|V|охотиться
thick|A|толстый, густой
dominate|V|доминировать
supplier|N|поставщик
prize|N|приз
typically|D|как правило
peer|N|сверстник
pension|N|пенсия
wing|N|крыло
acquisition|N|приобретение
laughter|N|смех
deeply|D|глубоко
recognition|N|признание
electricity|N|электричество
assistance|N|помощь
retirement|N|пенсия, отставка
respectively|D|соответственно
variation|N|вариация
ultimately|D|в конечном счёте
proof|N|доказательство
soil|N|почва
layer|N|слой
upset|V|расстраивать
representation|N|представление
preparation|N|подготовка
dispute|N|спор
agenda|N|повестка дня
emphasis|N|акцент
edition|N|издание
silver|N|серебро
entertainment|N|развлечение
undertake|V|предпринимать
wire|N|провод
unlikely|A|маловероятный
gay|A|гей
publication|N|публикация
slight|A|незначительный
unknown|A|неизвестный
framework|N|рамки, структура
zone|N|зона
restrict|V|ограничивать
trace|V|прослеживать
inch|N|дюйм
equivalent|A|равносильный
solid|A|твёрдый, надёжный
enterprise|N|предприятие
elderly|A|пожилой
governor|N|губернатор
port|N|порт
pitch|N|подача, высота тона
contemporary|A|современный
ease|N|лёгкость
beer|N|пиво
assure|V|заверять
crack|V|трескаться
numerous|A|многочисленный
submit|V|подавать, подчиняться
virtually|D|практически
era|N|эпоха
coverage|N|освещение, покрытие
tension|N|напряжение
cable|N|кабель
input|N|ввод, вклад
isolate|V|изолировать
eliminate|V|устранять
wet|A|мокрый
secondary|A|вторичный
recruit|V|набирать
exclude|V|исключать
string|N|струна, нить
persuade|V|убеждать
grand|A|величественный
hence|D|отсюда, следовательно
crew|N|экипаж
phenomenon|N|явление
pupil|N|ученик, зрачок
assist|V|помогать
restore|V|восстанавливать
formula|N|формула
alter|V|изменять
perceive|V|воспринимать
anymore|D|больше не
hero|N|герой
convert|V|преобразовывать
steady|A|устойчивый
meter|N|метр, счётчик
truck|N|грузовик
beside|C|рядом с
sail|V|плыть под парусом
disaster|N|бедствие
heavily|D|сильно, тяжело
devote|V|посвящать
terrorist|N|террорист
vital|A|жизненно важный
fascinate|V|очаровывать
external|A|внешний
spare|A|запасной
whenever|C|когда бы ни
underlie|V|лежать в основе
mom|N|мама
distinction|N|различие
satisfaction|N|удовлетворение
incorporate|V|включать, учреждать
sweep|V|подметать
obligation|N|обязательство
sir|N|сэр
evaluate|V|оценивать
anger|N|гнев
perception|N|восприятие
naturally|D|естественно
database|N|база данных
initially|D|первоначально
territory|N|территория
rarely|D|редко
apparent|A|явный, кажущийся
western|A|западный
expansion|N|расширение
constantly|D|постоянно
muscle|N|мышца
scare|V|пугать
badly|D|плохо
everyday|A|повседневный
ratio|N|соотношение
scream|V|кричать
disorder|N|расстройство, беспорядок
symbol|N|символ
demonstration|N|демонстрация
analyst|N|аналитик
steel|N|сталь
transform|V|преобразовывать
restriction|N|ограничение
foundation|N|основа, фонд
strain|V|напрягать
album|N|альбом
trail|V|идти по следу
trap|V|ловить в ловушку
extension|N|расширение, пристройка
wealth|N|богатство
gradually|D|постепенно
tank|N|танк, бак
evil|A|злой
remarkable|A|замечательный
tune|N|мелодия
grass|N|трава
transition|N|переход
frighten|V|пугать
bid|V|делать ставку
breed|V|разводить
extraordinary|A|необычайный
brilliant|A|блестящий
adviser|N|советник
stem|N|стебель
mode|N|режим, способ
awful|A|ужасный
pose|V|ставить, позировать
adjust|V|настраивать
creative|A|творческий
poem|N|стихотворение
agricultural|A|сельскохозяйственный
competitor|N|конкурент
alcohol|N|алкоголь
planet|N|планета
curve|N|кривая, изгиб
knee|N|колено
overcome|V|преодолевать
web|N|сеть, паутина
depth|N|глубина
entrance|N|вход
log|N|бревно, журнал
giant|A|гигантский
god|N|бог
substance|N|вещество
extensive|A|обширный
interpret|V|толковать
independence|N|независимость
inner|A|внутренний
harm|V|вредить
consult|V|консультироваться
shadow|N|тень
strip|V|сдирать
smooth|A|гладкий
intervention|N|вмешательство
impress|V|впечатлять
vice|N|порок
radical|A|радикальный
similarly|D|подобным образом
behave|V|вести себя
loud|A|громкий
dimension|N|измерение, размер
subsequent|A|последующий
infection|N|инфекция
efficiency|N|эффективность
statistic|N|статистика, показатель
regularly|D|регулярно
membership|N|членство
blind|A|слепой
pure|A|чистый
bloody|A|кровавый
ally|N|союзник
quantity|N|количество
bend|V|сгибать
mature|A|зрелый
briefly|D|кратко
alarm|N|тревога, будильник
disturb|V|беспокоить
sustain|V|поддерживать
poverty|N|бедность
crazy|A|сумасшедший
cite|V|цитировать
newly|D|недавно
parallel|A|параллельный
gender|N|гендер, пол
sponsor|V|спонсировать
boot|N|ботинок
dealer|N|дилер
burden|N|бремя
desert|N|пустыня
mate|N|товарищ, партнёр
occasionally|D|изредка
shareholder|N|акционер
resistance|N|сопротивление
bath|N|ванна
frequency|N|частота
criticize|V|критиковать
tap|V|постукивать
philosophy|N|философия
lip|N|губа
attribute|V|приписывать
apologize|V|извиняться
approval|N|одобрение
grab|V|хватать
entitle|V|давать право
involvement|N|участие
exposure|N|воздействие, разоблачение
conventional|A|традиционный
digital|A|цифровой
edit|V|редактировать
formation|N|формирование
pleasant|A|приятный
overseas|A|зарубежный
advocate|N|сторонник, адвокат
establishment|N|учреждение, истеблишмент
summary|N|краткое изложение
rough|A|грубый, неровный
recovery|N|восстановление
seal|N|печать
tube|N|труба, тюбик
tower|N|башня
characterize|V|характеризовать
specify|V|указывать
exact|A|точный
spin|V|крутить
operator|N|оператор
infant|N|младенец
dig|V|копать
drag|V|тащить
mount|V|монтировать, восходить
wrap|V|заворачивать
anticipate|V|предвидеть
dependent|A|зависимый
specialize|V|специализироваться
angle|N|угол
virus|N|вирус
precisely|D|точно
rival|N|соперник
offense|N|обида, правонарушение
detect|V|обнаруживать
admire|V|восхищаться
moderate|A|умеренный
surgery|N|операция, хирургия
significance|N|значение
charity|N|благотворительность
universal|A|всеобщий
cigarette|N|сигарета
constitute|V|составлять
adequate|A|достаточный
consultant|N|консультант
historian|N|историк
visual|A|визуальный
keen|A|острый, увлечённый
ethnic|A|этнический
clinical|A|клинический
eastern|A|восточный
segment|N|сегмент
sand|N|песок
prompt|V|побуждать
charm|N|обаяние
react|V|реагировать
venture|N|предприятие, авантюра
compound|N|соединение, комплекс
mess|N|беспорядок
preference|N|предпочтение
comprehensive|A|всесторонний
incentive|N|стимул
dialog|N|диалог
cream|N|крем, сливки
rapid|A|быстрый
regret|V|сожалеть
dismiss|V|увольнять, отклонять
margin|N|край, маржа
beneath|C|под, ниже
opponent|N|противник
resist|V|сопротивляться
capability|N|способность
absolute|A|абсолютный
correspond|V|соответствовать
stroke|N|инсульт, удар
dare|V|осмеливаться
barrier|N|барьер
rid|V|избавлять
divorce|V|разводиться
ruin|V|разрушать
bury|V|хоронить
counsel|N|совет, адвокат
tendency|N|тенденция
frequent|A|частый
motor|N|мотор
survival|N|выживание
counter|N|прилавок, счётчик
possess|V|владеть
permission|N|разрешение
valley|N|долина
float|V|плыть
mad|A|безумный, злой
greatly|D|весьма
visible|A|видимый
electric|A|электрический
impressive|A|впечатляющий
evolution|N|эволюция
awareness|N|осведомлённость
violent|A|жестокий
slave|N|раб
architecture|N|архитектура
acceptable|A|приемлемый
journal|N|журнал
coal|N|уголь
measurement|N|измерение
random|A|случайный
successfully|D|успешно
depress|V|угнетать
illustration|N|иллюстрация
burst|V|лопнуть, вспыхнуть
buyer|N|покупатель
mutual|A|взаимный
rail|N|рельс
motivate|V|мотивировать
laboratory|N|лаборатория
passion|N|страсть
fulfill|V|выполнять
dust|N|пыль
dedicate|V|посвящать
roughly|D|примерно
province|N|провинция
evaluation|N|оценка
accomplish|V|достигать, выполнять
announcement|N|объявление
opera|N|опера
contest|N|конкурс
brush|V|чистить щёткой
embarrass|V|смущать
genetic|A|генетический
aggressive|A|агрессивный
chest|N|грудь, ящик
format|N|формат
literary|A|литературный
govern|V|управлять
embrace|V|обнимать, принимать
praise|V|хвалить
silent|A|тихий, безмолвный
pump|V|качать
publisher|N|издатель
celebration|N|празднование
compensation|N|компенсация
classical|A|классический
weigh|V|весить, взвешивать
versus|C|против
deficit|N|дефицит
modify|V|изменять
flash|V|вспыхивать
friendship|N|дружба
literally|D|буквально
equation|N|уравнение
entertain|V|развлекать
fantastic|A|фантастический
assign|V|назначать
inflation|N|инфляция
historic|A|исторический
injure|V|травмировать
remote|A|удалённый
twist|V|скручивать
personnel|N|персонал
imagination|N|воображение
throat|N|горло
insight|N|понимание, озарение
forever|D|навсегда
exceed|V|превышать
expenditure|N|расход
joy|N|радость
pregnant|A|беременная
gear|N|передача, снаряжение
poet|N|поэт
fortune|N|удача, состояние
ceremony|N|церемония
pile|V|складывать в кучу
mixture|N|смесь
automatically|D|автоматически
scholar|N|учёный
psychological|A|психологический
dramatically|D|резко, драматично
stake|N|ставка, доля
creature|N|существо
partnership|N|партнёрство
participation|N|участие
clause|N|пункт, придаточное
penalty|N|штраф, наказание
chamber|N|палата, камера
fancy|A|изысканный, причудливый
clothing|N|одежда
evolve|V|развиваться
sake|N|ради
boost|V|повышать
tail|N|хвост
possession|N|владение
abortion|N|аборт
curious|A|любопытный
wooden|A|деревянный
boom|N|бум, подъём
tale|N|сказка, история
maintenance|N|обслуживание
consequently|D|следовательно
strengthen|V|укреплять
whilst|C|в то время как
constraint|N|ограничение
fold|V|складывать
bin|N|бак, корзина
undergo|V|претерпевать
potentially|D|потенциально
scope|N|охват, рамки
pretend|V|притворяться
allege|V|утверждать
pride|N|гордость
intense|A|интенсивный
inquiry|N|запрос, расследование
craft|N|ремесло
concrete|A|конкретный, бетонный
shell|N|оболочка, раковина
damn|A|проклятый
distinct|A|отчётливый, особый
humor|N|юмор
limitation|N|ограничение
indication|N|признак, указание
stability|N|стабильность
wise|A|мудрый
neglect|V|пренебрегать
jail|N|тюрьма
mere|A|простой, всего лишь
carbon|N|углерод
regulate|V|регулировать
trigger|V|запускать
pipe|N|труба
destruction|N|разрушение
flag|N|флаг
magic|N|магия
mystery|N|тайна
rear|A|задний
moon|N|луна
presumably|D|предположительно
bless|V|благословлять
airline|N|авиакомпания
amendment|N|поправка
jury|N|присяжные
cooperation|N|сотрудничество
civilian|N|гражданский
composition|N|состав, сочинение
regardless|D|независимо от
scan|V|сканировать
bunch|N|связка, куча
racial|A|расовый
greet|V|приветствовать
hopefully|D|надеюсь
trick|N|трюк, уловка
paragraph|N|абзац
maker|N|изготовитель
stimulate|V|стимулировать
tissue|N|ткань
barely|D|едва
tourism|N|туризм
pro|N|профессионал
stair|N|ступенька
hesitate|V|колебаться
romantic|A|романтический
firmly|D|твёрдо
interior|N|интерьер
nowhere|D|нигде
pray|V|молиться
championship|N|чемпионат
servant|N|слуга
immigrant|N|иммигрант
excess|N|избыток
complexity|N|сложность
surprisingly|D|удивительно
extract|V|извлекать
implementation|N|реализация
differently|D|иначе
catalog|N|каталог
continuous|A|непрерывный
golden|A|золотой
guideline|N|руководство, рекомендация
biological|A|биологический
consume|V|потреблять
luxury|N|роскошь
weekly|A|еженедельный
wherever|C|где бы ни
bite|V|кусать
firstly|D|во-первых
anxious|A|тревожный
exhaust|V|исчерпывать, изнурять
attraction|N|достопримечательность, влечение
ocean|N|океан
quietly|D|тихо
castle|N|замок
veteran|N|ветеран
reflection|N|отражение
nerve|N|нерв
determination|N|решимость
altogether|D|в целом, совсем
fiction|N|художественная литература
cluster|N|скопление, кластер
confusion|N|путаница
logic|N|логика
hint|V|намекать
hook|V|зацеплять
bell|N|колокол, звонок
liquid|N|жидкость
panic|V|паниковать
slope|N|склон
happiness|N|счастье
genuine|A|подлинный
vessel|N|сосуд, судно
verb|N|глагол
reckon|V|считать, полагать
silly|A|глупый
transportation|N|транспорт
harbor|N|гавань
chase|V|гнаться
universe|N|вселенная
horrible|A|ужасный
lover|N|возлюбленный
rat|N|крыса
portrait|N|портрет
substitute|V|заменять
supplement|N|дополнение
adjustment|N|корректировка
reasonably|D|разумно
filter|V|фильтровать
flexible|A|гибкий
tent|N|палатка
precise|A|точный
distant|A|далёкий
shade|N|тень, оттенок
grain|N|зерно
situate|V|располагать
summarize|V|суммировать
leap|V|прыгать
snap|V|щёлкать, ломаться
probability|N|вероятность
uncertainty|N|неопределённость
swear|V|клясться, ругаться
refugee|N|беженец
shore|N|берег
monthly|A|ежемесячный
comprise|V|включать в себя
stir|V|помешивать
excitement|N|волнение
sigh|V|вздыхать
pregnancy|N|беременность
experimental|A|экспериментальный
institutional|A|институциональный
slice|N|ломтик
wander|V|бродить
empire|N|империя
subsequently|D|впоследствии
gentle|A|нежный, мягкий
attendance|N|посещаемость
ownership|N|собственность, владение
suspend|V|приостанавливать
functional|A|функциональный
voluntary|A|добровольный
pale|A|бледный
stain|V|пачкать
tongue|N|язык
server|N|сервер
structural|A|структурный
fool|V|обманывать
alongside|C|рядом с
unite|V|объединять
gently|D|нежно
compute|V|вычислять
weird|A|странный
gaze|V|пристально смотреть
fade|V|увядать, тускнеть
royal|A|королевский
theoretical|A|теоретический
mayor|N|мэр
darkness|N|темнота
tournament|N|турнир
registration|N|регистрация
fragment|N|фрагмент
listener|N|слушатель
density|N|плотность
ugly|A|уродливый
module|N|модуль
faithfully|D|верно, преданно
cheek|N|щека
attachment|N|вложение, привязанность
holder|N|держатель
grin|V|ухмыляться
noun|N|существительное
fortunate|A|удачливый
alright|D|хорошо, ладно
hunger|N|голод
insure|V|страховать
ashamed|A|пристыженный
found|V|основывать
thirst|N|жажда
`);
