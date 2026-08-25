const API = '/api';

/** Reads the double-submit CSRF cookie set by the server. */
export function getCsrfToken() {
  const pair = document.cookie.split('; ').find((c) => c.startsWith('csrf_token='));
  return pair ? decodeURIComponent(pair.split('=')[1]) : '';
}

async function parseJson(res) {
  return res.json().catch(() => ({}));
}

/** One automatic retry: iOS PWAs often apply Set-Cookie after the first POST has already fired. */
export async function api(path, options = {}, isRetry = false) {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfToken(), ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await parseJson(res);
  if (res.status === 403 && data.error === 'Invalid CSRF token' && !isRetry) {
    await new Promise((r) => setTimeout(r, 50));
    return api(path, options, true);
  }
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export function track(event) {
  return fetch(`${API}/analytics`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfToken() },
    body: JSON.stringify({ event }),
  }).then(async (res) => {
    if (res.status !== 403) return;
    const data = await res.json().catch(() => ({}));
    if (data.error !== 'Invalid CSRF token') return;
    await new Promise((r) => setTimeout(r, 50));
    return fetch(`${API}/analytics`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfToken() },
      body: JSON.stringify({ event }),
    });
  }).catch(() => {});
}

export function captureReferralFromUrl() {
  const ref = new URLSearchParams(window.location.search).get('ref');
  if (ref) sessionStorage.setItem('langapp_ref', ref);
  return ref;
}

export function getStoredReferral() {
  return sessionStorage.getItem('langapp_ref') || null;
}

export async function fetchPublicStats() {
  const res = await fetch(`${API}/public/stats`);
  if (!res.ok) return { words: 3500, sessionSize: 18 };
  return res.json();
}
