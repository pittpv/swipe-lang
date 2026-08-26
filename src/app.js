import { track, captureReferralFromUrl, getStoredReferral, fetchPublicStats, api } from './track.js';
import { showAchievements, dismissAchievements, achievementBadge } from './achievements.js';

export { api } from './track.js';

/** Injected at build/dev time from package.json via vite.config.js */
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.1.0';

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
    this.drag = { active: false, pointerId: null, startX: 0, startY: 0, x: 0, y: 0 };
    this._onWinPointerMove = (e) => this.onPointerMove(e);
    this._onWinPointerUp = (e) => this.onPointerUp(e);
    this.swiping = false;
    this.cardEnter = false;
    this.reminder = { enabled: false };
    this.reminderTime = '19:00';
    this.reminderError = '';
    this.reminderSaveTimer = null;
    this.reminderSaveInFlight = false;
    this.reminderSaveQueued = false;
    this.reminderSaveInteractiveQueued = false;
    this.reminderNeedsGestureHeal = false;
    this.settingsError = '';
    this.settingsSaved = false;
    this.name = '';
    this.progressReset = false;
    this.publicStats = { words: 3564, sessionSize: 18 };
    this.referralLink = '';
    /** Level-up offer when current CEFR scope is fully known. */
    this.levelOffer = null;
    /** Achievements unlocked at session end — shown after leaving summary (iOS). */
    this.pendingAchievements = null;
    this._summaryTapHandled = false;
    this._suppressClickUntil = 0;
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
    if (this.user?.name) this.name = this.user.name;
    if (this.view === 'landing') track('landing_view');
    if (this.user?.id) {
      await this.loadUserExtras();
    }
    this.render();
    this.armGesturePushHeal();
    this.initVersionWatch();
  }

  /**
   * SPA deployments swap the server bundle while an already-open tab keeps
   * running the old code. Watch for a newly deployed bundle and offer a
   * one-tap reload instead of silently staying on the stale version.
   */
  initVersionWatch() {
    // The hashed bundle this instance is running from (absent on the dev server).
    const current = document.querySelector('script[src*="/assets/index-"]')?.getAttribute('src');
    if (!current) return;
    let toastShown = false;

    const check = async () => {
      if (toastShown || document.visibilityState !== 'visible') return;
      try {
        const res = await fetch(`/?t=${Date.now()}`, { cache: 'no-store' });
        const html = await res.text();
        const deployed = html.match(/src="(\/assets\/index-[^"]+\.js)"/)?.[1];
        if (deployed && deployed !== current) {
          toastShown = true;
          this.showUpdateToast();
        }
      } catch {
        /* offline or transient failure — try again later */
      }
    };

    document.addEventListener('visibilitychange', check);
    setInterval(check, 5 * 60 * 1000);
  }

  showUpdateToast() {
    if (document.querySelector('.update-toast')) return;
    const toast = document.createElement('div');
    toast.className = 'update-toast';

    const text = document.createElement('span');
    text.textContent = 'Доступна новая версия';

    const btn = document.createElement('button');
    btn.textContent = 'Обновить';
    btn.addEventListener('click', () => window.location.reload());

    toast.append(text, btn);
    document.body.appendChild(toast);
  }

  /** Referral link + reminder state — needed by home/settings after any login path. */
  async loadUserExtras() {
    await Promise.all([this.loadReferralLink(), this.loadReminderStatus()]);
  }

  setView(view) {
    this.view = view;
    this.error = '';
    this.overlayWord = null;
    dismissAchievements();
    this.render();
    if (view === 'home') this.flushPendingAchievements();
  }

  flushPendingAchievements() {
    const list = this.pendingAchievements;
    this.pendingAchievements = null;
    if (list?.length) showAchievements(list);
  }

  async login() {
    try {
      this.user = await api('/auth/login', { method: 'POST', body: { email: this.email, password: this.password } });
      if (this.user?.name) this.name = this.user.name;
      this.view = this.user.needsOnboarding ? 'onboarding' : 'home';
      if (!this.user.needsOnboarding) await this.loadUserExtras();
    } catch (e) {
      this.error = e.message;
    }
    this.render();
    this.armGesturePushHeal();
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
      await this.loadUserExtras();
    } catch (e) {
      this.error = e.message;
    }
    this.render();
    this.armGesturePushHeal();
  }

  async startSession() {
    this.pendingAchievements = null;
    dismissAchievements();
    try {
      const data = await api('/session/start', { method: 'POST' });
      if (!data.cards?.length) {
        if (data.levelComplete) {
          this.levelOffer = data.levelProgress;
          this.view = 'level-up';
          track('level_complete_shown');
        } else {
          this.error = 'Нет слов для сессии. Попробуйте сменить уровень в настройках.';
          this.view = 'home';
        }
        this.render();
        return;
      }
      this.sessionId = data.sessionId;
      this.cards = data.cards;
      this.cardIndex = 0;
      this.summary = null;
      this.levelOffer = data.levelComplete ? data.levelProgress : null;
      this.view = 'session';
      track('session_start');
    } catch (e) {
      this.error = e.message;
    }
    this.render();
  }

  async acceptLevelUp() {
    const next = this.levelOffer?.nextCefrLevel;
    if (!next) {
      this.levelOffer = null;
      this.setView('home');
      return;
    }
    this.settingsError = '';
    try {
      const result = await api('/profile', { method: 'PATCH', body: { cefrLevel: next } });
      this.cefrLevel = result.cefrLevel;
      if (this.user) this.user.cefrLevel = result.cefrLevel;
      this.levelOffer = null;
      track('level_up_accepted');
      await this.startSession();
      return;
    } catch (e) {
      this.error = e.message;
      this.view = 'level-up';
    }
    this.render();
  }

  dismissLevelUp() {
    this.levelOffer = null;
    this.setView('home');
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
    this.drag.pointerId = null;
    this.endPointerTracking();
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
    this.drag = { active: false, pointerId: null, startX: 0, startY: 0, x: 0, y: 0 };
    this.cardEnter = true;
    if (this.cardIndex >= this.cards.length) {
      this.overlayWord = null;
      this.summary = await api('/session/complete', { method: 'POST' });
      if (this.user) this.user.streak = this.summary.streak;
      if (this.summary.levelComplete) this.levelOffer = this.summary.levelProgress;
      track('session_complete');
      this.view = 'summary';
      // Defer celebration until Home: on iOS a full-screen layer + post-swipe
      // missing click made «На главную» need two taps.
      this.pendingAchievements = this.summary.achievements;
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
      if (this.stats.levelProgress?.complete && this.stats.levelProgress.nextCefrLevel) {
        this.levelOffer = this.stats.levelProgress;
      }
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
    const local = readReminderPref();
    try {
      const status = await api('/push/status');
      if (status.time) this.reminderTime = status.time;
      else if (local?.time) this.reminderTime = local.time;
      if (status.enabled || local?.enabled) {
        this.reminder.enabled = true;
        await this.pushSubscribe({ interactive: false });
        return;
      }
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) await this.pushSubscribe({ interactive: false });
    } catch {
      if (local?.enabled) {
        this.reminder.enabled = true;
        if (local.time) this.reminderTime = local.time;
      }
    }
  }

  /**
   * iOS requires pushManager.subscribe inside a real user gesture. Launch heal
   * may have failed; retry on the first tap — synchronously, because setTimeout
   * drops user activation and subscribe() then fails silently.
   */
  armGesturePushHeal() {
    if (!this.reminderNeedsGestureHeal) return;
    const retry = () => {
      document.removeEventListener('pointerup', retry, true);
      this.reminderNeedsGestureHeal = false;
      this.pushSubscribe({ interactive: false });
    };
    document.addEventListener('pointerup', retry, { once: true, capture: true });
  }

  /**
   * @param {{ interactive?: boolean }} [opts]
   * interactive: only the Enable button may call Notification.requestPermission.
   * A launch-time request is not a user gesture; iOS then reports "denied"
   * even when the PWA already has notification permission.
   * Subscribe itself is still attempted whenever permission is already granted.
   */
  async ensurePushSubscription({ interactive = false } = {}) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      if (!interactive) return null;
      throw new Error('Push-уведомления не поддерживаются этим браузером');
    }
    const config = await api('/push/config');
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    // Only rotate when WebKit exposes the key AND it disagrees. An empty key
    // must not unsubscribe — that killed live Apple endpoints after 8c03b34.
    if (subscription && !this.sameVapidKey(subscription, config.publicKey)) {
      await subscription.unsubscribe().catch(() => {});
      subscription = null;
    }
    if (subscription) return subscription.toJSON();

    let permission = typeof Notification !== 'undefined' ? Notification.permission : 'denied';
    if (permission !== 'granted') {
      if (!interactive) return null;
      permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Разрешение на уведомления не выдано');
      }
    }
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(config.publicKey),
      });
    } catch (e) {
      if (!interactive) return null;
      throw e;
    }
    return subscription.toJSON();
  }

  sameVapidKey(subscription, publicKeyB64) {
    const existing = new Uint8Array(subscription.options?.applicationServerKey ?? []);
    // WebKit often omits applicationServerKey — treat as unknown/match.
    if (!existing.length) return true;
    const current = urlB64ToUint8Array(publicKeyB64);
    return existing.length === current.length && existing.every((b, i) => b === current[i]);
  }

  async enableReminders() {
    await this.pushSubscribe({ interactive: true });
  }

  /**
   * Debounced save so dragging the time picker fires one request, not one
   * per input event — parallel subscribe calls could otherwise race the
   * delete-then-create schedule replacement on the server.
   */
  queueReminderSave(delayMs = 800) {
    clearTimeout(this.reminderSaveTimer);
    this.reminderSaveTimer = setTimeout(() => {
      this.reminderSaveTimer = null;
      this.saveReminderTime();
    }, delayMs);
  }

  async saveReminderTime() {
    if (this.reminder.enabled) await this.pushSubscribe({ interactive: true });
  }

  /** Single serialized /push/subscribe call shared by enable + time change. */
  async pushSubscribe({ interactive = false } = {}) {
    // If a call is already running, coalesce into exactly one follow-up.
    if (this.reminderSaveInFlight) {
      this.reminderSaveQueued = true;
      if (interactive) this.reminderSaveInteractiveQueued = true;
      return;
    }
    this.reminderSaveInFlight = true;
    if (interactive) this.reminderError = '';
    try {
      const subscription = await this.ensurePushSubscription({ interactive });
      if (!subscription) {
        this.reminderNeedsGestureHeal = true;
        if (readReminderPref()?.enabled) this.reminder.enabled = true;
      } else {
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
        this.reminderNeedsGestureHeal = false;
        if (this.reminder.enabled) writeReminderPref({ enabled: true, time: this.reminderTime });
      }
    } catch (e) {
      if (interactive) this.reminderError = e.message;
      else this.reminderNeedsGestureHeal = true;
      if (readReminderPref()?.enabled) this.reminder.enabled = true;
    }
    this.reminderSaveInFlight = false;
    if (this.reminderSaveQueued) {
      this.reminderSaveQueued = false;
      const nextInteractive = this.reminderSaveInteractiveQueued;
      this.reminderSaveInteractiveQueued = false;
      await this.pushSubscribe({ interactive: nextInteractive });
      return;
    }
    if (interactive || this.view === 'settings') this.render();
  }

  cancelPendingReminderSave() {
    clearTimeout(this.reminderSaveTimer);
    this.reminderSaveTimer = null;
    this.reminderSaveQueued = false;
  }

  async disableReminders() {
    this.cancelPendingReminderSave();
    clearReminderPref();
    try {
      await api('/push/unsubscribe', { method: 'POST' });
    } catch {
      /* ignore */
    }
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      await subscription?.unsubscribe();
    } catch {
      /* ignore */
    }
    this.reminder.enabled = false;
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

  async saveName() {
    this.settingsError = '';
    const name = String(this.name ?? '').trim();
    if (!name) {
      this.settingsError = 'Введите имя';
      this.render();
      return;
    }
    try {
      const result = await api('/profile', { method: 'PATCH', body: { name } });
      if (this.user) this.user.name = result.name;
      this.name = result.name ?? name;
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

  async resetProgress() {
    if (!confirm('Сбросить статистику и прогресс? Streak, изученные слова и сессии будут удалены. Это действие нельзя отменить.')) return;
    try {
      await api('/profile/reset-progress', { method: 'POST' });
      if (this.user) this.user.streak = 0;
      this.stats = null;
      this.progressReset = true;
      this.render();
      setTimeout(() => {
        if (this.progressReset) {
          this.progressReset = false;
          this.render();
        }
      }, 2400);
      return;
    } catch (e) {
      this.error = e.message;
    }
    this.render();
  }

  async logout() {
    await api('/auth/logout', { method: 'POST' });
    this.cancelPendingReminderSave();
    this.user = null;
    this.referralLink = '';
    this.reminder = { enabled: false };
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
    this.drag = { active: false, pointerId: null, startX: 0, startY: 0, x: 0, y: 0 };
    this.endPointerTracking();
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
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    // Drop a leftover spring-back transition so dragging follows the finger 1:1.
    e.currentTarget.style.transition = '';
    this.drag = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      x: 0,
      y: 0,
    };
    // Track the gesture on window — not setPointerCapture. Capturing on the
    // card and then destroying it at session end makes iOS eat the next tap
    // («На главную» looks dead until the second press).
    window.addEventListener('pointermove', this._onWinPointerMove);
    window.addEventListener('pointerup', this._onWinPointerUp);
    window.addEventListener('pointercancel', this._onWinPointerUp);
  }

  endPointerTracking() {
    window.removeEventListener('pointermove', this._onWinPointerMove);
    window.removeEventListener('pointerup', this._onWinPointerUp);
    window.removeEventListener('pointercancel', this._onWinPointerUp);
  }

  onPointerMove(e) {
    if (!this.drag.active || e.pointerId !== this.drag.pointerId) return;
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
    if (!this.drag.active || e.pointerId !== this.drag.pointerId) return;
    const { x, y } = this.drag;
    this.drag.active = false;
    this.drag.pointerId = null;
    this.endPointerTracking();
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

  /**
   * After a swipe, iOS often never synthesizes `click` for the next tap.
   * Summary CTAs therefore run on pointerup; a short click-capture suppress
   * stops the late ghost-click from hitting the newly rendered Home button.
   */
  onSummaryPointerUp(e) {
    if ((this.view !== 'summary' && this.view !== 'level-up') || this._summaryTapHandled) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const t = e.target.closest('[data-action="home"], [data-action="start"], [data-action="level-up"], [data-action="dismiss-level-up"]');
    if (!t) return;
    this._summaryTapHandled = true;
    this._suppressClickUntil = Date.now() + 450;
    const suppress = (ev) => {
      if (Date.now() > this._suppressClickUntil) {
        document.removeEventListener('click', suppress, true);
        return;
      }
      ev.preventDefault();
      ev.stopPropagation();
    };
    document.addEventListener('click', suppress, true);
    setTimeout(() => {
      document.removeEventListener('click', suppress, true);
      this._summaryTapHandled = false;
    }, 450);
    if (t.dataset.action === 'home') this.setView('home');
    else if (t.dataset.action === 'level-up') this.acceptLevelUp();
    else if (t.dataset.action === 'dismiss-level-up') this.dismissLevelUp();
    else this.startSession();
  }

  bindEvents() {
    this.root.onclick = (e) => {
      if (Date.now() < this._suppressClickUntil) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const t = e.target.closest('[data-action]');
      if (!t) return;
      const action = t.dataset.action;
      // Already handled in onSummaryPointerUp (iOS post-swipe path).
      if (this._summaryTapHandled && (action === 'home' || action === 'start' || action === 'level-up' || action === 'dismiss-level-up')) return;
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
      if (action === 'level-up') this.acceptLevelUp();
      if (action === 'dismiss-level-up') this.dismissLevelUp();
      if (action === 'stats') this.loadStats();
      if (action === 'settings') this.setView('settings');
      if (action === 'save-name') this.saveName();
      if (action === 'reset-progress') this.resetProgress();
      if (action === 'home') this.setView('home');
      if (action === 'logout') this.logout();
      if (action === 'delete-account') this.deleteAccount();
      if (action === 'exit-session') this.exitSession();
      if (action === 'overlay') {
        if (this.view === 'session' && !this.swiping) this.openOverlay();
      }
      if (action === 'close-overlay') this.closeOverlay();
      if (action === 'speak') this.speak(this.overlayWord?.lemma);
      if (action === 'swipe-left') this.swipe('left');
      if (action === 'swipe-right') this.swipe('right');
      if (action === 'copy-referral') this.copyReferral();
      if (action === 'reminder-enable') this.enableReminders();
      if (action === 'reminder-disable') this.disableReminders();
    };

    this.root.onpointerup = (e) => this.onSummaryPointerUp(e);

    this.root.oninput = (e) => {
      const { name, value } = e.target;
      if (name === 'reminderTime') {
        this.reminderTime = value;
        if (this.reminder.enabled) this.queueReminderSave();
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
          <p>Свайп влево — знаю, вправо — учу. Сессии по ${this.publicStats.sessionSize} карточек — без бесконечной ленты.</p>
        </section>
        <div class="benefits">
          <div class="benefit"><strong>18 карточек</strong><span>за 5 минут</span></div>
          <div class="benefit"><strong>SRS</strong><span>умные повторы</span></div>
          <div class="benefit"><strong>Тап</strong><span>перевод + аудио</span></div>
          <div class="benefit"><strong>Онбординг</strong><span>за 20 секунд</span></div>
          <div class="benefit"><strong>🔥 Streak</strong><span>серии и достижения</span></div>
          <div class="benefit"><strong>📲 PWA</strong><span>установи на телефон</span></div>
        </div>
        <button class="btn btn-primary btn-lg" data-action="show-register">Начать бесплатно →</button>
        <p class="subcta">Без карты · Быстрая регистрация</p>
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
              ${opt('B2', 'B2 — продвинутый', this.cefrLevel)}
              ${opt('C1', 'C1 — свободный', this.cefrLevel)}
            </select>
          </label>
          ${this.error ? `<p class="error">${esc(this.error)}</p>` : ''}
          <button class="btn btn-primary" data-action="onboarding">Продолжить</button>
          <p style="text-align:center;font-size:0.85rem;color:var(--color-muted);margin:1rem 0 0">📲 Совет: установите LangApp как приложение — инструкция для <a href="/help/faq.html#install" target="_blank" rel="noopener">iPhone и Android — в FAQ</a>.</p>
        </div>`;
    } else if (v === 'home') {
      html += `
        <section class="hero">
          <h1>${this.user?.name ? `Привет, ${esc(this.user.name)}!` : 'Привет!'}</h1>
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
      const lp = this.summary.levelProgress;
      const offerUp = this.summary.levelComplete && lp?.nextCefrLevel;
      const allDone = this.summary.levelComplete && lp?.atMaxLevel;
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
          ${offerUp ? `
          <div class="level-up-banner">
            <p class="level-up-title">Уровень ${esc(lp.cefrLevel)} освоен!</p>
            <p class="level-up-text">Все ${lp.wordsTotal} слов до ${esc(lp.cefrLevel)} отмечены как «Знаю». Перейти на ${esc(lp.nextCefrLevel)}?</p>
            <button class="btn btn-primary" data-action="level-up" style="width:100%">Перейти на ${esc(lp.nextCefrLevel)}</button>
          </div>` : ''}
          ${allDone ? `
          <div class="level-up-banner">
            <p class="level-up-title">Словарь пройден!</p>
            <p class="level-up-text">Вы отметили «Знаю» все слова до C1. Можно повторять due-карточки.</p>
          </div>` : ''}
          ${!offerUp ? '<button class="btn btn-primary" data-action="start" style="width:100%">Ещё сессия</button>' : ''}
          <button class="btn btn-ghost" data-action="home" style="width:100%;margin-top:0.5rem">На главную</button>
        </div>`;
    } else if (v === 'level-up' && this.levelOffer) {
      const lp = this.levelOffer;
      html += `
        <div class="summary-card level-up-card">
          <h2>${lp.atMaxLevel ? 'Словарь освоен' : `Уровень ${esc(lp.cefrLevel)} пройден`}</h2>
          <p>${lp.atMaxLevel
            ? 'Все слова словаря отмечены как «Знаю». Возвращайтесь к повторениям, когда они появятся.'
            : `Все ${lp.wordsTotal} слов до ${esc(lp.cefrLevel)} изучены. Откроем ${esc(lp.nextCefrLevel)}?`}</p>
          ${lp.nextCefrLevel
            ? `<button class="btn btn-primary" data-action="level-up" style="width:100%">Перейти на ${esc(lp.nextCefrLevel)}</button>
               <button class="btn btn-ghost" data-action="dismiss-level-up" style="width:100%;margin-top:0.5rem">Остаться на ${esc(lp.cefrLevel)}</button>`
            : `<button class="btn btn-primary" data-action="home" style="width:100%">На главную</button>`}
        </div>`;
    } else if (v === 'stats' && this.stats) {
      const achievements = Array.isArray(this.stats.achievements) ? this.stats.achievements : [];
      const lp = this.stats.levelProgress;
      const eta = this.stats.eta;
      html += `
        <section class="hero"><h1>Статистика</h1></section>
        <div class="card-form stats-page">
          <div class="stat-row"><span>Streak</span><strong>${this.stats.streak} дн.</strong></div>
          <div class="stat-row"><span>Знаю (всего)</span><strong>${this.stats.wordsLearned}</strong></div>
          <div class="stat-row"><span>Сессий</span><strong>${this.stats.sessionsCompleted}</strong></div>
          <div class="stat-row"><span>Уровень</span><strong>${esc(this.stats.cefrLevel)}</strong></div>
          ${lp ? `
          <div class="settings-divider"></div>
          <p class="referral-title">Прогресс уровня ${esc(lp.cefrLevel)}</p>
          <p class="eta-scope">${lp.wordsKnown} из ${lp.wordsTotal} слов до ${esc(lp.cefrLevel)} · ${lp.percent}%</p>
          <div class="progress-bar" role="progressbar" aria-valuenow="${lp.percent}" aria-valuemin="0" aria-valuemax="100" aria-label="Прогресс уровня">
            <div class="progress-bar-fill" style="width:${lp.percent}%"></div>
          </div>
          <div class="stat-row"><span>Новых</span><strong>${lp.wordsNew}</strong></div>
          <div class="stat-row"><span>На учёбе</span><strong>${lp.wordsLearning}</strong></div>
          ${eta ? `
          <div class="eta-box">
            <p class="eta-label">Оценка до «Знаю» по уровню</p>
            <p class="eta-value">${esc(eta.label)}</p>
            ${eta.remainingWords
              ? `<p class="eta-hint">Осталось ${eta.remainingWords} слов · до ~13 новых за сессию</p>`
              : ''}
          </div>` : ''}
          ${lp.complete && lp.nextCefrLevel ? `
          <button class="btn btn-primary" data-action="level-up" style="width:100%;margin-top:0.75rem">Перейти на ${esc(lp.nextCefrLevel)}</button>` : ''}
          ${lp.complete && lp.atMaxLevel ? `
          <p class="saved-hint" style="margin-top:0.75rem">Словарь C1 полностью освоен ✓</p>` : ''}
          ` : ''}
          <div class="settings-divider"></div>
          <p class="referral-title">🏅 Достижения</p>
          ${achievements.length
            ? `<div class="ach-grid">
                ${achievements.map((a) => {
                  const badge = achievementBadge(a);
                  if (!badge) return '';
                  return `
                    <div class="ach-badge" title="${esc(badge.title)}">
                      <span class="ach-badge-emoji">${badge.emoji}</span>
                      <strong>${esc(badge.title)}</strong>
                    </div>`;
                }).join('')}
              </div>`
            : '<p class="settings-hint">Достижений пока нет — завершите сессию, чтобы получить первое 🎯</p>'}
        </div>
        <button class="btn btn-primary" data-action="home" style="width:100%;margin-top:1rem">На главную</button>`;
    } else if (v === 'settings') {
      html += `
        <section class="hero"><h1>Настройки</h1></section>
        <div class="card-form">
          <label>Имя
            <input name="name" type="text" value="${esc(this.name)}" maxlength="64" placeholder="Как к вам обращаться?" autocomplete="given-name" />
          </label>
          <button class="btn btn-primary" data-action="save-name" style="width:100%">Сохранить имя</button>
          ${this.settingsSaved ? '<p class="saved-hint">Сохранено ✓</p>' : ''}
          <div class="settings-divider"></div>
          <label>Уровень языка
            <select name="cefrLevel">
              ${opt('A1', 'A1 — начальный', this.cefrLevel)}
              ${opt('A2', 'A2 — элементарный', this.cefrLevel)}
              ${opt('B1', 'B1 — средний', this.cefrLevel)}
              ${opt('B2', 'B2 — продвинутый', this.cefrLevel)}
              ${opt('C1', 'C1 — свободный', this.cefrLevel)}
            </select>
          </label>
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
        ${this.progressReset ? '<p class="saved-hint reset-hint">Прогресс сброшен ✓</p>' : ''}
        <div class="danger-zone">
          <button class="btn btn-danger" data-action="reset-progress">Сбросить статистику и прогресс</button>
          <button class="btn btn-danger" data-action="delete-account">Удалить аккаунт</button>
        </div>
        <p class="app-version">LangApp v${esc(APP_VERSION)}</p>`;
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

    this.endPointerTracking();
    this.root.innerHTML = html;
    this.cardEnter = false;
    this.bindEvents();
    const card = this.root.querySelector('#active-card');
    if (card) {
      card.addEventListener('pointerdown', (e) => this.onPointerDown(e));
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

const REMINDER_PREF_KEY = 'langapp.reminders';

function readReminderPref() {
  try {
    const raw = localStorage.getItem(REMINDER_PREF_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeReminderPref(value) {
  try {
    localStorage.setItem(REMINDER_PREF_KEY, JSON.stringify(value));
  } catch {
    /* private mode */
  }
}

function clearReminderPref() {
  try {
    localStorage.removeItem(REMINDER_PREF_KEY);
  } catch {
    /* private mode */
  }
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
