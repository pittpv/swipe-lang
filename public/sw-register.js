/** Register the service worker as early as possible, bypassing HTTP cache. */
if ('serviceWorker' in navigator) {
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
