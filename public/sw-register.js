/** Register the service worker as early as possible, bypassing HTTP cache. */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(function () {});
}
