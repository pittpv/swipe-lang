# Security Audit — LangSwipe (повторный)

> **Agents:** `@senior-secops-engineer` + `@security-architect`  
> **Date:** 2026-10-16  
> **Previous:** 2026-07-01, update 2026-08-23 — PASS with dev exceptions  
> **Verdict:** **FAIL for new deploy** until the two High authorization/secret-routing bugs are fixed. No Critical secret-in-repo or injection. Production HTTPS and headers are in place.  
> **Live check:** `https://www.langswipe.xyz` (HTML + `/api/health` + `/api/public/stats` with a foreign `Origin` + `/admin/dashboard.html`).  
> **Standard file:** `security/17-security-pattern.md` is **not in this repo**. Findings cite the sections the SecOps agent treats as that standard.

## Automatic scan

| Category | Result |
|----------|--------|
| Hardcoded secrets | None in application code. `.env` / `.env*` gitignored. |
| Insecure secret fallback | `SESSION_SECRET` still fails closed in production (`server/security.js`). VAPID keys fail closed on Vercel. |
| Secrets in logs | No password, session cookie, or admin key written to logs. |
| JWT | Not used. Session is HMAC-SHA256, algorithm fixed, compare is timing-safe. |
| Token storage | User session cookie is `HttpOnly`. **Admin API key is in `sessionStorage`.** |
| CORS on API | No `Access-Control-Allow-Origin` on `/api/*`, including with `Origin: https://evil.example`. |
| SQL injection | Neon uses tagged templates (`sql\`…\``). No string-built SQL. |
| XSS sinks | Card, circle, and admin HTML go through `esc()`. |

## What the August audit got right — still true

| Control | Evidence |
|---------|----------|
| Password hashing | bcrypt cost 10 |
| Session cookie | `httpOnly`, `sameSite=lax`, `secure` when `NODE_ENV=production` |
| CSRF | Double-submit `csrf_token` + `X-CSRF-Token`, timing-safe, on mutating `/api` except cron and admin (admin is a custom header, not a cookie) |
| Body limit | JSON 32kb |
| Security headers on the live site | `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, CSP, HSTS `max-age=31536000; includeSubDomains` |
| HTTPS | Live. Apex `langswipe.xyz` → `308` to `https://www.langswipe.xyz/` |
| Account deletion | `DELETE /api/account` and admin delete still purge user, progress, sessions, circles, analytics |
| Admin DTO | `listAdminUsers` does not return `password_hash` or the push subscription body |
| Analytics events | Allowlist; only `landing_view` and `landing_cta_click` are anonymous |

## Production checklist

- [x] `SESSION_SECRET` (min 32) — process is up in production, so startup check passed
- [x] `NODE_ENV=production` — `Secure` on `csrf_token`, HSTS present
- [x] HTTPS in front of the app — **closed since 2026-08-23**. Vercel terminates TLS
- [x] Postgres in production — `/api/health` returns `"storage":"postgres"`
- [x] `database/langapp.json` gitignored
- [ ] Auth rate limit that actually holds on Vercel — see High below
- [ ] Circle join restricted to invite code or a real suggestion — see High below

## Findings

### [HIGH] Anyone logged in can join any circle by guessing its id

- **Standard:** §13 / BOLA (broken object-level authorization)
- **Location:** `POST /api/circles/join` → `joinCircle()` in `server/circles.js`
- **SLA:** 72h
- **Violation:** The handler forwards `req.body.circleId` with no check that this user was invited or that the circle appeared in their suggestions. Ids come from `nextId` and are `1, 2, 3…`. Suggestions are only a UI filter. After a join, the response includes `inviteCode`, member names, and the week’s activity.
- **Risk:** A second account walks ids, enters private circles, reads who studies together, and takes the invite link.
- **Fix:** Public join accepts only `code`. `circleId` stays inside `acceptCircleInvite` (already checks the invite) and inside a new path that joins only if `suggestionsFor(...)` contains that id.

### [HIGH] Login rate limit does not survive the production runtime

- **Standard:** § auth routes — every auth route has a real limit
- **Location:** `authRateLimit` in `server/security.js`; no `trust proxy` in `server/index.js`
- **SLA:** 72h
- **Violation:** The limiter is a `Map` in process memory. On Vercel each isolate has its own map and a cold start empties it. `req.ip` is the socket address because `trust proxy` is unset, so it is not the visitor.
- **Risk:** The “20 attempts / 15 min / IP” control from the August audit does not constrain credential stuffing or registration spam against `www.langswipe.xyz`.
- **Fix:** A shared store (Upstash Redis is already a dependency path) keyed by the real client IP, with `app.set('trust proxy', 1)` only because Vercel is the proxy. Same limiter on `/api/admin/*` and `/api/tts`.

### [HIGH] Reminder callback URL is taken from request headers, and the callback carries `REMINDER_SECRET`

