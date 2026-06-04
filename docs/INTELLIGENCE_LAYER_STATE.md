# Intelligence layer state (ACCESS)

Single source of truth for how ACCESS decides what the user sees and what JYSON can run.

## Server

| Module | Role |
|--------|------|
| `lib/openjarvis/resolve-runtime-state.ts` | Probes private layer, connector, OpenJarvis HTTP, install |
| `lib/openjarvis/runtime-capabilities.ts` | `resolveIntelligenceCapabilities(runtime)` → tier, `setupComplete`, `recommendedAction`, `localIntelligenceActive` |
| `GET /api/jyson/openjarvis/health` | Returns `runtime`, `capabilities`, `setupComplete`, `recommendedAction`, `localToolsAvailable` |

## Full capacity

| Deployment | Tier `full` when |
|------------|------------------|
| **Cloud** (Vercel) | Vault cloud metadata ready + JYSON cloud chat (default for signed-in users). Local OpenJarvis is **optional** — not blocking. |
| **Local** (founder `npm run dev`) | `localToolsAvailable` — private layer + connector heartbeat + OpenJarvis `/health` + install |

## Partial local (founder)

`localIntelligenceActive` is true when:

- `localToolsAvailable`, **or**
- `deploymentMode === 'local'` **and** `openJarvisOnline`

UI treats this as **setup complete** (no “Set up on this Mac” CTA). File execution still requires `localToolsAvailable` (connector + full stack).

## `recommendedAction`

| Value | Meaning |
|-------|---------|
| `none` | Nothing required for current tier |
| `enable_private` | Set `PRIVATE_JYSON_ENABLED=true` in `.env.local` |
| `start_openjarvis` | Install or run `npm run openjarvis:serve` |
| `pair_connector` | Run `npm run dev:founder` (includes bridge loop) or pair once — see [VAULT_LOCAL_BRAIN.md](./VAULT_LOCAL_BRAIN.md) |

## Client

| Module | Role |
|--------|------|
| `lib/openjarvis/use-openjarvis-health.ts` | Poll health every 30s, refresh on focus/visibility |
| `lib/openjarvis/local-tools-activation.ts` | `localStorage` key `access-local-tools-activated-at` for fast “connected” before first poll |

## UI mapping

| Surface | Connected when |
|---------|------------------|
| Agents header / execution card | `setupComplete` / `localIntelligenceActive` — badge **Local intelligence active** or **Connected** |
| JYSON orb line | **File tools active** when `localToolsAvailable`; else **Local intelligence active** when server reachable; hide setup link when `!showSetupCta` |
| Connect modal hero | **Connected** (full tools) or **Local intelligence active** (server only) |

## Vault cloud index (production JYSON)

| Piece | Role |
|-------|------|
| `vault_chunks` (Supabase) | Searchable note chunks per `vault_id` + `clerk_user_id` |
| `requestVaultSync` | After local scan → `replaceVaultContentChunks` (delete + batch insert) |
| `retrieveVaultContextForQuery` | Local `.jyson-vault-index` first when `PRIVATE_JYSON_ENABLED`; else `vault_chunks` |
| `POST /api/vault/index/rebuild` | Manual cloud re-index from vault `local_path` on host |

`vault_files` remains metadata-only (paths, sizes) — unchanged.

## Future users

- **Cloud signup:** `setupComplete` true on cloud deploy; vault Q&A works after Mac sync uploads chunks.
- **Local enhancement:** Agents → optional setup; not a dashboard gate.
