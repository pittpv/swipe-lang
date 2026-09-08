/** Appearance preference: system follows the OS; light/dark pin the palette. */
export const THEME_KEY = 'langapp.theme';
export const THEME_CHOICES = [
  { value: 'system', label: 'Система' },
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
];

const LIGHT_CHROME = '#1a5f4a';
const DARK_CHROME = '#121916';

export function getThemePreference() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    /* private mode */
  }
  return 'system';
}

export function resolveTheme(pref = getThemePreference()) {
  if (pref === 'light' || pref === 'dark') return pref;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function syncThemeColor(pref, resolved) {
  const override = document.querySelector('meta[name="theme-color"][data-theme-override]');
  if (pref === 'system') {
    override?.remove();
    return;
  }
  let meta = override;
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    meta.setAttribute('data-theme-override', '');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', resolved === 'dark' ? DARK_CHROME : LIGHT_CHROME);
}

export function applyTheme(pref = getThemePreference()) {
  const root = document.documentElement;
  if (pref === 'light' || pref === 'dark') root.setAttribute('data-theme', pref);
  else root.removeAttribute('data-theme');
  syncThemeColor(pref, resolveTheme(pref));
}

export function setThemePreference(pref) {
  const next = pref === 'light' || pref === 'dark' || pref === 'system' ? pref : 'system';
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* private mode */
  }
  applyTheme(next);
}

export function initTheme() {
  applyTheme();
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const onSchemeChange = () => applyTheme();
  mq.addEventListener('change', onSchemeChange);
  window.addEventListener('storage', (event) => {
    if (event.key === THEME_KEY) applyTheme();
  });
}
