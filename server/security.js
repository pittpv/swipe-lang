import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const isProd = process.env.NODE_ENV === 'production';

let cachedDevSecret = null;

export function resolveSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (isProd) {
    throw new Error('SESSION_SECRET must be set (min 32 chars) in production');
  }
  // Random per process — must stay stable within one run, or signed
  // session cookies can never be verified.
  cachedDevSecret ??= randomBytes(32).toString('hex');
  return cachedDevSecret;
}

// Strict CSP — no inline scripts allowed anywhere (app JS is bundled by Vite,
// admin dashboard script lives in /admin/dashboard.js).
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "manifest-src 'self'",
  'object-src \'none\'',
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

export function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Content-Security-Policy', CONTENT_SECURITY_POLICY);
  if (isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
}

// --- CSRF protection (double-submit cookie pattern) ---

export const CSRF_COOKIE = 'csrf_token';
export const CSRF_HEADER = 'x-csrf-token';

/** Sets the readable csrf_token cookie once per browser (on any request). */
export function ensureCsrfToken(req, res, next) {
  if (!req.cookies?.[CSRF_COOKIE]) {
    res.cookie(CSRF_COOKIE, randomBytes(32).toString('hex'), {
      httpOnly: false,
      sameSite: 'lax',
      secure: isProd,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
  next();
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Requires matching X-CSRF-Token header on every mutating /api request. */
export function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method) || !req.path.startsWith('/api')) return next();
  // The QStash callback is machine-to-machine and authorized by its own
  // shared secret (x-internal-secret) inside the route — no CSRF applies.
  if (req.path === '/api/cron/reminders') return next();
  const header = req.get(CSRF_HEADER) ?? '';
  const cookie = req.cookies?.[CSRF_COOKIE] ?? '';
  const tokensMatch =
    header.length > 0 &&
    header.length === cookie.length &&
    timingSafeEqual(Buffer.from(header), Buffer.from(cookie));
  if (!tokensMatch) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  next();
}

const buckets = new Map();

export function rateLimit({ windowMs = 60_000, max = 60, keyFn }) {
  return (req, res, next) => {
    const key = keyFn(req);
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || now > bucket.reset) {
      bucket = { count: 0, reset: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > max) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    next();
  };
}

export const authRateLimit = rateLimit({
  windowMs: 15 * 60_000,
  max: 20,
  keyFn: (req) => `auth:${req.ip}:${req.path}`,
});

export function validateEmail(email) {
  if (typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  return normalized.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export function validatePassword(password) {
  return typeof password === 'string' && password.length >= 8 && password.length <= 128;
}

// --- Stateless HMAC-signed session cookie ---
// Replaces express-session MemoryStore so auth survives serverless cold starts.
// Payload: { userId?, activeSessionId?, sessionStats?, exp } base64url + HMAC-SHA256.

export const SESSION_COOKIE = 'langapp_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function hmac(value) {
  return createHmac('sha256', resolveSessionSecret()).update(value).digest('base64url');
}

export function encodeSession(payload) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + SESSION_TTL_MS })).toString('base64url');
  return `${body}.${hmac(body)}`;
}

export function decodeSession(token) {
  if (typeof token !== 'string') return null;
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = hmac(body);
  if (mac.length !== expected.length || !timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload?.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Parses the signed cookie into req.session ({} when absent/invalid). */
export function attachSession(req, _res, next) {
  req.session = decodeSession(req.cookies?.[SESSION_COOKIE]) ?? {};
  next();
}

export function setSessionCookie(res, payload) {
  res.cookie(SESSION_COOKIE, encodeSession(payload), {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: SESSION_TTL_MS,
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
  });
}

export function sanitizeText(value, max = 200) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}
