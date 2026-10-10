import { track, captureReferralFromUrl, captureCircleFromUrl, getStoredReferral, takeStoredCircleCode, fetchPublicStats, api } from './track.js';
import { showAchievements, dismissAchievements, achievementBadge, achievementScope } from './achievements.js';
import { THEME_CHOICES, getThemePreference, setThemePreference } from './theme.js';
import {
  CHANGELOG,
  formatChangelogDate,
  hasUnseenChangelog,
  markChangelogSeen,
} from './changelog.js';
import {
  DEFAULT_LANG_PAIR,
  LANG_PAIRS,
  LANG_PAIR_META,
  cefrLevelsForPair,
  clampCefrToPair,
  normalizeLangPair,
} from '../server/lang-pairs.js';
import { STREAK_WARN_MS, formatStreakRiskHint, msUntilStreakWarning, streakResetRisk } from './streak-risk.js';

export { api } from './track.js';

/** Injected at build/dev time from package.json via vite.config.js */
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.1.0';
const SUPPORT_TELEGRAM_URL = 'https://t.me/+mf9HThpx2m4xNzQ8';
const IOS_INSTALL_DISMISS_KEY = 'langapp.iosInstallDismissed';
const SEEN_CIRCLE_INVITES_KEY = 'langapp.seenCircleInvites';

function splashProgress(n) {
  window.__langSplash?.set(n);
}

export class App {
  constructor(root) {
    this.root = root;
    this.view = 'loading';
    this.user = null;
    /** Explanation under the streak badge while the reset warning is open. */
    this.streakRiskOpen = false;
    this._streakRiskTimer = null;
    this.circle = null;
    this.circleSuggestions = [];
    this.circleReferrals = [];
    this.circleInvites = [];
    this.circleLangPair = DEFAULT_LANG_PAIR;
    this.circleLoading = false;
    this.circleError = '';
    this.circleName = '';
    this.circleCode = '';
    this.circleCopied = false;
    this.ranks = null;
    this.ranksError = '';
    this.error = '';
    this.authMode = 'login';
    this.email = '';
    this.password = '';
    this.goal = 'travel';
    this.cefrLevel = 'A1';
    this.langPair = DEFAULT_LANG_PAIR;
    this.cards = [];
    this.cardIndex = 0;
    this.sessionId = null;
    /** 'circle' when the deck came from a study circle, so summary returns there. */
    this.sessionSource = null;
    this.summary = null;
    this.stats = null;
    this.overlayWord = null;
    /** @type {null | 'examples' | 'forms'} expanded section inside the word overlay */
    this.overlaySection = null;
    /** Play bottom-sheet enter animation only on first open, not on section toggle. */
    this.overlayEnter = false;
    /** word id → 'up' | 'down' | null, so a reopened card keeps the vote */
    this.associationVotes = new Map();
    this.drag = { active: false, pointerId: null, startX: 0, startY: 0, x: 0, y: 0 };
    this._onWinPointerMove = (e) => this.onPointerMove(e);
    this._onWinPointerUp = (e) => this.onPointerUp(e);
    this._onLandingPointerMove = (e) => this.onLandingPointerMove(e);
    this._onLandingPointerUp = (e) => this.onLandingPointerUp(e);
    this.landingBenefitIndex = 0;
    this._landingSwiping = false;
    this._landingAutoTimer = null;
    this._landingDrag = { active: false, pointerId: null, startX: 0, startY: 0, x: 0, y: 0 };
    this.swiping = false;
    /** True after fly-out while /session/swipe is still in flight — show card skeleton. */
    this.awaitingNext = false;
    this.cardEnter = false;
    this.reminder = { enabled: false };
    this.reminderTime = '19:00';
    this.reminderError = '';
    this.reminderSaveTimer = null;
    this.reminderSaveInFlight = false;
    this.reminderSaveQueued = false;
    this.reminderSaveInteractiveQueued = false;
    this.reminderNeedsGestureHeal = false;
    this.gestureHealArmed = false;
    this.vapidPublicKey = null;
    this.settingsError = '';
    this.settingsErrorSource = '';
    this.settingsSaved = false;
    this.nameSavedTimer = null;
    this.name = '';
    this._onboardingBusy = false;
    this._onboardingToken = 0;
    this.progressReset = false;
    this.publicStats = {
      sessionSize: 18,
      pairs: {
        'tr-ru': { words: 3500, label: 'Турецкий' },
        'en-ru': { words: 4100, label: 'Английский' },
        'es-ru': { words: 3900, label: 'Испанский' },
      },
    };
    this.referralLink = '';
    this.referralCopied = false;
    this.referralCopiedTimer = null;
    this.changelogUnseen = false;
    /** Level-up offer when current CEFR scope is fully known. */
    this.levelOffer = null;
    /** Achievements unlocked at session end — shown after leaving summary (iOS). */
    this.pendingAchievements = null;
    this._summaryTapHandled = false;
    this._suppressClickUntil = 0;
    /** @type {Map<string, HTMLAudioElement>} cached pronunciation clips */
    this.audioCache = new Map();
    /** Serial swipe saves so session counts stay in order. The card does not wait on this. */
    this._swipeChain = Promise.resolve();
    this._swipeHalted = false;
    this._swipeFailure = null;
    this._deckPrefetch = null;
    this._deckGen = 0;
  }

