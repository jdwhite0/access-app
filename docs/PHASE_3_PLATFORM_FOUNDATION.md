# Phase 3 — Platform foundation

**Status:** Code complete in repo; Supabase migration must be applied manually.

## What shipped

### Database (`supabase/schema_v3_vault.sql`)

- `vault_connections` — per-identity vault links, connector status, last sync fields
- `sync_runs` — run history (`started` / `completed` / `failed` / `cancelled`)
- `connector_devices` — device registration, `token_hash`, revocable statuses
- Provenance columns on registry tables (`identity_id`, `vault_connection_id`, `source_*`, `content_hash`, `sync_version`, `visibility`)
- Partial unique indexes on `(identity_id, source_ref)` where applicable

### App (`access-app`)

- `lib/vault/provision.ts` — `primary_vault` for every identity
- `lib/vault/dev-seed.ts` — optional `JD_AI_System` row via `ACCESS_DEV_VAULT_SEED_HANDLES`
- `getRegistrySummary` — `vaultConnection`, `connectionsCount`, `syncStatus`, `registryCounts`
- Graceful degradation if `vault_connections` table is missing

### Local connector (`packages/access-connector`)

Flat `src/`: `config`, `scan`, `compile`, `sync-plan`, `cli`, `types`

| Command | Output |
|---------|--------|
| `npm run scan` | `vault-scan-report.json` |
| `npm run compile` | `vault-compile-summary.json` |
| `npm run sync:plan` | JSON plan to stdout (`applyToCloud: false`) |

No upload in this phase.

## Apply Supabase migration

1. Open Supabase project → **SQL Editor**
2. Run in order (if not already applied):
   - `supabase/schema.sql`
   - `supabase/schema_v2.sql`
   - `supabase/schema_v3_vault.sql`
3. Optional dev seed (Jerry handles only):
   - `supabase/seed_dev_jd_ai_system_vault.sql`
4. Set app env: `ACCESS_DEV_VAULT_SEED_HANDLES=jerry.access,jdwhite.access,jdwhite0.access` for auto-provision of JD vault row on login

Verify tables:

```sql
select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in ('vault_connections', 'sync_runs', 'connector_devices');
```

## Local connector setup

```bash
cd access-app/packages/access-connector
cp config.example.json config.local.json
# Edit identityHandle + vaultKey

export ACCESS_VAULT_ROOT="/path/to/JD_Ai_System"
npm run scan
npm run compile
npm run sync:plan
```

## Explicitly not in Phase 3

- Chat UI, JYSON runtime, marketplace, workflow builder
- Metadata upload / sync apply to Supabase
- New public routes or Founder/Companion experimental UI
- RLS policies (required before public multi-tenant launch)

## Recommended Phase 4

1. Connector device auth (JWT / hashed token) — replace service-role probe pattern
2. `sync_runs` orchestration — async job, idempotent upsert by `source_ref`
3. RLS on all tenant tables keyed by `identity_id`
4. Registry write path from connector (metadata only) with audit log
