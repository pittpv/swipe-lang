const RETURN_KEY = 'langapp.returnView';

const back = document.querySelector('[data-info-back]');
if (back) {
  const from = new URLSearchParams(location.search).get('from');
  if (from) {
    try {
      sessionStorage.setItem(RETURN_KEY, from);
    } catch {
      /* private mode */
    }
  }

  back.addEventListener('click', (e) => {
    e.preventDefault();
    let sameOrigin = false;
    try {
      sameOrigin = Boolean(document.referrer) && new URL(document.referrer).origin === location.origin;
    } catch {
      sameOrigin = false;
    }
    if (sameOrigin && history.length > 1) {
      history.back();
      return;
    }
    let stored = from || '';
    try {
      stored = stored || sessionStorage.getItem(RETURN_KEY) || '';
    } catch {
      /* private mode */
    }
    location.href = stored === 'settings' ? '/?open=settings' : '/';
  });
}
