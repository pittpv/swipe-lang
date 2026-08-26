# LangApp — Deploy

## Vercel (recommended)

The app is serverless-ready: sessions are stateless HMAC-signed cookies, and data
lives in **Neon Postgres** when `POSTGRES_URL` is set (recommended), otherwise in
Upstash Redis when `UPSTASH_REDIS_REST_*` env vars are set, or a local JSON file
as a fallback.

### Storage option A — Neon Postgres (recommended)

1. Create a free project at [neon.tech](https://neon.tech) and copy the
   **pooled** connection string (`postgresql://...neon.tech/...?sslmode=require`).
   Or use **Vercel → Storage → Marketplace → Neon**, which wires `POSTGRES_URL`
   into the project automatically.
2. Migrate existing state once:

   ```powershell
   $env:POSTGRES_URL="postgresql://..."
   npm run migrate:pg            # from database/langapp.json
   npm run migrate:pg -- --from-redis   # or from the current Upstash blob
   ```

3. Add `POSTGRES_URL` to the project environment variables and deploy.
   The state lives in one JSONB document (`langapp_state`); on an empty DB
   the 3564-word vocabulary seeds itself on first cold start.

### Storage option B — Upstash Redis

1. Push the repo to GitHub, then **Vercel → Add New → Project** and import it.
   Framework preset is auto-detected via `vercel.json` (build: `npm run build`, output: `dist`).
2. **Storage → Marketplace → Upstash Redis** — add it to the project.
   This creates `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` automatically.
3. Add environment variables (Project → Settings → Environment Variables):
   | Variable | Value |
   |----------|-------|
   | `SESSION_SECRET` | any random string, min 32 chars |
   | `ADMIN_API_KEY` | key for `/admin/dashboard.html` |
4. Deploy. On the first cold start the 3564-word vocabulary seeds itself into Redis.

### App version (Settings screen)

The UI shows `LangApp vX.Y.Z+abcdefg`: semver from `package.json` plus a short
git commit SHA injected at build time (`VERCEL_GIT_COMMIT_SHA` on Vercel, else
`git rev-parse`). Bump the marketed semver only when you intend a release:

```powershell
npm version patch   # or minor / major — then commit & push
```

CLI alternative:

```powershell
npx vercel login
npx vercel link
npx vercel env add SESSION_SECRET
npx vercel --prod
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SESSION_SECRET` | prod | Min 32 chars (signs session cookies) |
| `NODE_ENV` | prod | `production` |
| `PORT` | no | Default 3000 (local only) |
| `ADMIN_API_KEY` | recommended | Analytics dashboard access |
| `POSTGRES_URL` / `DATABASE_URL` | optional | Neon Postgres storage — takes priority over Redis |
| `UPSTASH_REDIS_REST_URL` | Vercel | Upstash REST endpoint (serverless storage) |
| `UPSTASH_REDIS_REST_TOKEN` | Vercel | Upstash REST token |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | reminders | Web Push identity (`npx web-push generate-vapid-keys`) |
| `REMINDER_SECRET` | reminders | Shared secret for `/api/cron/reminders` callbacks |
| `QSTASH_TOKEN` | reminders | QStash API token (console.upstash.com → QStash) |

## Study reminders

- Client subscribes from the home screen («🔔 Напоминания») and picks a local time.
- Server creates one **QStash schedule** per user (cron in UTC) targeting
  `POST /api/cron/reminders` with the `x-internal-secret` header.
- Push is sent via `web-push` only when there are words due for review
  (or as a one-time nudge for users who never studied).

## Local production smoke

```powershell
npm run import:vocab
npm run build
$env:SESSION_SECRET="your-32-char-minimum-secret-here-xx"
$env:NODE_ENV="production"
$env:ADMIN_API_KEY="your-admin-key"
npm start
```

Open http://localhost:3000

## Docker

```powershell
docker build -t langapp .
docker run -p 3000:3000 -e SESSION_SECRET=... -e ADMIN_API_KEY=... -v langapp-data:/app/database langapp
```

## Analytics

- Dashboard: `/admin/dashboard.html` (enter `ADMIN_API_KEY`)
- Weekly report: `npm run report:weekly`

## Backups

```powershell
npm run backup   # -> database/backups/langapp-<timestamp>.json (keeps last 14)
```

Schedule daily via cron / Task Scheduler. Restore: stop server, copy snapshot over `database/langapp.json`, start server.
On Neon Postgres no cron backup is needed: use Neon branches / point-in-time restore from the console
(or run `npm run migrate:pg -- --from-file` in reverse by dumping `langapp_state`).

## Post-launch checklist

- [ ] HTTPS reverse proxy (Caddy / nginx)
- [x] Backup `database/langapp.json` daily — automated via `npm run backup`
- [ ] Monitor `/api/health`
