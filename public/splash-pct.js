/** Splash percent: real boot progress, never 100% until the app is ready. */
(function () {
  var num = document.querySelector('.splash-pct-num');
  if (!num) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var displayed = 1;
  var target = 1;
  var finished = false;
  var raf = 0;

  function render(value) {
    num.textContent = String(Math.max(1, Math.min(100, Math.round(value))));
  }

  function setTarget(next) {
    if (finished) return;
    next = Math.max(1, Math.min(99, next));
    if (next <= target) return;
    target = next;
    if (reduced) {
      displayed = target;
      render(displayed);
      return;
    }
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function finish() {
    finished = true;
    target = 100;
    displayed = 100;
    render(100);
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  function tick() {
    raf = 0;
    if (displayed < target) {
      var gap = target - displayed;
      displayed += Math.max(0.4, gap * 0.2);
      if (displayed > target) displayed = target;
      render(displayed);
    }
    if (!finished && displayed < target) raf = requestAnimationFrame(tick);
  }

  window.__langSplash = { set: setTarget, finish: finish };

  setTarget(3);

  function resourceScore() {
    var entries = [];
    try {
      entries = performance.getEntriesByType('resource');
    } catch (err) {
      /* private mode */
    }
    var keys = [
      'theme.css',
      'splash.css',
      'theme-boot.js',
      'splash-pct.js',
      'main.js',
      '/assets/',
      'fonts.googleapis',
      'fonts.gstatic',
    ];
    var hits = 0;
    for (var i = 0; i < keys.length; i++) {
      for (var j = 0; j < entries.length; j++) {
        if (entries[j].name.indexOf(keys[i]) !== -1) {
          hits += 1;
          break;
        }
      }
    }
    var cssDone = 0;
    var cssTotal = 0;
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    for (var c = 0; c < links.length; c++) {
      cssTotal += 1;
      if (links[c].sheet) cssDone += 1;
    }
    var fonts = 0;
    try {
      if (document.fonts && document.fonts.status === 'loaded') fonts = 1;
    } catch (err) {
      fonts = 0;
    }
    var fraction =
      (hits / keys.length) * 0.72 + (cssTotal ? cssDone / cssTotal : 0) * 0.18 + fonts * 0.1;
    setTarget(4 + Math.round(fraction * 44));
  }

  try {
    var observer = new PerformanceObserver(function () {
      resourceScore();
    });
    observer.observe({ type: 'resource', buffered: true });
  } catch (err) {
    /* older webviews */
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      setTarget(34);
      resourceScore();
    }).catch(function () {});
  }

  function watchModule() {
    var scripts = document.querySelectorAll('script[type="module"][src]');
    var script = scripts[scripts.length - 1];
    if (!script) return false;
    script.addEventListener('load', function () {
      setTarget(50);
    });
    script.addEventListener('error', function () {
      setTarget(50);
    });
    return true;
  }

  if (!watchModule()) {
    var retries = 0;
    var arm = function () {
      if (watchModule() || retries > 40) return;
      retries += 1;
      requestAnimationFrame(arm);
    };
    requestAnimationFrame(arm);
  }

  document.addEventListener('DOMContentLoaded', function () {
    setTarget(16);
    resourceScore();
  });

  resourceScore();
  if (!reduced) raf = requestAnimationFrame(tick);
})();
