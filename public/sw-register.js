/** Register the service worker as early as possible, bypassing HTTP cache. */
if ('serviceWorker' in navigator) {
  try {
    var params = new URLSearchParams(location.search);
    if (params.has('online')) {
      params.delete('online');
      var qs = params.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
    }
  } catch (e) {
    /* private mode */
  }
  var registration = navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
  registration.catch(function () {});
  if (
    navigator.onLine === false &&
    navigator.serviceWorker.controller &&
    !/\/offline\.html$/i.test(location.pathname)
  ) {
    location.replace('/offline.html');
  }
}
