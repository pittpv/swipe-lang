/* LangSwipe service worker — Web Push + offline navigation fallback. */

const OFFLINE_CACHE = 'langswipe-offline-v4';
const STATIC_CACHE = 'langswipe-static-v2';
/* Phone often stays "online" with no route, and the hung fetch is the blank wait. */
const FAST_FAIL_MS = 700;
const PATIENT_MS = 8000;
const OFFLINE_URL = '/offline.html';
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/offline.js',
  '/offline.css',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
];

function isHtmlNavigation(request) {
  if (request.method !== 'GET') return false;
  if (request.mode === 'navigate') return true;
  if (request.destination === 'document') return true;
  const accept = request.headers.get('accept') || '';
  if (accept.includes('text/html')) return true;
  try {
    const path = new URL(request.url, self.location.origin).pathname;
    return path === '/' || path === '/index.html' || path.endsWith('.html');
  } catch {
    return false;
  }
}

function isStaticAsset(url) {
  try {
    const path = new URL(url, self.location.origin).pathname;
    if (path.startsWith('/assets/')) return true;
    return path.startsWith('/fonts/') && path.endsWith('.woff2');
  } catch {
    return false;
  }
}

async function cacheFirstStatic(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone()).catch(() => {});
    return response;
  } catch {
    return Response.error();
  }
}

function precachePath(url) {
  try {
    const path = new URL(url, self.location.origin).pathname;
    return PRECACHE_URLS.indexOf(path) !== -1;
  } catch {
    return false;
  }
}

function offlineFallbackHtml() {
  return new Response(
    '<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Нет интернета</title></head><body style="margin:0;min-height:100dvh;display:grid;place-items:center;font-family:system-ui;background:#f4f7f5;color:#1a5f4a;text-align:center;padding:1.5rem"><div><p style="font-size:1.75rem;font-weight:700;margin:0">LangSwipe</p><h1 style="font-size:1.5rem;margin:1rem 0 0.5rem">Нет интернета</h1><p style="color:#5c6b64">Появится связь — откроется само.</p><p><a href="/" style="color:#1a5f4a">Повторить</a></p></div></body></html>',
    {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    },
  );
}

/**
 * Rebuild the offline page with a decoded body and fresh headers.
 * Copying Content-Encoding / Content-Length off the cached response makes
 * WebKit and Chromium decode the HTML a second time and paint a blank page.
 */
async function asOfflineDocument(response) {
  try {
    const html = await response.text();
    if (html.indexOf('Нет интернета') === -1) return offlineFallbackHtml();
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return offlineFallbackHtml();
  }
}

async function fromPrecache() {
  try {
    const cache = await caches.open(OFFLINE_CACHE);
    const cached = await cache.match(OFFLINE_URL, { ignoreSearch: true });
    if (cached) return asOfflineDocument(cached);
  } catch {
    /* Cache Storage unavailable */
  }
  return offlineFallbackHtml();
}

async function isUsableDocument(response) {
  if (!response || response.type === 'error' || response.status === 304 || !response.ok) return false;
  const type = response.headers.get('content-type') || '';
  if (type && !/text\/html/i.test(type)) return false;
  try {
    const text = await response.clone().text();
    return text.indexOf('<html') !== -1 || text.indexOf('<HTML') !== -1;
  } catch {
    return false;
  }
}

function isDefinitelyOffline() {
  const nav = self.navigator;
  if (!nav) return false;
  if (nav.onLine === false) return true;
  const conn = nav.connection;
  return Boolean(conn && (conn.type === 'none' || conn.downlink === 0));
}

/** Probe already proved the network; this navigation may take longer. */
function patientNavigation(url) {
  try {
    return new URL(url).searchParams.get('online') === '1';
  } catch {
    return false;
  }
}

function documentUrl(url) {
  const target = new URL(url);
  target.searchParams.delete('online');
  return target.href;
}

