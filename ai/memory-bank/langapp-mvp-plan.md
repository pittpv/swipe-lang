# LangApp MVP — План команды и пайплайн NEXUS

> **Режим:** NEXUS-Sprint (Startup MVP Runbook)  
> **Срок:** 4–6 недель  
> **Оркестратор:** Agents Orchestrator  
> **Спецификация:** [`site-setup.md`](./site-setup.md)  
> **Task list:** [`tasks/langapp-swipe-vocab-tasklist.md`](./tasks/langapp-swipe-vocab-tasklist.md)  
> **Методология:** [`.vendor/agency-agents/strategy/nexus-strategy.md`](../../.vendor/agency-agents/strategy/nexus-strategy.md)

---

## Executive Summary

LangApp — PWA для изучения лексики: свайп влево = знаю, вправо = учу, тапы = перевод/аудио/примеры. MVP: одна пара EN→RU, SRS, короткие сессии, anti-routine UX. Социальный слой — фаза 2.

Команда собрана по **NEXUS-Sprint** + **scenario-startup-mvp.md** с дополнениями под edtech (Behavioral Nudge Engine, Workflow Architect, Voice AI).

---

## 1. Активация пайплайна

Скопировать в чат Cursor для старта:

```
Activate Agents Orchestrator in NEXUS-Sprint mode.

Project: LangApp — Swipe Vocab PWA
Specification: ai/memory-bank/site-setup.md
Task list: ai/memory-bank/tasks/langapp-swipe-vocab-tasklist.md
Timeline: 4-6 weeks
Skip Phase 0 full market report — use compressed discovery (Day 1-2).

Sprint team: see langapp-mvp-plan.md Section 2
Begin at Phase 1 with architecture and sprint planning.
Run Dev↔QA loops for all implementation tasks.
Reality Checker approval required before launch.
Maximum 3 retries per task before escalation.
```

---

## 2. Состав команды (18 агентов)

### 2.1 Command & PM

| Агент | Cursor rule | Роль в LangApp | Фаза |
|-------|-------------|----------------|------|
| **Agents Orchestrator** | `@agents-orchestrator` | Контроллер пайплайна, Dev↔QA loop, эскалации | 1–6 |
| **Senior Project Manager** | `@senior-project-manager` | Spec → tasks, acceptance criteria, scope control | 1, 3 |
| **Sprint Prioritizer** | `@sprint-prioritizer` | RICE backlog, MoSCoW, спринты | 1, 3 |
| **Studio Producer** | `@studio-producer` | Go/No-Go, launch timing, portfolio alignment | 1, 5 |
| **Project Shepherd** | `@project-shepherd` | Кросс-функциональная координация, риски сроков | 3–5 |

### 2.2 Product & Discovery

| Агент | Cursor rule | Роль в LangApp | Фаза |
|-------|-------------|----------------|------|
| **Product Manager** | `@product-manager` | PRD alignment, outcome metrics, GTM framing | 0–1 |
| **Trend Researcher** | `@trend-researcher` | Конкуренты (Duolingo, Anki, Drops, Memrise) — 1 день | 0 |
| **UX Researcher** | `@ux-researcher` | Персоны, journey map свайп-сессии | 0 |
| **Behavioral Nudge Engine** | `@behavioral-nudge-engine` | Anti-routine: длина сессии, streak, variable rewards | 1, 3 |
| **Workflow Architect** | `@workflow-architect` | Дерево состояний: свайп, SRS, тапы, edge cases | 1 |

### 2.3 Design

| Агент | Cursor rule | Роль в LangApp | Фаза |
|-------|-------------|----------------|------|
| **UX Architect** | `@ux-architect` | CSS design system, layout, component architecture | 1–2 |
| **UI Designer** | `@ui-designer` | Карточка слова, свайп-анимации, session summary | 1–3 |
| **Brand Guardian** | `@brand-guardian` | Визуальная идентичность, tone of voice | 1 |
| **Whimsy Injector** | `@whimsy-injector` | Микро-радость без перегруза (бонус-карточки) | 3 |

### 2.4 Engineering

