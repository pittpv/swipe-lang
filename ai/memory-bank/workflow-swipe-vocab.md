# LangApp — Workflow: Swipe Vocabulary Session

> **Author:** Workflow Architect (Phase 0)  
> **Status:** Approved for build  
> **Reference:** `site-setup.md`

## State Machine

```
[App Launch]
    → authenticated? ─no→ [Auth] → [Onboarding?] ─yes→ [Onboarding] → [Session Home]
                    └─yes→ [Onboarding complete?] ─no→ [Onboarding]
                                          └─yes→ [Session Home]

[Session Home]
    → startSession() → [Building Deck] → [Card Idle] (card 1..N)

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

## Edge Cases

| Case | Behavior |
|------|----------|
| Empty review queue | Show only new words up to session cap (20) |
| No new words left | Review-only session |
| Both queues empty | Celebrate + suggest level up (`levelComplete` from `/api/session/start`; UI: level-up screen / stats CTA) |
| Level complete but reviews due | Review-only session; level-up still offered on summary/stats |
| Offline mid-session | Complete current card; sync on reconnect |
| Undo last swipe | Phase 2 — not MVP |
| Session cap reached | Force [Session Summary] after card 20 |

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
