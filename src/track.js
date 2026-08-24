const API = '/api';

/** Reads the double-submit CSRF cookie set by the server. */
export function getCsrfToken() {
  const pair = document.cookie.split('; ').find((c) => c.startsWith('csrf_token='));
  return pair ? decodeURIComponent(pair.split('=')[1]) : '';
}

export function track(event) {
  return fetch(`${API}/analytics`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfToken() },
    body: JSON.stringify({ event }),
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
