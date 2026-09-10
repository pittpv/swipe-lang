const RETURN_HREF = {
  settings: '/?open=settings',
  home: '/',
};

const back = document.querySelector('[data-info-back]');
if (back) {
  const from = new URLSearchParams(location.search).get('from');
  if (from && RETURN_HREF[from]) back.setAttribute('href', RETURN_HREF[from]);
}
