import './styles.css';
import { api, App } from './app.js';

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

  try {
    await app.init();
  } catch {
    /* still dismiss so the user is never stuck on the splash */
  }

  const minMs = prefersReducedMotion() ? 0 : SPLASH_MIN_MS;
  await wait(minMs - (performance.now() - started));
  await dismissSplash(splash);
}

void boot();

export { api };
