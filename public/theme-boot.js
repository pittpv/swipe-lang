/** First-paint theme: apply before CSS so splash/PWA chrome match the preference. */
(function () {
  var KEY = 'langapp.theme';
  var LIGHT_CHROME = '#1a5f4a';
  var DARK_CHROME = '#121916';
  var pref = 'system';

  try {
    var stored = localStorage.getItem(KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') pref = stored;
  } catch (e) {
    /* private mode */
  }

  var root = document.documentElement;
  if (pref === 'light' || pref === 'dark') root.setAttribute('data-theme', pref);
  else root.removeAttribute('data-theme');

  var resolved =
    pref === 'dark' ||
    (pref !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'dark'
      : 'light';

  var override = document.querySelector('meta[name="theme-color"][data-theme-override]');
  if (pref === 'system') {
    if (override) override.remove();
    return;
  }

  if (!override) {
    override = document.createElement('meta');
    override.setAttribute('name', 'theme-color');
    override.setAttribute('data-theme-override', '');
    document.head.appendChild(override);
  }
  override.setAttribute('content', resolved === 'dark' ? DARK_CHROME : LIGHT_CHROME);
})();
