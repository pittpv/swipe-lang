# Growth Plan — Phase 5 Launch

> **Agent:** `@growth-hacker`  
> **Date:** 2026-07-01 · актуализировано 2026-10-03 по коду 0.5.13

## Positioning

**LangSwipe** — словари TR/EN/ES → RU со свайп-механикой и русским интерфейсом. Не «ещё один Anki», а сессии по 18 карточек. Прод: https://www.langswipe.xyz.

## Landing optimizations (shipped)

- Hero с social proof: `3500+ слов`, `18 карточек / 5 мин`
- Benefit grid: короткие сессии, SRS, тап+аудио
- CTA: «Начать бесплатно →» + subtext «Без карты»
- FAQ link для снижения friction

## Referral loop (shipped)

- У каждого пользователя `referral_code`
- Ссылка `/?ref=CODE` → sessionStorage → register
- Блок «Пригласи друга» на home
- Event: `referral_share`

## Acquisition channels

Группа поддержки в Telegram уже есть в продукте (справка, главная, FAQ, 0.5.9). Посты в чужих сообществах планом не закрыты.

| Channel | Статус |
|---------|--------|
| Telegram-группа поддержки | В продукте |
| Посты в группах изучающих язык | Не сделано |
| Reddit | Не сделано |
| Product Hunt | После реальных пользователей, не тестовых аккаунтов |
| SEO | `robots.txt` и `sitemap.xml` на проде; лендинг больше не только про турецкий |

## North star

**D7 retention ≥ 25%** остаётся северной звездой запуска. Кружки по пересечению словаря уже в продукте (0.5.14), не дожидаясь порога. Считать `npm run report:weekly`; тестовые аккаунты в метрики запуска не входят (см. `pipeline-status.md`).
