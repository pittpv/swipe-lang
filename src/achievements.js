/**
 * Fullscreen achievement celebrations styled like an incoming iMessage
 * conversation: a blurred backdrop fades in, then chat bubbles pop in one by
 * one with a spring animation, each preceded by a short "typing…" indicator.
 *
 * The layer is appended to document.body (outside the app's render root), so
 * re-renders of the main view never interrupt the animation. Multiple calls
 * queue up; tap anywhere or press Escape to dismiss.
 */

const TYPING_MS = 650; // how long the "typing…" bubble shows before a message
const READ_MS = 2400; // how long a message stays before the next one
const TAIL_PAUSE_MS = 600; // extra beat after the last message
const CLOSE_MS = 380; // fade-out duration

/** @type {Array<{emoji:string,title:string,text:string}>} */
let queue = [];
let showing = false;
let activeClose = null;
// Timers of the currently playing batch are registered here so an early
// dismiss cancels every pending step at once.
let timers = [];

/**
 * @param {Array<{type:string,value:number}>} achievements
 */
export function showAchievements(achievements) {
  const messages = (Array.isArray(achievements) ? achievements : [])
    .map(toMessage)
    .filter(Boolean);
  if (!messages.length) return;
  queue.push(...messages);
  if (!showing) runQueue();
}

/** Drop any playing celebration so it can't swallow the next tap (e.g. «На главную»). */
export function dismissAchievements() {
  queue = [];
  activeClose?.();
}

function toMessage(a) {
  const badge = achievementBadge(a);
  if (!badge) return null;
  return {
    emoji: badge.emoji,
    title: `${badge.title}!`,
    text: a.type === 'streak' ? streakSub(a.value) : wordsSub(a.value),
  };
}

/** Emoji + short title for an achievement, shared by bubbles and the stats page. */
export function achievementBadge(a) {
  if (a?.type === 'streak') {
    const days = plural(a.value, 'день', 'дня', 'дней');
    return { emoji: '🔥', title: `Страйк ${a.value} ${days}` };
  }
  if (a?.type === 'words') {
    const words = plural(a.value, 'слово', 'слова', 'слов');
    return { emoji: a.value >= 100 ? '🏆' : '🎉', title: `${a.value} ${words}` };
  }
  return null;
}

function streakSub(days) {
  if (days >= 100) return 'Легенда! Так держать 🔥';
  if (days >= 30) return 'Привычка сформирована — не останавливайся';
  if (days >= 10) return 'Серию видно издалека. Продолжай!';
  return 'Отличный ритм — возвращайся завтра';
}

function wordsSub(count) {
  if (count >= 500) return 'Словарный запас уверенно растёт';
  if (count >= 100) return 'Сотни слов — и это только начало';
  if (count >= 20) return 'Каждое слово — шаг к свободной речи';
  return 'Начало положено. Дальше — больше!';
}

function runQueue() {
  showing = true;
  (async () => {
    while (queue.length) {
      const batch = queue;
      queue = [];
      await playBatch(batch);
    }
    showing = false;
  })();
}

function playBatch(messages) {
  return new Promise((resolve) => {
    const layer = document.createElement('div');
    layer.className = 'ach-layer';
    layer.setAttribute('role', 'alert');

    const backdrop = document.createElement('div');
    backdrop.className = 'ach-backdrop';

    const chat = document.createElement('div');
    chat.className = 'ach-chat';

    layer.append(backdrop, chat);
    document.body.appendChild(layer);

    let closed = false;
    let timers = [];

    const close = () => {
      if (closed) return;
      closed = true;
      if (activeClose === close) activeClose = null;
      timers.forEach(clearTimeout);
      timers = [];
      document.removeEventListener('keydown', onKey);
      layer.classList.add('ach-closing');
      setTimeout(() => {
        layer.remove();
        resolve();
      }, reducedMotion() ? 0 : CLOSE_MS);
    };
    activeClose = close;

    function onKey(e) {
      if (e.key === 'Escape') close();
    }

    layer.addEventListener('click', close);
    document.addEventListener('keydown', onKey);

    async function play() {
      let lastBubble = null;
      for (const msg of messages) {
        if (closed) break;
        const typing = buildTyping();
        chat.appendChild(typing);
        await sleep(TYPING_MS);
        if (closed) break;
        lastBubble = buildBubble(msg);
        typing.replaceWith(lastBubble);
        await sleep(READ_MS);
      }
      if (!closed && lastBubble) {
        lastBubble.insertAdjacentElement('afterend', buildTimeLabel());
        await sleep(TAIL_PAUSE_MS);
      }
      close();
    }

    play();
  });
}

function buildTyping() {
  const el = document.createElement('div');
  el.className = 'ach-bubble ach-typing';
  for (let i = 0; i < 3; i += 1) {
    const dot = document.createElement('span');
    dot.className = 'ach-dot';
    dot.style.animationDelay = `${i * 0.15}s`;
    el.appendChild(dot);
  }
  return el;
}

function buildBubble(msg) {
  const el = document.createElement('div');
  el.className = 'ach-bubble';

  const emoji = document.createElement('span');
  emoji.className = 'ach-emoji';
  emoji.textContent = msg.emoji;

  const text = document.createElement('span');
  text.className = 'ach-text';
  const title = document.createElement('strong');
  title.textContent = msg.title;
  const sub = document.createElement('span');
  sub.textContent = msg.text;
  text.append(title, sub);

  el.append(emoji, text);
  return el;
}

function buildTimeLabel() {
  const el = document.createElement('div');
  el.className = 'ach-time';
  el.textContent = 'Сейчас';
  return el;
}

/** Russian plural forms: plural(5, 'слово', 'слова', 'слов') → 'слов'. */
function plural(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function sleep(ms) {
  return new Promise((resolve) => {
    timers.push(setTimeout(resolve, reducedMotion() ? Math.min(ms, 50) : ms));
  });
}

function reducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
