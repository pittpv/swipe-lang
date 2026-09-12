# LangApp — AI tooling setup

This project is wired for Cursor with two design/agent layers:

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

---

## Cursor settings

For skills to load reliably:

1. **Settings → Beta** — Nightly channel (recommended for Agent Skills).
2. **Settings → Rules** — enable **Agent Skills**.

Reload Cursor after changing MCP or skills.