- **Standard:** §8 / trust boundary — do not let the client choose where a secret is sent
- **Location:** `POST /api/push/subscribe` in `server/index.js` (`x-forwarded-proto`, `x-forwarded-host`, `host`)
- **SLA:** 72h
- **Violation:** `callbackUrl` is built from those headers and passed to QStash. QStash then calls that URL with `Upstash-Forward-x-internal-secret: REMINDER_SECRET`. `APP_URL` already exists and is used for referral links, but not here. Host is not allowlisted and is not split on commas (proto is).
- **Risk:** If the edge forwards a client `X-Forwarded-Host`, the secret is delivered to that host. With the secret, the caller can hit `/api/cron/reminders` for any `userId`. On Vercel the edge usually overwrites this header; the code still trusts it. Not probed live — that probe would send the secret off-site.
- **Fix:**

```js
const origin = process.env.APP_URL;
if (!origin) return res.status(503).json({ error: 'Reminders are not configured' });
const callbackUrl = `${origin}/api/cron/reminders`;
```

Compare `REMINDER_SECRET` and `ADMIN_API_KEY` with `timingSafeEqual`, and reject secrets shorter than 32 characters at startup.

### [MEDIUM] Push subscription endpoint is any URL the user sends

- **Standard:** SSRF at the trust boundary
- **Location:** `POST /api/push/subscribe`, `webpush.sendNotification` in `server/reminders.js`
- **SLA:** 1 week
- **Violation:** `subscription.endpoint` is stored and later fetched by the server. No host allowlist.
- **Risk:** The account’s own daily job (or an admin test push) makes the server POST to that URL, with a VAPID `Authorization` header. The private key is not in the request. The JWT audience is the attacker’s origin, so it is not a reusable key for FCM — the harm is “the server will request a URL the user picked.”
- **Fix:** Allow only known push origins before save: `fcm.googleapis.com`, `updates.push.services.mozilla.com`, `web.push.apple.com`, `*.notify.windows.com`, and only `https:`.

### [MEDIUM] Admin key lives in `sessionStorage`

- **Standard:** §6.1 — bearer secrets are not readable by script
- **Location:** `public/admin/dashboard.js` (`langapp_admin_key`)
- **SLA:** 1 week
- **Violation:** The key that deletes any user is written to `sessionStorage` and sent as `X-Admin-Key`.
- **Risk:** Not exploitable today: admin HTML is escaped, and the page does not load third-party scripts. Any future XSS on that origin steals a key that can delete every account. There is also no rate limit on the admin routes.
- **Fix:** Keep the key in a page variable only, or exchange it once for a short `HttpOnly` cookie scoped to `/api/admin`. Do not persist it.

### [MEDIUM] Upstream errors are returned to the browser

- **Standard:** §13 — fail without internal detail
- **Location:** `POST /api/push/subscribe` (`502` + `e.message`), `POST /api/cron/reminders` (`500` + `e.message`)
- **SLA:** 1 week
- **Risk:** QStash’s response body is interpolated into `Error` and sent to the logged-in user. That body can describe internal URLs and schedule ids.
- **Fix:** Log the detail on the server. Respond with a fixed string: `Reminder scheduling failed`.

### [LOW] Smaller gaps

| Item | Note |
|------|------|
| `GET /api/health` | Public `{"storage":"postgres","words":11712}`. Drop `storage` or require the admin key. |
| `X-Powered-By: Express` | Present on live API responses. `app.disable('x-powered-by')`. |
| `GET /api/tts` | Unauthenticated proxy to a fixed Google host, no rate limit. Not open SSRF. Add the shared limiter. |
| `POST /api/analytics` | Anonymous `landing_view` writes the whole JSON document. Cap is 10k rows, but there is no rate limit. |
| Register `409` | “Email already registered” confirms accounts. Login message is already generic. |
| `requireAuth` | Checks the cookie’s `userId`, not that the row still exists. Ids are not reused, so this is not account takeover. A copied cookie still works until it expires (7 days); logout only clears the browser cookie. |
| Static `Access-Control-Allow-Origin: *` | On HTML only (`/` and `/admin/dashboard.html`), not on `/api`. Pages are already public. Remove it if Vercel lets you; do not copy it onto the API. |
| CSP `style-src 'unsafe-inline'` | Scripts stay on `'self'` plus Yandex and one hash. Style inline is the remaining relaxation. |
| `security/17-security-pattern.md` | Missing. This audit cannot cite a local standard the team checked in. |

## STRIDE (architect)

| Threat | Where | Now |
|--------|-------|-----|
| Spoofing | Login | Passwords are hashed. The rate limit does not hold on Vercel. |
| Tampering | Circle join | Client-supplied `circleId` is honored. **Fix first.** |
| Repudiation | Admin delete | No audit log of who deleted a user. |
| Info disclosure | Health, QStash errors, `X-Powered-By` | Low, except the callback-secret path above. |
| Denial of service | Auth, TTS, analytics | In-memory limit + one JSON document rewritten per request. |
| Elevation | Admin key | Header secret, CSRF not required. Stored where script can read it. |

## Top action

Stop accepting `circleId` on `POST /api/circles/join` unless that id is a current suggestion or an invite for this user, and send QStash only to `APP_URL`.
