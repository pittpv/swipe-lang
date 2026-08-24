# Evidence Collector — QA Checklist

> **Agent:** `@evidence-collector`  
> **Project:** LangApp TR→RU  
> **Date:** 2026-07-01

## Automated Evidence

| Check | Command | Expected |
|-------|---------|----------|
| SRS unit tests | `npm test` | 5/5 pass |
| Vocabulary import | `npm run import:vocab` | 3500+ unique words |
| E2E API flow | `npm run test:e2e` (server running) | health + register + session |
| Production build | `npm run build` | dist/ created |

## Manual Screenshots (desktop 1920 / mobile 375)

- [ ] Landing — hero, CTA, legal links
- [ ] Register / Login
- [ ] Onboarding — goal + level
- [ ] Session — swipe card with Turkish lemma
- [ ] Overlay — translation, POS, unit, TTS
- [ ] Session summary — stats grid
- [ ] Stats page
- [ ] `/legal/privacy.html`
- [ ] `/legal/terms.html`

## Functional Verification

- [x] Swipe left updates SRS (known)
- [x] Swipe right adds to learning queue
- [x] Session capped at 18 cards
- [x] TTS uses `tr-TR`
- [x] Dictionary TR→RU from Eski+Yeni CSV merge

## Brand / UX

- [ ] Session length feels short (anti-routine)
- [ ] Swipe labels visible on drag
- [ ] Keyboard ← → works on session screen

**Verdict:** Automated checks PASS. Manual screenshots pending human capture.
