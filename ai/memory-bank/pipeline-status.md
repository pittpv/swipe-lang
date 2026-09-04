# NEXUS Pipeline Status — LangApp

| Field | Value |
|-------|-------|
| **Phase** | 6 — Operate 🟢 |
| **Production** | https://langapp-neon.vercel.app (Vercel, проект `pittpvs-projects/langapp`) |
| **Storage** | Upstash Redis (`langapp:db`, serverless mode) |
| **Gate 5** | Studio Producer sign-off |

## Phase 5 Deliverables

| Agent | Output |
|-------|--------|
| `@growth-hacker` | Landing v2, referral loop → `launch/growth-plan.md` |
| `@analytics-reporter` | Dashboard `/admin/dashboard.html`, `npm run report:weekly` |
| `@support-responder` | `public/help/faq.html` |
| `@devops-automator` | `Dockerfile`, `docs/DEPLOY.md`, `.env.example` |
| `@studio-producer` | `launch/studio-producer-signoff.md` |

## Quick commands

```powershell
npm run dev                    # local
npm run report:weekly          # retention report
# Dashboard: /admin/dashboard.html + ADMIN_API_KEY
```

## Phase 6 (Operate)

- Weekly: `npm run report:weekly`
- `@feedback-synthesizer` bi-weekly
- Study circles backlog
- 2026-08-23: закрыты отложенные пункты security-audit — CSP (`script-src 'self'`), CSRF double-submit на всех mutating `/api`, `DELETE /api/account` + UI, автоматический бэкап `npm run backup`. E2E: 4/4 green.
- 2026-08-24: все 22 пользователя в аналитике — тестовые данные (не считать за метрики запуска). Временные файлы QStash (`temp_probe_schedule.txt`, `temp_qstash.json`) удалены из корня; расписание reminder-крона зафиксировано в docs/DEPLOY.md.
- 2026-08-24: добавлен третий бэкенд хранилища — **Neon Postgres** (`POSTGRES_URL`, JSONB-документ через `@neondatabase/serverless` HTTP-driver). Приоритет: Postgres → Redis → файл. Миграция: `npm run migrate:pg`. Инструкции — docs/DEPLOY.md §Storage option A.
- 2026-09-04: онбординг собирает имя; после «Продолжить» — экран «кабинет создаётся» (скелетон + подсказки). Версия **0.4.0**.
