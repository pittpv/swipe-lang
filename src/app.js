import { track, captureReferralFromUrl, getStoredReferral, fetchPublicStats, getCsrfToken } from './track.js';

const API = '/api';

export async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfToken(), ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export class App {
  constructor(root) {
    this.root = root;
    this.view = 'loading';
    this.user = null;
    this.error = '';
    this.authMode = 'login';
    this.email = '';
    this.password = '';
    this.goal = 'travel';
    this.cefrLevel = 'A1';
    this.cards = [];
    this.cardIndex = 0;
    this.sessionId = null;
    this.summary = null;
    this.stats = null;
    this.overlayWord = null;
    this.drag = { active: false, startX: 0, startY: 0, x: 0, y: 0 };
    this.swiping = false;
    this.cardEnter = false;
    this.reminder = { enabled: false };
    this.reminderTime = '19:00';
    this.reminderError = '';
    this.settingsError = '';
    this.settingsSaved = false;
    this.publicStats = { words: 3564, sessionSize: 18 };
    this.referralLink = '';
    /** @type {Map<string, HTMLAudioElement>} cached pronunciation clips */
    this.audioCache = new Map();
  }

  async init() {
    captureReferralFromUrl();
    try {
      this.publicStats = await fetchPublicStats();
    } catch {
      /* use defaults */
    }
    try {
      this.user = await api('/auth/me');
      this.view = this.user.needsOnboarding ? 'onboarding' : 'home';
    } catch {
      this.view = 'landing';
    }
    if (this.user?.cefrLevel) this.cefrLevel = this.user.cefrLevel;
    if (this.view === 'landing') track('landing_view');
    if (this.user?.id) {
      await Promise.all([this.loadReferralLink(), this.loadReminderStatus()]);
    }
    this.render();
  }

  setView(view) {
    this.view = view;
    this.error = '';
    this.render();
  }

  async login() {
    try {
      this.user = await api('/auth/login', { method: 'POST', body: { email: this.email, password: this.password } });
      this.view = this.user.needsOnboarding ? 'onboarding' : 'home';
    } catch (e) {
      this.error = e.message;
    }
    this.render();
  }

  async register() {
    try {
      const referralCode = getStoredReferral();
      this.user = await api('/auth/register', {
        method: 'POST',
        body: { email: this.email, password: this.password, referralCode },
      });
      track('register_complete');
      this.view = 'onboarding';
    } catch (e) {
      this.error = e.message;
    }
    this.render();
  }

  async saveOnboarding() {
    try {
      await api('/onboarding', { method: 'POST', body: { goal: this.goal, cefrLevel: this.cefrLevel } });
      track('onboarding_complete');
      this.user.needsOnboarding = false;
      this.view = 'home';
    } catch (e) {
      this.error = e.message;
    }
    this.render();
  }

  async startSession() {
    try {
      const data = await api('/session/start', { method: 'POST' });
      this.sessionId = data.sessionId;
      this.cards = data.cards;
      this.cardIndex = 0;
      this.summary = null;
      this.view = 'session';
      track('session_start');
    } catch (e) {
      this.error = e.message;
    }
    this.render();
  }

  currentCard() {
    return this.cards[this.cardIndex] ?? null;
  }

  /**
   * Animates the current card flying out in the swipe direction.
   * Resolves on transitionend (or a timeout fallback).
   */
  flyCardOut(direction, fromX = 0, fromY = 0) {
    return new Promise((resolve) => {
      const el = this.root.querySelector('#active-card');
      if (!el) return resolve();
      const off = direction === 'left' ? -1 : 1;
      // Continue outward from where the finger released. Px-based target so the
      // transform interpolates smoothly from the current drag position (a
      // percentage-based target made the card jump on release).
      const exitX = off * (Math.abs(fromX) + Math.max(window.innerWidth * 0.6, 320));
      el.style.pointerEvents = 'none';
      el.style.transition = 'transform 0.28s ease-in, opacity 0.28s ease-in';
      el.style.transform = `translate(${exitX}px, ${fromY}px) rotate(${off * 22}deg)`;
      el.style.opacity = '0';
      let done = false;
      const finish = () => {
        if (!done) {
          done = true;
          resolve();
        }
      };
      el.addEventListener('transitionend', finish, { once: true });
      setTimeout(finish, 340);
    });
  }

  async swipe(direction, from = { x: 0, y: 0 }) {
    const card = this.currentCard();
    if (!card || this.swiping) return;
    this.swiping = true;
    this.drag.active = false;
    track(direction === 'left' ? 'swipe_left' : 'swipe_right');
    // Fly away while the request is in flight — no dead waiting time.
    const flight = this.flyCardOut(direction, from.x, from.y);
    try {
      await api('/session/swipe', { method: 'POST', body: { wordId: card.id, direction } });
    } catch (e) {
      this.error = e.message;
      this.swiping = false;
      this.render(); // card comes back on failure
      return;
    }
    await flight;
    this.cardIndex += 1;
    this.drag = { active: false, startX: 0, startY: 0, x: 0, y: 0 };
    this.cardEnter = true;
    if (this.cardIndex >= this.cards.length) {
      this.summary = await api('/session/complete', { method: 'POST' });
      track('session_complete');
      this.view = 'summary';
    }
    this.swiping = false;
    this.render();
  }

  speak(text) {
    if (!text) return;
    track('tap_audio');
    window.speechSynthesis?.cancel();
    // Primary voice: free public Turkish TTS (natural-sounding, no API key).
    // Falls back to the browser's built-in speechSynthesis when unavailable.
    this.playNativeAudio(text).catch(() => this.speakWithBrowserTts(text));
  }

  playNativeAudio(text) {
    return new Promise((resolve, reject) => {
      let audio = this.audioCache.get(text);
      if (!audio) {
        // Same-origin TTS proxy (/api/tts on the server): fetches the free
        // public Turkish voice server-side and streams it back as audio/mpeg.
        // Falls back to built-in speechSynthesis when unavailable.
        audio = new Audio(`/api/tts?q=${encodeURIComponent(text)}`);
        audio.preload = 'auto';
        this.audioCache.set(text, audio);
      }
      const fail = () => {
        this.audioCache.delete(text); // don't keep broken clips cached
        reject(new Error('native audio unavailable'));
      };
      audio.addEventListener('ended', resolve, { once: true });
      audio.addEventListener('error', fail, { once: true });
      try {
        audio.currentTime = 0;
      } catch {
        /* first play — nothing to rewind */
      }
      audio.play().catch(fail);
    });
  }

  speakWithBrowserTts(text) {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'tr-TR';
    window.speechSynthesis.speak(u);
  }

  openOverlay() {
    this.overlayWord = this.currentCard();
    track('tap_translation');
    this.render();
  }

  closeOverlay() {
    this.overlayWord = null;
    this.render();
  }

  async loadStats() {
    try {
      this.stats = await api('/stats');
      this.view = 'stats';
    } catch (e) {
      this.error = e.message;
    }
    this.render();
  }

  async loadReferralLink() {
    try {
      const data = await api('/referral');
      this.referralLink = data.link;
    } catch {
      this.referralLink = '';
    }
  }

  async copyReferral() {
    if (!this.referralLink) await this.loadReferralLink();
    if (this.referralLink && navigator.clipboard) {
      await navigator.clipboard.writeText(this.referralLink);
      track('referral_share');
    }
    this.render();
  }

  // --- Study reminders ---

  async loadReminderStatus() {
    try {
      const status = await api('/push/status');
      this.reminder.enabled = status.enabled;
      if (status.time) this.reminderTime = status.time;
    } catch {
      /* reminders stay hidden/default on failure */
    }
  }

  async ensurePushSubscription() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push-уведомления не поддерживаются этим браузером');
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Разрешение на уведомления не выдано');
    }
    const config = await api('/push/config');
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(config.publicKey),
      });
    }
    return subscription.toJSON();
  }

  async enableReminders() {
    this.reminderError = '';
    try {
      const subscription = await this.ensurePushSubscription();
      const result = await api('/push/subscribe', {
        method: 'POST',
        body: {
          subscription,
          reminderTime: this.reminderTime,
          tzOffsetMinutes: new Date().getTimezoneOffset(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });
      this.reminder.enabled = Boolean(result.enabled);
    } catch (e) {
      this.reminderError = e.message;
    }
    this.render();
  }

  async disableReminders() {
    try {
      await api('/push/unsubscribe', { method: 'POST' });
    } catch {
      /* ignore */
    }
    this.reminder.enabled = false;
    this.render();
  }

  async saveReminderTime() {
    this.reminderError = '';
    try {
      const subscription = await this.ensurePushSubscription();
      const result = await api('/push/subscribe', {
        method: 'POST',
        body: {
          subscription,
          reminderTime: this.reminderTime,
          tzOffsetMinutes: new Date().getTimezoneOffset(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });
      this.reminder.enabled = Boolean(result.enabled);
    } catch (e) {
      this.reminderError = e.message;
    }
    this.render();
  }

  async saveCefr() {
    this.settingsError = '';
    try {
      const result = await api('/profile', { method: 'PATCH', body: { cefrLevel: this.cefrLevel } });
      if (this.user) this.user.cefrLevel = result.cefrLevel;
      this.settingsSaved = true;
      this.render();
      setTimeout(() => {
        if (this.settingsSaved) {
          this.settingsSaved = false;
          this.render();
        }
      }, 1600);
      return;
    } catch (e) {
      this.settingsError = e.message;
    }
    this.render();
  }

  async logout() {
    await api('/auth/logout', { method: 'POST' });
    this.user = null;
    this.view = 'landing';
    this.render();
  }

  exitSession() {
    this.cards = [];
    this.cardIndex = 0;
    this.sessionId = null;
    this.summary = null;
    this.overlayWord = null;
    this.swiping = false;
    this.cardEnter = false;
    this.drag = { active: false, startX: 0, startY: 0, x: 0, y: 0 };
    this.setView('home');
  }

  async deleteAccount() {
    if (!confirm('Удалить аккаунт безвозвратно? Весь прогресс будет потерян.')) return;
    try {
      await api('/account', { method: 'DELETE' });
      this.user = null;
      this.stats = null;
      this.summary = null;
      this.view = 'landing';
    } catch (e) {
      this.error = e.message;
    }
    this.render();
  }

  onPointerDown(e) {
    if (this.view !== 'session' || this.overlayWord || this.swiping) return;
    // Drop a leftover spring-back transition so dragging follows the finger 1:1.
    e.currentTarget.style.transition = '';
    this.drag = { active: true, startX: e.clientX, startY: e.clientY, x: 0, y: 0 };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  onPointerMove(e) {
    if (!this.drag.active) return;
    this.drag.x = e.clientX - this.drag.startX;
    this.drag.y = e.clientY - this.drag.startY;
    const card = this.root.querySelector('.word-card');
    if (card) {
      const rot = this.drag.x * 0.08;
      card.style.transform = `translate(${this.drag.x}px, ${this.drag.y}px) rotate(${rot}deg)`;
      const know = this.root.querySelector('.swipe-label.know');
      const learn = this.root.querySelector('.swipe-label.learn');
      if (know) know.style.opacity = this.drag.x < -40 ? Math.min(1, Math.abs(this.drag.x) / 120) : 0;
      if (learn) learn.style.opacity = this.drag.x > 40 ? Math.min(1, this.drag.x / 120) : 0;
    }
  }

  async onPointerUp(e) {
    if (!this.drag.active) return;
    const { x, y } = this.drag;
    this.drag.active = false;
    const moved = Math.hypot(x, y);
    // Swipe threshold crossed — let swipe() animate the fly-out from the
    // current finger position (no transform reset here).
    if (x < -100 || x > 100) {
      await this.swipe(x < -100 ? 'left' : 'right', { x, y });
      return;
    }
    const card = this.root.querySelector('.word-card');
    if (card) {
      // Smooth spring back to the center.
      card.style.transition = 'transform 0.2s ease-out';
      card.style.transform = '';
      setTimeout(() => {
        if (card.isConnected) card.style.transition = '';
      }, 220);
    }
    const know = this.root.querySelector('.swipe-label.know');
    const learn = this.root.querySelector('.swipe-label.learn');
    if (know) know.style.opacity = 0;
    if (learn) learn.style.opacity = 0;
    // A tiny total movement is a tap — open the translation overlay directly.
    // (Relying on the follow-up click event is unreliable: render() replaces
    // the card mid-gesture, detaching the click target from the DOM.)
    // Otherwise just let the spring-back finish: re-rendering here would
    // replace the DOM mid-animation and make the card snap into place.
    if (moved < 12) this.openOverlay();
  }

  onKeyDown(e) {
    if (this.view !== 'session') return;
    if (this.overlayWord) {
      if (e.key === 'Escape') this.closeOverlay();
      return;
    }
    if (e.key === 'ArrowLeft') this.swipe('left');
    if (e.key === 'ArrowRight') this.swipe('right');
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.openOverlay();
    }
  }

  bindEvents() {
    this.root.onclick = (e) => {
      const t = e.target.closest('[data-action]');
      if (!t) return;
      const action = t.dataset.action;
      if (action === 'show-login') {
        this.authMode = 'login';
        this.setView('auth');
      }
      if (action === 'show-register') {
        track('landing_cta_click');
        this.authMode = 'register';
        this.setView('auth');
      }
      if (action === 'login') this.login();
      if (action === 'register') this.register();
      if (action === 'onboarding') this.saveOnboarding();
      if (action === 'start') this.startSession();
      if (action === 'stats') this.loadStats();
      if (action === 'settings') this.setView('settings');
      if (action === 'home') this.setView('home');
      if (action === 'logout') this.logout();
      if (action === 'delete-account') this.deleteAccount();
      if (action === 'exit-session') this.exitSession();
      if (action === 'overlay') this.openOverlay();
      if (action === 'close-overlay') this.closeOverlay();
      if (action === 'speak') this.speak(this.overlayWord?.lemma);
      if (action === 'swipe-left') this.swipe('left');
      if (action === 'swipe-right') this.swipe('right');
      if (action === 'copy-referral') this.copyReferral();
      if (action === 'reminder-enable') this.enableReminders();
      if (action === 'reminder-disable') this.disableReminders();
    };

    this.root.oninput = (e) => {
      const { name, value } = e.target;
      if (name === 'reminderTime') {
        this.reminderTime = value;
        if (this.reminder.enabled) this.saveReminderTime();
        return;
      }
      if (name === 'cefrLevel' && this.view === 'settings') {
        this.cefrLevel = value;
        this.saveCefr();
        return;
      }
      if (name in this) this[name] = value;
    };

    this.root.onkeydown = (e) => this.onKeyDown(e);

    // CSP-safe replacement for the former inline onclick on .overlay-panel:
    // clicks on the panel body must not bubble to the closing backdrop,
    // but clicks on [data-action] controls (buttons) must keep bubbling.
    this.root.querySelector('.overlay-panel')?.addEventListener('click', (e) => {
      if (!e.target.closest('[data-action]')) e.stopPropagation();
    });
  }

  render() {
    const v = this.view;
    let html = '<div class="shell">';

    if (v === 'loading') {
      html += '<p style="text-align:center;color:var(--color-muted)">Загрузка…</p>';
    } else if (v === 'landing') {
      const w = this.publicStats.words;
      html += `
        <section class="hero">
          <p class="eyebrow">TR → RU · ${w}+ слов</p>
          <h1>Учи турецкий свайпом</h1>
          <p>Как Tinder, но для слов: влево — знаю, вправо — учу. Сессии по ${this.publicStats.sessionSize} карточек — без бесконечной ленты.</p>
        </section>
        <div class="benefits">
          <div class="benefit"><strong>18 карточек</strong><span>за 5 минут</span></div>
          <div class="benefit"><strong>SRS</strong><span>умные повторы</span></div>
          <div class="benefit"><strong>Тап</strong><span>перевод + аудио</span></div>
        </div>
        <button class="btn btn-primary btn-lg" data-action="show-register">Начать бесплатно →</button>
        <p class="subcta">Без карты · Регистрация за 30 сек</p>
        <p style="text-align:center;margin-top:1rem">
          <button class="link-btn" data-action="show-login">Уже есть аккаунт</button>
        </p>
        <p class="footer-links">
          <a href="/help/faq.html">FAQ</a>
          · <a href="/legal/privacy.html">Конфиденциальность</a>
          · <a href="/legal/terms.html">Условия</a>
        </p>`;
    } else if (v === 'auth') {
      html += `
        <section class="hero"><h1>${this.authMode === 'login' ? 'Вход' : 'Регистрация'}</h1></section>
        <div class="card-form">
          <label>Email<input name="email" type="email" value="${esc(this.email)}" autocomplete="email" /></label>
          <label>Пароль<input name="password" type="password" value="${esc(this.password)}" autocomplete="${this.authMode === 'login' ? 'current-password' : 'new-password'}" /></label>
          ${this.error ? `<p class="error">${esc(this.error)}</p>` : ''}
          <button class="btn btn-primary" data-action="${this.authMode}">${this.authMode === 'login' ? 'Войти' : 'Создать аккаунт'}</button>
          <button class="link-btn" data-action="${this.authMode === 'login' ? 'show-register' : 'show-login'}">${this.authMode === 'login' ? 'Создать аккаунт' : 'Войти'}</button>
        </div>`;
    } else if (v === 'onboarding') {
      html += `
        <section class="hero"><h1>Настройка</h1><p>Короткий онбординг — и к первой сессии.</p></section>
        <div class="card-form">
          <label>Цель
            <select name="goal">
              ${opt('travel', 'Путешествия', this.goal)}
              ${opt('work', 'Работа', this.goal)}
              ${opt('exam', 'Экзамен', this.goal)}
            </select>
          </label>
          <label>Уровень
            <select name="cefrLevel">
              ${opt('A1', 'A1 — начальный', this.cefrLevel)}
              ${opt('A2', 'A2 — элементарный', this.cefrLevel)}
              ${opt('B1', 'B1 — средний', this.cefrLevel)}
              ${opt('C1', 'C1 — свободный', this.cefrLevel)}
            </select>
          </label>
          ${this.error ? `<p class="error">${esc(this.error)}</p>` : ''}
          <button class="btn btn-primary" data-action="onboarding">Продолжить</button>
        </div>`;
    } else if (v === 'home') {
      html += `
        <section class="hero">
          <h1>Привет!</h1>
          <p>Готов к сессии из 18 слов? Тап по карточке — перевод и примеры.</p>
        </section>
        ${this.user?.streak ? `<p style="text-align:center"><span class="streak-badge">🔥 ${this.user.streak} дней</span></p>` : ''}
        ${this.error ? `<p class="error" style="text-align:center">${esc(this.error)}</p>` : ''}
        <button class="btn btn-primary" data-action="start" style="width:100%;margin-top:1rem">Начать сессию</button>
        <button class="btn btn-ghost" data-action="stats" style="width:100%;margin-top:0.5rem">Статистика</button>
        <button class="btn btn-ghost" data-action="settings" style="width:100%;margin-top:0.5rem">Настройки</button>
        ${this.referralLink ? `
        <div class="referral-box">
          <p class="referral-title">Пригласи друга</p>
          <p class="referral-muted">Поделись ссылкой — учите турецкий вместе</p>
          <button class="btn btn-primary" data-action="copy-referral" style="width:100%">Скопировать ссылку</button>
          ${this.user?.referralsCount ? `<p class="referral-muted">${this.user.referralsCount} приглашённых</p>` : ''}
        </div>` : ''}
        <p class="footer-links"><a href="/help/faq.html">FAQ</a></p>
        <button class="link-btn" data-action="logout" style="display:block;margin:1.5rem auto 0">Выйти</button>`;
    } else if (v === 'session') {
      const card = this.currentCard();
      html += `
        <div class="session-header">
          <button class="session-exit" data-action="exit-session" title="Выйти из сессии" aria-label="Выйти из сессии">✕</button>
          <span class="progress">${this.cardIndex + 1} / ${this.cards.length}</span>
          ${this.user?.streak ? `<span class="streak-badge">🔥 ${this.user.streak}</span>` : ''}
        </div>
        <div class="deck-area" id="deck">
          ${card ? `
          <div class="word-card${this.cardEnter ? ' card-enter' : ''}" data-action="overlay" id="active-card">
            <span class="swipe-label know">ЗНАЮ</span>
            <span class="swipe-label learn">УЧУ</span>
            <p class="lemma">${esc(card.lemma)}</p>
            <p class="hint">Тап — подробнее · ← знаю · → учу</p>
          </div>` : ''}
        </div>
        <div class="swipe-hints">
          <span>← Знаю</span>
          <span>Учу →</span>
        </div>
        <div style="display:flex;gap:0.5rem;margin-top:1rem">
          <button class="btn btn-ghost" data-action="swipe-left" style="flex:1">← Знаю</button>
          <button class="btn btn-primary" data-action="swipe-right" style="flex:1">Учу →</button>
        </div>`;
    } else if (v === 'summary' && this.summary) {
      html += `
        <div class="summary-card">
          <h2>Сессия завершена</h2>
          <p>Отлично! Коротко и по делу — без рутины.</p>
          <div class="stat-grid">
            <div class="stat-box"><div class="num">${this.summary.cardsReviewed}</div><div class="lbl">Просмотрено</div></div>
            <div class="stat-box"><div class="num">${this.summary.cardsLearned}</div><div class="lbl">На учёбе</div></div>
            <div class="stat-box"><div class="num">${this.summary.streak}</div><div class="lbl">Streak</div></div>
            <div class="stat-box"><div class="num">${this.summary.wordsDueTomorrow}</div><div class="lbl">На завтра</div></div>
          </div>
          <button class="btn btn-primary" data-action="start" style="width:100%">Ещё сессия</button>
          <button class="btn btn-ghost" data-action="home" style="width:100%;margin-top:0.5rem">На главную</button>
        </div>`;
    } else if (v === 'stats' && this.stats) {
      html += `
        <section class="hero"><h1>Статистика</h1></section>
        <div class="card-form stats-page">
          <div class="stat-row"><span>Streak</span><strong>${this.stats.streak} дн.</strong></div>
          <div class="stat-row"><span>Слов в учёбе</span><strong>${this.stats.wordsLearned}</strong></div>
          <div class="stat-row"><span>Сессий</span><strong>${this.stats.sessionsCompleted}</strong></div>
          <div class="stat-row"><span>Уровень</span><strong>${esc(this.stats.cefrLevel)}</strong></div>
        </div>
        <button class="btn btn-primary" data-action="home" style="width:100%;margin-top:1rem">На главную</button>`;
    } else if (v === 'settings') {
      html += `
        <section class="hero"><h1>Настройки</h1></section>
        <div class="card-form">
          <label>Уровень языка
            <select name="cefrLevel">
              ${opt('A1', 'A1 — начальный', this.cefrLevel)}
              ${opt('A2', 'A2 — элементарный', this.cefrLevel)}
              ${opt('B1', 'B1 — средний', this.cefrLevel)}
              ${opt('B2', 'B2 — продвинутый', this.cefrLevel)}
              ${opt('C1', 'C1 — свободный', this.cefrLevel)}
            </select>
          </label>
          ${this.settingsSaved ? '<p class="saved-hint">Сохранено ✓</p>' : ''}
          ${this.settingsError ? `<p class="error">${esc(this.settingsError)}</p>` : ''}
          <p class="settings-hint">Влияет на слова, которые попадают в сессии</p>
          <div class="settings-divider"></div>
          <p class="referral-title">🔔 Напоминания</p>
          <p class="referral-muted">Пуш в удобное время — повторяй слова каждый день</p>
          <div class="reminder-row">
            <label>Время напоминания
              <input type="time" name="reminderTime" value="${esc(this.reminderTime)}">
            </label>
          </div>
          ${this.reminder.enabled
            ? '<button class="btn btn-ghost" data-action="reminder-disable" style="width:100%">Отключить напоминания</button>'
            : '<button class="btn btn-primary" data-action="reminder-enable" style="width:100%">Включить напоминания</button>'}
          ${this.reminderError ? `<p class="error" style="text-align:center">${esc(this.reminderError)}</p>` : ''}
        </div>
        <button class="btn btn-primary" data-action="home" style="width:100%;margin-top:1rem">На главную</button>
        <div class="danger-zone">
          <button class="btn btn-danger" data-action="delete-account">Удалить аккаунт</button>
        </div>`;
    }

    html += '</div>';

    if (this.overlayWord) {
      const w = this.overlayWord;
      const meanings = String(w.translation ?? '')
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);
      html += `
        <div class="overlay" data-action="close-overlay">
          <div class="overlay-panel">
            <h2>${esc(w.lemma)}</h2>
            ${meanings.map((m) => `<p class="translation">${esc(m)}</p>`).join('')}
            <span class="pos">${esc(w.pos)} · ${esc(w.cefrLevel)}${w.unit ? ` · ${esc(w.unit)}` : ''}</span>
            <button class="btn btn-primary" data-action="speak" style="width:100%;margin-bottom:1rem">🔊 Произношение</button>
            <ul class="examples">${w.examples.map((ex) => `<li>${esc(ex)}</li>`).join('')}</ul>
            <button class="btn btn-ghost" data-action="close-overlay" style="width:100%">Закрыть</button>
          </div>
        </div>`;
    }

    this.root.innerHTML = html;
    this.cardEnter = false;
    this.bindEvents();
    const card = this.root.querySelector('#active-card');
    if (card) {
      card.addEventListener('pointerdown', (e) => this.onPointerDown(e));
      card.addEventListener('pointermove', (e) => this.onPointerMove(e));
      card.addEventListener('pointerup', (e) => this.onPointerUp(e));
      card.addEventListener('pointercancel', (e) => this.onPointerUp(e));
    }
  }
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function urlB64ToUint8Array(base64UrlString) {
  const padding = '='.repeat((4 - (base64UrlString.length % 4)) % 4);
  const base64 = (base64UrlString + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

function opt(value, label, selected) {
  return `<option value="${value}"${selected === value ? ' selected' : ''}>${label}</option>`;
}
