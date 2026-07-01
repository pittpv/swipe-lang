# LangApp — AI tooling setup

This project is wired for Cursor with three design/agent layers:

## 1. Agency Agents ([agency-agents](https://github.com/msitarzewski/agency-agents))

**218 specialist agents** live in `.cursor/rules/*.mdc`.

Use in chat:

```
@frontend-developer Review this component for performance.
@ui-designer Propose a design system for the dashboard.
```

Refresh after updating `.vendor/agency-agents`:

```powershell
node scripts/install-agency-agents.mjs
```

## 2. Impeccable ([impeccable](https://github.com/pbakaus/impeccable))

Design skill + detector hook installed under `.cursor/skills/impeccable/`.

Start a new UI task:

```
/impeccable init
```

Common commands: `/impeccable audit`, `/impeccable polish`, `/impeccable critique`, `/impeccable shape`.

Update:

```powershell
npx impeccable update --providers=cursor --scope=project
```

## 3. Refero Styles ([styles.refero.design](https://styles.refero.design/))

- **Skill:** `.cursor/skills/refero-design/` — research-first design workflow (typography, color, anti-slop).
- **MCP:** `.cursor/mcp.json` — connects to `https://api.refero.design/mcp`.

### Refero MCP setup (one-time)

1. Open **Cursor Settings → MCP** and enable the `refero` server (or reload the window).
2. On first use, sign in via the browser OAuth flow, **or** add your Bearer token to `.cursor/mcp.json`:

```json
"headers": { "Authorization": "Bearer YOUR_TOKEN" }
```

Get a token at [refero.design/mcp](https://refero.design/mcp) (Refero Pro required for live search).

### Using Refero styles

Ask the agent to search styles before building UI:

```
Search Refero styles for a clean language-learning app with soft colors.
```

Browse curated `DESIGN.md` examples at [styles.refero.design](https://styles.refero.design/) and paste a style into context for a specific visual direction.

---

## Cursor settings

For skills to load reliably:

1. **Settings → Beta** — Nightly channel (recommended for Agent Skills).
2. **Settings → Rules** — enable **Agent Skills**.

Reload Cursor after changing MCP or skills.
