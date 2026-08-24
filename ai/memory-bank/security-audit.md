# Security Audit — LangApp (Senior SecOps)

> **Agent:** `@senior-secops-engineer`  
> **Date:** 2026-07-01  
> **Verdict:** PASS with documented dev exceptions  
> **Update:** 2026-08-23 — deferred Phase 2 items implemented (CSP, CSRF, account deletion)

## Automatic Scan Summary

| Category | Finding | Severity | Status |
|----------|---------|----------|--------|
| Hardcoded secrets | None in repo | — | ✅ |
| Insecure SESSION_SECRET fallback | Was hardcoded dev string | CRITICAL | ✅ Fixed — random dev / fail in prod |
| Sensitive data in logs | No password/token logging | — | ✅ |
| JWT issues | N/A (session cookies) | — | ✅ |

## Controls Implemented

| Control | Implementation |
|---------|----------------|
| Password hashing | bcrypt (cost 10) |
| Session cookie | httpOnly, sameSite=lax, secure in prod |
| Rate limiting | 20 auth attempts / 15 min / IP |
| Input validation | email, password 8–128, CEFR whitelist |
| Body size limit | 32kb JSON |
| Security headers | X-Content-Type-Options, X-Frame-Options, Referrer-Policy, HSTS (prod) |
| Analytics allowlist | Fixed event names only |
| CSP | `script-src 'self'`, no inline scripts anywhere (`server/security.js`) |
| CSRF | Double-submit cookie (`csrf_token` + `X-CSRF-Token` header) on all mutating /api requests, timing-safe compare |
| Account deletion | `DELETE /api/account` + UI (stats → «Удалить аккаунт»); removes user, progress, sessions, analytics; nulls referrals |

## Production Checklist

- [x] Set `SESSION_SECRET` (min 32 chars)
- [x] Set `NODE_ENV=production`
- [ ] HTTPS termination in front of Node
- [x] Backup `database/langapp.json` daily — automated: `npm run backup` (keeps last 14, `database/backups/`)
- [x] Do not commit `database/langapp.json` with real user data to public repos

## Deferred

- ~~CSP header~~ — ✅ implemented 2026-08-23
- ~~CSRF token for cookie-based API~~ — ✅ implemented 2026-08-23
- ~~Account deletion API endpoint~~ — ✅ implemented 2026-08-23
- HTTPS reverse proxy — ops task, see docs/DEPLOY.md
