# LangSwipe — Workflow: Swipe Vocabulary Session

> **Author:** Workflow Architect (Phase 0)  
> **Status:** сверено с кодом 0.5.13 (2026-10-03)  
> **Reference:** `site-setup.md`

## State Machine

```
[App Launch]
    → authenticated? ─no→ [Auth] → [Onboarding?] ─yes→ [Onboarding] → [Setup wait] → [Session Home]
                    └─yes→ [Onboarding complete?] ─no→ [Onboarding]
                                          └─yes→ [Session Home]

[Session Home]
    → startSession() → [Building Deck] → [Card Idle] (card 1..N)
    → «Статистика» → [Stats Loading skeleton] → [Stats]
    → «Скопировать ссылку» → clipboard; button reads «Ссылка скопирована» for 1s

[Card Idle]
    → tap card → [Detail Overlay Open]
    → swipe left → [SRS: known] → next card or [Session Summary]
    → swipe right → [SRS: learning] → next card or [Session Summary]

[Detail Overlay Open]
    → tap translation / audio / examples (in-place)
    → close overlay → [Card Idle]
    → swipe from overlay → same as [Card Idle]

[Session Summary]
    → streak update, stats persist
    → [Another session?] / [Progress page] / [Home]
```

## Onboarding

- Collects **name** (UI-required, one character is valid), **language** (`tr-ru` / `en-ru` / `es-ru`), **goal** (travel / work / exam), **CEFR**. Spanish stops at B2. `POST /api/onboarding` may omit name (backward compatible); UI blocks empty name.
- After «Продолжить»: setup-wait screen (home skeleton + install/reminder/5-min tips) while profile + extras save, then Home greets by name.

## Edge Cases

| Case | Behavior |
|------|----------|
| Empty review queue | Show only new words up to session cap (18) |
| No new words left | Review-only session |
| Both queues empty | Celebrate + suggest level up (`levelComplete` from `/api/session/start`; UI: level-up screen / stats CTA) |
| Level complete but reviews due | Review-only session; level-up still offered on summary/stats |
| Streak < 3h from reset | Home badge ⚠️; tap shows local reset time (`src/streak-risk.js`). Deadline matches the server: end of the UTC day after `lastSessionDate` |
| Installed PWA, no network | `offline.html` instead of a blank screen; reload when online |
| Offline mid-session | Complete current card; sync on reconnect |
| Undo last swipe | Not built — phase 2 |
| Session cap reached | Force [Session Summary] after card 18 |

## SRS Transitions

| Swipe | `user_word_progress` |
|-------|----------------------|
| Left (know) | `status=known`, interval × ease factor, `next_review_at` += interval |
| Right (learn) | `status=learning`, interval reset, `next_review_at` = +1 day |

## Session Mix (server-enforced)

- Target size: **18 cards** (within 15–20)
- Review ratio: **30%** (round down, min 0)
- New ratio: remainder from unseen words filtered by CEFR level

## Analytics Events

`session_start`, `card_shown`, `swipe_left`, `swipe_right`, `tap_translation`, `tap_audio`, `session_complete`
