# ACCESS Platform Redesign

## Design V4 — Research-driven experience (current)

Research: [`ACCESS_DESIGN_V4_RESEARCH.md`](./ACCESS_DESIGN_V4_RESEARCH.md)

- Stripe-informed hierarchy, motion, density, emotion (not visual copy)
- Contextual home (aware headline + attention list, no “what are we building today?”)
- `v4-experience.css` motion tokens + quieter nav
- JYSON layer shows `layerInsight` per route

---

## UX Philosophy V3 — JYSON as operating layer

- **Persistent floating JYSON** on every signed-in route (`JysonGlobalLayer` in root layout).
- Expand/collapse survives refresh via `localStorage` (`access_jyson_layer_open`).
- **Context-aware:** pathname, project id, companion hash, registry counts, settings section.
- **Conversation-first:** nav intents, registry answers (`what am I building`), local tools, cloud chat — without requiring Companion page.
- Home copy is **user-centric** (name + building), not platform-centric.

---

## V3 — JYSON-centered home

- **HOME** (`/dashboard`) is no longer a command-center card grid.
- **Living planet** hero with canvas particles, halo, orbit ring, pointer parallax.
- **Primary prompt:** “What are we building today?” + glass command field → routes to Companion with pending prompt.
- **Emergent workspace:** recent intents + registry-backed tiles (projects, agents, systems) — grows from conversation, not static KPI cards.
- Legacy `PlatformDashboard.tsx` retained for operator reference; not mounted on home.

---

# ACCESS Platform Redesign (v2)

Premium AI-native product shell — sans-first typography, wide intelligence surfaces, reusable platform primitives.

## Phases

| Phase | Status | Scope |
|-------|--------|--------|
| 1 — Design system | Done | `platform.css`, primitives in `lib/design-system/components/platform/` |
| 2 — App shell | Done | `ACCESSShell`, nav sans, rail footer, `PageMotion`, account topbar |
| 3 — Dashboard | Done | `PlatformDashboard.tsx` — all command-center modules |
| 4 — Companion | Done | `PageHeader`, wide layout, structured `sectionsFromMessage`, advanced in `<details>` |
| 5 — Terminal | Done | `access-terminal-page` result blocks, history UX |
| 6 — Founder / Registry / Settings | Done | Overview + wizard + registry grid; scanline removed on signed-in routes |

## Platform components

`lib/design-system/components/platform/`:

- `PageHeader`, `PlanetPresence`, `CommandInput`, `IntelligenceAnswer`
- `ConnectionStatus`, `ActionCard`
- `SectionPanel`, `MetricCard`, `IntelligenceCard`, `RuntimeCard`
- `BlueprintHealthCard`, `RecommendationCard`, `PlatformEmptyState`, `PageMotion`

Page-level: `components/platform/PlatformDashboard.tsx`, `PlatformSettings.tsx`

## Typography rules

- **Sans (Inter):** UI, nav, cards, intelligence sections
- **Mono:** terminal output, code, paths, technical `<details>`

## Content width

- Default max: `--content-max` (1120px)
- Wide pages: `--wide` up to 1280px
- Companion console: up to 1200px

## Verification

```bash
cd access-app && npm run build
```

Local stack: ACCESS `:3000`, OpenJarvis `:8000`, connector heartbeat for local tools.

## Non-goals (this pass)

- Replacing `landing_page/index.html` (JD cinematic portal)
- OpenJarvis architecture changes
- `/api/files/*` on OpenJarvis