| Агент | Cursor rule | Роль в LangApp | Фаза |
|-------|-------------|----------------|------|
| **Backend Architect** | `@backend-architect` | API, SRS engine, схема БД, auth | 1–4 |
| **Frontend Developer** | `@frontend-developer` | Livewire swipe deck, тап-overlay, PWA shell | 2–4 |
| **Senior Developer** | `@senior-developer` | Сложные жесты, Alpine swipe, performance | 3 |
| **Mobile App Builder** | `@mobile-app-builder` | PWA install, touch UX, viewport | 2–3 |
| **Voice AI Integration Engineer** | `@voice-ai-integration-engineer` | TTS pipeline, fallback Web Speech API | 3 |
| **DevOps Automator** | `@devops-automator` | CI/CD, staging/prod, env | 2, 5 |
| **Rapid Prototyper** | `@rapid-prototyper` | Day 1–2 swipe prototype для валидации жеста | 0 |

### 2.5 QA & Hardening

| Агент | Cursor rule | Роль в LangApp | Фаза |
|-------|-------------|----------------|------|
| **Evidence Collector** | `@evidence-collector` | Screenshots каждой задачи (desktop/tablet/mobile) | 3–4 |
| **Reality Checker** | `@reality-checker` | Финальный gate перед launch | 4 |
| **API Tester** | `@api-tester` | SRS API, auth, word endpoints | 3–4 |
| **Performance Benchmarker** | `@performance-benchmarker` | Load test, LCP, API P95 | 4 |
| **Accessibility Auditor** | `@accessibility-auditor` | WCAG 2.1 AA на swipe deck | 4 |

### 2.6 Launch & Ops (Week 5+)

| Агент | Cursor rule | Роль в LangApp | Фаза |
|-------|-------------|----------------|------|
| **Growth Hacker** | `@growth-hacker` | Каналы привлечения, referral hook (фаза 2 prep) | 5 |
| **Analytics Reporter** | `@analytics-reporter` | D1/D7 dashboards, funnel свайпов | 5–6 |
| **Legal Compliance Checker** | `@legal-compliance-checker` | GDPR, privacy policy, cookie consent | 4–5 |
| **Support Responder** | `@support-responder` | FAQ, шаблоны ответов | 5–6 |

### 2.7 Не в MVP-команде (фаза 2+)

| Агент | Когда подключать |
|-------|------------------|
| `@ai-engineer` | AI-репетитор, smart recommendations |
| `@social-media-strategist` | Launch campaign |
| `@reddit-community-builder` | Community-led growth |
| `@cultural-intelligence-strategist` | Локализация UI на другие рынки |
| `@data-privacy-officer` | Масштабирование EU compliance |

---

## 3. Оргструктура (NEXUS Command)

```
                    ┌──────────────────────┐
                    │  Agents Orchestrator  │
                    └──────────┬───────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
  ┌──────▼──────┐      ┌───────▼───────┐     ┌───────▼────────┐
  │ Studio      │      │ Senior PM     │     │ Sprint         │
  │ Producer    │      │ + Product Mgr │     │ Prioritizer    │
  └─────────────┘      └───────────────┘     └────────────────┘
                               │
    ┌──────────────────────────┼──────────────────────────┐
    │                          │                          │
┌───▼───┐  ┌────────┐  ┌───────▼────┐  ┌─────────┐  ┌─────▼─────┐
│Design │  │Workflow│  │Engineering │  │   QA    │  │  Launch   │
│track  │  │Architect│ │   track    │  │  track  │  │  track    │
└───────┘  └────────┘  └────────────┘  └─────────┘  └───────────┘
```

---

## 4. Фазы и недели

### Phase 0 — Discovery (сжато, 2 дня)

| День | Агент | Deliverable |
|------|-------|-------------|
| 1 | `@trend-researcher` | Competitive scan: 1-pager vs Duolingo/Anki/Drops |
| 1 | `@ux-researcher` | 2 персоны + journey «5-мин сессия» |
| 1 | `@rapid-prototyper` | HTML swipe prototype (жест работает?) |
| 2 | `@behavioral-nudge-engine` | Anti-routine playbook: session cap, mix ratio, streak rules |
| 2 | `@workflow-architect` | State machine: card → swipe → SRS → summary |
| 2 | `@studio-producer` | **Gate:** Go/No-Go |

**Quality Gate 0:** Go decision + workflow doc approved.

---

### Phase 1 — Strategy & Architecture (5 дней)

