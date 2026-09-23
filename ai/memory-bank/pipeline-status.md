# NEXUS Pipeline Status — LangSwipe

| Field | Value |
|-------|-------|
| **Phase** | 6 — Operate 🟢 |
| **Production** | https://www.langswipe.xyz (Vercel, проект `pittpvs-projects/langapp`; apex `langswipe.xyz` → www) |
| **Storage** | Neon Postgres (`langapp_state` JSONB, dictionary from CSV) |
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
# Dashboard: /admin/dashboard.html + ADMIN_API_KEY (users list + delete)
```

## Phase 6 (Operate)

- Weekly: `npm run report:weekly`
- `@feedback-synthesizer` bi-weekly
- Study circles backlog
- 2026-08-23: закрыты отложенные пункты security-audit — CSP (`script-src 'self'`), CSRF double-submit на всех mutating `/api`, `DELETE /api/account` + UI, автоматический бэкап `npm run backup`. E2E: 4/4 green.
- 2026-08-24: все 22 пользователя в аналитике — тестовые данные (не считать за метрики запуска). Временные файлы QStash (`temp_probe_schedule.txt`, `temp_qstash.json`) удалены из корня; расписание reminder-крона зафиксировано в docs/DEPLOY.md.
- 2026-08-24: добавлен третий бэкенд хранилища — **Neon Postgres** (`POSTGRES_URL`, JSONB-документ через `@neondatabase/serverless` HTTP-driver). Приоритет: Postgres → Redis → файл. Миграция: `npm run migrate:pg`. Инструкции — docs/DEPLOY.md §Storage option A.
- 2026-09-04: онбординг собирает имя; после «Продолжить» — экран «кабинет создаётся» (скелетон + подсказки). Версия **0.4.0**.
- 2026-09-04: экран статистики открывается скелетоном, пока грузится `/stats`; кнопка реферальной ссылки на секунду показывает «Ссылка скопирована». Версия **0.4.1**.
- 2026-09-10: три словаря (TR/EN/ES), страница «Что нового». Версия **0.5.0**.
- 2026-09-10: достижения за слова с меткой языка; streak помечен как общий. Версия **0.5.1**.
- 2026-09-10: бейджи за слова не затираются при смене языка; пропавшие восстанавливаются из «Знаю». Версия **0.5.2**.
- 2026-09-10: кабинет секциями (главная, настройки, статистика), стрелка назад на FAQ/legal, скелетоны под новую вёрстку. Версия **0.5.3**.
- 2026-09-10: админ-дашборд — таблица всех пользователей с поиском и удалением (`GET/DELETE /api/admin/users`).
- 2026-09-10: лендинг — свайп-колода преимуществ; в справке настроек — политика и условия. Версия **0.5.4**.
- 2026-09-11: словарь TR/EN/ES больше не пишется в JSONB (только аккаунты, прогресс, `_wordIdMap`); hydrate из CSV. Вход показывает ошибку, если API недоступен. Версия **0.5.5**.
- 2026-09-12: подсказка установки PWA в Safari на iPhone; однобуквенное имя в онбординге; кабинет не зависает на скелетоне, если iOS потеряла ответ. Версия **0.5.6**.
- 2026-09-12: кастомный домен **https://www.langswipe.xyz**, `APP_URL` в Production; PWA со старого `*.vercel.app` нужно переустановить с нового адреса. Версия **0.5.7**.
- 2026-09-14: кнопки в Настройках снова работают в мобильном Safari (не PWA) — тихий retry Web Push больше не перерисовывает экран до click. Версия **0.5.8**.
- 2026-09-21: `public/robots.txt` (Google / Yandex / `*`) и `public/sitemap.xml`; SPA-rewrite в `vercel.json` их не перехватывает. Главная кабинета влезает в видимый экран iPhone (safe-area + `100svh`).
- 2026-09-23: установленный PWA без сети показывает экран «Нет интернета» вместо белого (service worker кэширует `offline.html`). Версия **0.5.11**.
