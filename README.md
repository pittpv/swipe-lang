# LangApp — Swipe Vocab

LangApp is a PWA for learning **Turkish vocabulary (TR→RU)** built on **3,564 words** from two CSV dictionaries. Its learning methodology is a proven combination of **spaced repetition + microlearning + gamification** — the same principles behind Anki and Duolingo, delivered through a Tinder-style swipe interface.

## 1. Spaced Repetition — Simplified SM-2 (`server/srs.js`)

The heart of the app is an adaptation of the SuperMemo-2 algorithm built around two gestures:

| Action | Result |
|---|---|
| **Swipe left** ("I know it") | `repetitions+1`; interval: 1st review → **1 day**, 2nd → **6 days**, then `interval × ease`. With `ease=2.5`: 15 → 38 → 94 days... Word becomes `mature` at ≥ 21-day interval |
| **Swipe right** ("still learning") | Progress reset: `status=learning`, interval = **1 day**, `ease − 0.2` |

Key implementation details:

- **Ease factor** (initial value 2.5) — a per-word "difficulty" score: the more often you forget a word, the slower its intervals grow
- **Minimum ease = 1.3** (`MIN_EASE`) — protection against endlessly punishing a hard word
- The `isDue()` function selects only words whose review time has arrived
- Algorithm correctness is covered by unit tests (`npm test`)

## 2. Microlearning: Fixed Short Sessions (`server/session.js`)

- **18 cards per session** (`SESSION_SIZE = 18`) — about 3–5 minutes, following the principle "consistency beats volume"
- **30% reviews / 70% new words** (`REVIEW_RATIO = 0.3`) — a balance between consolidation and forward progress
- Reviews are picked most-overdue-first (sorted by `next_review_at`)
- New words are filtered **by the user's CEFR level** (A1→C1, levels accumulate via `levelsUpTo()`)
- When the current CEFR scope is fully marked «known» and nothing is due → empty deck → **level-up offer** (or dictionary-complete at C1); due reviews still run as review-only sessions
- Edge cases are documented in the workflow spec: empty review queue → new words only; everything learned → celebration + level-up suggestion

## 2b. Progress ETA & level completion (`server/progress.js`)

- **Stats screen** shows known / new / learning counts for the active CEFR scope, a progress bar, and a rough **ETA** to finish marking the level as «Знаю»
- ETA ≈ `remaining ÷ ~13 new cards per session × 1.3 buffer`, paced by completed sessions in the last 14 days (defaults to 1 session/day)
- **Level-up** can be accepted from stats, session summary, or the dedicated level-up screen; it PATCHes `cefrLevel` and starts a new session

## 3. Active Recall + Context

- The swipe forces **recall before the hint**: decision first, verification second
- **Tapping a card** reveals the translation, audio pronunciation, and usage examples (context-based learning)
- Analytics events (`tap_translation`, `tap_audio`) measure how often users need help

## 4. Habit Building: Streaks & Push Reminders

- **Streaks** are computed server-side (`server/index.js`): study today = streak preserved, studied yesterday = +1 day, otherwise reset to 1
- **Web Push via QStash** (`server/reminders.js`): daily reminders at the user's chosen local time, with smart copy:
  - Words due → *"N words are waiting for review. Five minutes and you're done 🔥"*
  - All reviewed → *"Today's plan is complete — see you tomorrow 🎉"*
  - New user → *"Your first 18-word session is waiting"*

## 5. Gamification & Dopamine Loops

- **Milestone achievements** (`MILESTONES`): streaks `[3, 5, 7, 10, 14, 20, 30, 50, 75, 100...]` days and vocabulary size `[5, 10, 20 ... 1000]` words
- Celebrations are styled as an **iMessage conversation** with a "typing…" animation (`src/achievements.js`) — respecting `prefers-reduced-motion`
- Progressive captions: 30 days → *"Habit formed"*, 100 days → *"Legend!"*

## 6. Analytics & the Retention Loop

The client emits events (`session_start`, `card_shown`, `swipe_left/right`, `session_complete`), and `npm run report:weekly` generates a weekly **D1/D7 retention report** — measuring whether users come back the next day and the next week.

---

## How It Maps to Learning Science

| Principle | Implementation |
|---|---|
| Spaced Repetition (SM-2) | `server/srs.js` — simplified version with an ease factor |
| Active Recall | Swipe before the translation is shown |
| Microlearning / consistency | 18-card sessions + daily streak + push reminders |
| Gamification | Milestones, animated achievements |
| Adaptivity (zone of proximal development) | CEFR filtering of new words by level |
| Level completion | Offer next CEFR when scope is fully «known» (`progress.js`) |
| Progress foresight | ETA on stats from remaining words + recent pace |
| Data-driven improvement | Event analytics + D1/D7 retention reports |

## App version

Settings footer shows `LangApp vX.Y.Z+abcdefg` — semver from `package.json` plus a short git SHA injected at Vite build time (see `docs/DEPLOY.md`).
