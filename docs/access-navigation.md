# ACCESS OS — Navigation Architecture

Universal navigation for all signed-in ACCESS surfaces. Configuration lives in `lib/navigation/`.

## Route map

| Primary | Path | Shell |
|---------|------|--------|
| Terminal | `/` | OS shell (signed in) / landing (signed out) |
| Dashboard | `/dashboard` | `AccessUniversalShell` |
| Founder | `/founder` | `AccessAppLayout` |
| Companion | `/companion` | `AccessAppLayout` |
| Registry | `/registry` | `AccessUniversalShell` + registry module rail |
| Settings | `/settings` | `AccessAppLayout` |

### Settings / operator

| Section | Path |
|---------|------|
| Command Center | `/internal/command-center` |
| Internal Status | `/internal/status` |
| Public Status | `/status` |

### Founder context (`?step=`)

| Nav label | Query |
|-----------|--------|
| Identity | `?step=handle` |
| Companies | `?step=organizations` |
| Products | `?step=products` |
| Experiences | `?step=experiences` |
| Review | `?step=review` |

### Companion context (`#hash`)

| Nav label | Hash |
|-----------|------|
| Overview | `#overview` |
| Memory | `#memory` |
| Projects | `#projects` |
| Agents | `#agents` |
| Diagnostics | `#diagnostics` |

## Components

- `AccessUniversalShell` — OS modules (dashboard, registry)
- `AccessAppLayout` — full-page modules (founder, companion, settings, command center)
- `AccessNavRail` — primary + contextual nav
- `AccessBreadcrumbs` — `ACCESS → Section → Subsection`

## Mobile

Uses `ACCESSShell` hamburger + slide-out rail (≤768px). All nav links meet 44px touch targets.
