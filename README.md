# LangApp — Swipe Vocab

PWA для изучения **турецкой лексики (TR→RU)**: свайп влево = знаю, вправо = учу, тап = перевод / произношение / примеры.

Словари: `vocabulary-Eski.csv` + `vocabulary-Yeni.csv` → **3564** уникальных слова.

## Быстрый старт

```powershell
npm install
npm run import:vocab
npm run dev
```

- **Frontend:** http://localhost:5173  
- **API:** http://localhost:3000  

## Команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | API + Vite dev server |
| `npm run build` | Production build → `dist/` |
| `npm start` | API + static (после build) |
| `npm run import:vocab` | Импорт CSV словарей TR→RU |
| `npm run seed` | Alias импорта (без --replace) |
| `npm test` | SRS unit tests |
| `npm run test:e2e` | E2E API (нужен запущенный server) |
| `npm run report:weekly` | Отчёт D1/D7 retention |
| `npm run backup` | Бэкап БД → `database/backups/` (хранит 14) |
| `npm run migrate:pg` | Перенос состояния в Neon Postgres (`POSTGRES_URL`) |
| `npm start` | Production (после build) |

## Launch

- FAQ: `/help/faq.html`
- Analytics: `/admin/dashboard.html` (ключ `ADMIN_API_KEY`)
- Deploy: [`docs/DEPLOY.md`](docs/DEPLOY.md)

## Документация проекта

- Спека: [`ai/memory-bank/site-setup.md`](ai/memory-bank/site-setup.md)
- План команды: [`ai/memory-bank/langapp-mvp-plan.md`](ai/memory-bank/langapp-mvp-plan.md)
- Workflow: [`ai/memory-bank/workflow-swipe-vocab.md`](ai/memory-bank/workflow-swipe-vocab.md)
- Pipeline status: [`ai/memory-bank/pipeline-status.md`](ai/memory-bank/pipeline-status.md)

## Стек (MVP)

Node.js, Express, Vite, vanilla JS. Хранилище — три режима по приоритету:
**Neon Postgres** (`POSTGRES_URL`, JSONB-документ через serverless HTTP-driver) →
**Upstash Redis** (`UPSTASH_REDIS_REST_*`) → **локальный JSON-файл** (dev).  
*Запланированный Laravel + Livewire — после включения PHP `extension=openssl` и установки Composer.*

## NEXUS

Запуск пайплайна — см. `ai/memory-bank/langapp-mvp-plan.md` §1.
