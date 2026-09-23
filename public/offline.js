/** Probe the network and reopen the app as soon as it comes back. */
(function () {
  const retryBtn = document.getElementById('offline-retry');
  const statusEl = document.getElementById('offline-status');
  const idleText = 'Жду связь.';
  let probing = false;

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function goHome() {
    location.replace('/');
  }

  async function probe(fromUser) {
    if (probing) return;
    probing = true;
    if (fromUser && retryBtn) retryBtn.disabled = true;
    setStatus('Проверяю связь…');
    try {
      const res = await fetch('/manifest.json?offline-probe=' + Date.now(), {
        method: 'GET',
        cache: 'no-store',
        credentials: 'same-origin',
      });
      if (res.ok) {
        setStatus('Есть сеть, открываю…');
        goHome();
        return;
      }
    } catch {
      /* still offline */
    } finally {
      probing = false;
      if (retryBtn) retryBtn.disabled = false;
      if (statusEl && statusEl.textContent === 'Проверяю связь…') setStatus(idleText);
    }
  }

  const stayOnPage = /\/offline\.html$/i.test(location.pathname);

  window.addEventListener('online', () => {
    if (!stayOnPage) probe(false);
  });

  document.addEventListener('visibilitychange', () => {
    if (!stayOnPage && document.visibilityState === 'visible') probe(false);
  });

  retryBtn?.addEventListener('click', () => {
    probe(true);
  });

  if (!stayOnPage) {
    setInterval(() => {
      if (document.visibilityState === 'visible') probe(false);
    }, 4000);

    if (navigator.onLine) probe(false);
  }
})();
