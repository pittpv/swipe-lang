/* LangApp service worker — Web Push delivery for study reminders. */

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { body: event.data?.text() };
  }
  const title = data.notification?.title || data.title || 'LangApp';
  const body = data.notification?.body || data.body || 'Пора повторить слова!';
  const url = data.notification?.navigate || data.url || '/';
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag: data.notification?.tag || 'langapp-reminder',
      data: { url },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    (async () => {
      const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windowClients) {
        if ('focus' in client) return client.focus();
      }
      return clients.openWindow(url);
    })(),
  );
});
