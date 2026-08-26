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
  // Declarative payloads nest fields under `notification`; classic keeps them top-level.
  const notif = data.notification && typeof data.notification === 'object' ? data.notification : {};
  const title = notif.title || data.title || 'LangApp';
  const body = notif.body || data.body || 'Пора повторить слова!';
  const url = notif.navigate || data.url || '/';
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
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

/**
 * Browser rotated or revoked the push endpoint. Rebind while the session cookie
 * still works so the server does not keep a dead Apple URL until next app open.
 */
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const [configRes, statusRes] = await Promise.all([
          fetch('/api/push/config', { credentials: 'include' }),
          fetch('/api/push/status', { credentials: 'include' }),
        ]);
        if (!configRes.ok || !statusRes.ok) return;
        const config = await configRes.json();
        const status = await statusRes.json();
        if (!status.enabled || !status.time || !config.publicKey) return;

        const raw = atob(config.publicKey.replace(/-/g, '+').replace(/_/g, '/'));
        const applicationServerKey = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) applicationServerKey[i] = raw.charCodeAt(i);

        const subscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
        await fetch('/api/push/subscribe', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
            reminderTime: status.time,
            tzOffsetMinutes: new Date().getTimezoneOffset(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        });
      } catch {
        /* next app-open heal will retry */
      }
    })(),
  );
});
