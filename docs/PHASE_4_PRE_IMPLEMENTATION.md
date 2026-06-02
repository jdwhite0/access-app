# Phase 4 — Pre-implementation plan

**Status:** Approved for implementation  
**Objective:** Prove vault → connector → registry sync without connector service-role access.

---

## 1. Current gaps

| Gap | Impact |
|-----|--------|
| No connector device JWT flow | Connector cannot authenticate as device |
| No pairing / registration API | Devices cannot enroll without admin key |
| `sync-plan` only; no `sync-apply` | Registry never updated from vault |
| App uses `createSupabaseAdmin()` everywhere | No tenant session context |
| RLS commented out | No DB-enforced isolation |
| Global `systems.system_handle` unique | Multi-tenant collision |
| `identity_id` not written on registry rows | Provenance / idempotency incomplete |
| No `sync_jobs` queue | Sync must be synchronous only |
| No audit log table | Cannot prove who synced what |
| Connector may load service role from parent `.env` | Violates Phase 4A |

---

## 2. Architecture changes

```
┌─────────────┐     pairing code      ┌──────────────────┐
│ ACCESS App  │ ────────────────────► │ register device  │
│ (Clerk)     │                       │ (server action)  │
└─────────────┘                       └────────┬─────────┘
                                               │ one-time device JWT
┌─────────────┐   Bearer device JWT            ▼
│  Connector  │ ────────────────────► ┌──────────────────┐
│  (local)    │   scan/compile/plan     │ /api/connector/* │
└─────────────┘                         └────────┬─────────┘
        │                                          │
        │ no Supabase service role                 │ validate JWT + guards
        ▼                                          ▼
  vault-scan-report.json                  ┌──────────────────┐
                                          │ sync apply engine│
                                          │ (service role +  │
                                          │  request context)│
                                          └────────┬─────────┘
                                                   ▼
                                          Supabase registry + sync_runs + audit
```

- **Connector** talks only to HTTPS APIs with device token.
- **Cloud** uses service role **only on server**, scoped by validated `identity_id` from JWT.
- **RLS** uses `access_set_request_context()` before writes (defense in depth).
- **Async:** connector may `enqueue` or `apply`; worker drains `sync_jobs`.

---

## 3. Schema changes (`schema_v4_platform_hardening.sql`)

| Object | Purpose |
|--------|---------|
| `connector_pairing_codes` | Short-lived codes for device enrollment |
| `connector_devices.permissions` | Scoped capabilities |
| `connector_devices.token_jti` | Active token id for revocation |
| `sync_audit_events` | Per-row audit trail |
| `sync_jobs` | Queue (pending → processing → completed / dead_letter) |
| `access_set_request_context()` | Sets `access.identity_id` for RLS |
| RLS policies | Tenant isolation on vault + registry + sync |
| `get_registry_summary(uuid)` | Single read path |
| Scoped unique on `systems` | `(identity_id, system_handle)` |

---

## 4. Security implications

| Control | Mitigation |
|---------|------------|
| Stolen device token | Short TTL (7d), rotation, revoke, `token_hash` check |
| Pairing code brute force | 6-char, 10 min expiry, rate limit (app layer) |
| Service role on server | Never exposed to connector; guards enforce identity scope |
| Metadata injection | Validator rejects abs paths, secrets, bodies > 4KB |
| Cross-tenant write | JWT `identity_id` must match vault_connection + all upserts |
| RLS bypass via admin | Session context set on every sync apply path |

---

## 5. Implementation plan

| Step | Phase | Deliverable |
|------|-------|-------------|
| 1 | Doc | This file + `SECURITY_REVIEW_PHASE_4.md` |
| 2 | SQL | `schema_v4_platform_hardening.sql` |
| 3 | 4A | `lib/connector-auth/*`, device service, API routes |
| 4 | 4B | `lib/sync/*`, apply API |
| 5 | 4C | ownership guards + RLS context |
| 6 | 4D | `sync_jobs` + `scripts/sync-worker.ts` |
| 7 | Connector | `auth.ts`, `api-client.ts`, `sync-apply.ts`, commands |
| 8 | Verify | `npm run build`, e2e script |

---

## Success criteria mapping

| # | Requirement | Implementation |
|---|-------------|----------------|
| 1 | Authenticate | Device JWT + pairing registration |
| 2 | Scan vault | Existing `scan` |
| 3 | Compile | Existing `compile` |
| 4 | Sync plan | Existing `sync-plan` |
| 5 | Apply sync | `sync-apply` → API |
| 6 | Update registry | `metadata-upsert` engine |
| 7 | Provenance | `source_ref`, `content_hash`, `vault_connection_id` |
| 8 | Complete sync run | `sync_runs` + `sync_audit_events` |

No new UI, chat, marketplace, or graph features in this phase.
