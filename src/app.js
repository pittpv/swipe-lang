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
const CHANNEL_TELEGRAM_URL = 'https://t.me/langswipe_xyz';
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
    this.reminder = { enabled: false, pendingRebind: false };
    this.reminderTime = '19:00';
    this.reminderError = '';
    this.reminderSaveTimer = null;
    this.reminderSaveInFlight = false;
    this.reminderSaveQueued = false;
    this.reminderSaveInteractiveQueued = false;
    this.reminderNeedsGestureHeal = false;
    this.reminderRotate = false;
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
    this._swipeOutbox = [];
    this._swipeFlushing = false;
    this._swipeHalted = false;
    this._swipeFailure = null;
    this._finishing = false;
    this.wrapError = '';
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

    const bar = document.createElement('aside');
    bar.className = 'ios-install';
    bar.setAttribute('role', 'status');
    bar.setAttribute('aria-labelledby', 'ios-install-title');

    const icon = document.createElement('img');
    icon.className = 'ios-install-icon';
    icon.src = '/apple-touch-icon.png';
    icon.alt = '';
    icon.width = 44;
    icon.height = 44;

    const copy = document.createElement('div');
    copy.className = 'ios-install-copy';
    const title = document.createElement('strong');
    title.id = 'ios-install-title';
    title.textContent = 'Добавить на домашний экран';
    const body = document.createElement('p');
    body.textContent = 'Используйте как приложение';
    copy.append(title, body);

    const act = document.createElement('button');
    act.type = 'button';
    act.className = 'ios-install-act';
    act.textContent = 'Установить';
    act.addEventListener('click', () => this.openIosInstallGuide());

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'ios-install-close';
    close.setAttribute('aria-label', 'Закрыть подсказку');
    close.innerHTML = '<span class="ios-install-x">×</span>';
    close.addEventListener('click', () => this.dismissIosInstallHint());

    bar.append(icon, copy, act, close);

    const guide = document.createElement('div');
    guide.className = 'ios-guide';
    guide.setAttribute('role', 'dialog');
    guide.setAttribute('aria-modal', 'true');
    guide.setAttribute('aria-labelledby', 'ios-guide-title');
    guide.innerHTML = iosGuideHtml();
    if (!isIosSafari()) {
      const note = guide.querySelector('.ios-guide-note');
      if (note) note.hidden = false;
    }
    const requestClose = () => this.closeIosInstallGuide(guide);
    guide.querySelector('.ios-guide-done')?.addEventListener('click', requestClose);
    guide.addEventListener('click', (event) => {
      if (event.target === guide) requestClose();
    });

    document.body.append(bar, guide);
  }

  dismissIosInstallHint() {
    try {
      localStorage.setItem(IOS_INSTALL_DISMISS_KEY, '1');
    } catch {
      /* private mode */
    }
    if (this._iosGuideKeydown) {
      document.removeEventListener('keydown', this._iosGuideKeydown);
      this._iosGuideKeydown = null;
    }
    this.stopIosGuide();
    document.querySelector('.ios-guide')?.remove();
    document.querySelector('.ios-install')?.remove();
    this.syncIosInstallHint();
  }

  openIosInstallGuide() {
    const guide = document.querySelector('.ios-guide');
    if (!guide || guide.classList.contains('is-open')) return;
    const stage = guide.querySelector('.ios-guide-stage');
    if (stage) stage.dataset.step = '0';
    const sheet = guide.querySelector('.ios-guide-sheet');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Stay below the screen for one painted frame, then use the same
    // transition as close, in reverse. A native dialog open jumps to the top.
    guide.classList.remove('is-shown');
    if (sheet && !reduced) {
      sheet.style.transition = 'none';
      sheet.style.transform = 'translateY(100%)';
    }
    guide.classList.add('is-open');
    if (sheet) void sheet.offsetHeight;
    const reveal = () => {
      if (!guide.classList.contains('is-open')) return;
      if (sheet) {
        sheet.style.transition = '';
        sheet.style.transform = '';
      }
      guide.classList.add('is-shown');
    };
    if (reduced) reveal();
    else requestAnimationFrame(() => requestAnimationFrame(reveal));
    this.playIosGuide(guide);
    this._iosGuideKeydown = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      this.closeIosInstallGuide(guide);
    };
    document.addEventListener('keydown', this._iosGuideKeydown);
  }

  closeIosInstallGuide(guide = document.querySelector('.ios-guide')) {
    if (!guide?.classList.contains('is-open') || guide.dataset.closing === '1') return;
    const finish = () => {
      if (guide.dataset.closing === 'done') return;
      guide.dataset.closing = 'done';
      guide.classList.remove('is-open', 'is-shown');
      const sheet = guide.querySelector('.ios-guide-sheet');
      if (sheet) {
        sheet.style.transition = '';
        sheet.style.transform = '';
      }
      delete guide.dataset.closing;
      if (this._iosGuideKeydown) {
        document.removeEventListener('keydown', this._iosGuideKeydown);
        this._iosGuideKeydown = null;
      }
      this.stopIosGuide();
    };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      guide.classList.remove('is-shown');
      finish();
      return;
    }
    guide.dataset.closing = '1';
    guide.classList.remove('is-shown');
    const sheet = guide.querySelector('.ios-guide-sheet');
    let settled = false;
    const done = (event) => {
      if (settled) return;
      if (event && event.target !== sheet) return;
      if (event && event.propertyName !== 'transform') return;
      settled = true;
      sheet?.removeEventListener('transitionend', done);
      finish();
    };
    sheet?.addEventListener('transitionend', done);
    setTimeout(done, 560);
  }

  playIosGuide(guide) {
    this.stopIosGuide();
    const stage = guide.querySelector('.ios-guide-stage');
    const caption = guide.querySelector('.ios-guide-caption');
    if (!stage || !caption) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      stage.dataset.step = '3';
      caption.innerHTML = `Нажмите ${iosCapIco(IOS_DOTS_SVG, 'кнопка с тремя точками, iOS 26')} справа или ${iosCapIco(IOS_PAGE_SVG, 'меню страницы, iOS 27')} слева от адреса, затем «Поделиться», выберите «На экран „Домой“» и подтвердите «Добавить».`;
      return;
    }
    let step = 1;
    const show = () => {
      stage.dataset.step = String(step);
      caption.innerHTML = IOS_GUIDE_STEPS[step - 1];
    };
    show();
    this._iosGuideTimer = setInterval(() => {
      step = step === IOS_GUIDE_STEPS.length ? 1 : step + 1;
      show();
    }, IOS_GUIDE_STEP_MS);
  }

  stopIosGuide() {
    clearInterval(this._iosGuideTimer);
    this._iosGuideTimer = null;
  }

  syncIosInstallHint() {
    const onHome = this.view === 'home' && Boolean(this.user);
    if (onHome) this.mountIosInstallHint();
    const guide = document.querySelector('.ios-guide');
    if (!onHome && guide?.classList.contains('is-open')) this.closeIosInstallGuide(guide);
    const el = document.querySelector('.ios-install');
    if (el) el.hidden = !onHome;
    document.documentElement.classList.remove('has-ios-install');
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
    await this.drainSwipes();
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
    this._swipeOutbox.push({
      wordId,
      direction,
      swipedAt: new Date().toISOString(),
      sessionId: this.sessionId,
    });
    this.scheduleSwipeFlush();
  }

  scheduleSwipeFlush() {
    if (this._swipeFlushing || this._swipeHalted) return;
    this._swipeFlushing = true;
    this._swipeChain = this._swipeChain
      .then(() => this.flushSwipeOutbox())
      .finally(() => {
        this._swipeFlushing = false;
        if (this._swipeOutbox.length && !this._swipeHalted) this.scheduleSwipeFlush();
      });
  }

  async flushSwipeOutbox() {
    while (this._swipeOutbox.length && !this._swipeHalted) {
      const sessionId = this._swipeOutbox[0].sessionId;
      const batch = [];
      while (
        this._swipeOutbox.length &&
        this._swipeOutbox[0].sessionId === sessionId &&
        batch.length < 18
      ) {
        batch.push(this._swipeOutbox.shift());
      }
      let sent = false;
      let lastError = null;
      for (let attempt = 0; attempt < 3 && !sent; attempt++) {
        try {
          await api('/session/swipe', {
            method: 'POST',
            body: {
              sessionId,
              swipes: batch.map(({ wordId, direction, swipedAt }) => ({ wordId, direction, swipedAt })),
            },
            signal: abortAfter(15000),
          });
          sent = true;
          for (const swipe of batch) track(swipe.direction === 'left' ? 'swipe_left' : 'swipe_right');
        } catch (error) {
          lastError = error;
          if (!isTransientApiError(error) || attempt === 2) break;
          await wait(400 * (attempt + 1));
        }
      }
      if (!sent) {
        this._swipeOutbox = batch.concat(this._swipeOutbox);
        this._swipeHalted = true;
        this._swipeFailure = { wordId: batch[0].wordId, error: lastError };
        if (this.view === 'session' && !this.swiping) this.applySwipeFailure();
        return;
      }
    }
  }

  async drainSwipes() {
    if (this._swipeOutbox.length && !this._swipeHalted) this.scheduleSwipeFlush();
    while ((this._swipeFlushing || this._swipeOutbox.length) && !this._swipeHalted) {
      await this._swipeChain;
      if (this._swipeOutbox.length && !this._swipeFlushing && !this._swipeHalted) {
        this.scheduleSwipeFlush();
      }
    }
  }

  failWrap(error) {
    this.wrapError = sessionSaveError(error);
    this.view = 'session-wrapping';
    this.swiping = false;
    this.render();
  }

  async completeSessionWithRetry() {
    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await api('/session/complete', {
          method: 'POST',
          body: { sessionId: this.sessionId, wordIds: this.cards.map((card) => card.id) },
          signal: abortAfter(15000),
        });
      } catch (error) {
        lastError = error;
        if (!isTransientApiError(error) || attempt === 2) throw error;
        await wait(400 * (attempt + 1));
      }
    }
    throw lastError;
  }

  async finishSession() {
    if (this._finishing) return;
    this._finishing = true;
    this.overlayWord = null;
    this.overlaySection = null;
    this.swiping = false;
    this.wrapError = '';
    this.view = 'session-wrapping';
    this.render();
    try {
      await this.drainSwipes();
      if (this._swipeHalted) {
        this.failWrap(this._swipeFailure?.error);
        return;
      }
      this.summary = await this.completeSessionWithRetry();
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
    } catch (error) {
      this.failWrap(error);
      return;
    } finally {
      this._finishing = false;
    }
    this.render();
  }

  retryFinish() {
    this._swipeHalted = false;
    this._swipeFailure = null;
    this.wrapError = '';
    this.finishSession();
  }

  applySwipeFailure() {
    const failure = this._swipeFailure;
    if (!failure || failure.applied) return;
    failure.applied = true;
    const index = this.cards.findIndex((card) => card.id === failure.wordId);
    this.error = sessionSaveError(failure.error);
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
    if (this._swipeHalted && this.view === 'session' && !this.swiping) {
      this._swipeHalted = false;
      this._swipeFailure = null;
      this.error = '';
      this.render();
      this.scheduleSwipeFlush();
      return;
    }
    const card = this.currentCard();
    if (!card || this.swiping || this._swipeHalted || this.view !== 'session') return;
    this.swiping = true;
    this.awaitingNext = false;
    this.drag.active = false;
    this.drag.pointerId = null;
    this.endPointerTracking();
    const wordId = card.id;
    const isLast = this.cardIndex >= this.cards.length - 1;
    this.enqueueSwipe(wordId, direction);
    await this.flyCardOut(direction, from.x, from.y);
    if (this._swipeHalted) {
      this.swiping = false;
      if (isLast) this.failWrap(this._swipeFailure?.error);
      else this.applySwipeFailure();
      return;
    }
    this.cardIndex += 1;
    this.drag = { active: false, pointerId: null, startX: 0, startY: 0, x: 0, y: 0 };
    this.cardEnter = true;
    if (isLast) {
      await this.finishSession();
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
    await this.drainSwipes();
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
    // Warm the VAPID key and the service worker before any Enable tap so
    // subscribe stays in-gesture. A home-screen reinstall has no worker yet;
    // waiting for it inside the tap drops iOS user activation.
    void this.prefetchVapidPublicKey();
    void this.preparePushRegistration();
    try {
      const status = await api('/push/status');
      if (status.time) this.reminderTime = status.time;
      else if (local?.time) this.reminderTime = local.time;
      this.reminderRotate = false;
      const wantsReminders = Boolean(status.enabled || local?.enabled);
      if (wantsReminders) {
        // Schedule is on, but the stored endpoint was rejected. Re-uploading
        // the browser's copy would put the same dead URL back.
        if (status.enabled && status.hasSubscription === false && status.revokedTag) {
          this.reminderRotate = await this.browserSubscriptionMatchesTag(status.revokedTag);
        }
        await this.pushSubscribe({ interactive: false });
        // Deleting the home-screen icon drops this device's subscription.
        // The account schedule stays on, so the switch must not claim the
        // new install is already subscribed.
        this.reminder.pendingRebind = !this.reminder.enabled;
        if (this.view === 'settings') this.render();
        return;
      }
      this.reminder.pendingRebind = false;
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) await this.pushSubscribe({ interactive: false });
    } catch {
      if (local?.enabled) {
        this.reminder.pendingRebind = !this.reminder.enabled;
        if (local.time) this.reminderTime = local.time;
        if (this.view === 'settings') this.render();
      }
    }
  }

  /**
   * iOS requires pushManager.subscribe inside a real user gesture. Launch heal
   * may have failed; retry on the first tap — synchronously, because setTimeout
   * drops user activation and subscribe() then fails silently.
   *
   * In a browser tab, only retry when permission is already granted. Asking
   * from this listener makes the tap interactive, and on iOS Safari (not the
   * home-screen app) PushManager rejects in a microtask. Replacing innerHTML
   * before `click` makes cabinet buttons need several taps.
   *
   * The installed app is different: deleting the icon clears permission, so
   * the next tap there may request it again. The Enable button is left to its
   * own click handler — a silent subscribe started on pointerup would hold the
   * gesture until that click's request runs too late.
   */
  armGesturePushHeal() {
    if (!this.reminderNeedsGestureHeal || this.gestureHealArmed) return;
    const permission = typeof Notification !== 'undefined' ? Notification.permission : 'default';
    if (permission !== 'granted' && !isStandaloneDisplay()) return;
    this.gestureHealArmed = true;
    const retry = (event) => {
      document.removeEventListener('pointerup', retry, true);
      this.gestureHealArmed = false;
      if (!this.reminderNeedsGestureHeal) return;
      const enable = event.target instanceof Element && event.target.closest('[data-action="reminder-enable"]');
      if (enable) {
        this.armGesturePushHeal();
        return;
      }
      const current = typeof Notification !== 'undefined' ? Notification.permission : 'default';
      // Keep reminderNeedsGestureHeal until pushSubscribe succeeds so a failed
      // tap can re-arm instead of silently giving up after one attempt.
      this.pushSubscribe({ interactive: current !== 'granted' && isStandaloneDisplay() });
    };
    document.addEventListener('pointerup', retry, { once: true, capture: true });
  }

  async preparePushRegistration() {
    if (!('serviceWorker' in navigator)) return null;
    try {
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
      await navigator.serviceWorker.ready;
      this._pushRegistration = registration;
      return registration;
    } catch {
      return null;
    }
  }

  async browserHasSubscription() {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      return Boolean(subscription?.endpoint);
    } catch {
      return false;
    }
  }

  async browserSubscriptionMatchesTag(tag) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (!subscription?.endpoint || !tag) return false;
      return (await endpointTag(subscription.endpoint)) === tag;
    } catch {
      return false;
    }
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
  async ensurePushSubscription({ interactive = false, rotate = false } = {}) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      if (!interactive) return null;
      throw new Error('Push-уведомления не поддерживаются этим браузером');
    }
    // Ask before any other await. After a home-screen reinstall iOS permission
    // is back to "default", and a prompt issued after serviceWorker.ready is
    // no longer a user gesture, so the new install never gets a subscription.
    let permission = typeof Notification !== 'undefined' ? Notification.permission : 'denied';
    if (permission !== 'granted') {
      if (!interactive) return null;
      permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Разрешение на уведомления не выдано');
      }
    }
    // Prefer a cached VAPID key so subscribe() stays inside the user-gesture
    // window on iOS (awaiting /push/config first often burns activation).
    let publicKey = this.vapidPublicKey;
    if (!publicKey) {
      const config = await api('/push/config');
      publicKey = config.publicKey;
      this.vapidPublicKey = publicKey;
    }
    let registration = this._pushRegistration;
    if (!registration) {
      registration = await navigator.serviceWorker.getRegistration();
      if (!registration) registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
      await navigator.serviceWorker.ready;
      this._pushRegistration = registration;
    }
    let subscription = await registration.pushManager.getSubscription();
    // Only rotate when WebKit exposes the key AND it disagrees. An empty key
    // must not unsubscribe — that killed live Apple endpoints after 8c03b34.
    if (subscription && !this.sameVapidKey(subscription, publicKey)) {
      await subscription.unsubscribe().catch(() => {});
      subscription = null;
    }
    // Push service already rejected this endpoint. Unsubscribe and mint a new
    // one — the same thing the settings toggle does by hand. Rotate only when
    // the server says this exact endpoint was revoked.
    if (subscription && rotate) {
      const deadEndpoint = subscription.endpoint;
      await subscription.unsubscribe().catch(() => {});
      subscription = await registration.pushManager.getSubscription();
      if (subscription?.endpoint === deadEndpoint) return null;
    }
    if (subscription) return subscription.toJSON();

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
    const rotate = this.reminderRotate;
    this.reminderRotate = false;
    let rotateAgain = false;
    try {
      const subscription = await this.ensurePushSubscription({ interactive, rotate });
      if (!subscription) {
        this.reminderNeedsGestureHeal = true;
        if (rotate) this.reminderRotate = true;
        this.reminder.enabled = false;
      } else {
        const result = await api('/push/subscribe', {
          method: 'POST',
          body: {
            subscription,
            reminderTime: this.reminderTime,
            tzOffsetMinutes: new Date().getTimezoneOffset(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            replaceRevoked: rotate,
          },
        });
        this.reminder.enabled = Boolean(result.enabled);
        this.reminder.pendingRebind = false;
        this.reminderNeedsGestureHeal = false;
        if (this.reminder.enabled) writeReminderPref({ enabled: true, time: this.reminderTime });
      }
    } catch (e) {
      if (e.data?.rotate && !rotate) {
        this.reminderRotate = true;
        rotateAgain = true;
      } else {
        if (interactive) this.reminderError = e.message;
        else this.reminderNeedsGestureHeal = true;
        if (rotate) this.reminderRotate = true;
        if (!(await this.browserHasSubscription())) this.reminder.enabled = false;
      }
    }
    this.reminderSaveInFlight = false;
    if (rotateAgain) {
      await this.pushSubscribe({ interactive });
      return;
    }
    if (this.reminderSaveQueued) {
      this.reminderSaveQueued = false;
      const nextInteractive = this.reminderSaveInteractiveQueued;
      this.reminderSaveInteractiveQueued = false;
      await this.pushSubscribe({ interactive: nextInteractive });
      return;
    }
    // A failed silent heal must not re-render. On iOS Safari (not the home-screen
    // app) PushManager rejects in a microtask, before `click`. Replacing
    // innerHTML in that microtask detaches the button, so the tap looks dead.
    // Wait until the next task so the click that started this subscribe lands.
    // Never redraw an open session: the rebind tap may be "Начать сессию".
    if (this.view !== 'session' && (interactive || (this.view === 'settings' && !this.reminderNeedsGestureHeal))) {
      this.renderAfterClick();
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
    this.reminderRotate = false;
    this.reminder.pendingRebind = false;
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
    this.reminder = { enabled: false, pendingRebind: false };
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
      if (action === 'retry-finish') this.retryFinish();
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

  /** Skip if a click handler already rendered a newer screen in this turn. */
  renderAfterClick() {
    const gen = this._renderGen ?? 0;
    setTimeout(() => {
      if ((this._renderGen ?? 0) !== gen) return;
      this.render();
    }, 0);
  }

  render() {
    this._renderGen = (this._renderGen ?? 0) + 1;
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
          <span>Знаю - свайп влево</span>
          <span>свайп вправо - Учу</span>
        </div>
        <div style="display:flex;gap:0.5rem;margin-top:1rem">
          <button class="btn btn-ghost" data-action="swipe-left" style="flex:1" ${this.swiping ? 'disabled' : ''}>← Знаю</button>
          <button class="btn btn-primary" data-action="swipe-right" style="flex:1" ${this.swiping ? 'disabled' : ''}>Учу →</button>
        </div>`;
    } else if (v === 'session-wrapping') {
      html += `
        <div class="screen-result">
          <div class="summary-card summary-wrapping${this.wrapError ? ' is-failed' : ''}" aria-busy="${this.wrapError ? 'false' : 'true'}" aria-live="polite">
            ${this.wrapError ? '' : '<div class="skeleton-bone skeleton-summary-title"></div>'}
            <p class="${this.wrapError ? 'error' : 'wrapping-copy'}">${this.wrapError ? esc(this.wrapError) : 'Подвожу итоги сессии…'}</p>
            ${this.wrapError ? `
            <div class="screen-actions">
              <button type="button" class="btn btn-primary" data-action="retry-finish">Повторить</button>
              <button type="button" class="btn btn-ghost" data-action="home">На главную</button>
            </div>` : `
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
            </div>`}
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
              ${this.reminder.pendingRebind ? '<p class="settings-hint">Приложение ставили на экран заново — нажмите «Включить», чтобы пуши снова приходили на это устройство.</p>' : ''}
              ${this.reminderError ? `<p class="error">${esc(this.reminderError)}</p>` : ''}
            </div>`)}
          ${settingsGroup('Справка', `
            <nav class="card-form settings-list" aria-label="Справка">
              <a class="settings-row" href="/help/faq.html?from=settings">
                FAQ
                <span class="settings-row-go" aria-hidden="true">›</span>
              </a>
              <a class="settings-row" href="${SUPPORT_TELEGRAM_URL}" target="_blank" rel="noopener noreferrer">
                Багрепорты и поддержка
                <span class="settings-row-go" aria-hidden="true">›</span>
              </a>
              <button type="button" class="settings-row" data-action="updates">
                Что нового
                <span class="settings-row-end">
                  ${this.changelogUnseen ? '<span class="settings-new">новое</span>' : ''}
                  <span class="settings-row-go" aria-hidden="true">›</span>
                </span>
              </button>
              <a class="settings-row" href="${CHANNEL_TELEGRAM_URL}" target="_blank" rel="noopener noreferrer">
                Канал LangSwipe_xyz
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

  /**
   * Streak chip in the top corner. Within 12 hours of the reset deadline it
   * shows a clock on the badge and opens a short explanation on tap.
   * @param {boolean} compact session header omits the word «дней»
   */
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
        >${count}<span class="streak-warn-mark" aria-hidden="true">${STREAK_WARN_SVG}</span></button>
        ${open ? `<span class="streak-risk-note" id="streak-risk-note" role="status">${esc(hint)}</span>` : ''}
      </span>`;
  }

  /**
   * The warning window often opens while the phone is locked. Background timers
   * do not run there, so a stale home screen kept the badge without the clock.
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

  /** Re-render when the warning window opens, and keep an open hint fresh. */
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

const STREAK_WARN_SVG =
  '<svg class="streak-warn-icon" viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" focusable="false"><circle cx="8" cy="8.15" r="5.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M8 4.85V8.25l2.15 1.35"/></svg>';

const IOS_GUIDE_STEP_MS = 3000;

const IOS_GUIDE_STEPS_TAIL = [
  'Нажмите «Поделиться»',
  'Выберите «На экран „Домой“»',
  'Нажмите «Добавить»',
  'Иконка появится на экране „Домой“',
];

const IOS_SHARE_SVG =
  '<svg class="ios-install-share" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M8 9H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2M12 3v12M8.5 6.5 12 3l3.5 3.5"/></svg>';

const IOS_CHEVRON_SVG =
  '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M10 3.2 5.4 8 10 12.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const IOS_DOTS_SVG =
  '<svg viewBox="325.2 41.4 20.6 6.1" width="16" height="16" aria-hidden="true"><path d="M328.244 46.2949C327.219 46.2949 326.389 45.4746 326.389 44.4492C326.389 43.4238 327.219 42.5938 328.244 42.5938C329.27 42.5938 330.09 43.4238 330.09 44.4492C330.09 45.4746 329.27 46.2949 328.244 46.2949ZM335.5 46.2949C334.475 46.2949 333.645 45.4746 333.645 44.4492C333.645 43.4238 334.475 42.5938 335.5 42.5938C336.525 42.5938 337.346 43.4238 337.346 44.4492C337.346 45.4746 336.525 46.2949 335.5 46.2949ZM342.756 46.2949C341.73 46.2949 340.9 45.4746 340.9 44.4492C340.9 43.4238 341.73 42.5938 342.756 42.5938C343.781 42.5938 344.611 43.4238 344.611 44.4492C344.611 45.4746 343.781 46.2949 342.756 46.2949Z" fill="currentColor"/></svg>';

const IOS_PAGE_SVG =
  '<svg viewBox="111.2 51.6 18.8 20.4" width="16" height="16" aria-hidden="true"><path d="M113.366 53.2461C113.454 53.1852 113.66 53.0469 113.763 53.0353C114.17 52.9894 114.618 53.0015 115.028 53.0015L117.133 53.0029L118.93 53.0015C119.303 53.0011 119.68 52.9934 120.046 53.0321C120.383 53.0679 120.785 53.4871 120.825 53.8077C120.898 54.3929 120.869 55.0525 120.869 55.6446C121.025 55.6759 121.071 55.6351 121.193 55.6413C121.566 55.6397 122.068 55.6245 122.425 55.668C122.503 55.6581 122.612 55.6412 122.687 55.6396C122.704 55.7401 122.73 55.8607 122.725 55.9606L122.748 56.317C122.852 56.2876 122.866 56.2611 122.953 56.2863C123.019 56.3815 122.996 56.6044 122.997 56.735C123.001 56.9769 123.005 57.2463 122.978 57.4861C122.978 57.5644 122.989 57.6853 122.945 57.7443C122.889 57.753 122.915 57.7562 122.864 57.7359C122.822 57.7181 122.792 57.7225 122.745 57.7224C122.739 57.8182 122.728 57.9358 122.732 58.0299L122.394 58.0517C122.37 58.1474 122.404 58.2093 122.364 58.2837C122.297 58.3065 122.242 58.2982 122.171 58.2937C121.954 58.306 121.711 58.3219 121.496 58.3047C121.513 58.2457 121.518 58.1317 121.523 58.0658L121.192 58.045L121.025 58.0493L120.871 58.0459C120.863 58.6348 120.861 59.2238 120.867 59.8127C120.873 59.9484 120.876 60.2878 120.833 60.4069C120.754 60.4119 120.687 60.391 120.61 60.3726L120.599 60.734C120.292 60.7844 120.014 60.9502 119.693 60.9751C119.322 61.0039 118.942 60.9956 118.57 60.9958L116.716 60.9962L115.091 60.9957C114.352 60.9953 113.973 61.0623 113.31 60.6843C113.305 60.5956 113.302 60.4813 113.288 60.3956C113.167 60.3734 113.144 60.4213 113.067 60.3929C113.043 60.3201 113.039 60.2635 113.03 60.188C112.993 59.4253 112.997 58.4474 113.024 57.6819C113.029 57.579 113.012 57.5795 113.064 57.5097C113.173 57.4552 113.347 57.4783 113.483 57.4797C113.628 57.4737 113.779 57.4693 113.923 57.4597C113.925 57.5374 113.916 57.6563 113.965 57.7101C114.032 57.7424 114.129 57.7298 114.206 57.7266C114.319 57.7353 114.402 57.7437 114.517 57.7348C114.496 58.0181 114.535 57.9545 114.536 58.0576C114.778 58.0807 115.355 58.0486 115.601 58.0188L115.584 57.9743C115.516 57.9303 115.463 57.8883 115.475 57.8027C115.536 57.756 115.626 57.7517 115.705 57.7402C115.73 57.6985 115.749 57.5515 115.759 57.4949C115.763 57.4073 115.76 57.2911 115.801 57.2164C115.894 57.1506 115.939 57.1627 116.061 57.154C116.068 56.9337 116.063 56.7089 116.034 56.4904C115.959 56.5308 115.925 56.5541 115.841 56.5673C115.686 56.4972 115.856 56.2416 115.503 56.23C115.458 56.1552 115.472 56.0591 115.472 55.9671C115.157 55.9525 114.841 55.9578 114.527 55.9596L114.208 55.9668C114.21 56.0496 114.226 56.1903 114.182 56.2529C114.124 56.2909 114.022 56.2794 113.949 56.2779C113.931 56.3735 113.924 56.443 113.916 56.5401C113.709 56.531 113.539 56.5267 113.332 56.5319C113.246 56.5747 113.154 56.5731 113.073 56.5289C113.018 56.4627 113.028 56.4001 113.029 56.3133C112.98 55.5177 113.001 54.394 113.032 53.5953C113.01 53.2777 113.075 53.2987 113.366 53.2461Z" fill="currentColor" opacity="0.55"/><path d="M127.9 64C128.397 64 128.801 64.4033 128.801 64.9004C128.801 65.3974 128.397 65.8008 127.9 65.8008H113.4C112.903 65.8008 112.5 65.3974 112.5 64.9004C112.5 64.4033 112.903 64 113.4 64H127.9Z" fill="currentColor"/><path d="M122.9 69C123.397 69 123.801 69.4033 123.801 69.9004C123.801 70.3974 123.397 70.8008 122.9 70.8008H113.4C112.903 70.8008 112.5 70.3974 112.5 69.9004C112.5 69.4033 112.903 69 113.4 69H122.9Z" fill="currentColor"/></svg>';

function iosCapIco(svg, label, variant) {
  const extra = variant ? ` ${variant}` : '';
  return `<span class="ios-cap-ico${extra}" role="img" aria-label="${label}">${svg}</span>`;
}

const IOS_GUIDE_STEPS = [
  `Нажмите ${iosCapIco(IOS_DOTS_SVG, 'кнопка с тремя точками, iOS 26')} справа или ${iosCapIco(IOS_PAGE_SVG, 'меню страницы, iOS 27')} слева от адреса`,
  ...IOS_GUIDE_STEPS_TAIL,
];

const IOS_BOOK_SVG =
  '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" d="M12 7.2c-1.4-1-3.6-1.4-6.2-.6v11.2c2.6-.8 4.8-.4 6.2.6 1.4-1 3.6-1.4 6.2-.6V6.6c-2.6-.8-4.8-.4-6.2.6z"/></svg>';

const IOS_TABS_SVG =
  '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="7.2" y="7.2" width="11" height="11" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6.2 15.2V6.8A1.8 1.8 0 0 1 8 5h8.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

function iosSafariPageHtml(dim) {
  return `
    <div class="ios-safari-page${dim ? ' is-dim' : ''}">
      <div class="ios-safari-site">
        <span class="ios-safari-mark">L</span>
        <span class="ios-safari-line"></span>
        <span class="ios-safari-line is-short"></span>
        <span class="ios-safari-line"></span>
      </div>
    </div>`;
}

function iosGuideHtml() {
  return `
    <div class="ios-guide-sheet" tabindex="-1">
      <div class="ios-guide-handle" aria-hidden="true"></div>
      <div class="ios-guide-stage" aria-hidden="true">
        <div class="ios-scene ios-scene-1">
          <div class="ios-phone">
            ${iosSafariPageHtml()}
            <div class="ios-safari-bar ios-bar-both">
              <span class="ios-safari-back">${IOS_CHEVRON_SVG}</span>
              <span class="ios-page">${IOS_PAGE_SVG}</span>
              <span class="ios-safari-url"><span class="ios-safari-lock"></span>langswipe.xyz</span>
              <span class="ios-bar-end">
                <span class="ios-more">${IOS_DOTS_SVG}</span>
                <span class="ios-tabs">${IOS_TABS_SVG}</span>
              </span>
            </div>
            <span class="ios-os-tag is-26">iOS 26</span>
            <span class="ios-os-tag is-27">iOS 27</span>
            <span class="ios-tap"></span>
          </div>
        </div>
        <div class="ios-scene ios-scene-2">
          <div class="ios-phone">
            ${iosSafariPageHtml(true)}
            <div class="ios-more-menu">
              <div class="ios-menu-row is-hit"><span>Поделиться</span>${IOS_SHARE_SVG}</div>
              <div class="ios-menu-row"><span>Закладки</span>${IOS_BOOK_SVG}</div>
              <div class="ios-menu-row"><span>Вкладки</span>${IOS_TABS_SVG}</div>
            </div>
            <div class="ios-safari-bar">
              <span class="ios-safari-back">${IOS_CHEVRON_SVG}</span>
              <span class="ios-page is-on">${IOS_PAGE_SVG}</span>
              <span class="ios-safari-url"><span class="ios-safari-lock"></span>langswipe.xyz</span>
              <span class="ios-tabs is-static">${IOS_TABS_SVG}</span>
            </div>
            <span class="ios-tap"></span>
          </div>
        </div>
        <div class="ios-scene ios-scene-3">
          <div class="ios-phone">
            ${iosSafariPageHtml(true)}
            <div class="ios-share-sheet">
              <div class="ios-share-scroll">
                <div class="ios-share-head">
                  <img src="/apple-touch-icon.png" alt="">
                  <span class="ios-share-meta">
                    <strong>LangSwipe</strong>
                    <small>langswipe.xyz</small>
                    <span class="ios-share-opt">Параметры ›</span>
                  </span>
                  <span class="ios-share-x" aria-hidden="true">×</span>
                </div>
                <div class="ios-share-people">
                  <div class="ios-share-person"><span class="ios-avatar is-a">А</span><span>Аня</span></div>
                  <div class="ios-share-person"><span class="ios-avatar is-m">М</span><span>Марк</span></div>
                  <div class="ios-share-person"><span class="ios-avatar is-l">Л</span><span>Лена</span></div>
                  <div class="ios-share-person"><span class="ios-avatar is-i">И</span><span>Илья</span></div>
                  <div class="ios-share-person"><span class="ios-avatar is-o">О</span><span>Оля</span></div>
                </div>
                <div class="ios-share-apps">
                  <div class="ios-share-app"><span class="ios-glyph is-air"></span><span>AirDrop</span></div>
                  <div class="ios-share-app"><span class="ios-glyph is-msg"></span><span>Сообщения</span></div>
                  <div class="ios-share-app"><span class="ios-glyph is-mail"></span><span>Почта</span></div>
                  <div class="ios-share-app"><span class="ios-glyph is-notes"></span><span>Заметки</span></div>
                  <div class="ios-share-app"><span class="ios-glyph is-rem"></span><span>Напоминания</span></div>
                </div>
                <div class="ios-share-group">
                  <div class="ios-share-row"><span>Скопировать</span><span class="ios-row-ico is-copy"></span></div>
                </div>
                <div class="ios-share-group">
                  <div class="ios-share-row"><span>В список для чтения</span><span class="ios-row-ico is-read"></span></div>
                  <div class="ios-share-row"><span>Добавить закладку</span><span class="ios-row-ico is-book"></span></div>
                  <div class="ios-share-row"><span>В избранное</span><span class="ios-row-ico is-star"></span></div>
                  <div class="ios-share-row"><span>Найти на странице</span><span class="ios-row-ico is-find"></span></div>
                  <div class="ios-share-row is-hit"><span>На экран «Домой»</span><span class="ios-row-ico is-plus"></span></div>
                </div>
                <div class="ios-share-group">
                  <div class="ios-share-row"><span>Разметка</span><span class="ios-row-ico is-mark"></span></div>
                  <div class="ios-share-row"><span>Печать</span><span class="ios-row-ico is-print"></span></div>
                </div>
                <p class="ios-share-edit">Изменить действия…</p>
              </div>
            </div>
            <span class="ios-tap"></span>
          </div>
        </div>
        <div class="ios-scene ios-scene-4">
          <div class="ios-phone">
            <div class="ios-add-card">
              <div class="ios-add-head">
                <span class="ios-add-x" aria-hidden="true">×</span>
                <span>На экран «Домой»</span>
                <span class="ios-add-go">Добавить</span>
              </div>
              <div class="ios-add-app">
                <img src="/apple-touch-icon.png" alt="">
                <span>
                  <strong>LangSwipe</strong>
                  <small>langswipe.xyz</small>
                </span>
                <span class="ios-add-clear" aria-hidden="true">×</span>
              </div>
              <div class="ios-add-toggle">
                <span>Открыть как веб-приложение</span>
                <span class="ios-switch" aria-hidden="true"></span>
              </div>
              <p class="ios-add-note">Значок на экране «Домой» для быстрого доступа к сайту.</p>
            </div>
            <span class="ios-tap"></span>
          </div>
        </div>
        <div class="ios-scene ios-scene-5">
          <div class="ios-phone ios-home">
            <div class="ios-home-grid">
              <div class="ios-home-app is-new">
                <img src="/apple-touch-icon.png" alt="">
                <span>LangSwipe</span>
              </div>
              <div class="ios-home-app">
                <span class="ios-home-blob is-cal"><b>17</b></span>
                <span>Календарь</span>
              </div>
              <div class="ios-home-app">
                <span class="ios-home-blob is-photos"></span>
                <span>Фото</span>
              </div>
              <div class="ios-home-app">
                <span class="ios-home-blob is-cam"></span>
                <span>Камера</span>
              </div>
            </div>
            <div class="ios-home-dock" aria-hidden="true">
              <span></span><span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>
      <h2 id="ios-guide-title">Добавить на домашний экран</h2>
      <p class="ios-guide-note" hidden>Сначала откройте сайт в Safari.</p>
      <p class="ios-guide-caption" aria-live="polite"></p>
      <button type="button" class="btn btn-primary ios-guide-done">Понятно</button>
    </div>`;
}

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

function sessionSaveError(error) {
  if (!error || error.name === 'TimeoutError' || error.name === 'AbortError' || error.name === 'TypeError') {
    return 'Сервер временно недоступен';
  }
  return error.message || 'Сервер временно недоступен';
}

function isTransientApiError(error) {
  const status = error?.status;
  if (status == null) return true;
  return status === 408 || status === 429 || status >= 500;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function abortAfter(ms) {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
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

/** Same 16-hex SHA-256 prefix as server `pushEndpointTag`. */
async function endpointTag(endpoint) {
  if (!endpoint || !crypto?.subtle) return null;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
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