  async init() {
    captureReferralFromUrl();
    captureCircleFromUrl();
    splashProgress(58);
    const statsPromise = fetchPublicStats()
      .then((stats) => {
        this.publicStats = stats;
      })
      .catch(() => {});
    try {
      this.user = await api('/auth/me');
      this.view = this.user.needsOnboarding ? 'onboarding' : 'home';
    } catch {
      this.view = 'landing';
    }
    splashProgress(82);
    if (this.user?.cefrLevel) this.cefrLevel = this.user.cefrLevel;
    if (this.user?.langPair) this.langPair = normalizeLangPair(this.user.langPair);
    this.cefrLevel = clampCefrToPair(this.cefrLevel, this.langPair);
    if (this.user?.name) this.name = this.user.name;
    if (this.view === 'landing') track('landing_view');
    splashProgress(88);
    this.changelogUnseen = hasUnseenChangelog();
    this.consumeOpenView();
    if (this.view === 'home') await this.maybeJoinStoredCircle();
    if (this.view === 'landing') {
      await statsPromise;
    } else if (this.user?.id && this.view === 'home') {
      await Promise.all([statsPromise, this.loadUserExtras()]);
    }
    splashProgress(94);
    this.render();
    this.armGesturePushHeal();
    this.initVersionWatch();
    this.syncIosInstallHint();
    const onForeground = () => {
      if (document.hidden) return;
      if (this.view === 'onboarding-setup') void this.resumeOnboardingSetup();
      this.refreshStreakRisk();
    };
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.clearLandingAuto();
        return;
      }
      onForeground();
      if (this.view === 'landing' && !this._landingSwiping && !this._landingDrag.active) {
        this.scheduleLandingAuto();
      }
    });
    window.addEventListener('pageshow', onForeground);
  }

  consumeOpenView() {
    const params = new URLSearchParams(location.search);
    const open = params.get('open');
    let stored = '';
    try {
      stored = sessionStorage.getItem('langapp.returnView') || '';
    } catch {
      /* private mode */
    }
    const fromInfo = isReturnFromInfoPage();
    const target = open || (fromInfo ? stored : '');
    if (this.user && !this.user.needsOnboarding && target === 'settings') {
      this.view = 'settings';
    }
    try {
      sessionStorage.removeItem('langapp.returnView');
    } catch {
      /* private mode */
    }
    if (!params.has('open')) return;
    params.delete('open');
    const qs = params.toString();
    history.replaceState({}, '', `${location.pathname}${qs ? `?${qs}` : ''}${location.hash}`);
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

  /** Safari has no system install prompt — guide iPhone users to Add to Home Screen. */
  mountIosInstallHint() {
    if (document.querySelector('.ios-install')) return;
    if (!shouldShowIosInstallHint()) return;

    const el = document.createElement('aside');
    el.className = 'ios-install';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-labelledby', 'ios-install-title');

    const copy = document.createElement('div');
    copy.className = 'ios-install-copy';
    const title = document.createElement('strong');
    title.id = 'ios-install-title';
    const body = document.createElement('p');

    if (isIosSafari()) {
      title.textContent = 'Установить приложение';
      body.append('Нажмите ');
      const icon = document.createElement('span');
      icon.className = 'ios-install-share-wrap';
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = IOS_SHARE_SVG;
      body.append(icon, ' Поделиться, затем «На экран Домой».');
    } else {
      title.textContent = 'Установить приложение';
      body.textContent = 'Иконка на экране появляется только из Safari: Поделиться → На экран «Домой».';
    }

    copy.append(title, body);

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'ios-install-close';
    close.setAttribute('aria-label', 'Закрыть подсказку');
    close.textContent = '×';
    close.addEventListener('click', () => {
      try {
        localStorage.setItem(IOS_INSTALL_DISMISS_KEY, '1');
      } catch {
        /* private mode */
      }
      el.remove();
    });

    el.append(copy, close);
    document.body.appendChild(el);
  }

  syncIosInstallHint() {
    const onHome = this.view === 'home' && Boolean(this.user);
    if (onHome) this.mountIosInstallHint();
    const el = document.querySelector('.ios-install');
    if (!el) return;
    el.hidden = !onHome;
  }

  openUpdates() {
    markChangelogSeen();
    this.changelogUnseen = false;
    this.setView('updates');
  }

  /** Referral link, reminders, and circle notices — needed by home after any login path. */
  async loadUserExtras() {
    await Promise.all([this.loadReferralLink(), this.loadReminderStatus(), this.refreshCircleNotices()]);
  }

  /** Pending circle invites for the home badge. Skips itself if a circle screen fetch is in flight. */
  async refreshCircleNotices() {
    if (!this.user || this.user.needsOnboarding || this.view === 'circle') return;
    const ticket = (this._circleNoticeTicket ?? 0) + 1;
    this._circleNoticeTicket = ticket;
    try {
      const data = await api('/circles');
      if (ticket !== this._circleNoticeTicket || this.view === 'circle') return;
      this.applyCircle(data);
    } catch {
      /* home still works without the badge */
    }
  }

  bumpCircleFetch() {
    this._circleNoticeTicket = (this._circleNoticeTicket ?? 0) + 1;
  }

  unseenCircleInviteCount() {
    const seen = readSeenInviteIds();
    return (this.circleInvites ?? []).filter((invite) => Number.isInteger(invite.id) && !seen.has(invite.id)).length;
  }

  /** Opening the circle screen is enough: the invite has been read. */
  noteCircleInvitesSeen() {
    if (this.view !== 'circle' || this.circleLoading) return;
    const ids = (this.circleInvites ?? []).map((invite) => invite.id).filter((id) => Number.isInteger(id));
    if (!ids.length) return;
    rememberSeenInviteIds(ids);
  }

  setView(view) {
    if (this.view === 'landing' && view !== 'landing') this.stopLandingDeck();
    if (view === 'landing' && this.view !== 'landing') this.landingBenefitIndex = 0;
    this.view = view;
    this.error = '';
    this.overlayWord = null;
    this.overlaySection = null;
    dismissAchievements();
    this.render();
    window.scrollTo(0, 0);
    if (view === 'home') {
      this.flushPendingAchievements();
      void this.refreshCircleNotices().then(() => {
        if (this.view === 'home') this.render();
      });
    }
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
      if (this.user?.cefrLevel) this.cefrLevel = this.user.cefrLevel;
      if (this.user?.langPair) this.langPair = normalizeLangPair(this.user.langPair);
      this.cefrLevel = clampCefrToPair(this.cefrLevel, this.langPair);
      this.view = this.user.needsOnboarding ? 'onboarding' : 'home';
      if (!this.user.needsOnboarding) await this.loadUserExtras();
    } catch (e) {
      this.error = friendlyError(e.message);
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
      this.error = friendlyError(e.message);
    }
    this.render();
  }

  applyOnboardedProfile(source, fallbackName = '') {
    const name = source?.name ?? fallbackName;
    const goal = source?.goal ?? this.goal;
    const cefrLevel = source?.cefrLevel ?? this.cefrLevel;
    const langPair = normalizeLangPair(source?.langPair ?? this.langPair);
    if (this.user) {
      this.user.needsOnboarding = false;
      if (name) this.user.name = name;
      if (goal) this.user.goal = goal;
      this.user.cefrLevel = cefrLevel;
      this.user.langPair = langPair;
    } else if (source?.id) {
      this.user = source;
      this.user.needsOnboarding = false;
    }
    if (name) this.name = name;
    this.cefrLevel = clampCefrToPair(cefrLevel, langPair);
    this.langPair = langPair;
  }

  async recoverOnboardedUser() {
    try {
      const me = await withTimeout(api('/auth/me'), 5000);
      if (!me || me.needsOnboarding) return false;
      this.user = me;
      this.applyOnboardedProfile(me);
      return true;
    } catch {
      return false;
    }
  }

  async enterHomeAfterOnboarding() {
    this._onboardingBusy = false;
    this.view = 'home';
    try {
      await this.loadUserExtras();
      await this.maybeJoinStoredCircle();
    } catch {
      /* home still opens without the invite row */
    }
    if (this.view === 'home' || this.view === 'circle') this.render();
    this.armGesturePushHeal();
  }

  /** iOS PWAs often kill the in-flight /onboarding response; reopen should not stay on the skeleton. */
  async resumeOnboardingSetup() {
    if (this.view !== 'onboarding-setup') return;
    const recovered = await this.recoverOnboardedUser();
    if (!recovered || this.view !== 'onboarding-setup') return;
    this._onboardingToken += 1;
    this.enterHomeAfterOnboarding();
  }

  async saveOnboarding() {
    if (this._onboardingBusy) return;
    const name = String(this.name ?? '').trim();
    if (!name) {
      this.error = 'Введите имя';
      this.render();
      return;
    }
    this._onboardingBusy = true;
    const token = ++this._onboardingToken;
    this.error = '';
    this.view = 'onboarding-setup';
    this.render();
    const started = Date.now();
    try {
      const result = await withTimeout(
        api('/onboarding', {
          method: 'POST',
          body: { goal: this.goal, cefrLevel: this.cefrLevel, langPair: this.langPair, name },
        }),
        12000,
      );
      if (token !== this._onboardingToken) return;
      track('onboarding_complete');
      this.applyOnboardedProfile(result, name);
    } catch (e) {
      if (token !== this._onboardingToken) return;
      const recovered = await this.recoverOnboardedUser();
      if (token !== this._onboardingToken) return;
      if (!recovered) {
        this.error = e.message === 'timeout' ? 'Не удалось создать кабинет. Попробуйте ещё раз.' : friendlyError(e.message);
        this.view = 'onboarding';
        this._onboardingBusy = false;
        this.render();
        return;
      }
      track('onboarding_complete');
    }
    if (token !== this._onboardingToken) return;
    const wait = 1100 - (Date.now() - started);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    if (token !== this._onboardingToken) return;
    this.enterHomeAfterOnboarding();
  }

  async startSession() {
    this.pendingAchievements = null;
    this.sessionSource = null;
    dismissAchievements();
    this._swipeHalted = false;
    this._swipeFailure = null;
    try {
      const data = await this.takePrefetchedDeck();
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
      this.awaitingNext = false;
      this.levelOffer = data.levelComplete ? data.levelProgress : null;
      this.view = 'session';
      track('session_start');
    } catch (e) {
      this.error = e.message;
    }
    this.render();
  }

  applyCircle(data) {
    this.circle = data?.circle ?? null;
    this.circleSuggestions = data?.suggestions ?? [];
    this.circleReferrals = data?.referrals ?? [];
    this.circleInvites = data?.invites ?? [];
    if (data?.langPair) this.circleLangPair = data.langPair;
  }

  async maybeJoinStoredCircle() {
    const code = takeStoredCircleCode();
    if (!code || !this.user || this.user.needsOnboarding) return;
    this.bumpCircleFetch();
    this.view = 'circle';
    this.circleLoading = true;
    this.circleError = '';
    try {
      this.applyCircle(await api('/circles/join', { method: 'POST', body: { code } }));
      track('circle_join');
    } catch (e) {
      this.circleError = e.message;
      try {
        this.applyCircle(await api('/circles'));
      } catch {
        /* keep the join error */
      }
    }
    this.circleLoading = false;
    this.noteCircleInvitesSeen();
  }

  async openCircle() {
    this.bumpCircleFetch();
    this.circleError = '';
    this.circleCopied = false;
    this.circleLoading = true;
    this.sessionSource = null;
    this.setView('circle');
    try {
      this.applyCircle(await api('/circles'));
    } catch (e) {
      this.circleError = e.message;
    }
    this.circleLoading = false;
    if (this.view === 'circle') {
      this.noteCircleInvitesSeen();
      this.render();
    }
  }

  async createCircle() {
    const name = String(this.circleName ?? '').trim();
    if (name.length < 2) {
      this.circleError = 'Название — от 2 символов';
      this.render();
      return;
    }
    this.circleError = '';
    try {
      this.applyCircle(await api('/circles', { method: 'POST', body: { name } }));
      this.circleName = '';
      track('circle_create');
    } catch (e) {
      this.circleError = e.message;
    }
    this.render();
  }

  async joinCircle(circleId, code) {
    if (code != null && !String(code).trim()) {
      this.circleError = 'Введите код';
      this.render();
      return;
    }
    this.circleError = '';
    try {
      const body = code ? { code } : { circleId: Number(circleId) };
      this.applyCircle(await api('/circles/join', { method: 'POST', body }));
      this.circleCode = '';
      track('circle_join');
    } catch (e) {
      this.circleError = e.message;
    }
    this.render();
  }

  async leaveCircle() {
    if (!confirm('Выйти из кружка?')) return;
    this.circleError = '';
    try {
      this.applyCircle(await api('/circles/leave', { method: 'POST', body: {} }));
    } catch (e) {
      this.circleError = e.message;
    }
    this.render();
  }

  async inviteReferral(userId) {
    this.circleError = '';
    try {
      this.applyCircle(await api('/circles/invite', { method: 'POST', body: { userId: Number(userId) } }));
    } catch (e) {
      this.circleError = e.message;
    }
    this.render();
  }

  async respondToInvite(circleId, accept) {
    this.circleError = '';
    const path = accept ? '/circles/invites/accept' : '/circles/invites/decline';
    try {
      this.applyCircle(await api(path, { method: 'POST', body: { circleId: Number(circleId) } }));
    } catch (e) {
      this.circleError = e.message;
    }
    if (this.view === 'circle') this.noteCircleInvitesSeen();
    this.render();
  }

  async copyCircleLink() {
    const link = this.circle?.inviteLink;
    if (!link || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      this.circleError = 'Не удалось скопировать ссылку';
      this.render();
      return;
    }
    this.circleCopied = true;
    clearTimeout(this.circleCopiedTimer);
    this.circleCopiedTimer = setTimeout(() => {
      this.circleCopied = false;
      this.circleCopiedTimer = null;
      if (this.view === 'circle') this.render();
    }, 1000);
    this.render();
  }

  async startCircleSession() {
    this.pendingAchievements = null;
    dismissAchievements();
    this.circleError = '';
    this._swipeHalted = false;
    this._swipeFailure = null;
    this._deckGen += 1;
    const pendingDeck = this._deckPrefetch;
    this._deckPrefetch = null;
    await this._swipeChain;
    if (pendingDeck) await pendingDeck.promise.catch(() => {});
    try {
      const data = await api('/circles/session', { method: 'POST' });
      if (!data.cards?.length) {
        this.circleError = 'Общих слов пока нет';
        this.view = 'circle';
        this.render();
        return;
      }
      this.sessionSource = 'circle';
      this.sessionId = data.sessionId;
      this.cards = data.cards;
      this.cardIndex = 0;
      this.summary = null;
      this.awaitingNext = false;
      this.levelOffer = null;
      this.view = 'session';
      track('session_start');
    } catch (e) {
      this.sessionSource = null;
      this.circleError = e.message;
      this.view = 'circle';
    }
    this.render();
  }

  renderCircleSkeleton() {
    return `
      <section class="circle-card circle-card-primary circle-skeleton" aria-busy="true" aria-live="polite">
        <span class="sr-only">Загружаю кружок</span>
        <div class="skeleton-bone skeleton-circle-title"></div>
        <div class="skeleton-bone skeleton-circle-meta"></div>
        <div class="skeleton-bone skeleton-circle-btn"></div>
      </section>
      <section class="circle-card circle-skeleton" aria-hidden="true">
        <div class="skeleton-bone skeleton-circle-kicker"></div>
        <div class="skeleton-bone skeleton-circle-row"></div>
        <div class="skeleton-bone skeleton-circle-row short"></div>
      </section>`;
  }

  renderCircleMember() {
    const circle = this.circle;
    const words = circle.sharedPreview ?? [];
    const hint = circle.sharedCount
      ? `${circle.sharedCount} ${this.pluralWords(circle.sharedCount)} уже есть у каждого`
      : 'Общая сессия откроется, когда двое отметят одни и те же слова';
    return `
      <section class="circle-card circle-card-primary">
        <div class="circle-heading">
          <h2 class="circle-title">${esc(circle.name)}</h2>
          <p class="circle-meta">${circle.memberCount} из ${circle.maxMembers}</p>
        </div>
        <button type="button" class="btn btn-primary" data-action="start-circle"${circle.canStart ? '' : ' disabled'}>Сессия по общим словам</button>
        <p class="circle-note">${esc(hint)}</p>
      </section>
      ${this.renderCircleRhythm()}
      ${words.length ? `
      <section class="circle-card">
        <h2 class="circle-kicker">Общие слова</h2>
        <ul class="circle-people">
          ${words.map((word) => `<li><div class="circle-person"><strong>${esc(word.lemma)}</strong><span>${esc(word.translation)}</span></div></li>`).join('')}
        </ul>
      </section>` : ''}
      <section class="circle-card">
        <h2 class="circle-kicker">Участники</h2>
        <ul class="circle-people circle-ranks">
          ${renderRankItems(circle.members)}
        </ul>
      </section>
      ${this.renderCircleInvites()}
      ${this.renderCircleReferrals()}
      <section class="circle-card">
        <h2 class="circle-kicker">Пригласить по ссылке</h2>
        <p class="circle-note">Человек откроет ссылку и войдёт, если учит тот же язык.</p>
        <button type="button" class="btn btn-ghost btn-ghost-border" data-action="copy-circle">${this.circleCopied ? 'Ссылка скопирована' : 'Скопировать приглашение'}</button>
      </section>
      <button type="button" class="btn btn-danger circle-leave" data-action="leave-circle">Выйти из кружка</button>`;
  }

  renderCircleLobby() {
    const suggestions = this.circleSuggestions ?? [];
    const inviteFirst = (this.circleInvites ?? []).length > 0;
    const createPrimary = suggestions.length === 0 && !inviteFirst;
    const create = `
      <section class="circle-card${createPrimary ? ' circle-card-primary' : ''}">
        <h2 class="circle-kicker">Новый кружок</h2>
        <p class="circle-lead">До 8 человек с тем же языком. Общая сессия — по словам, которые уже есть у каждого.</p>
        <form class="card-form">
          <label>Название
            <input name="circleName" maxlength="40" placeholder="Например, утро" value="${esc(this.circleName)}" autocomplete="off">
          </label>
          <button type="button" class="btn ${createPrimary ? 'btn-primary' : 'btn-ghost btn-ghost-border'}" data-action="create-circle">Создать</button>
        </form>
      </section>`;
    const discovery = suggestions.length ? `
      <section class="circle-card${inviteFirst ? '' : ' circle-card-primary'}">
        <h2 class="circle-kicker">Похожий словарь</h2>
        <ul class="circle-people">
          ${suggestions.map((row, index) => `
            <li>
              <div class="circle-person">
                <strong>${esc(row.name)}</strong>
                <span>${row.overlapCount} общих · ${row.overlapPct}% · ${row.memberCount} из ${row.maxMembers}</span>
              </div>
              <button type="button" class="btn ${index === 0 && !inviteFirst ? 'btn-primary' : 'btn-ghost btn-ghost-border'}" data-action="join-circle" data-circle-id="${row.id}">Войти</button>
            </li>`).join('')}
        </ul>
      </section>` : '';
    return `
      ${this.renderCircleInvites()}
      ${discovery || create}
      ${discovery ? create : ''}
      ${this.renderCircleReferrals()}
      <section class="circle-card">
        <h2 class="circle-kicker">Есть код</h2>
        <form class="card-form">
          <label>Код приглашения
            <input name="circleCode" maxlength="16" placeholder="Код из ссылки" value="${esc(this.circleCode)}" autocomplete="off" autocapitalize="off" spellcheck="false">
          </label>
          <button type="button" class="btn btn-ghost btn-ghost-border" data-action="join-code">Войти по коду</button>
        </form>
      </section>
      ${suggestions.length ? '' : '<p class="circle-footnote">Подбор появится, когда ваши слова пересекутся с чужим кружком этого языка.</p>'}`;
  }

  renderCircleInvites() {
    const invites = this.circleInvites ?? [];
    if (!invites.length) return '';
    const busy = Boolean(this.circle);
    return invites.map((invite) => `
      <section class="circle-card circle-card-invite">
        <h2 class="circle-kicker">Вас зовут</h2>
        <p class="circle-lead"><strong>${esc(invite.fromName)}</strong> зовёт в «${esc(invite.circleName)}» · ${invite.memberCount} из ${invite.maxMembers}</p>
        ${busy ? '<p class="circle-note">Сначала выйдите из текущего кружка этого языка.</p>' : ''}
        <div class="circle-actions">
          ${busy ? '' : `<button type="button" class="btn btn-primary" data-action="accept-invite" data-circle-id="${invite.circleId}">Принять</button>`}
          <button type="button" class="btn btn-ghost btn-ghost-border" data-action="decline-invite" data-circle-id="${invite.circleId}">Отклонить</button>
        </div>
      </section>`).join('');
  }

  renderCircleReferrals() {
    const people = this.circleReferrals ?? [];
    if (!people.length) return '';
    const hasCircle = Boolean(this.circle);
    return `
      <section class="circle-card">
        <h2 class="circle-kicker">Пришли по вашей ссылке</h2>
        ${hasCircle ? '' : '<p class="circle-note">Создайте кружок — и можно позвать тех, кто учит тот же язык. Они подтвердят сами.</p>'}
        <ul class="circle-people">
          ${people.map((person) => {
            const row = this.referralRow(person, hasCircle);
            return `<li>
              <div class="circle-person">
                <strong>${esc(person.name)}</strong>
                <span>${esc(row.label)}</span>
              </div>
              ${row.canInvite ? `<button type="button" class="btn btn-ghost btn-ghost-border" data-action="invite-referral" data-user-id="${person.id}">Пригласить</button>` : ''}
            </li>`;
          }).join('')}
        </ul>
      </section>`;
  }

  referralRow(person, hasCircle) {
    const lang = String(person.langLabel || '');
    if (!person.sameLanguage) return { label: lang ? `Учит ${lang.toLowerCase()}` : 'Другой язык', canInvite: false };
    if (person.inThisCircle) return { label: 'В кружке', canInvite: false };
    if (person.inOtherCircle) return { label: 'Уже в другом кружке', canInvite: false };
    if (person.invited) return { label: 'Ждёт ответа', canInvite: false };
    if (!hasCircle) return { label: 'Тот же язык', canInvite: false };
    return { label: 'Тот же язык', canInvite: true };
  }

  renderCircleRhythm() {
    const circle = this.circle;
    if (!circle || circle.memberCount < 2) return '';
    const closed = circle.todayClosed ?? 0;
    const total = circle.memberCount;
    const pct = total ? Math.round((closed / total) * 100) : 0;
    const youClosed = circle.members?.some((member) => member.you && member.closedToday);
    return `
      <section class="circle-card">
        <h2 class="circle-kicker">Сегодня в кружке</h2>
        <p class="circle-lead">${closed} из ${total} уже закрыли день</p>
        <div class="progress-bar rhythm-meter" role="meter" aria-valuenow="${closed}" aria-valuemin="0" aria-valuemax="${total}" aria-label="Сколько человек закрыли день">
          <div class="progress-bar-fill" style="width:${pct}%"></div>
        </div>
        <p class="circle-note">${esc(circleRhythmNote(closed, total, youClosed))}</p>
      </section>`;
  }

  pluralWords(count) {
    const n = Math.abs(count) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return 'слов';
    if (n1 === 1) return 'слово';
    if (n1 >= 2 && n1 <= 4) return 'слова';
    return 'слов';
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
      if (result.langPair) {
        this.langPair = result.langPair;
        if (this.user) this.user.langPair = result.langPair;
      }
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
   * The entrance animation is cleared first so it cannot fight the exit transform.
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
      el.classList.remove('card-enter');
      el.style.animation = 'none';
      el.style.pointerEvents = 'none';
      el.style.transition = 'transform 0.28s ease-in, opacity 0.28s ease-in';
      el.style.transform = `translate(${exitX}px, ${fromY}px) rotate(${off * 22}deg)`;
      el.style.opacity = '0';
      let done = false;
      const started = performance.now();
      const finish = () => {
        if (!done) {
          done = true;
          resolve();
        }
      };
      const onEnd = (event) => {
        if (event.target !== el || event.propertyName !== 'transform') return;
        if (performance.now() - started < 40) return;
        el.removeEventListener('transitionend', onEnd);
        finish();
      };
      el.addEventListener('transitionend', onEnd);
      setTimeout(finish, 340);
    });
  }

  enqueueSwipe(wordId, direction) {
    const swipedAt = new Date().toISOString();
    const sessionId = this.sessionId;
    this._swipeChain = this._swipeChain.then(async () => {
      if (this._swipeHalted) return;
      try {
        await api('/session/swipe', {
          method: 'POST',
          body: { wordId, direction, swipedAt, sessionId },
        });
      } catch (error) {
        this._swipeHalted = true;
        this._swipeFailure = { wordId, error };
        if (!this.swiping) this.applySwipeFailure();
      }
    });
  }

  applySwipeFailure() {
    const failure = this._swipeFailure;
    if (!failure || failure.applied) return;
    failure.applied = true;
    const index = this.cards.findIndex((card) => card.id === failure.wordId);
    this.error = failure.error?.message || 'Не удалось сохранить свайп';
    if (index >= 0) this.cardIndex = index;
    this.view = 'session';
    this.swiping = false;
    this.awaitingNext = false;
    this.cardEnter = false;
    this.drag = { active: false, pointerId: null, startX: 0, startY: 0, x: 0, y: 0 };
    this.endPointerTracking();
    this.render();
  }

  /** Swap the word card in place so the header and buttons do not remount. */
  presentNextCard() {
    const deck = this.root.querySelector('#deck');
    const card = this.currentCard();
    if (!deck || this.overlayWord || this.view !== 'session' || !card) {
      this.render();
      return;
    }
    const progress = this.root.querySelector('.session-header .progress');
    if (progress) progress.textContent = `${this.cardIndex + 1} / ${this.cards.length}`;
    deck.innerHTML = sessionCardHtml(card, true);
    deck.querySelector('#active-card')?.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.cardEnter = false;
    this.prefetchUpcomingAudio();
  }

  async swipe(direction, from = { x: 0, y: 0 }) {
    const card = this.currentCard();
    if (!card || this.swiping || this._swipeHalted || this.view !== 'session') return;
    this.swiping = true;
    this.awaitingNext = false;
    this.drag.active = false;
    this.drag.pointerId = null;
    this.endPointerTracking();
    track(direction === 'left' ? 'swipe_left' : 'swipe_right');
    const wordId = card.id;
    const isLast = this.cardIndex >= this.cards.length - 1;
    this.enqueueSwipe(wordId, direction);
    await this.flyCardOut(direction, from.x, from.y);
    if (this._swipeHalted) {
      this.swiping = false;
      this.applySwipeFailure();
      return;
    }
    this.cardIndex += 1;
    this.drag = { active: false, pointerId: null, startX: 0, startY: 0, x: 0, y: 0 };
    this.cardEnter = true;
    if (isLast) {
      this.overlayWord = null;
      this.overlaySection = null;
      this.swiping = false;
      this.view = 'session-wrapping';
      this.render();
      try {
        await this._swipeChain;
        if (this._swipeHalted) {
          this.applySwipeFailure();
          return;
        }
        this.summary = await api('/session/complete', {
          method: 'POST',
          body: { sessionId: this.sessionId, wordIds: this.cards.map((card) => card.id) },
        });
        if (this.user) {
          this.user.streak = this.summary.streak;
          if (this.summary.lastSessionDate) this.user.lastSessionDate = this.summary.lastSessionDate;
          this.streakRiskOpen = false;
        }
        if (this.summary.levelComplete) this.levelOffer = this.summary.levelProgress;
        track('session_complete');
        this.view = 'summary';
        // Defer celebration until Home: on iOS a full-screen layer + post-swipe
        // missing click made «На главную» need two taps.
        this.pendingAchievements = this.summary.achievements;
      } catch (e) {
        this.error = e.message;
        this.view = 'home';
      }
      this.render();
      return;
    }
    this.swiping = false;
    this.presentNextCard();
  }

  deckCacheKey() {
    return `${normalizeLangPair(this.langPair)}:${this.cefrLevel}`;
  }

  scheduleDeckPrefetch() {
    if (this.view !== 'home' || !this.user || this.user.needsOnboarding) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    const key = this.deckCacheKey();
    if (this._deckPrefetch?.key === key) return;
    const gen = this._deckGen + 1;
    this._deckGen = gen;
    const previous = this._deckPrefetch?.promise || this._swipeChain;
    const promise = previous.catch(() => {}).then(async () => {
      if (this._deckGen !== gen || this.deckCacheKey() !== key || this.view !== 'home') {
        return { ok: false, skipped: true };
      }
      try {
        const data = await api('/session/start', { method: 'POST' });
        if (this._deckGen !== gen) return { ok: false, skipped: true };
        return { ok: true, data };
      } catch (error) {
        return { ok: false, error };
      }
    });
    this._deckPrefetch = { key, gen, promise };
  }

  async takePrefetchedDeck() {
    const key = this.deckCacheKey();
    const pending = this._deckPrefetch;
    if (pending?.key === key) {
      this._deckPrefetch = null;
      const result = await pending.promise;
      if (result?.ok && this.deckCacheKey() === key) return result.data;
    }
    this._deckGen += 1;
    this._deckPrefetch = null;
    await this._swipeChain;
    return api('/session/start', { method: 'POST' });
  }

  warmAudio(text, pair) {
    if (!text) return;
    const tts = LANG_PAIR_META[normalizeLangPair(pair)].tts;
    const cacheKey = `${tts}:${text}`;
    if (this.audioCache.has(cacheKey)) return;
    const audio = new Audio(`/api/tts?q=${encodeURIComponent(text)}&lang=${encodeURIComponent(tts)}`);
    audio.preload = 'auto';
    this.audioCache.set(cacheKey, audio);
  }

  prefetchUpcomingAudio() {
    if (this.view !== 'session') return;
    const pair = normalizeLangPair(this.langPair);
    const upcoming = [this.currentCard(), this.cards[this.cardIndex + 1]];
    for (const card of upcoming) {
      if (card?.lemma) this.warmAudio(card.lemma, card.langPair || pair);
    }
  }

  speak(text) {
    if (!text) return;
    track('tap_audio');
    window.speechSynthesis?.cancel();
    const pair = normalizeLangPair(this.overlayWord?.langPair || this.langPair);
    this.playNativeAudio(text, pair).catch(() => this.speakWithBrowserTts(text, pair));
  }

  playNativeAudio(text, pair = this.langPair) {
    const tts = LANG_PAIR_META[normalizeLangPair(pair)].tts;
    const cacheKey = `${tts}:${text}`;
    return new Promise((resolve, reject) => {
      let audio = this.audioCache.get(cacheKey);
      if (!audio) {
        audio = new Audio(`/api/tts?q=${encodeURIComponent(text)}&lang=${encodeURIComponent(tts)}`);
        audio.preload = 'auto';
        this.audioCache.set(cacheKey, audio);
      }
      const fail = () => {
        this.audioCache.delete(cacheKey);
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

  speakWithBrowserTts(text, pair = this.langPair) {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANG_PAIR_META[normalizeLangPair(pair)].ttsBcp;
    window.speechSynthesis.speak(u);
  }

  openOverlay() {
    this.overlayWord = this.currentCard();
    this.overlaySection = null;
    this.overlayEnter = true;
    track('tap_translation');
    this.render();
  }

  closeOverlay() {
    this.overlayWord = null;
    this.overlaySection = null;
    this.overlayEnter = false;
    this.render();
  }

  rateAssociation(vote) {
    const word = this.overlayWord;
    if (!word?.association || (vote !== 'up' && vote !== 'down')) return;
    const prev = this.associationVotes.get(word.id) ?? null;
    const next = prev === vote ? null : vote;
    this.associationVotes.set(word.id, next);
    this.syncAssociationVote();
    api('/associations/rate', { method: 'POST', body: { wordId: word.id, vote: next } }).catch(() => {
      if (prev) this.associationVotes.set(word.id, prev);
      else this.associationVotes.delete(word.id);
      this.syncAssociationVote();
    });
  }

  syncAssociationVote() {
    const vote = this.associationVotes.get(this.overlayWord?.id) ?? null;
    for (const btn of this.root.querySelectorAll('[data-action="rate-association"]')) {
      const on = btn.dataset.vote === vote;
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.classList.toggle('is-on', on);
    }
  }

  toggleOverlaySection(section) {
    this.overlaySection = this.overlaySection === section ? null : section;
    if (this.overlaySection) track(`overlay_${this.overlaySection}`);
    // Update in place so the panel does not remount / replay slideUp.
    this.syncOverlaySection();
  }

  /** Expand/collapse examples & forms without re-rendering the whole overlay. */
  syncOverlaySection() {
    const panel = this.root.querySelector('.overlay-panel');
    const w = this.overlayWord;
    if (!panel || !w) return;

    const examples = Array.isArray(w.examples) ? w.examples : [];
    const forms = Array.isArray(w.forms) ? w.forms : [];
    const section = this.overlaySection;

    panel.querySelectorAll('.overlay-actions [data-action]').forEach((btn) => {
      const active =
        (btn.dataset.action === 'overlay-examples' && section === 'examples') ||
        (btn.dataset.action === 'overlay-forms' && section === 'forms');
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-expanded', active ? 'true' : 'false');
    });

    const slot = panel.querySelector('.overlay-section-slot');
    const inner = panel.querySelector('.overlay-section-slot-inner');
    if (!slot || !inner) return;

    if (!section) {
      slot.classList.remove('is-open');
      const clear = () => {
        if (!this.overlaySection) inner.innerHTML = '';
      };
      const onEnd = (e) => {
        if (e.target !== slot || e.propertyName !== 'grid-template-rows') return;
        slot.removeEventListener('transitionend', onEnd);
        clear();
      };
      slot.addEventListener('transitionend', onEnd);
      setTimeout(clear, 350);
      return;
    }

    const html =
      section === 'examples'
        ? renderExamplesSection(examples)
        : section === 'forms'
          ? renderFormsSection(forms, w.langPair)
          : '';
    const wasOpen = slot.classList.contains('is-open');
    inner.innerHTML = html;
    if (wasOpen) {
      slot.classList.add('is-open');
      return;
    }
    slot.classList.remove('is-open');
    void slot.offsetHeight;
    requestAnimationFrame(() => {
      slot.classList.add('is-open');
    });
  }

  async loadStats() {
    if (this.view === 'stats-loading') return;
    this.error = '';
    this.view = 'stats-loading';
    this.render();
    try {
      this.stats = await api('/stats');
      if (this.stats.levelProgress?.complete && this.stats.levelProgress.nextCefrLevel) {
        this.levelOffer = this.stats.levelProgress;
      }
      if (this.view === 'stats-loading') this.view = 'stats';
    } catch (e) {
      this.error = e.message;
      if (this.view === 'stats-loading') this.view = 'home';
    }
    this.render();
  }

  async openRanks() {
    if (this.view === 'ranks-loading') return;
    this.ranksError = '';
    this.view = 'ranks-loading';
    this.render();
    try {
      this.ranks = await api('/ranks');
      if (this.view === 'ranks-loading') this.view = 'ranks';
    } catch (e) {
      this.ranks = null;
      this.ranksError = e.message;
      if (this.view === 'ranks-loading') this.view = 'ranks';
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
    if (!this.referralLink || !navigator.clipboard?.writeText) {
      this.render();
      return;
    }
    try {
      await navigator.clipboard.writeText(this.referralLink);
    } catch {
      this.render();
      return;
    }
    track('referral_share');
    this.referralCopied = true;
    clearTimeout(this.referralCopiedTimer);
    this.referralCopiedTimer = setTimeout(() => {
      this.referralCopied = false;
      this.referralCopiedTimer = null;
      if (this.view === 'home') this.render();
    }, 1000);
    this.render();
  }

  // --- Study reminders ---

  async loadReminderStatus() {
    const local = readReminderPref();
    // Warm the VAPID key before any Enable tap so subscribe stays in-gesture.
    void this.prefetchVapidPublicKey();
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
    if (!this.reminderNeedsGestureHeal || this.gestureHealArmed) return;
    this.gestureHealArmed = true;
    const retry = () => {
      document.removeEventListener('pointerup', retry, true);
      this.gestureHealArmed = false;
      // Keep reminderNeedsGestureHeal until pushSubscribe succeeds so a failed
      // tap can re-arm instead of silently giving up after one attempt.
      this.pushSubscribe({ interactive: false });
    };
    document.addEventListener('pointerup', retry, { once: true, capture: true });
  }

  async prefetchVapidPublicKey() {
    if (this.vapidPublicKey) return this.vapidPublicKey;
    try {
      const config = await api('/push/config');
      this.vapidPublicKey = config.publicKey;
      return this.vapidPublicKey;
    } catch {
      return null;
    }
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
    // Prefer a cached VAPID key so subscribe() stays inside the user-gesture
    // window on iOS (awaiting /push/config first often burns activation).
    let publicKey = this.vapidPublicKey;
    if (!publicKey) {
      const config = await api('/push/config');
      publicKey = config.publicKey;
      this.vapidPublicKey = publicKey;
    }
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
    await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    // Only rotate when WebKit exposes the key AND it disagrees. An empty key
    // must not unsubscribe — that killed live Apple endpoints after 8c03b34.
    if (subscription && !this.sameVapidKey(subscription, publicKey)) {
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
        applicationServerKey: urlB64ToUint8Array(publicKey),
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
    // A failed silent heal must not re-render Settings. On iOS Safari (not PWA)
    // PushManager rejects in a microtask; replacing innerHTML then drops the
    // tap's click, so every control on the page looks dead.
    if (interactive || (this.view === 'settings' && !this.reminderNeedsGestureHeal)) {
      this.render();
    }
    if (this.reminderNeedsGestureHeal) this.armGesturePushHeal();
  }

  cancelPendingReminderSave() {
    clearTimeout(this.reminderSaveTimer);
    this.reminderSaveTimer = null;
    this.reminderSaveQueued = false;
    this.reminderSaveInteractiveQueued = false;
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

  async saveStudyPrefs() {
    this.settingsError = '';
    this.settingsErrorSource = '';
    this.cefrLevel = clampCefrToPair(this.cefrLevel, this.langPair);
    try {
      const result = await api('/profile', {
        method: 'PATCH',
        body: { cefrLevel: this.cefrLevel, langPair: this.langPair },
      });
      this.cefrLevel = result.cefrLevel;
      this.langPair = normalizeLangPair(result.langPair ?? this.langPair);
      if (this.user) {
        this.user.cefrLevel = result.cefrLevel;
        this.user.langPair = this.langPair;
      }
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
      this.settingsErrorSource = 'prefs';
    }
    this.render();
  }

  async saveCefr() {
    return this.saveStudyPrefs();
  }

  flashNameSaved() {
    const hint = this.root.querySelector('[data-name-saved]');
    if (!hint) return;
    hint.hidden = false;
    clearTimeout(this.nameSavedTimer);
    this.nameSavedTimer = setTimeout(() => {
      const el = this.root.querySelector('[data-name-saved]');
      if (el) el.hidden = true;
    }, 1600);
  }

  async saveNameIfChanged() {
    const name = String(this.name ?? '').trim();
    const current = String(this.user?.name ?? '').trim();
    if (!name) {
      this.name = current;
      const input = this.root.querySelector('input[name="displayName"]');
      if (input) input.value = current;
      if (!current) {
        this.settingsError = 'Введите имя';
        this.settingsErrorSource = 'name';
        this.render();
      }
      return;
    }
    if (name === current) return;
    await this.saveName({ quiet: true });
  }

  async saveName({ quiet = false } = {}) {
    this.settingsError = '';
    this.settingsErrorSource = '';
    const name = String(this.name ?? '').trim();
    if (!name) {
      this.settingsError = 'Введите имя';
      this.settingsErrorSource = 'name';
      this.render();
      return;
    }
    try {
      const result = await api('/profile', { method: 'PATCH', body: { name } });
      if (this.user) this.user.name = result.name;
      this.name = result.name ?? name;
      if (quiet) {
        this.flashNameSaved();
        return;
      }
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
      this.settingsErrorSource = 'name';
    }
    this.render();
  }

  async resetProgress() {
    if (!confirm('Сбросить статистику и прогресс? Streak, изученные слова и сессии будут удалены. Это действие нельзя отменить.')) return;
    try {
      await api('/profile/reset-progress', { method: 'POST' });
      if (this.user) {
        this.user.streak = 0;
        this.user.lastSessionDate = null;
      }
      this.streakRiskOpen = false;
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
    this._deckGen += 1;
    const pendingDeck = this._deckPrefetch;
    this._deckPrefetch = null;
    if (pendingDeck) await pendingDeck.promise.catch(() => {});
    await api('/auth/logout', { method: 'POST' });
    this.cancelPendingReminderSave();
    this.user = null;
    this.referralLink = '';
    this.referralCopied = false;
    clearTimeout(this.referralCopiedTimer);
    this.referralCopiedTimer = null;
    this.reminder = { enabled: false };
    this.landingBenefitIndex = 0;
    this.view = 'landing';
    this.render();
  }

  exitSession() {
    this.cards = [];
    this.cardIndex = 0;
    this.sessionId = null;
    this.summary = null;
    this.overlayWord = null;
    this.overlaySection = null;
    this.swiping = false;
    this.awaitingNext = false;
    this.cardEnter = false;
    this.drag = { active: false, pointerId: null, startX: 0, startY: 0, x: 0, y: 0 };
    this.endPointerTracking();
    if (this.sessionSource === 'circle') {
      this.sessionSource = null;
      this.openCircle();
      return;
    }
    this.setView('home');
  }

  async deleteAccount() {
    if (!confirm('Удалить аккаунт безвозвратно? Весь прогресс будет потерян.')) return;
    try {
      await api('/account', { method: 'DELETE' });
      this.user = null;
      this.stats = null;
      this.summary = null;
      this.landingBenefitIndex = 0;
      this.view = 'landing';
    } catch (e) {
      this.error = e.message;
    }
    this.render();
  }

  onPointerDown(e) {
    if (this.view !== 'session' || this.overlayWord || this.swiping) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    // Drop a leftover spring-back or entrance animation so dragging follows the finger 1:1.
    e.currentTarget.classList.remove('card-enter');
    e.currentTarget.style.animation = 'none';
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
    if (this.view === 'landing') {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.advanceLandingBenefit('left');
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.advanceLandingBenefit('right');
      }
      return;
    }
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

  landingBenefitsList() {
    return landingBenefits(this.publicStats.sessionSize ?? 18);
  }

  prefersReducedMotion() {
    return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
  }

  clearLandingAuto() {
    clearTimeout(this._landingAutoTimer);
    this._landingAutoTimer = null;
  }

  scheduleLandingAuto() {
    this.clearLandingAuto();
    if (this.view !== 'landing' || this.prefersReducedMotion() || document.hidden) return;
    this._landingAutoTimer = setTimeout(() => {
      this.advanceLandingBenefit('left', { auto: true });
    }, 3800);
  }

  stopLandingDeck() {
    this.clearLandingAuto();
    this.endLandingPointerTracking();
    this._landingSwiping = false;
    this._landingDrag = { active: false, pointerId: null, startX: 0, startY: 0, x: 0, y: 0 };
  }

  mountLandingDeck() {
    this.bindLandingCard();
    this.scheduleLandingAuto();
  }

  bindLandingCard() {
    const card = this.root.querySelector('#landing-active-card');
    if (!card) return;
    card.addEventListener('pointerdown', (e) => this.onLandingPointerDown(e));
  }

  endLandingPointerTracking() {
    window.removeEventListener('pointermove', this._onLandingPointerMove);
    window.removeEventListener('pointerup', this._onLandingPointerUp);
    window.removeEventListener('pointercancel', this._onLandingPointerUp);
  }

  syncLandingDots() {
    const dots = this.root.querySelectorAll('.landing-dots span');
    dots.forEach((el, i) => el.classList.toggle('is-on', i === this.landingBenefitIndex));
  }

  landingNextIndex() {
    const n = this.landingBenefitsList().length;
    if (!n) return 0;
    return (this.landingBenefitIndex + 1) % n;
  }

  paintLandingDeck() {
    const deck = this.root.querySelector('.landing-deck');
    if (!deck || this.view !== 'landing') return;
    const list = this.landingBenefitsList();
    const current = list[this.landingBenefitIndex] || list[0];
    const next = list[this.landingNextIndex()] || current;
    deck.querySelector('#landing-peek-card')?.remove();
    deck.querySelector('#landing-active-card')?.remove();
    deck.insertAdjacentHTML('beforeend', landingPeekCardHtml(next) + landingBenefitCardHtml(current));
    this.bindLandingCard();
    this.syncLandingDots();
  }

  promoteLandingPeek() {
    const deck = this.root.querySelector('.landing-deck');
    const peek = deck?.querySelector('#landing-peek-card');
    const gone = deck?.querySelector('#landing-active-card');
    if (!deck || !peek) {
      this.paintLandingDeck();
      return;
    }
    const list = this.landingBenefitsList();
    const current = list[this.landingBenefitIndex] || list[0];
    gone?.remove();
    peek.id = 'landing-active-card';
    peek.classList.remove('landing-benefit-peek');
    peek.classList.add('landing-benefit-card');
    peek.removeAttribute('aria-hidden');
    peek.tabIndex = 0;
    peek.setAttribute('role', 'group');
    peek.setAttribute('aria-label', `${current.title}. ${current.subtitle}`);
    const next = list[this.landingNextIndex()] || current;
    peek.insertAdjacentHTML('beforebegin', landingPeekCardHtml(next));
    this.bindLandingCard();
    this.syncLandingDots();
  }

  flyLandingCardOut(direction, fromX = 0, fromY = 0) {
    return new Promise((resolve) => {
      const el = this.root.querySelector('#landing-active-card');
      if (!el || this.prefersReducedMotion()) return resolve();
      const off = direction === 'left' ? -1 : 1;
      const exitX = off * (Math.abs(fromX) + 220);
      el.style.pointerEvents = 'none';
      el.style.transition = 'transform 0.28s ease-in';
      el.style.transform = `translate(${exitX}px, ${fromY}px) rotate(${off * 18}deg)`;
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

  async advanceLandingBenefit(direction, { auto = false, from = { x: 0, y: 0 } } = {}) {
    if (this.view !== 'landing' || this._landingSwiping) return;
    if (auto && this._landingDrag.active) {
      this.scheduleLandingAuto();
      return;
    }
    this._landingSwiping = true;
    this.clearLandingAuto();
    this.endLandingPointerTracking();
    this._landingDrag.active = false;
    if (!this.prefersReducedMotion()) {
      await this.flyLandingCardOut(direction, from.x, from.y);
    }
    const n = this.landingBenefitsList().length;
    this.landingBenefitIndex = (this.landingBenefitIndex + (direction === 'left' ? 1 : n - 1)) % n;
    this._landingSwiping = false;
    if (this.view !== 'landing') return;
    if (this.prefersReducedMotion() || direction === 'right') this.paintLandingDeck();
    else this.promoteLandingPeek();
    this.scheduleLandingAuto();
  }

  onLandingPointerDown(e) {
    if (this.view !== 'landing' || this._landingSwiping) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.currentTarget.style.transition = '';
    this.clearLandingAuto();
    this._landingDrag = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      x: 0,
      y: 0,
    };
    window.addEventListener('pointermove', this._onLandingPointerMove);
    window.addEventListener('pointerup', this._onLandingPointerUp);
    window.addEventListener('pointercancel', this._onLandingPointerUp);
  }

  onLandingPointerMove(e) {
    if (!this._landingDrag.active || e.pointerId !== this._landingDrag.pointerId) return;
    this._landingDrag.x = e.clientX - this._landingDrag.startX;
    this._landingDrag.y = e.clientY - this._landingDrag.startY;
    const card = this.root.querySelector('#landing-active-card');
    if (card) {
      const rot = this._landingDrag.x * 0.08;
      card.style.transform = `translate(${this._landingDrag.x}px, ${this._landingDrag.y}px) rotate(${rot}deg)`;
    }
  }

  async onLandingPointerUp(e) {
    if (!this._landingDrag.active || e.pointerId !== this._landingDrag.pointerId) return;
    const { x, y } = this._landingDrag;
    this._landingDrag.active = false;
    this._landingDrag.pointerId = null;
    this.endLandingPointerTracking();
    if (x < -80 || x > 80) {
      await this.advanceLandingBenefit(x < -80 ? 'left' : 'right', { from: { x, y } });
      return;
    }
    const card = this.root.querySelector('#landing-active-card');
    if (card) {
      card.style.transition = 'transform 0.2s ease-out';
      card.style.transform = '';
      setTimeout(() => {
        if (card.isConnected) card.style.transition = '';
      }, 220);
    }
    this.scheduleLandingAuto();
  }

  /**
   * After a swipe, iOS often never synthesizes `click` for the next tap.
   * Summary CTAs therefore run on pointerup; a short click-capture suppress
   * stops the late ghost-click from hitting the newly rendered Home button.
   */
  onSummaryPointerUp(e) {
    if ((this.view !== 'summary' && this.view !== 'level-up') || this._summaryTapHandled) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const t = e.target.closest('[data-action="home"], [data-action="start"], [data-action="start-circle"], [data-action="open-circle"], [data-action="level-up"], [data-action="dismiss-level-up"]');
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
    else if (t.dataset.action === 'open-circle') this.openCircle();
    else if (t.dataset.action === 'level-up') this.acceptLevelUp();
    else if (t.dataset.action === 'dismiss-level-up') this.dismissLevelUp();
    else if (t.dataset.action === 'start-circle') this.startCircleSession();
    else this.startSession();
  }

  bindEvents() {
    this.root.onsubmit = (e) => e.preventDefault();
    this.root.onclick = (e) => {
      if (Date.now() < this._suppressClickUntil) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const infoLink = e.target.closest('a[href*="/help/faq.html"], a[href*="/legal/"]');
      if (infoLink && this.view === 'settings') {
        try {
          sessionStorage.setItem('langapp.returnView', 'settings');
        } catch {
          /* private mode */
        }
      }
      const inStreak = e.target.closest('.streak-badge-wrap');
      const closedStreakNote = this.streakRiskOpen && !inStreak;
      if (closedStreakNote) this.streakRiskOpen = false;
      const t = e.target.closest('[data-action]');
      if (!t) {
        if (closedStreakNote) this.render();
        return;
      }
      const action = t.dataset.action;
      // Already handled in onSummaryPointerUp (iOS post-swipe path).
      if (this._summaryTapHandled && (action === 'home' || action === 'start' || action === 'start-circle' || action === 'open-circle' || action === 'level-up' || action === 'dismiss-level-up')) return;
      if (action === 'show-login') {
        this.authMode = 'login';
        this.setView('auth');
      }
      if (action === 'show-register') {
        track('landing_cta_click');
        this.authMode = 'register';
        this.setView('auth');
      }
      if (action === 'landing') {
        this.error = '';
        this.setView('landing');
      }
      if (action === 'login') this.login();
      if (action === 'register') this.register();
      if (action === 'onboarding') this.saveOnboarding();
      if (action === 'start') this.startSession();
      if (action === 'start-circle') this.startCircleSession();
      if (action === 'open-circle') this.openCircle();
      if (action === 'create-circle') this.createCircle();
      if (action === 'join-circle') this.joinCircle(t.dataset.circleId);
      if (action === 'join-code') this.joinCircle(null, this.circleCode);
      if (action === 'leave-circle') this.leaveCircle();
      if (action === 'copy-circle') this.copyCircleLink();
      if (action === 'invite-referral') this.inviteReferral(t.dataset.userId);
      if (action === 'accept-invite') this.respondToInvite(t.dataset.circleId, true);
      if (action === 'decline-invite') this.respondToInvite(t.dataset.circleId, false);
      if (action === 'level-up') this.acceptLevelUp();
      if (action === 'dismiss-level-up') this.dismissLevelUp();
      if (action === 'stats') this.loadStats();
      if (action === 'open-ranks') this.openRanks();
      if (action === 'settings') this.setView('settings');
      if (action === 'updates') this.openUpdates();
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
      if (action === 'rate-association') this.rateAssociation(t.dataset.vote);
      if (action === 'speak') this.speak(this.overlayWord?.lemma);
      if (action === 'overlay-examples') this.toggleOverlaySection('examples');
      if (action === 'overlay-forms') this.toggleOverlaySection('forms');
      if (action === 'swipe-left') this.swipe('left');
      if (action === 'swipe-right') this.swipe('right');
      if (action === 'copy-referral') this.copyReferral();
      if (action === 'streak-risk') {
        this.streakRiskOpen = !this.streakRiskOpen;
        this.render();
      }
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
      if (name === 'theme' && this.view === 'settings') {
        setThemePreference(value);
        return;
      }
      if (name === 'langPair') {
        this.langPair = normalizeLangPair(value);
        this.cefrLevel = clampCefrToPair(this.cefrLevel, this.langPair);
        if (this.view === 'settings') this.saveStudyPrefs();
        else this.render();
        return;
      }
      if (name === 'cefrLevel' && this.view === 'settings') {
        this.cefrLevel = value;
        this.saveCefr();
        return;
      }
      if (name === 'displayName') {
        this.name = value;
        return;
      }
      if (name in this) this[name] = value;
    };

    this.root.onchange = (e) => {
      const { name, value } = e.target;
      if (name === 'theme' && this.view === 'settings') setThemePreference(value);
    };

    this.root.onfocusout = (e) => {
      if (this.view === 'settings' && e.target?.name === 'displayName') this.saveNameIfChanged();
    };

    this.root.onkeydown = (e) => {
      if (this.view === 'onboarding' && e.key === 'Enter' && e.target.name === 'displayName') {
        e.preventDefault();
        this.saveOnboarding();
        return;
      }
      if (this.view === 'settings' && e.key === 'Enter' && e.target.name === 'displayName') {
        e.preventDefault();
        e.target.blur();
        return;
      }
      this.onKeyDown(e);
    };

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
      html += '';
    } else if (v === 'landing') {
      const sessionSize = this.publicStats.sessionSize ?? 18;
      const benefits = landingBenefits(sessionSize);
      const benefit = benefits[this.landingBenefitIndex] || benefits[0];
      const peek = benefits[(this.landingBenefitIndex + 1) % benefits.length] || benefit;
      html += `
        <div class="landing">
          <section class="hero">
            <h1>Учи языки свайпом</h1>
            <p>Турецкий, английский или испанский — с переводом на русский.</p>
          </section>
          <section class="landing-langs" aria-label="Словари">
            ${landingLangBenefits(this.publicStats)}
          </section>
          <div class="landing-main">
            <div class="landing-start">
              <div class="home-deck landing-deck" role="region" aria-roledescription="карусель" aria-label="Как устроено приложение">
                <span class="home-deck-layer is-left" aria-hidden="true"></span>
                <span class="home-deck-layer is-right" aria-hidden="true"></span>
                <span class="landing-deck-shadow" aria-hidden="true"></span>
                ${landingPeekCardHtml(peek)}
                ${landingBenefitCardHtml(benefit)}
              </div>
              ${landingDotsHtml(this.landingBenefitIndex, benefits.length)}
              <p class="landing-how">Влево — знаю, вправо — учу</p>
              <button type="button" class="btn btn-primary btn-lg" data-action="show-register">Начать бесплатно</button>
            </div>
            <div class="landing-cta">
              <p class="subcta">Без карты · быстрая регистрация</p>
              <button type="button" class="link-btn" data-action="show-login">Уже есть аккаунт</button>
            </div>
          </div>
          <p class="footer-links">
            <a href="/help/faq.html">FAQ</a>
            · <a href="${SUPPORT_TELEGRAM_URL}" target="_blank" rel="noopener noreferrer">Поддержка</a>
            · <a href="/legal/privacy.html">Конфиденциальность</a>
            · <a href="/legal/terms.html">Условия</a>
          </p>
        </div>`;
    } else if (v === 'auth') {
      html += `
        ${pageBar({
          title: this.authMode === 'login' ? 'Вход' : 'Регистрация',
          backAction: 'landing',
          backLabel: 'На экран приветствия',
        })}
        <form class="card-form" autocomplete="on">
          <label>Email<input name="email" type="email" value="${esc(this.email)}" autocomplete="username" inputmode="email" /></label>
          <label>Пароль<input name="password" type="password" value="${esc(this.password)}" autocomplete="${this.authMode === 'login' ? 'current-password' : 'new-password'}" /></label>
          ${this.error ? `<p class="error">${esc(this.error)}</p>` : ''}
          <button type="button" class="btn btn-primary" data-action="${this.authMode}">${this.authMode === 'login' ? 'Войти' : 'Создать аккаунт'}</button>
          <p class="auth-switch">
            <button type="button" class="link-btn" data-action="${this.authMode === 'login' ? 'show-register' : 'show-login'}">${this.authMode === 'login' ? 'Создать аккаунт' : 'Войти'}</button>
          </p>
        </form>`;
    } else if (v === 'onboarding') {
      html += `
        ${pageBar({
          title: 'Настройка',
          subtitle: 'Коротко — и к первой сессии',
        })}
        <form class="card-form" autocomplete="off">
          ${accountUsernameField(this.email || this.user?.email)}
          <label>Имя
            ${nameFieldHtml(this.name)}
          </label>
          <label>Язык
            <select name="langPair">
              ${langPairOptions(this.langPair)}
            </select>
          </label>
          <label>Цель
            <select name="goal">
              ${opt('travel', 'Путешествия', this.goal)}
              ${opt('work', 'Работа', this.goal)}
              ${opt('exam', 'Экзамен', this.goal)}
            </select>
          </label>
          <label>Уровень
            <select name="cefrLevel">
              ${cefrOptions(this.cefrLevel, this.langPair)}
            </select>
          </label>
          ${this.error ? `<p class="error">${esc(this.error)}</p>` : ''}
          <button type="button" class="btn btn-primary" data-action="onboarding"${this._onboardingBusy ? ' disabled' : ''}>Продолжить</button>
          <p class="settings-hint onboarding-install">📲 Совет: установите LangSwipe как приложение — инструкция для <a href="/help/faq.html#install" target="_blank" rel="noopener">iPhone и Android — в FAQ</a>.</p>
        </form>`;
    } else if (v === 'onboarding-setup') {
      html += `
        ${pageBar({
          title: 'Кабинет создаётся',
          subtitle: 'Ещё секунда — и можно свайпать',
        })}
        <div class="setup-wait" aria-busy="true" aria-live="polite">
          <div class="setup-preview" aria-hidden="true">
            <div class="skeleton-home-bar">
              <div class="skeleton-home-copy">
                <div class="skeleton-bone skeleton-home-title"></div>
                <div class="skeleton-bone skeleton-home-sub"></div>
              </div>
              <div class="skeleton-bone skeleton-home-badge"></div>
            </div>
            <div class="skeleton-home-start">
              <div class="skeleton-home-deck-wrap">
                <div class="skeleton-bone skeleton-home-deck-layer"></div>
                <div class="skeleton-bone skeleton-home-deck"></div>
              </div>
              <div class="skeleton-bone skeleton-home-btn"></div>
            </div>
            <div class="skeleton-home-nav">
              <div class="skeleton-bone skeleton-home-btn ghost"></div>
              <div class="skeleton-bone skeleton-home-btn ghost"></div>
            </div>
          </div>
          <ul class="setup-tips">
            <li>
              <strong>Никакой рутины — всего 5 минут в день</strong>
              <span>18 карточек, затем стоп. Без бесконечной ленты.</span>
            </li>
            <li>
              <strong>Установите на рабочий стол</strong>
              <span>Так проще возвращаться каждый день. Инструкция — в FAQ.</span>
            </li>
            <li>
              <strong>Не забудьте добавить напоминание</strong>
              <span>Пуш в удобное время — в настройках, после первой сессии.</span>
            </li>
          </ul>
        </div>`;
    } else if (v === 'home') {
      const sessionSize = this.publicStats.sessionSize ?? 18;
      const langLabel = LANG_PAIR_META[normalizeLangPair(this.langPair)].label;
      html += `
        <div class="home">
          <header class="home-bar">
            <div class="home-bar-copy">
              <h1>${this.user?.name ? `Привет, ${esc(this.user.name)}!` : 'Привет!'}</h1>
              <p>${esc(langLabel)} · ${esc(this.cefrLevel)}</p>
            </div>
            ${this.streakBadgeHtml(false)}
          </header>
          ${this.homeRhythmHtml()}
          ${this.error ? `<p class="error home-error">${esc(this.error)}</p>` : ''}
          <div class="home-main">
            <button type="button" class="home-start-card" data-action="start" aria-label="Начать сессию">
              <span class="home-deck" aria-hidden="true">
                <span class="home-deck-layer is-left"></span>
                <span class="home-deck-layer is-right"></span>
                <span class="home-deck-front">
                  <span class="home-deck-facts">${sessionSize} слов</span>
                  <span class="home-deck-time">около 5 минут</span>
                </span>
              </span>
              <span class="btn btn-primary home-start-label">Начать сессию</span>
            </button>
            <nav class="home-nav" aria-label="Кабинет">
              <button type="button" class="btn btn-ghost" data-action="stats">Статистика</button>
              ${this.homeNavButton('open-circle', 'Кружок', this.unseenCircleInviteCount(), (count) => `${count} ${pluralRu(count, 'новое приглашение', 'новых приглашения', 'новых приглашений')}`)}
              ${this.homeNavButton('settings', 'Настройки', this.changelogUnseen ? 1 : 0, () => 'есть обновление')}
            </nav>
          </div>
          ${this.referralLink ? `
          <div class="referral-box">
            <div class="referral-copy">
              <p class="referral-title">Пригласи друга</p>
              <p class="referral-muted">Поделись ссылкой — учите вместе</p>
            </div>
            <button class="btn btn-primary" data-action="copy-referral" aria-live="polite">${this.referralCopied ? 'Ссылка скопирована' : 'Скопировать ссылку'}</button>
            ${this.user?.referralsCount ? `<p class="referral-muted">${this.user.referralsCount} приглашённых</p>` : ''}
          </div>` : ''}
          <p class="home-support">
            <a href="/help/faq.html?from=home">FAQ</a>
          </p>
          </div>`;
    } else if (v === 'circle') {
      const langLabel = LANG_PAIR_META[normalizeLangPair(this.circleLangPair || this.langPair)].label;
      html += `
        ${pageBar({ title: 'Кружок', subtitle: esc(langLabel), backAction: 'home' })}
        <div class="circle-screen">
          ${this.circleError ? `<p class="error">${esc(this.circleError)}</p>` : ''}
          ${this.circleLoading ? this.renderCircleSkeleton() : this.circle ? this.renderCircleMember() : this.renderCircleLobby()}
        </div>`;
    } else if (v === 'session') {
      const card = this.currentCard();
      const progressNum = this.awaitingNext
        ? Math.min(this.cardIndex + 2, this.cards.length)
        : this.cardIndex + 1;
      html += `
        <div class="session-header">
          <button class="session-exit" data-action="exit-session" title="Выйти из сессии" aria-label="Выйти из сессии">✕</button>
          <span class="progress">${progressNum} / ${this.cards.length}</span>
          ${this.streakBadgeHtml(true)}
        </div>
        ${this.error ? `<p class="error">${esc(this.error)}</p>` : ''}
        <div class="deck-area" id="deck">
          ${this.awaitingNext ? `
          <div class="word-card word-card-skeleton" aria-busy="true" aria-label="Загрузка карточки">
            <div class="skeleton-bone skeleton-lemma"></div>
            <div class="skeleton-bone skeleton-hint"></div>
          </div>` : card ? sessionCardHtml(card, this.cardEnter) : ''}
        </div>
        <div class="swipe-hints">
          <span>← Знаю</span>
          <span>Учу →</span>
        </div>
        <div style="display:flex;gap:0.5rem;margin-top:1rem">
          <button class="btn btn-ghost" data-action="swipe-left" style="flex:1" ${this.swiping ? 'disabled' : ''}>← Знаю</button>
          <button class="btn btn-primary" data-action="swipe-right" style="flex:1" ${this.swiping ? 'disabled' : ''}>Учу →</button>
        </div>`;
    } else if (v === 'session-wrapping') {
      html += `
        <div class="screen-result">
          <div class="summary-card summary-wrapping" aria-busy="true" aria-live="polite">
            <div class="skeleton-bone skeleton-summary-title"></div>
            <p class="wrapping-copy">Подвожу итоги сессии…</p>
            <div class="stat-grid">
              <div class="stat-box skeleton-stat"><div class="skeleton-bone skeleton-stat-num"></div><div class="skeleton-bone skeleton-stat-lbl"></div></div>
              <div class="stat-box skeleton-stat"><div class="skeleton-bone skeleton-stat-num"></div><div class="skeleton-bone skeleton-stat-lbl"></div></div>
              <div class="stat-box skeleton-stat"><div class="skeleton-bone skeleton-stat-num"></div><div class="skeleton-bone skeleton-stat-lbl"></div></div>
              <div class="stat-box skeleton-stat"><div class="skeleton-bone skeleton-stat-num"></div><div class="skeleton-bone skeleton-stat-lbl"></div></div>
            </div>
            <p class="summary-rhythm summary-rhythm-skeleton" aria-hidden="true"><span class="skeleton-bone skeleton-summary-rhythm"></span></p>
            <div class="screen-actions">
              <div class="skeleton-bone skeleton-summary-btn"></div>
              <div class="skeleton-bone skeleton-summary-btn ghost"></div>
            </div>
          </div>
        </div>`;
    } else if (v === 'summary' && this.summary) {
      const lp = this.summary.levelProgress;
      const offerUp = this.summary.levelComplete && lp?.nextCefrLevel;
      const allDone = this.summary.levelComplete && lp?.atMaxLevel;
      html += `
        <div class="screen-result">
          <div class="summary-card">
            <h2>Сессия завершена</h2>
            <p>${this.summary.cardsReviewed} карточек — коротко и по делу.</p>
            <div class="stat-grid">
              <div class="stat-box"><div class="num">${this.summary.cardsReviewed}</div><div class="lbl">Просмотрено</div></div>
              <div class="stat-box"><div class="num">${this.summary.cardsLearned}</div><div class="lbl">На учёбе</div></div>
              <div class="stat-box"><div class="num">${this.summary.streak}</div><div class="lbl">Streak</div></div>
              <div class="stat-box"><div class="num">${this.summary.wordsDueTomorrow}</div><div class="lbl">На завтра</div></div>
            </div>
            ${summaryRhythmHtml(this.summary)}
            ${offerUp ? `
            <div class="level-up-banner">
              <p class="level-up-title">Уровень ${esc(lp.cefrLevel)} освоен!</p>
              <p class="level-up-text">Все ${lp.wordsTotal} слов до ${esc(lp.cefrLevel)} отмечены как «Знаю». Перейти на ${esc(lp.nextCefrLevel)}?</p>
              <button class="btn btn-primary" data-action="level-up">Перейти на ${esc(lp.nextCefrLevel)}</button>
            </div>` : ''}
            ${allDone ? `
            <div class="level-up-banner">
              <p class="level-up-title">Словарь пройден!</p>
              <p class="level-up-text">Вы отметили «Знаю» все слова до C1. Можно повторять due-карточки.</p>
            </div>` : ''}
            <div class="screen-actions">
              ${!offerUp ? `<button class="btn btn-primary" data-action="${this.sessionSource === 'circle' ? 'start-circle' : 'start'}">${this.sessionSource === 'circle' ? 'Ещё общие слова' : 'Ещё сессия'}</button>` : ''}
              <button class="btn btn-ghost" data-action="${this.sessionSource === 'circle' ? 'open-circle' : 'home'}">${this.sessionSource === 'circle' ? 'В кружок' : 'На главную'}</button>
            </div>
          </div>
        </div>`;
    } else if (v === 'level-up' && this.levelOffer) {
      const lp = this.levelOffer;
      html += `
        <div class="screen-result">
          <div class="summary-card level-up-card">
            <h2>${lp.atMaxLevel ? 'Словарь освоен' : `Уровень ${esc(lp.cefrLevel)} пройден`}</h2>
            <p>${lp.atMaxLevel
              ? 'Все слова словаря отмечены как «Знаю». Возвращайтесь к повторениям, когда они появятся.'
              : `Все ${lp.wordsTotal} слов до ${esc(lp.cefrLevel)} изучены. Откроем ${esc(lp.nextCefrLevel)}?`}</p>
            <div class="screen-actions">
              ${lp.nextCefrLevel
                ? `<button class="btn btn-primary" data-action="level-up">Перейти на ${esc(lp.nextCefrLevel)}</button>
                   <button class="btn btn-ghost" data-action="dismiss-level-up">Остаться на ${esc(lp.cefrLevel)}</button>`
                : `<button class="btn btn-primary" data-action="home">На главную</button>`}
            </div>
          </div>
        </div>`;
    } else if (v === 'stats-loading') {
      const langLabel = LANG_PAIR_META[normalizeLangPair(this.langPair)].label;
      html += `
        ${pageBar({
          title: 'Статистика',
          subtitle: `${esc(langLabel)} · ${esc(this.cefrLevel)}`,
          backAction: 'home',
          backLabel: 'На главную',
        })}
        <div class="settings-stack stats-skeleton" aria-busy="true" aria-live="polite">
          <p class="sr-only">Загружаю статистику…</p>
          ${settingsGroup('Сводка', `
            <div class="card-form">
              <div class="stats-hero" aria-hidden="true">
                ${statsHeroSkeleton()}
                ${statsHeroSkeleton()}
                ${statsHeroSkeleton()}
              </div>
            </div>`)}
          ${settingsGroup('Эта неделя', `
            <div class="card-form" aria-hidden="true">
              <div class="skeleton-bone skeleton-progress-track"></div>
              <div class="skeleton-bone skeleton-section-sub"></div>
            </div>`)}
          ${settingsGroup('Прогресс уровня', `
            <div class="card-form">
              <div class="stats-progress-head" aria-hidden="true">
                <div class="skeleton-bone skeleton-progress-pct"></div>
                <div class="skeleton-bone skeleton-section-sub"></div>
              </div>
              <div class="skeleton-bone skeleton-progress-track" aria-hidden="true"></div>
              <div class="stats-split" aria-hidden="true">
                <div class="skeleton-bone skeleton-split"></div>
                <div class="skeleton-bone skeleton-split"></div>
              </div>
              <div class="skeleton-bone skeleton-stats-eta" aria-hidden="true"></div>
            </div>`)}
          ${settingsGroup('Достижения', `
            <div class="card-form">
              <div class="ach-grid" aria-hidden="true">
                <div class="skeleton-bone skeleton-ach-badge"></div>
                <div class="skeleton-bone skeleton-ach-badge"></div>
                <div class="skeleton-bone skeleton-ach-badge"></div>
                <div class="skeleton-bone skeleton-ach-badge"></div>
              </div>
            </div>`)}
        </div>`;
    } else if (v === 'stats' && this.stats) {
      const achievements = Array.isArray(this.stats.achievements) ? this.stats.achievements : [];
      const lp = this.stats.levelProgress;
      const eta = this.stats.eta;
      const langLabel = LANG_PAIR_META[normalizeLangPair(this.langPair)].label;
      const cefr = this.stats.cefrLevel || this.cefrLevel;
      html += `
        ${pageBar({
          title: 'Статистика',
          subtitle: `${esc(langLabel)} · ${esc(cefr)}`,
          backAction: 'home',
          backLabel: 'На главную',
        })}
        <div class="settings-stack">
          ${settingsGroup('Сводка', `
            <div class="card-form">
              <div class="stats-hero">
                ${statsHeroItem(this.stats.streak, 'Streak')}
                ${statsHeroItem(this.stats.wordsLearned, 'Знаю')}
                ${statsHeroItem(this.stats.sessionsCompleted, 'Сессии')}
              </div>
            </div>`)}
          ${renderWeekBlock(this.stats.week)}
          ${lp ? settingsGroup('Прогресс уровня', `
            <div class="card-form">
              <div class="stats-progress-head">
                <p class="stats-progress-pct">${lp.percent}%</p>
                <p class="stats-progress-frac">${lp.wordsKnown} из ${lp.wordsTotal} «Знаю»</p>
              </div>
              <div class="progress-bar" role="progressbar" aria-valuenow="${lp.percent}" aria-valuemin="0" aria-valuemax="100" aria-label="Прогресс уровня ${esc(lp.cefrLevel)}">
                <div class="progress-bar-fill" style="width:${lp.percent}%"></div>
              </div>
              <div class="stats-split">
                <div class="stats-split-item">
                  <div class="num">${lp.wordsLearning}</div>
                  <div class="lbl">На учёбе</div>
                </div>
                <div class="stats-split-item">
                  <div class="num">${lp.wordsNew}</div>
                  <div class="lbl">Впереди</div>
                </div>
              </div>
              ${renderStatsEta(this.stats, lp, eta)}
              ${lp.complete && lp.nextCefrLevel
                ? `<button type="button" class="btn btn-primary" data-action="level-up">Перейти на ${esc(lp.nextCefrLevel)}</button>`
                : ''}
              ${lp.complete && lp.atMaxLevel
                ? '<p class="saved-hint">Словарь C1 полностью освоен ✓</p>'
                : ''}
            </div>`) : ''}
          ${settingsGroup('Достижения', `
            <div class="card-form">
              ${achievements.length
                ? `<div class="ach-grid">
                    ${achievements.map((a) => {
                      const badge = achievementBadge(a);
                      if (!badge) return '';
                      const scope = achievementScope(a);
                      const lang = scope
                        ? `<span class="ach-badge-lang">${scope.flag ? `${scope.flag} ` : ''}${esc(scope.label)}</span>`
                        : '';
                      const hint = scope ? `${badge.title} · ${scope.label}` : badge.title;
                      return `
                        <div class="ach-badge" title="${esc(hint)}">
                          <span class="ach-badge-emoji">${badge.emoji}</span>
                          <span class="ach-badge-copy">
                            <strong>${esc(badge.title)}</strong>
                            ${lang}
                          </span>
                        </div>`;
                    }).join('')}
                  </div>`
                : '<p class="settings-lead">После первой сессии появится первое достижение.</p>'}
            </div>`)}
        </div>`;
    } else if (v === 'ranks-loading') {
      const langLabel = LANG_PAIR_META[normalizeLangPair(this.langPair)].label;
      html += `
        ${pageBar({
          title: 'Рейтинг',
          subtitle: esc(langLabel),
          backAction: 'stats',
          backLabel: 'К статистике',
        })}
        <div class="circle-screen">
          ${renderRankSkeleton()}
        </div>`;
    } else if (v === 'ranks') {
      const langLabel = LANG_PAIR_META[normalizeLangPair(this.ranks?.langPair || this.langPair)].label;
      const rows = this.ranks?.rows ?? [];
      html += `
        ${pageBar({
          title: 'Рейтинг',
          subtitle: esc(langLabel),
          backAction: 'stats',
          backLabel: 'К статистике',
        })}
        <div class="circle-screen">
          ${this.ranksError ? `<p class="error">${esc(this.ranksError)}</p>` : ''}
          ${renderPinnedRank(this.ranks?.me)}
          ${rows.length ? `
            <section class="circle-card">
              <ul class="circle-people circle-ranks">${renderRankItems(rows)}</ul>
            </section>` : ''}
          ${rows.length || this.ranksError ? '' : '<p class="circle-lead">Рейтинг появится, когда на этой неделе кто-то закроет сессию.</p>'}
        </div>`;
    } else if (v === 'settings') {
      const nameError = this.settingsErrorSource === 'name' && this.settingsError
        ? `<p class="error">${esc(this.settingsError)}</p>`
        : '';
      const prefsError = this.settingsErrorSource === 'prefs' && this.settingsError
        ? `<p class="error">${esc(this.settingsError)}</p>`
        : '';
      html += `
        ${pageBar({
          title: 'Настройки',
          backAction: 'home',
          backLabel: 'На главную',
        })}
        <div class="settings-stack">
          ${settingsGroup('Профиль', `
            <div class="card-form">
              <label>Имя
                ${nameFieldHtml(this.name, ' enterkeyhint="done"')}
              </label>
              <p class="saved-hint" data-name-saved hidden>Сохранено ✓</p>
              ${nameError}
            </div>`)}
          ${settingsGroup('Тема', `
            <div class="card-form">
              ${renderThemePicker(getThemePreference())}
            </div>`)}
          ${settingsGroup('Обучение', `
            <div class="card-form">
              <label>Язык
                <select name="langPair">
                  ${langPairOptions(this.langPair)}
                </select>
              </label>
              <label>Уровень
                <select name="cefrLevel">
                  ${cefrOptions(this.cefrLevel, this.langPair)}
                </select>
              </label>
              ${this.settingsSaved ? '<p class="saved-hint">Сохранено ✓</p>' : ''}
              ${prefsError}
              <p class="settings-hint">Слова в сессиях зависят от языка и уровня. Прогресс по каждому языку хранится отдельно.</p>
            </div>`)}
          ${settingsGroup('Напоминания', `
            <div class="card-form">
              <p class="settings-lead">Пуш каждый день в выбранное время</p>
              <div class="reminder-row">
                <label>Время
                  <input type="time" name="reminderTime" value="${esc(this.reminderTime)}">
                </label>
              </div>
              ${this.reminder.enabled
                ? '<button type="button" class="btn btn-ghost btn-ghost-border" data-action="reminder-disable">Отключить</button>'
                : '<button type="button" class="btn btn-primary" data-action="reminder-enable">Включить</button>'}
              ${this.reminderError ? `<p class="error">${esc(this.reminderError)}</p>` : ''}
            </div>`)}
          ${settingsGroup('Справка', `
            <nav class="card-form settings-list" aria-label="Справка">
              <a class="settings-row" href="${SUPPORT_TELEGRAM_URL}" target="_blank" rel="noopener noreferrer">
                Группа поддержки в Telegram
                <span class="settings-row-go" aria-hidden="true">›</span>
              </a>
              <a class="settings-row" href="/help/faq.html?from=settings">
                FAQ
                <span class="settings-row-go" aria-hidden="true">›</span>
              </a>
              <a class="settings-row" href="/legal/privacy.html?from=settings">
                Конфиденциальность
                <span class="settings-row-go" aria-hidden="true">›</span>
              </a>
              <a class="settings-row" href="/legal/terms.html?from=settings">
                Условия
                <span class="settings-row-go" aria-hidden="true">›</span>
              </a>
              <button type="button" class="settings-row" data-action="updates">
                Что нового
                <span class="settings-row-end">
                  ${this.changelogUnseen ? '<span class="settings-new">новое</span>' : ''}
                  <span class="settings-row-go" aria-hidden="true">›</span>
                </span>
              </button>
            </nav>`)}
          ${settingsGroup('Аккаунт', `
            <div class="card-form settings-list">
              <button type="button" class="settings-row" data-action="logout">Выйти</button>
            </div>
            <p class="app-version">LangSwipe v${esc(APP_VERSION)}</p>
            ${this.progressReset ? '<p class="saved-hint reset-hint">Прогресс сброшен ✓</p>' : ''}
            <div class="card-form settings-list">
              <button type="button" class="settings-row settings-row-danger" data-action="reset-progress">Сбросить статистику и прогресс</button>
              <button type="button" class="settings-row settings-row-danger" data-action="delete-account">Удалить аккаунт</button>
            </div>`)}
        </div>`;
    } else if (v === 'updates') {
      html += `
        ${pageBar({
          title: 'Что нового',
          subtitle: 'История обновлений',
          backAction: 'settings',
          backLabel: 'Назад в настройки',
        })}
        <div class="card-form changelog">
          ${CHANGELOG.map((entry) => `
            <article class="changelog-entry">
              <header class="changelog-meta">
                <strong>v${esc(entry.version)}</strong>
                <time datetime="${esc(entry.date)}">${esc(formatChangelogDate(entry.date))}</time>
              </header>
              <ul>
                ${(entry.items || []).map((item) => `<li>${esc(item)}</li>`).join('')}
              </ul>
            </article>`).join('')}
        </div>`;
    }

    html += '</div>';

    if (this.overlayWord) {
      const w = this.overlayWord;
      const meanings = String(w.translation ?? '')
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);
      const examples = Array.isArray(w.examples) ? w.examples : [];
      const forms = Array.isArray(w.forms) ? w.forms : [];
      const hasExamples = examples.length > 0;
      const hasForms = w.pos === 'verb' && forms.length > 0;
      const section = this.overlaySection;
      const enterClass = this.overlayEnter ? ' overlay-panel--enter' : '';
      const vote = this.associationVotes.get(w.id) ?? null;
      html += `
        <div class="overlay" data-action="close-overlay">
          <div class="overlay-panel${enterClass}">
            <div class="overlay-head">
              <h2>${esc(w.lemma)}</h2>
              <button type="button" class="overlay-close" data-action="close-overlay" aria-label="Закрыть">×</button>
            </div>
            ${meanings.map((m) => `<p class="translation">${esc(m)}</p>`).join('')}
            <p class="overlay-meta">${esc(posLabel(w.pos))} · ${esc(w.cefrLevel)}${w.unit ? ` · ${esc(w.unit)}` : ''}</p>
            ${renderAssociation(w.association, vote)}
            <button type="button" class="btn btn-primary overlay-speak" data-action="speak">🔊 Произношение</button>
            <div class="overlay-actions">
              <button
                type="button"
                class="btn btn-soft${section === 'examples' ? ' is-active' : ''}"
                data-action="overlay-examples"
                ${hasExamples ? '' : 'disabled'}
                aria-expanded="${section === 'examples'}"
              >Примеры</button>
              ${hasForms
                ? `<button
                    type="button"
                    class="btn btn-soft${section === 'forms' ? ' is-active' : ''}"
                    data-action="overlay-forms"
                    aria-expanded="${section === 'forms'}"
                  >Формы</button>`
                : ''}
            </div>
            <div class="overlay-section-slot${section ? ' is-open' : ''}">
              <div class="overlay-section-slot-inner">
                ${section === 'examples' ? renderExamplesSection(examples) : ''}
                ${section === 'forms' ? renderFormsSection(forms, w.langPair) : ''}
              </div>
            </div>
          </div>
        </div>`;
    }

    this.endPointerTracking();
    this.stopLandingDeck();
    this.root.innerHTML = html;
    this.cardEnter = false;
    this.overlayEnter = false;
    this.bindEvents();
    if (v === 'home') this.scheduleDeckPrefetch();
    if (v === 'session' && !this.swiping) this.prefetchUpcomingAudio();
    const card = this.root.querySelector('#active-card');
    if (card) {
      card.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    }
    if (v === 'landing') this.mountLandingDeck();
    if (v === 'onboarding' && !window.navigator.standalone) {
      this.root.querySelector('input[name="displayName"]')?.focus();
    }
    this.syncIosInstallHint();
    this.scheduleStreakRiskRefresh();
  }

  /**
   * Streak chip in the top corner. Within 3 hours of the reset deadline it
   * shows a warning and opens a short explanation on tap.
   * @param {boolean} compact session header omits the word «дней»
   */
  homeNavButton(action, label, count, noticeFor) {
    const badge = count
      ? `<span class="nav-badge" aria-hidden="true">${count > 9 ? '9+' : count}</span>`
      : '';
    const aria = count ? ` aria-label="${esc(`${label}, ${noticeFor(count)}`)}"` : '';
    return `<button type="button" class="btn btn-ghost" data-action="${action}"${aria}>${esc(label)}${badge}</button>`;
  }

  homeRhythmHtml() {
    const circle = this.circle;
    if (!circle || circle.memberCount < 2 || circle.todayClosed == null) return '';
    return `<p class="home-rhythm">В кружке сегодня ${circle.todayClosed} из ${circle.memberCount}</p>`;
  }

  streakBadgeHtml(compact) {
    const days = this.user?.streak;
    if (!days) return '';
    const risk = streakResetRisk(this.user);
    const count = compact ? `🔥 ${days}` : `🔥 ${days} дней`;
    if (!risk) {
      this.streakRiskOpen = false;
      return `<span class="streak-badge">${count}</span>`;
    }
    const open = this.streakRiskOpen;
    const hint = formatStreakRiskHint(risk);
    return `
      <span class="streak-badge-wrap">
        <button
          type="button"
          class="streak-badge streak-badge-risk"
          data-action="streak-risk"
          aria-expanded="${open ? 'true' : 'false'}"
          aria-controls="streak-risk-note"
          aria-label="Серия ${days} дней, скоро сбросится"
        ><span class="streak-warn-mark" aria-hidden="true">⚠️</span>${count}</button>
        ${open ? `<span class="streak-risk-note" id="streak-risk-note" role="status">${esc(hint)}</span>` : ''}
      </span>`;
  }

  /**
   * The 3-hour window often opens while the phone is locked. Background timers
   * do not run there, so a stale home screen kept the badge without ⚠️.
   */
  refreshStreakRisk() {
    if (this.view !== 'home' && this.view !== 'session') return;
    const risk = streakResetRisk(this.user);
    const showing = Boolean(this.root?.querySelector('[data-action="streak-risk"]'));
    if (Boolean(risk) !== showing || (risk && this.streakRiskOpen)) {
      this.render();
      return;
    }
    this.scheduleStreakRiskRefresh();
  }

  /** Re-render when the 3-hour window opens, and keep an open hint fresh. */
  scheduleStreakRiskRefresh() {
    clearTimeout(this._streakRiskTimer);
    this._streakRiskTimer = null;
    if ((this.view !== 'home' && this.view !== 'session') || !this.user?.streak) return;
    const now = Date.now();
    const risk = streakResetRisk(this.user, now);
    let delay = null;
    if (risk) {
      delay = this.streakRiskOpen ? Math.min(60_000, risk.remainingMs) : risk.remainingMs;
    } else {
      const until = msUntilStreakWarning(this.user, now);
      if (until != null && until > 0) delay = until;
    }
    if (delay == null) return;
    const cap = delay > STREAK_WARN_MS ? 5 * 60 * 1000 : 60_000;
    this._streakRiskTimer = setTimeout(() => {
      this.refreshStreakRisk();
    }, Math.min(Math.max(1000, delay), cap));
  }
}

function sessionCardHtml(card, enter) {
  return `
    <div class="word-card${enter ? ' card-enter' : ''}" data-action="overlay" id="active-card">
      <span class="swipe-label know">ЗНАЮ</span>
      <span class="swipe-label learn">УЧУ</span>
      <p class="lemma">${esc(card.lemma)}</p>
      <p class="hint">Тап — подробнее · ← знаю · → учу</p>
    </div>`;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const IOS_SHARE_SVG =
  '<svg class="ios-install-share" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M8 9H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2M12 3v12M8.5 6.5 12 3l3.5 3.5"/></svg>';

function isIosDevice() {
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

function isStandaloneDisplay() {
  if (window.navigator.standalone) return true;
  return Boolean(window.matchMedia?.('(display-mode: standalone), (display-mode: fullscreen)').matches);
}

function isIosSafari() {
  if (!isIosDevice()) return false;
  const ua = navigator.userAgent || '';
  return !/CriOS|FxiOS|OPiOS|EdgiOS|YaBrowser|YaApp|GSA|FBAN|FBAV|Instagram|Line\/|Twitter|Telegram|MicroMessenger/i.test(ua);
}

function shouldShowIosInstallHint() {
  if (!isIosDevice() || isStandaloneDisplay()) return false;
  try {
    return localStorage.getItem(IOS_INSTALL_DISMISS_KEY) !== '1';
  } catch {
    return true;
  }
}

/** iOS treats `name="name"` as a username and shows a login/password error for short values. */
function readSeenInviteIds() {
  try {
    const raw = JSON.parse(localStorage.getItem(SEEN_CIRCLE_INVITES_KEY) || '[]');
    if (!Array.isArray(raw)) return new Set();
    return new Set(raw.filter((id) => Number.isInteger(id)));
  } catch {
    return new Set();
  }
}

function rememberSeenInviteIds(ids) {
  const seen = readSeenInviteIds();
  for (const id of ids) seen.add(id);
  try {
    localStorage.setItem(SEEN_CIRCLE_INVITES_KEY, JSON.stringify([...seen].slice(-80)));
  } catch {
    /* private mode */
  }
}

function pluralRu(count, one, few, many) {
  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return many;
  if (n1 === 1) return one;
  if (n1 >= 2 && n1 <= 4) return few;
  return many;
}

function nameFieldHtml(value, extra = '') {
  return `<input name="displayName" type="text" value="${esc(value)}" maxlength="64" placeholder="Как к вам обращаться?" autocomplete="given-name" autocapitalize="words" spellcheck="false"${extra} />`;
}

/** Keeps iCloud Keychain bound to the account email so the visible name field is not used as a login. */
function accountUsernameField(email) {
  if (!email) return '';
  return `<input class="sr-only" type="email" value="${esc(email)}" autocomplete="username" tabindex="-1" readonly aria-hidden="true" />`;
}

function withTimeout(promise, ms, timeoutMessage = 'timeout') {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

function friendlyError(message) {
  switch (message) {
    case 'Valid email and password (8–128 chars) required':
      return 'Введите корректный email и пароль от 8 символов';
    case 'Email already registered':
      return 'Этот email уже зарегистрирован';
    case 'Invalid credentials':
      return 'Неверный email или пароль';
    default:
      return message || 'Сервер временно недоступен';
  }
}

function isReturnFromInfoPage() {
  try {
    if (!document.referrer) return false;
    const ref = new URL(document.referrer);
    return ref.origin === location.origin && /\/(help|legal)\//.test(ref.pathname);
  } catch {
    return false;
  }
}

const POS_LABELS = {
  noun: 'сущ.',
  verb: 'глаг.',
  adjective: 'прил.',
  adverb: 'нареч.',
  pronoun: 'мест.',
  particle: 'част.',
  other: 'др.',
};

const TENSE_LABELS = {
  şimdi: 'Настоящее время',
  di: 'Прошедшее время',
  gelecek: 'Будущее время',
};

const PERSON_LABELS_BY_PAIR = {
  'tr-ru': {
    ben: 'я (ben)',
    sen: 'ты (sen)',
    o: 'он/она (o)',
    biz: 'мы (biz)',
    siz: 'вы (siz)',
    onlar: 'они (onlar)',
  },
  'en-ru': {
    I: 'я (I)',
    you: 'ты (you)',
    'he/she': 'он/она (he/she)',
    we: 'мы (we)',
    'you (pl)': 'вы (you)',
    they: 'они (they)',
  },
  'es-ru': {
    yo: 'я (yo)',
    tú: 'ты (tú)',
    'él/ella': 'он/она (él/ella)',
    nosotros: 'мы (nosotros)',
    vosotros: 'вы (vosotros)',
    ellos: 'они (ellos)',
  },
};

const PERSON_ORDER_BY_PAIR = {
  'tr-ru': ['ben', 'sen', 'o', 'biz', 'siz', 'onlar'],
  'en-ru': ['I', 'you', 'he/she', 'we', 'you (pl)', 'they'],
  'es-ru': ['yo', 'tú', 'él/ella', 'nosotros', 'vosotros', 'ellos'],
};

const CEFR_OPTION_LABELS = {
  A1: 'A1 — начальный',
  A2: 'A2 — элементарный',
  B1: 'B1 — средний',
  B2: 'B2 — продвинутый',
  C1: 'C1 — свободный',
};

function settingsGroup(label, inner) {
  return `<section class="settings-group"><h2 class="settings-group-label">${label}</h2>${inner}</section>`;
}

function rankScoreLabel(row) {
  if (row?.closedToday) return 'сегодня';
  const days = row?.days ?? 0;
  return `${days} ${pluralRu(days, 'день', 'дня', 'дней')}`;
}

function circleRhythmNote(closed, total, youClosed) {
  if (closed === total) return 'Сегодня все на месте';
  const left = total - closed;
  if (youClosed) {
    return left === 1 ? 'День закрыт · ждёт ещё 1' : `День закрыт · ждут ещё ${left}`;
  }
  return 'Сессия закроет сегодняшний день';
}

function renderRankItems(rows) {
  return (rows ?? []).map((row) => `
    <li class="${row.you ? 'is-you' : ''}">
      <div class="circle-person">
        <strong class="circle-person-line">${row.place ? `<span class="rank-place">${row.place}</span>` : ''}<span class="circle-person-name">${esc(row.name)}</span>${row.you ? '<span class="you-tag">Это вы</span>' : ''}</strong>
      </div>
      <span class="rank-score">${esc(rankScoreLabel(row))}</span>
    </li>`).join('');
}

function renderPinnedRank(me) {
  if (!me?.pinned) return '';
  return `
    <section class="circle-card">
      <ul class="circle-people circle-ranks">${renderRankItems([{ ...me, you: true }])}</ul>
    </section>`;
}

function renderRankSkeleton() {
  return `
    <section class="circle-card circle-skeleton" aria-busy="true" aria-live="polite">
      <span class="sr-only">Загружаю рейтинг</span>
      <div class="skeleton-bone skeleton-circle-row"></div>
      <div class="skeleton-bone skeleton-circle-row"></div>
      <div class="skeleton-bone skeleton-circle-row short"></div>
    </section>`;
}

function renderWeekBlock(week) {
  if (!week?.marks?.length) return '';
  const marks = week.marks.map((mark) => `
    <li class="${mark.closed ? 'is-closed' : ''}">
      <span class="week-mark" aria-hidden="true"></span>
      <span class="week-mark-label" aria-hidden="true">${esc(mark.label)}</span>
      <span class="sr-only">${esc(mark.label)}, ${mark.closed ? 'закрыт' : 'открыт'}</span>
    </li>`).join('');
  const holds = week.holds
    ? `<p class="week-note">${week.holds} ${pluralRu(week.holds, 'удержание', 'удержания', 'удержаний')}</p>`
    : '';
  const note = week.closedToday ? '' : '<p class="week-note">Сессия закроет сегодняшний день</p>';
  return settingsGroup('Эта неделя', `
    <div class="card-form">
      <ol class="week-marks" aria-label="Дни этой недели">${marks}</ol>
      <p class="week-count">${week.dayCount} из 7</p>
      ${note}
      ${holds}
      <button type="button" class="btn btn-ghost btn-ghost-border" data-action="open-ranks">Смотреть рейтинг</button>
    </div>`);
}

function summaryRhythmHtml(summary) {
  const rating = summary?.rating;
  if (!rating) return '';
  if (!rating.dayClosed) return '<p class="summary-rhythm">День в рейтинге ещё открыт</p>';
  if (rating.circle && rating.circle.total >= 2) {
    return `<p class="summary-rhythm">День закрыт · в кружке сегодня ${rating.circle.closed} из ${rating.circle.total}</p>`;
  }
  return `<p class="summary-rhythm">День закрыт · ${rating.weekDays} из 7 на этой неделе</p>`;
}

function statsHeroItem(value, label) {
  return `<div class="stats-hero-item"><div class="num">${value}</div><div class="lbl">${label}</div></div>`;
}

function statsHeroSkeleton() {
  return `<div class="stats-hero-item"><div class="skeleton-bone skeleton-hero-num"></div><div class="skeleton-bone skeleton-hero-lbl"></div></div>`;
}

function renderStatsEta(stats, lp, eta) {
  if (!eta || !lp) return '';
  if (lp.complete) return `<p class="stats-eta">${esc(eta.label)}</p>`;
  if (!stats.sessionsCompleted) {
    return '<p class="stats-eta">После первой сессии появится оценка, когда закроется уровень.</p>';
  }
  return `<p class="stats-eta">${esc(eta.label)}</p>`;
}

function pageBar({ title, subtitle = '', backAction = '', backLabel = 'Назад' }) {
  const back = backAction
    ? `<button type="button" class="page-back" data-action="${esc(backAction)}" aria-label="${esc(backLabel)}"><span aria-hidden="true">←</span></button>`
    : '';
  return `<header class="page-bar">${back}<div class="page-bar-copy"><h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ''}</div></header>`;
}

function langPairOptions(selected) {
  return LANG_PAIRS.map((pair) => opt(pair, LANG_PAIR_META[pair].label, selected)).join('');
}

function cefrOptions(selected, pair) {
  return cefrLevelsForPair(pair)
    .map((level) => opt(level, CEFR_OPTION_LABELS[level] || level, selected))
    .join('');
}

const LANDING_LANG_FALLBACK = {
  'tr-ru': 3500,
  'en-ru': 4100,
  'es-ru': 3900,
};

function landingLangBenefits(stats) {
  return LANG_PAIRS.map((pair) => {
    const meta = LANG_PAIR_META[pair];
    const raw = Number(stats?.pairs?.[pair]?.words);
    const count = Number.isFinite(raw) && raw > 0 ? raw : LANDING_LANG_FALLBACK[pair];
    return `<div class="landing-lang"><strong>${esc(meta.label)}</strong><span>${esc(formatWordCount(count))}</span></div>`;
  }).join('');
}

function landingBenefits(sessionSize) {
  const n = Math.max(1, Math.floor(Number(sessionSize) || 18));
  return [
    { title: `${n} карточек`, subtitle: 'около 5 минут' },
    { title: 'SRS', subtitle: 'умные повторы' },
    { title: 'Тап', subtitle: 'перевод + аудио' },
    { title: 'Онбординг', subtitle: 'за 20 секунд' },
    { title: 'Streak', subtitle: 'серии и достижения' },
    { title: 'PWA', subtitle: 'установи на телефон' },
  ];
}

function landingBenefitInner(benefit) {
  const b = benefit || landingBenefits(18)[0];
  return `<span class="home-deck-facts">${esc(b.title)}</span><span class="home-deck-time">${esc(b.subtitle)}</span>`;
}

function landingBenefitCardHtml(benefit) {
  const b = benefit || landingBenefits(18)[0];
  return `<div class="home-deck-front landing-benefit-card" id="landing-active-card" tabindex="0" role="group" aria-label="${esc(b.title)}. ${esc(b.subtitle)}">${landingBenefitInner(b)}</div>`;
}

function landingPeekCardHtml(benefit) {
  const b = benefit || landingBenefits(18)[0];
  return `<div class="home-deck-front landing-benefit-peek" id="landing-peek-card" aria-hidden="true">${landingBenefitInner(b)}</div>`;
}

function landingDotsHtml(index, total) {
  const on = Math.max(0, Math.min(index, total - 1));
  let html = '<div class="landing-dots" aria-hidden="true">';
  for (let i = 0; i < total; i += 1) {
    html += `<span${i === on ? ' class="is-on"' : ''}></span>`;
  }
  html += '</div>';
  return html;
}

function formatWordCount(n) {
  const count = Math.max(0, Math.floor(Number(n) || 0));
  return `${count.toLocaleString('ru-RU')} ${ruWordNoun(count)}`;
}

function ruWordNoun(n) {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 15) return 'слов';
  if (last === 1) return 'слово';
  if (last >= 2 && last <= 4) return 'слова';
  return 'слов';
}

function posLabel(pos) {
  return POS_LABELS[pos] || pos || '';
}

function voteButtons(vote) {
  const upOn = vote === 'up';
  const downOn = vote === 'down';
  return `
    <div class="association-votes" role="group" aria-label="Оценка ассоциации">
      <button type="button" class="vote-btn${upOn ? ' is-on' : ''}" data-action="rate-association" data-vote="up" aria-pressed="${upOn}" aria-label="Подходит">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3zm2 10h7.2a2 2 0 0 0 2-1.6l1.2-6A2 2 0 0 0 17.4 11H14V6.4A2.4 2.4 0 0 0 11.6 4L9 11v10z"/></svg>
      </button>
      <button type="button" class="vote-btn${downOn ? ' is-on' : ''}" data-action="rate-association" data-vote="down" aria-pressed="${downOn}" aria-label="Не подходит">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 13V4H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h3zm2-10h7.2a2 2 0 0 1 2 1.6l1.2 6A2 2 0 0 1 17.4 13H14v4.6A2.4 2.4 0 0 1 11.6 20L9 13V3z"/></svg>
      </button>
    </div>`;
}

function renderAssociation(association, vote = null) {
  if (!association || typeof association !== 'object') return '';
  const kind = association.kind;
  const head = `
    <div class="association-head">
      <p class="association-label">Чтобы запомнить</p>
      ${voteButtons(vote)}
    </div>`;
  if (kind === 'cognate') {
    const like = Array.isArray(association.hooks) ? association.hooks[0] : '';
    if (!like) return '';
    return `
      <div class="association" role="note">
        ${head}
        <p class="association-line">Похоже на «${esc(like)}»</p>
      </div>`;
  }
  if (kind === 'usage') {
    if (!association.image) return '';
    return `
      <div class="association" role="note">
        ${head}
        <p class="association-line">${esc(association.image)}</p>
      </div>`;
  }
  if (kind !== 'keyword') return '';
  const hooks = (Array.isArray(association.hooks) ? association.hooks : []).filter(Boolean);
  if (!association.phonetic || !hooks.length || !association.image) return '';
  return `
    <div class="association" role="note">
      ${head}
      <p class="association-sound">${esc(association.phonetic)} → ${esc(hooks.join(' + '))}</p>
      <p class="association-image">${esc(association.image)}</p>
    </div>`;
}

function renderExamplesSection(examples) {
  if (!examples.length) {
    return '<p class="overlay-empty">Примеров для этого слова пока нет.</p>';
  }
  return `
    <div class="overlay-section" role="region" aria-label="Примеры">
      <ul class="example-list">
        ${examples
          .map(
            (ex) => `
          <li class="example-item">
            <p class="example-tr">${esc(ex.example)}</p>
            ${ex.translate ? `<p class="example-ru">${esc(ex.translate)}</p>` : ''}
          </li>`,
          )
          .join('')}
      </ul>
    </div>`;
}

function renderFormsSection(forms, langPair = DEFAULT_LANG_PAIR) {
  if (!forms.length) {
    return '<p class="overlay-empty">Словоформ для этого глагола нет.</p>';
  }
  const pair = normalizeLangPair(langPair);
  const personLabels = PERSON_LABELS_BY_PAIR[pair] || PERSON_LABELS_BY_PAIR[DEFAULT_LANG_PAIR];
  const personOrder = PERSON_ORDER_BY_PAIR[pair] || PERSON_ORDER_BY_PAIR[DEFAULT_LANG_PAIR];
  const byTense = new Map();
  for (const f of forms) {
    const tense = f.tense || f.grammar || 'other';
    if (!byTense.has(tense)) byTense.set(tense, new Map());
    const byPerson = byTense.get(tense);
    const person = f.person || '';
    if (!byPerson.has(person)) byPerson.set(person, []);
    byPerson.get(person).push(f.form);
  }
  const tenseOrder = ['şimdi', 'di', 'gelecek'];
  const tenseKeys = [
    ...tenseOrder.filter((t) => byTense.has(t)),
    ...[...byTense.keys()].filter((t) => !tenseOrder.includes(t)),
  ];

  return `
    <div class="overlay-section" role="region" aria-label="Словоформы">
      ${tenseKeys
        .map((tense) => {
          const byPerson = byTense.get(tense);
          const personKeys = [
            ...personOrder.filter((p) => byPerson.has(p)),
            ...[...byPerson.keys()].filter((p) => !personOrder.includes(p)),
          ];
          return `
            <div class="forms-tense">
              <h3 class="forms-tense-title">${esc(TENSE_LABELS[tense] || tense)}</h3>
              <ul class="forms-list">
                ${personKeys
                  .map((person) => {
                    const formText = byPerson.get(person).join(', ');
                    return `
                      <li class="forms-row">
                        <span class="forms-person">${esc(personLabels[person] || person)}</span>
                        <span class="forms-value">${esc(formText)}</span>
                      </li>`;
                  })
                  .join('')}
              </ul>
            </div>`;
        })
        .join('')}
    </div>`;
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

function renderThemePicker(pref) {
  return `
    <div class="theme-field">
      <div class="theme-seg" role="radiogroup" aria-label="Тема">
        ${THEME_CHOICES.map((choice) => `
          <label class="theme-seg-item">
            <input type="radio" name="theme" value="${choice.value}"${pref === choice.value ? ' checked' : ''} />
            <span>${choice.label}</span>
          </label>`).join('')}
      </div>
      <p class="settings-hint">«Система» — как на устройстве</p>
    </div>`;
}
