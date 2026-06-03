# Milestone 11 — JYSON Orb + Chat Command Interface

**Scope:** `access-app` UI only. No OpenJarvis adapter changes.

## Experience

- **JYSON orb** — animated states: idle, listening, thinking, executing, success, error
- **Single command box** — `Ask JYSON or give a command…`
- **Smart routing** — natural language → `read_file` / `list_files` via `companion-command-router.ts`
- **Compact RuntimeCard** — under the command area; full JSON collapsed
- **Advanced** — manual tools under **Advanced OpenJarvis Tools** (`<details>`)

## Example commands

| Say | Routes to |
|-----|-----------|
| show me the docs folder | `list_files` → `docs` |
| list my files | `list_files` → `.` |
| read package.json | `read_file` |
| read the milestone 10 file | `read_file` → `docs/MILESTONE_10_…` |
| ambiguous text | one-line clarification |

Non-file phrases fall through to **JYSON cloud chat** (`/api/jyson/chat`).

## Files

| File | Role |
|------|------|
| `components/jyson/JysonOrb.tsx` | Orb visuals + state label |
| `components/jyson/JysonCompanionCommand.tsx` | Primary M11 shell |
| `components/jyson/JysonRuntimeCard.tsx` | Shared RuntimeCard (compact + full) |
| `lib/jyson-bridge/companion-command-router.ts` | NL → tool routing |
| `components/jyson/JysonCompanionPanel.tsx` | Layout: orb first, drawers below |

## Verify

```bash
cd access-app
npm run jyson:verify-m11
npm run build
```

Live: sign in → `/companion` → use the orb command box.
