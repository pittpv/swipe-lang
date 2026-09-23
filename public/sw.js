/* LangSwipe service worker — Web Push + offline navigation fallback. */

const OFFLINE_CACHE = 'langswipe-offline-v1';
const OFFLINE_URL = '/offline.html';
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/offline.css',
  '/offline.js',
  '/theme.css',
  '/theme-boot.js',
  '/favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(OFFLINE_CACHE);
      await Promise.all(
        PRECACHE_URLS.map((url) => cache.add(url).catch(() => {})),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('langswipe-offline-') && key !== OFFLINE_CACHE)
          .map((key) => caches.delete(key)),
      );
      await clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (request.mode !== 'navigate') return;

  event.respondWith(
    (async () => {
      try {
        return await fetch(request);
      } catch {
        const cache = await caches.open(OFFLINE_CACHE);
        const cached = await cache.match(OFFLINE_URL);
        if (cached) return cached;
        return new Response('Нет интернета', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
    })(),
  );
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { body: event.data?.text() };
  }
  // Declarative payloads nest fields under `notification`; classic keeps them top-level.
  const notif = data.notification && typeof data.notification === 'object' ? data.notification : {};
  const title = notif.title || data.title || 'LangSwipe';
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
