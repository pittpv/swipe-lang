# LangApp Swipe Vocab — Development Tasks

## Specification Summary

**Original Requirements** (from `site-setup.md`):

- Tinder-механика: свайп влево = знаю, вправо = учу
- Тапы: перевод, TTS, 2 примера, часть речи
- SRS под капотом, сессии 15–20 карточек, mix 70/30
- Одна пара EN→RU, 3–5k слов, PWA, auth, streak, stats
- Anti-routine UX; соц. слой — out of scope MVP

**Technical Stack**: Laravel 11, Livewire, FluxUI, Alpine.js, PostgreSQL/SQLite, Web Speech API TTS

**Target Timeline**: 4–6 weeks (NEXUS-Sprint)

---

## Development Tasks

### [ ] T-01: Laravel project scaffold

**Description**: Инициализировать Laravel 11, Breeze/Fortify auth, FluxUI, базовый layout

**Acceptance Criteria**:

- [ ] `php artisan serve` — приложение открывается без ошибок
- [ ] FluxUI подключён, базовый `app` layout рендерится
- [ ] `.env.example` с документированными переменными

**Files to Create/Edit**:

- `composer.json`, `routes/web.php`
- `resources/views/layouts/app.blade.php`
- `.env.example`

**Agent**: `@backend-architect` + `@frontend-developer`  
**QA**: `@api-tester` smoke  
**Reference**: site-setup.md §6

---

### [ ] T-02: Database schema — words & SRS

**Description**: Миграции для `words`, `user_word_progress`, `study_sessions`

**Acceptance Criteria**:

- [ ] `words`: id, lemma, translation, pos, examples (JSON), audio_url nullable, cefr_level
- [ ] `user_word_progress`: user_id, word_id, status, ease, interval, next_review_at
- [ ] `study_sessions`: user_id, started_at, ended_at, cards_reviewed, cards_learned
- [ ] Индексы на `user_id + next_review_at`

**Files to Create/Edit**:

- `database/migrations/*_create_words_table.php`
- `database/migrations/*_create_user_word_progress_table.php`
- `database/migrations/*_create_study_sessions_table.php`
- `app/Models/Word.php`, `UserWordProgress.php`, `StudySession.php`

**Agent**: `@backend-architect`  
**QA**: `@api-tester`  
**Reference**: site-setup.md §2

---

### [ ] T-03: Word seed / ETL (500 words MVP seed)

**Description**: Seeder или artisan command для загрузки 500 частотных EN→RU слов

**Acceptance Criteria**:

- [ ] ≥ 500 слов в БД после `php artisan db:seed`
- [ ] Каждое слово: lemma, translation, pos, ≥ 2 examples
- [ ] CEFR level A1–B1

**Files to Create/Edit**:

- `database/seeders/WordSeeder.php`
- `database/data/words-en-ru.json` (или CSV)

**Agent**: `@backend-architect`  
**QA**: `@api-tester` — count + sample validation

---

### [ ] T-04: CI/CD pipeline

**Description**: GitHub Actions — test, lint, deploy staging

**Acceptance Criteria**:

- [ ] Push to main запускает PHPUnit
- [ ] Pint/PHP CS на PR
- [ ] Staging deploy documented (manual or auto)

**Files to Create/Edit**:

- `.github/workflows/ci.yml`

**Agent**: `@devops-automator`  
**QA**: green CI on sample PR

---

### [ ] T-05: Onboarding flow

**Description**: 2 шага — цель обучения + уровень (A1–B1), сохранение в user profile

**Acceptance Criteria**:

- [ ] Новый пользователь проходит онбординг до первой сессии
- [ ] Данные сохраняются в `users` или `user_profiles`
- [ ] Responsive mobile-first

**Files to Create/Edit**:

- `app/Livewire/Onboarding.php`
- `resources/views/livewire/onboarding.blade.php`

**Agent**: `@frontend-developer`  
**QA**: `@evidence-collector` screenshots  
**Reference**: US-1