async function networkOrOffline(request) {
  // A cached index.html (stale-if-error) is still a 200 while the radio is off.
  // Treating that as success loads the app shell without its scripts: a white screen.
  const patient = patientNavigation(request.url);
  if (!patient && isDefinitelyOffline()) return fromPrecache();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), patient ? PATIENT_MS : FAST_FAIL_MS);
  try {
    const response = await fetch(documentUrl(request.url), {
      credentials: 'same-origin',
      redirect: 'follow',
      cache: 'no-store',
      signal: controller.signal,
    });
    if (await isUsableDocument(response)) return response;
  } catch {
    /* offline, timeout, or failed revalidation */
  } finally {
    clearTimeout(timer);
  }
  return fromPrecache();
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(OFFLINE_CACHE);
      const offline = await fetch(OFFLINE_URL, { cache: 'reload', credentials: 'same-origin' });
      if (!offline.ok) throw new Error('offline.html');
      const text = await offline.clone().text();
      if (text.indexOf('Нет интернета') === -1) throw new Error('offline.html mismatch');
      await cache.put(OFFLINE_URL, offline);
      await Promise.all(
        PRECACHE_URLS.filter((url) => url !== OFFLINE_URL).map(async (url) => {
          try {
            const res = await fetch(url, { cache: 'reload', credentials: 'same-origin' });
            if (res.ok) await cache.put(url, res);
          } catch {
            /* page still works without extras */
          }
        }),
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
          .filter(
            (key) =>
              (key.startsWith('langswipe-offline-') && key !== OFFLINE_CACHE) ||
              (key.startsWith('langswipe-static-') && key !== STATIC_CACHE),
          )
          .map((key) => caches.delete(key)),
      );
      if (self.registration.navigationPreload) {
        try {
          // Preload is satisfied from HTTP cache while offline and comes back
          // as an empty 304 or a cached shell. Either one paints white.
          await self.registration.navigationPreload.disable();
        } catch {
          /* Safari */
        }
      }
      await clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  if (isHtmlNavigation(request)) {
    event.respondWith(
      (async () => {
        // Don't paint a preload and don't wait on it: an offline preload
        // hangs the navigation on a blank window.
        const preload = event.preloadResponse;
        if (preload) preload.then(() => {}, () => {});
        return networkOrOffline(request);
      })(),
    );
    return;
  }

  if (isStaticAsset(request.url)) {
    event.respondWith(cacheFirstStatic(request));
    return;
  }

  if (precachePath(request.url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(OFFLINE_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response && response.ok) {
            cache.put(request, response.clone()).catch(() => {});
            return response;
          }
        } catch {
          /* miss */
        }
        return Response.error();
      })(),
    );
  }
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { body: event.data?.text() };
  }
  const notif = data.notification && typeof data.notification === 'object' ? data.notification : {};
  const title = notif.title || data.title || 'LangSwipe';
  const body = notif.body || data.body || 'Пора повторить слова!';
  const url = notif.navigate || data.url || '/';
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
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

/** Same 16-hex SHA-256 prefix as server `pushEndpointTag`. */
async function endpointTag(endpoint) {
  if (!endpoint || !crypto?.subtle) return null;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

function vapidKeyBytes(publicKey) {
  const raw = atob(publicKey.replace(/-/g, '+').replace(/_/g, '/'));
  const applicationServerKey = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) applicationServerKey[i] = raw.charCodeAt(i);
  return applicationServerKey;
}

async function csrfHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  try {
    const cookie = await self.cookieStore?.get?.('csrf_token');
    if (cookie?.value) headers['X-CSRF-Token'] = cookie.value;
  } catch {
    /* Cookie Store is missing on some browsers; the next app open heals. */
  }
  return headers;
}

async function postPushSubscription(subscription, reminderTime, replaceRevoked) {
  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    credentials: 'include',
    headers: await csrfHeaders(),
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      reminderTime,
      tzOffsetMinutes: new Date().getTimezoneOffset(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      replaceRevoked,
    }),
  });
  if (res.status === 409) return 'rotate';
  return res.ok ? 'ok' : 'fail';
}

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

        const applicationServerKey = vapidKeyBytes(config.publicKey);
        let current = await self.registration.pushManager.getSubscription();
        let replaceRevoked = false;
        if (current && status.revokedTag && (await endpointTag(current.endpoint)) === status.revokedTag) {
          await current.unsubscribe().catch(() => {});
          current = null;
          replaceRevoked = true;
        }
        const subscription =
          current ||
          (await self.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          }));
        const posted = await postPushSubscription(subscription, status.time, replaceRevoked);
        if (posted !== 'rotate') return;
        await subscription.unsubscribe().catch(() => {});
        const fresh = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
        await postPushSubscription(fresh, status.time, true);
      } catch {
        /* next app-open heal will retry */
      }
    })(),
  );
});
