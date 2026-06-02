# ACCESS Platform Readiness Report

**Milestone target:** M4 — JD_AI_System connector sync proof  
**Date:** 2026-06-01  
**Scope:** Infrastructure only (no UI/chat/marketplace/graph/agents)

---

## Milestone status

| Milestone | Status | Notes |
|-----------|--------|-------|
| **M0** Schema truth | Ready in repo | Apply SQL + `npm run platform:verify-m0` |
| **M1** Ownership model | Implemented | `identity_id` on writes; backfill in v4; scoped `systems` unique |
| **M2** Security perimeter | Implemented | RLS policies + tenant JWT client for sync apply |
| **M3** Connector trust | Implemented | Pairing → device JWT; no service role in connector |
| **M4** Sync proof | Ready to run | `npm run e2e:m4` after SQL + env |

---

## M4 definition of done

| Step | Mechanism |
|------|-----------|
| 1. Authenticate as device | Pairing code + `POST /api/connector/v1/devices/register` → Bearer JWT |
| 2. Scan vault | `packages/access-connector` `scan` (local only) |
| 3. Compile metadata | `compile` |
| 4. Generate sync plan | `sync-plan` → `registry-sync-plan.json` |
| 5. Apply sync | `sync-apply` → `POST /api/connector/v1/sync/apply` |
| 6. Write registry metadata | `lib/sync/metadata-upsert.ts` |
| 7. Record provenance | `source_ref`, `content_hash`, `vault_connection_id`, `identity_id` |
| 8. Create sync_runs | `apply-engine` |
| 9. Update registry summary | `get_registry_summary(identity_id)` RPC |

---

## Architecture compliance

| Requirement | Status |
|-------------|--------|
| No service role in connector | Enforced — connector uses HTTP API only |
| No file bodies in Supabase | Validator + metadata-only upserts |
| No Vercel filesystem for user vault | Connector local; cloud API only |
| RLS enforced on sync path | Tenant Supabase JWT when `SUPABASE_JWT_SECRET` + anon key set |
| `identity_id` canonical | All sync writes include `identity_id` |
| Full audit trail | `sync_audit_events` + `sync_runs.stats` |

---

## Residual risks (pre–public launch)

| Risk | Severity | Mitigation in M5+ |
|------|----------|-------------------|
| Service role still used for pairing/register on server | Medium | Clerk-authenticated pairing only in app; rate limits |
| App server actions still use admin client | Medium | Migrate reads to tenant JWT |
| No production rate limiting on connector API | Medium | Edge middleware / WAF |
| Async worker is script-based | Low | Hosted worker + cron |
| `access_identities.handle` still global unique | Low (correct for identity layer) | — |

---

## Scale readiness (honest)

| Scale | Ready? |
|-------|--------|
| 1 operator | Yes (after M4 E2E passes) |
| 10 trusted tenants | Conditional — need rate limits + monitoring |
| 1,000+ | Requires M5–M7 (summary cache, job queue scale, RLS everywhere) |
| 1,000,000 | Not yet — partitioning, regional, enterprise tier |

---

## Recommended M5 implementation plan

**Theme:** Read path + operations hardening (no new product UI)

### M5.1 — Registry summary at scale
- Materialized view or cached `registry_summary` per `identity_id` (60s TTL)
- Invalidate cache on `sync_runs` completion trigger
- Remove 8-query fallback in `getRegistrySummary` when RPC always available

### M5.2 — Connector API hardening
- Rate limit `/devices/register` and `/sync/apply` per IP + per identity
- Structured logging (device_id, identity_id, sync_run_id)
- Datadog/Sentry hooks for failed sync rate

### M5.3 — Sync operations
- Cron: `prune_sync_runs(90)` + audit archive
- Dashboard query pack (SQL) for ops — not user UI
- Dead letter queue review endpoint (admin only)

### M5.4 — Security completion
- Migrate remaining `lib/actions/*` writes to tenant JWT where feasible
- CI gate: fail if `SUPABASE_SERVICE_ROLE` appears in `packages/access-connector`
- Automated `e2e:m4` in CI with ephemeral Supabase branch

### M5.5 — JD_AI_System production connector
- Document machine setup for Jerry operator device
- Rotate token schedule (90 days)
- Prove second sync is idempotent (skipped rows = unchanged hash)

**Explicitly not in M5:** Chat, JYSON runtime, marketplace, memory graph, workflow builder UI.

---

## Next action

1. Apply all SQL migrations in Supabase.  
2. Set `ACCESS_CONNECTOR_JWT_SECRET`, `SUPABASE_JWT_SECRET`, anon key.  
3. Run `npm run e2e:m4 -- <your.handle>`.  
4. Archive JSON output as M4 proof artifact.

When E2E passes, platform is **M4-complete** and cleared for M5 read-path work only.
