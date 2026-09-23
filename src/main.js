import './styles.css';
import { initTheme } from './theme.js';
import { api, App } from './app.js';

initTheme();

/** Enter + hold before the 400ms exit — total splash ~2.8s on a fast boot. */
const SPLASH_MIN_MS = 2400;
const SPLASH_LEAVE_FALLBACK_MS = 500;

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function wait(ms) {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function dismissSplash(el) {
  const app = document.getElementById('app');
  const reveal = () => {
    document.documentElement.classList.remove('is-booting');
    app?.removeAttribute('aria-hidden');
  };

  if (!el) {
    reveal();
    return Promise.resolve();
  }

  if (prefersReducedMotion()) {
    el.remove();
    reveal();
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      el.remove();
      reveal();
      resolve();
    };

    el.classList.add('is-leaving');
    el.setAttribute('aria-busy', 'false');
    window.__langSplash?.finish();
    el.addEventListener('animationend', (event) => {
      if (event.target === el) finish();
    });
    setTimeout(finish, SPLASH_LEAVE_FALLBACK_MS);
  });
}

async function boot() {
  const splash = document.getElementById('app-splash');
  const started = performance.now();
  const root = document.getElementById('app');
  const app = new App(root);
  window.__langSplash?.set(54);

  try {
    await app.init();
  } catch {
    /* still dismiss so the user is never stuck on the splash */
  }

  window.__langSplash?.set(96);
  const minMs = prefersReducedMotion() ? 0 : SPLASH_MIN_MS;
  const remaining = minMs - (performance.now() - started);
  if (remaining > 0) {
    window.__langSplash?.set(99);
    await wait(remaining);
  }
  await dismissSplash(splash);
}

void boot();

export { api };