---

### [ ] T-06: Auth UI polish

**Description**: Login/register с FluxUI, redirect после auth

**Acceptance Criteria**:

- [ ] Register, login, logout работают
- [ ] Redirect: onboarding (new) → session (returning)
- [ ] Form validation errors отображаются

**Agent**: `@frontend-developer`  
**QA**: `@evidence-collector`

---

### [ ] T-07: SRS service

**Description**: PHP service для обновления интервалов после свайпа (SM-2 или FSRS)

**Acceptance Criteria**:

- [ ] `swipeLeft(word)` — увеличивает interval, status → known/mature
- [ ] `swipeRight(word)` — добавляет в learning queue, next_review_at = now + 1d
- [ ] Unit tests на 5 сценариев интервалов

**Files to Create/Edit**:

- `app/Services/SrsService.php`
- `tests/Unit/SrsServiceTest.php`

**Agent**: `@backend-architect`  
**QA**: `@api-tester`

---

### [ ] T-08: Swipe card component

**Description**: Главная карточка слова с жестами свайпа (touch + mouse)

**Acceptance Criteria**:

- [ ] Отображается lemma на лицевой стороне
- [ ] Свайп влево/вправо с анимацией и threshold
- [ ] Keyboard: ← = left, → = right (a11y)
- [ ] Работает на 375px и 1920px

**Files to Create/Edit**:

- `app/Livewire/SwipeDeck.php`
- `resources/views/livewire/swipe-deck.blade.php`
- `resources/js/swipe-gestures.js` (Alpine)

**Agent**: `@senior-developer` + `@frontend-developer`  
**QA**: `@evidence-collector` — 3 viewports

---

### [ ] T-09: Tap overlay — word details

**Description**: Overlay с переводом, TTS кнопкой, примерами, POS

**Acceptance Criteria**:

- [ ] Тап/клик открывает overlay без потери позиции в деке
- [ ] Кнопка «Произношение» вызывает TTS
- [ ] 2 примера и часть речи видны
- [ ] Закрытие overlay — возврат к карточке

**Agent**: `@frontend-developer`  
**QA**: `@evidence-collector`

---

### [ ] T-10: TTS integration

**Description**: Web Speech API для произношения EN слов

**Acceptance Criteria**:

- [ ] Кнопка play воспроизводит lemma
- [ ] Graceful fallback если API недоступен
- [ ] Не блокирует UI

**Agent**: `@voice-ai-integration-engineer`  
**QA**: `@evidence-collector` — manual + screenshot

---

### [ ] T-11: Session API — build deck

**Description**: Endpoint/Livewire action: собрать дек 15–20 слов (70% new, 30% review)

**Acceptance Criteria**:

- [ ] Возвращает 15–20 слов согласно SRS queue
- [ ] Учитывает onboarding level (CEFR filter)
- [ ] Пустая очередь — понятное empty state

**Files to Create/Edit**:

- `app/Services/SessionBuilderService.php`
- `app/Http/Controllers/Api/SessionController.php` (или Livewire)

**Agent**: `@backend-architect`  
**QA**: `@api-tester`

---

### [ ] T-12: Session summary screen

**Description**: Экран после 15–20 карточек: итог, слова на завтра, streak

**Acceptance Criteria**:

- [ ] Показывает cards_reviewed, cards_learned
- [ ] «N слов на повтор завтра»
- [ ] CTA «Ещё сессия» / «На главную»

**Agent**: `@frontend-developer`  
**QA**: `@evidence-collector`

---

### [ ] T-13: Progress / stats page

**Description**: Streak, total words learned, sessions this week

**Acceptance Criteria**:

- [ ] Streak считается по дням с ≥1 завершённой сессией
- [ ] Числа соответствуют данным в БД
- [ ] Mobile layout

**Agent**: `@frontend-developer`  
**QA**: `@evidence-collector` + `@api-tester`

---

### [ ] T-14: PWA manifest & service worker