| День | Агент | Deliverable |
|------|-------|-------------|
| 1–2 | `@brand-guardian` | Brand tokens (CSS variables), voice |
| 1–2 | `@ux-architect` | Design system + component map |
| 2–3 | `@backend-architect` | ERD, API spec, SRS algorithm choice |
| 2–3 | `@ui-designer` | Wireframes: deck, tap overlay, summary |
| 3 | `@senior-project-manager` | Task list → `tasks/langapp-swipe-vocab-tasklist.md` |
| 3 | `@sprint-prioritizer` | RICE backlog, Sprint 1–3 plan |
| 4–5 | `@product-manager` | PRD sign-off vs site-setup.md |
| 5 | `@studio-producer` | **Gate:** Architecture Package |

**Quality Gate 1:** Architecture + task list + wireframes approved.

---

### Phase 2 — Foundation (5 дней)

| День | Агент | Deliverable |
|------|-------|-------------|
| 1 | `@devops-automator` | CI/CD, `.env.example`, staging |
| 1–2 | `@backend-architect` | Laravel scaffold, migrations, seed 500 words |
| 1–2 | `@frontend-developer` | Livewire layout, FluxUI shell, routing |
| 2–3 | `@mobile-app-builder` | PWA manifest, service worker skeleton |
| 3–5 | `@ux-architect` | Base CSS tokens wired in `resources/css` |
| 5 | `@api-tester` | Smoke tests on scaffold |

**Quality Gate 2:** App boots, auth scaffold, CI green.

---

### Phase 3 — Build (2 спринта × 1 неделя)

**Dev↔QA loop** — каждая задача из task list:

```
Developer implements → @evidence-collector tests → PASS/FAIL (max 3 retries)
```

#### Sprint 1 (Week 2)

| Track | Агент | Задачи |
|-------|-------|--------|
| Backend | `@backend-architect` | Auth, Word API, SRS service |
| Frontend | `@frontend-developer` | Onboarding, auth UI |
| Frontend | `@senior-developer` | Swipe card component (Alpine) |
| Data | `@backend-architect` | Word ETL script (Kaikki → DB) |
| QA | `@evidence-collector` | Per-task screenshots |

#### Sprint 2 (Week 3)

| Track | Агент | Задачи |
|-------|-------|--------|
| Frontend | `@frontend-developer` | Tap overlay, session summary, stats |
| Voice | `@voice-ai-integration-engineer` | TTS integration |
| Backend | `@backend-architect` | Session API, daily goal, streak |
| Delight | `@whimsy-injector` | Session complete micro-animation |
| Analytics | `@analytics-reporter` | Event schema (swipe_left, swipe_right, tap_translation) |
| QA | `@api-tester` | SRS correctness tests |

**Quality Gate 3:** All MVP Must-Have tasks PASS.

---

### Phase 4 — Hardening (1 неделя)

| День | Агент | Deliverable |
|------|-------|-------------|
| 1–2 | `@evidence-collector` | Full screenshot suite |
| 1–2 | `@accessibility-auditor` | A11y report + fixes |
| 2–3 | `@performance-benchmarker` | LCP + API load report |
| 2–3 | `@legal-compliance-checker` | Privacy policy, GDPR checklist |
| 4 | `@reality-checker` | **Final verdict:** READY / NEEDS WORK |
| 5 | Fix cycle if NEEDS WORK | Dev agents + QA |

**Quality Gate 4:** Reality Checker = READY.

---

### Phase 5 — Launch (1 неделя)

| Агент | Deliverable |
|-------|-------------|
| `@devops-automator` | Production deploy |
| `@growth-hacker` | Landing page CTA, waitlist/referral sketch |
| `@analytics-reporter` | Live D1/D7 dashboard |
| `@support-responder` | FAQ: свайпы, SRS, аккаунт |
| `@studio-producer` | Launch sign-off |

---

### Phase 6 — Operate (ongoing)

| Агент | Cadence |
|-------|---------|
| `@analytics-reporter` | Weekly retention report |
| `@feedback-synthesizer` | Bi-weekly user feedback synthesis |
| `@sprint-prioritizer` | Phase 2 backlog (study circles) |
| `@infrastructure-maintainer` | Uptime, backups |

---

## 5. Параллельные треки (Phase 3)

```
Track A: Core Product          Track B: Growth Prep
├── Frontend Developer         ├── Growth Hacker
├── Backend Architect          ├── Analytics Reporter
├── Senior Developer           └── Content Creator (landing copy)
├── Voice AI Engineer
└── Evidence Collector (QA)

Track C: Design Support        Track D: Compliance
├── UI Designer (polish)       ├── Legal Compliance Checker
└── Brand Guardian (audit)     └── Data privacy review (light)
```

