# M4 — E2E vault sync runbook

## SQL apply order (M0)

```text
supabase/schema.sql
supabase/schema_v2.sql
supabase/schema_v3_vault.sql
supabase/schema_v4_platform_hardening.sql
supabase/schema_v4_m2_tenant_jwt.sql
```

Verify:

```bash
npm run platform:verify-m0
```

## Server environment

| Variable | Purpose |
|----------|---------|
| `ACCESS_CONNECTOR_JWT_SECRET` | Device JWT (32+ bytes) |
| `SUPABASE_JWT_SECRET` | Tenant Supabase JWT for RLS path |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Tenant client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only (pairing, vault status) |

## Connector environment

| Variable | Purpose |
|----------|---------|
| `ACCESS_VAULT_ROOT` | JD_AI_System repo root |
| `ACCESS_API_BASE_URL` | `http://localhost:3000` |

**Never** set `SUPABASE_SERVICE_ROLE_KEY` in connector env.

## Proof run

```bash
# Terminal 1
npm run dev

# Terminal 2
export ACCESS_VAULT_ROOT="/Users/you/Documents/JD_Ai_System"
npm run e2e:m4 -- jerry.access
```

Manual path:

```bash
npm run pairing:code -- jerry.access
cd packages/access-connector && npm run register -- <CODE>
npm run scan && npm run sync:plan && npm run sync:apply
```

## Definition of done checklist

- [ ] Device registered via pairing (no service role in connector)
- [ ] `sync_runs.status = completed`
- [ ] `sync_audit_events` has `run_started`, `row_upserted` or `row_skipped`, `run_completed`
- [ ] Registry rows have `identity_id`, `source_ref`, `vault_connection_id`
- [ ] `get_registry_summary(identity_id)` returns updated counts
- [ ] No file bodies in Supabase rows
