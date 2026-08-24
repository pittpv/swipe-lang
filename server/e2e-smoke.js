/**
 * E2E smoke test — requires server on PORT (default 3000).
 * Run: node server/index.js & npm run test:e2e
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.API_URL || 'http://localhost:3000';
const email = `e2e_${Date.now()}@langapp.test`;
const password = 'testpass123';

function jar() {
  // name -> value map so cleared cookies are replaced, not duplicated.
  const cookies = new Map();
  let csrf = '';
  return {
    async fetch(path, opts = {}) {
      const headers = { 'Content-Type': 'application/json', ...opts.headers };
      if (cookies.size) headers.Cookie = [...cookies].map(([k, v]) => `${k}=${v}`).join('; ');
      if (csrf && opts.method && opts.method !== 'GET') headers['X-CSRF-Token'] = csrf;
      const res = await fetch(`${BASE}${path}`, { ...opts, headers });
      const set = res.headers.getSetCookie?.() ?? [];
      for (const c of set) {
        const part = c.split(';')[0];
        const eq = part.indexOf('=');
        const name = part.slice(0, eq);
        const value = part.slice(eq + 1);
        if (value) cookies.set(name, value);
        else cookies.delete(name);
        if (name === 'csrf_token') csrf = value;
      }
      const data = await res.json().catch(() => ({}));
      return { res, data };
    },
  };
}

test('health has vocabulary', async () => {
  const res = await fetch(`${BASE}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.words >= 3000, `expected 3000+ words, got ${data.words}`);
});

test('mutating api rejects without csrf token', async () => {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `csrf_${Date.now()}@langapp.test`, password: 'testpass123' }),
  });
  assert.equal(res.status, 403);
});

test('full user flow', async () => {
  const client = jar();
  // Warm-up GET so the server sets the csrf_token cookie first.
  await client.fetch('/api/public/stats');

  let { res, data } = await client.fetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  assert.equal(res.status, 200, JSON.stringify(data));
  assert.equal(data.needsOnboarding, true);

  ({ res, data } = await client.fetch('/api/onboarding', {
    method: 'POST',
    body: JSON.stringify({ goal: 'travel', cefrLevel: 'A1' }),
  }));
  assert.equal(res.status, 200);

  ({ res, data } = await client.fetch('/api/session/start', { method: 'POST' }));
  assert.equal(res.status, 200);
  assert.ok(data.cards.length >= 15);
  assert.ok(data.cards[0].lemma);
  assert.ok(data.cards[0].translation);

  const wordId = data.cards[0].id;
  ({ res } = await client.fetch('/api/session/swipe', {
    method: 'POST',
    body: JSON.stringify({ wordId, direction: 'right' }),
  }));
  assert.equal(res.status, 200);

  ({ res, data } = await client.fetch('/api/stats'));
  assert.equal(res.status, 200);
  assert.ok(data.wordsLearned >= 1);
});

test('account deletion removes user and data', async () => {
  const client = jar();
  const delEmail = `del_${Date.now()}@langapp.test`;

  await client.fetch('/api/public/stats');
  let { res, data } = await client.fetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email: delEmail, password }),
  });
  assert.equal(res.status, 200);

  ({ res } = await client.fetch('/api/onboarding', {
    method: 'POST',
    body: JSON.stringify({ goal: 'travel', cefrLevel: 'A1' }),
  }));
  assert.equal(res.status, 200);

  ({ res, data } = await client.fetch('/api/session/start', { method: 'POST' }));
  assert.equal(res.status, 200);
  const wordId = data.cards[0].id;
  ({ res } = await client.fetch('/api/session/swipe', {
    method: 'POST',
    body: JSON.stringify({ wordId, direction: 'left' }),
  }));
  assert.equal(res.status, 200);

  ({ res } = await client.fetch('/api/account', { method: 'DELETE' }));
  assert.equal(res.status, 200);

  // Session destroyed — authenticated endpoints must reject.
  ({ res } = await client.fetch('/api/auth/me'));
  assert.equal(res.status, 401);

  // Account deletion also clears the csrf_token cookie — fetch a fresh one,
  // then verify old credentials no longer work (user removed).
  ({ res } = await client.fetch('/api/public/stats'));
  assert.equal(res.status, 200);
  ({ res } = await client.fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: delEmail, password }),
  }));
  assert.equal(res.status, 401);
});

test('push reminder endpoints', async () => {
  const client = jar();
  await client.fetch('/api/public/stats');
  let { res } = await client.fetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email: `push_${Date.now()}@langapp.test`, password }),
  });
  assert.equal(res.status, 200);

  ({ res } = await client.fetch('/api/push/config'));
  assert.equal(res.status, 200);

  ({ res } = await client.fetch('/api/push/status'));
  assert.equal(res.status, 200);

  // Callback must reject requests without the internal secret.
  ({ res } = await client.fetch('/api/cron/reminders', {
    method: 'POST',
    body: JSON.stringify({ userId: 1 }),
  }));
  assert.equal(res.status, 401);

  ({ res } = await client.fetch('/api/push/unsubscribe', { method: 'POST' }));
  assert.equal(res.status, 200);
});

test('profile level update', async () => {
  const client = jar();
  await client.fetch('/api/public/stats');
  let { res: regRes } = await client.fetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email: `profile_${Date.now()}@langapp.test`, password }),
  });
  assert.equal(regRes.status, 200);

  ({ res: regRes } = await client.fetch('/api/onboarding', {
    method: 'POST',
    body: JSON.stringify({ goal: 'travel', cefrLevel: 'A1' }),
  }));
  assert.equal(regRes.status, 200);

  let { res, data } = await client.fetch('/api/profile', {
    method: 'PATCH',
    body: JSON.stringify({ cefrLevel: 'B1' }),
  });
  assert.equal(res.status, 200);
  assert.equal(data.cefrLevel, 'B1');

  ({ res, data } = await client.fetch('/api/auth/me'));
  assert.equal(res.status, 200);
  assert.equal(data.cefrLevel, 'B1');

  ({ res } = await client.fetch('/api/profile', {
    method: 'PATCH',
    body: JSON.stringify({ cefrLevel: 'Z9' }),
  }));
  assert.equal(res.status, 400);
});