---

## 6. Handoff protocol

Все передачи между агентами — по шаблону из  
`.vendor/agency-agents/strategy/coordination/handoff-templates.md`

Обязательные поля:

- From / To agent
- Task ID из task list
- Relevant files
- Acceptance criteria (checkboxes)
- Evidence required

---

## 7. Ключевые решения (Decision Log)

| Когда | Кто | Решение |
|-------|-----|---------|
| Day 2 Phase 0 | Studio Producer | Go/No-Go на MVP |
| Day 4 Phase 1 | Senior PM | Architecture approval |
| Sprint planning | Sprint Prioritizer | MVP scope frozen (MoSCoW) |
| Week 4 Day 5 | Reality Checker | Production readiness |
| Post READY | Studio Producer | Launch date |

---

## 8. Риски и митигации

| Риск | Вероятность | Митигация | Владелец |
|------|-------------|-----------|----------|
| Scope creep (соц. слой в MVP) | Высокая | MoSCoW в site-setup.md | Sprint Prioritizer |
| Свайп = рутина | Средняя | Behavioral Nudge Engine в Phase 0 | Product Manager |
| Качество word data | Высокая | ETL + manual spot-check 100 слов | Backend Architect |
| Swipe UX на desktop | Средняя | Mouse drag + keyboard shortcuts | Senior Developer |
| SRS bugs | Средняя | API Tester unit tests на интервалы | API Tester |

---

## 9. Метрики успеха (из спеки)

| Метрика | Target | Владелец |
|---------|--------|----------|
| Time to live | ≤ 6 недель | Agents Orchestrator |
| D7 retention | ≥ 25% | Analytics Reporter |
| Core features | 100% Must-Have | Senior PM |
| QA first-pass rate | ≥ 70% | Evidence Collector |
| Reality Checker | READY before launch | Reality Checker |

---

## 10. Prompts активации по ролям

### Workflow Architect (Phase 0)

```
Activate Workflow Architect for LangApp swipe vocabulary flows.

Input: ai/memory-bank/site-setup.md
Deliverables:
1. State diagram: card idle → tap layers → swipe left/right → SRS update
2. Edge cases: undo last swipe, empty deck, offline session end
3. Handoff to UX Architect and Backend Architect

Format: Markdown in ai/memory-bank/workflow-swipe-vocab.md
```

### Behavioral Nudge Engine (Phase 0)

```
Activate Behavioral Nudge Engine for LangApp anti-routine design.

Input: site-setup.md Section "Anti-routine"
Deliverables:
1. Session length rules (15-20 cards)
2. New/review mix ratio policy
3. Streak mechanics without guilt-tripping
4. Variable reward schedule (bonus cards)

Handoff to: UI Designer, Frontend Developer
```

### Frontend Developer — Swipe Deck (Phase 3)

```
Activate Frontend Developer in NEXUS pipeline for LangApp.

Phase: 3 — Build
Task: T-08 — Swipe card component
Acceptance criteria: see langapp-swipe-vocab-tasklist.md

Reference:
- ai/memory-bank/site-setup.md
- Design system from UX Architect
- Workflow doc from Workflow Architect

Requirements:
- Livewire + Alpine.js gestures
- Swipe left/right with visual feedback
- WCAG 2.1 AA (keyboard alternative)
- Mobile-first 375px

QA: Evidence Collector will screenshot desktop/tablet/mobile.
```

---

## 11. Файлы проекта (canonical)

| Файл | Назначение |
|------|------------|
| `ai/memory-bank/site-setup.md` | Единственный source of truth — спека |
| `ai/memory-bank/langapp-mvp-plan.md` | Этот документ — команда и фазы |
| `ai/memory-bank/tasks/langapp-swipe-vocab-tasklist.md` | Задачи для разработки |
| `ai/memory-bank/workflow-swipe-vocab.md` | *(создаст Workflow Architect)* |
| `public/qa-screenshots/` | Evidence Collector output |

---

## 12. Следующий шаг

1. Запустить **Agents Orchestrator** промптом из Section 1  
2. Phase 0 Day 1: параллельно `@trend-researcher`, `@ux-researcher`, `@rapid-prototyper`  
3. После Gate 0 → Phase 1 architecture sprint

---

*Документ сгенерирован Senior Project Manager по NEXUS-Sprint + scenario-startup-mvp.md*