**Description**: Installable PWA, cache static assets

**Acceptance Criteria**:

- [ ] `manifest.json` с icons, theme_color
- [ ] Service worker кэширует shell
- [ ] Lighthouse PWA installable = pass

**Agent**: `@mobile-app-builder`  
**QA**: `@evidence-collector` Lighthouse screenshot

---

### [ ] T-15: Brand design system wiring

**Description**: CSS variables из Brand Guardian в `app.css`

**Acceptance Criteria**:

- [ ] Colors, typography, spacing tokens используются в компонентах
- [ ] Нет hardcoded hex вне tokens
- [ ] Dark mode optional — не блокер

**Agent**: `@ux-architect`  
**QA**: `@brand-guardian` audit

---

### [ ] T-16: Analytics events

**Description**: Client events: session_start, swipe_left, swipe_right, tap_translation, session_complete

**Acceptance Criteria**:

- [ ] События отправляются на backend или analytics endpoint
- [ ] Schema documented in `docs/analytics-events.md`

**Agent**: `@analytics-reporter` + `@frontend-developer`  
**QA**: `@api-tester`

---

### [ ] T-17: Landing / welcome page

**Description**: Публичная страница с value prop и CTA «Начать»

**Acceptance Criteria**:

- [ ] Hero, 3 benefits, CTA → register
- [ ] Brand-consistent
- [ ] LCP < 2.5s

**Agent**: `@frontend-developer` + `@ui-designer`  
**QA**: `@evidence-collector` + `@performance-benchmarker`

---

### [ ] T-18: Privacy & legal pages

**Description**: Privacy policy, terms (GDPR baseline)

**Acceptance Criteria**:

- [ ] `/privacy` и `/terms` доступны
- [ ] Cookie consent banner если нужен
- [ ] Legal Compliance Checker sign-off

**Agent**: `@legal-compliance-checker`  
**QA**: checklist pass

---

### [ ] T-19: Full QA screenshot suite

**Description**: Playwright capture всех экранов

**Acceptance Criteria**:

- [ ] `./qa-playwright-capture.sh http://localhost:8000 public/qa-screenshots`
- [ ] Все 8 экранов из site-setup.md §7
- [ ] Desktop + mobile

**Agent**: `@evidence-collector`  
**QA**: self

---

### [ ] T-20: Reality Check — integration test

**Description**: End-to-end: register → onboard → session 20 cards → summary → stats

**Acceptance Criteria**:

- [ ] Full flow без ошибок
- [ ] SRS state корректен после сессии
- [ ] Reality Checker verdict: READY

**Agent**: `@reality-checker`  
**QA**: final gate

---

## Sprint Allocation

| Sprint | Tasks | Focus |
|--------|-------|-------|
| **Sprint 0** (Week 1) | T-01, T-02, T-03, T-04, T-15 | Foundation |
| **Sprint 1** (Week 2) | T-05, T-06, T-07, T-08, T-11 | Core loop |
| **Sprint 2** (Week 3) | T-09, T-10, T-12, T-13, T-16 | Depth + stats |
| **Sprint 3** (Week 4) | T-14, T-17, T-18, T-19, T-20 | Polish + launch prep |

---

## Quality Requirements

- [ ] All FluxUI components use supported props only
- [ ] No background processes in commands — NEVER append `&`
- [ ] No server startup in tasks — dev server assumed running
- [ ] Mobile responsive design required
- [ ] Images: Unsplash, picsum.photos — NO Pexels
- [ ] Playwright: `./qa-playwright-capture.sh http://localhost:8000 public/qa-screenshots`
- [ ] Dev↔QA loop: max 3 retries per task

---

## Technical Notes

**Development Stack**: Laravel 11, Livewire 3, FluxUI, Alpine.js, PostgreSQL  
**Special Instructions**: Anti-routine — session cap enforced server-side, not только UI  
**Timeline**: 4–6 weeks per NEXUS-Sprint runbook
