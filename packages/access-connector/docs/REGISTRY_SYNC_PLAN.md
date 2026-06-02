# Registry Sync Plan — Phase 3d (Safe MVP)

## Principle

- **JD_AI_System** = private Intelligence Vault (local only)
- **Supabase** = structured registry metadata (cloud)
- **Connector** = only layer that reads the vault
- **Vercel** = never reads local paths or file bodies

## Phase sequence

| Phase | What runs | Cloud writes |
|-------|-----------|--------------|
| 3a | `vault_connections` + OS context | Auto-provision row (pending_connector) |
| 3b | `health`, `dry-run` | None |
| 3c | `scan` | None — local `vault-scan-report.json` |
| 3d | `sync-plan` | None — stdout JSON plan only |
| 4+ | `sync --apply` (future) | Metadata upserts + `sync_runs` |

## Commands

```bash
export ACCESS_VAULT_ROOT="/path/to/JD_Ai_System"   # local shell only
npm run scan
npm run sync-plan
```

## What `sync-plan` produces

For each scanned file (metadata only), a **candidate** registry row:

| Vault path pattern | Registry type |
|--------------------|---------------|
| `JD Command Vault/projects/*/00_ADMIN/*` | system |
| `JD Command Vault/projects/*/_START_HERE.md` | project |
| `command_center/AGENT*` | agent |
| `command_center/*PROTOCOL*`, `automations/` | workflow |
| `vault/client_system/*` | offer |
| `landing_page/index.html` | asset |
| `access-app/supabase/*.sql` | blueprint |

Unmapped files are omitted from `planned` (counted in `counts.skip`).

Each planned row includes:

- `sourcePath` — relative path only
- `sourceRef` — stable hash (idempotency)
- `sourceKind` — `vault_import`
- `action` — always `would_upsert` in 3d (no apply)

## What is NOT synced in MVP

- File bodies or markdown content
- `.env`, credentials, financial exports
- `node_modules`, `.git`, build artifacts
- Absolute Mac paths in Supabase
- JYSON, Founder, Companion routes

## Future `sync --apply` (Phase 4)

1. Verify `vault_connections.status` → `connected` after connector heartbeat
2. Insert `sync_runs` row (`run_type: metadata_delta`)
3. Upsert registry tables with provenance columns
4. Update `vault_connections.last_sync_at`
5. Never upload full document text — title/summary caps only

## Jerry mapping

| Field | Value |
|-------|--------|
| identityHandle | `jerry.access` (or your live `.access` handle) |
| vault_key | `JD_AI_System` |
| vaultType (config) | `local_intelligence_vault` |
| connector_type | `local_connector` |
| status (3a) | `pending_connector` until connector pairs |
