# ACCESS — Platform scale assessment & hardening roadmap

**Audience:** Principal platform engineering  
**Date:** 2026-06-01  
**Status:** Assessment only — **no implementation until this roadmap is confirmed**

---

## Executive framing

ACCESS is not a web app milestone. It is **Personal Intelligence Infrastructure (PII)**:

```
Identity → Vault → Connector → Registry → Memory → Graph → Agent → Model
```

Models are replaceable. Infrastructure is permanent. Every decision below is evaluated against: **“What happens at 1,000,000 identities?”**

---

## 1. Current maturity assessment

| Layer | Target role | Maturity | Evidence in repo |
|-------|-------------|----------|------------------|
| **Identity** | Canonical owner of all objects | **Early (L2)** | `access_identities` + Clerk; handle globally unique (correct for identity). App queries by `clerk_user_id`, not `identity_id`. |
| **Vault** | Owned intelligence containers | **Foundation (L2)** | `vault_connections` in `schema_v3_vault.sql`; `primary_vault` provisioning; dev seed isolated. **Not applied in prod until SQL run.** No vault content in cloud (correct). |
| **Connector** | Local compiler + sync gate | **Scaffold (L1)** | `packages/access-connector`: scan / compile / sync-plan only; **no upload**. No device registration flow in app. |
| **Registry** | Structured OS picture | **Demo-ready (L2)** | Tables + server actions; counts via 8 parallel queries. Provenance columns in SQL **only** — **zero app writes** to `source_ref` / `identity_id`. |
| **Memory** | Derived recall from registry | **Not started (L0)** | No tables, no APIs. |
| **Graph** | Relationships from memory | **Not started (L0)** | No edge store. |
| **Agent** | Reasoning on infrastructure | **Experimental (frozen)** | Founder / Companion / JYSON routes exist but are **out of platform hot path** per freeze. |
| **Model** | Provider bindings | **Not platformized (L0)** | No `personal_ai_instances` / provider binding schema in Supabase. |

### Phase 3 foundation (recent)

| Item | State |
|------|--------|
| `schema_v3_vault.sql` | Written; **manual apply required** |
| Connector local metadata pipeline | Works offline; no cloud sync |
| `getRegistrySummary` vault fields | Works when tables exist; degrades if missing |
| Build | `npm run build` passes |

### Scale readiness snapshot

| Users | Can operate today? | Blocker |
|-------|-------------------|---------|
| **1** (operator) | Yes, with service role + manual SQL | Acceptable for private operator |
| **10** | Risky | No RLS; admin client bypasses tenant boundary |
| **1,000** | No | Global `system_handle` unique; summary fan-out; no async sync |
| **100,000** | No | Above + no retention, no single read path, no connector auth |
| **1,000,000** | No | Full platform hardening + async workers + partitioning strategy |

**Verdict:** Phase 3 moved the **schema and local connector** toward platform shape. The **runtime security and sync model** are still operator-demo grade, not public-trust grade.

---

## 2. Missing infrastructure layers

### Must exist before public launch

1. **RLS on every tenant-owned table** — commented out in `schema.sql`; never enabled.
2. **Canonical `identity_id` in application code** — columns exist in v3 migration; **no `lib/` usage** of `identity_id` today.
3. **Scoped uniqueness migration** — replace global uniques:
   - `systems.system_handle` → `unique (identity_id, system_handle)` or `(owner_handle, system_handle)` with identity FK enforced
   - `access_keys_preview.key_string` → scoped to identity
   - Keep `access_identities.handle` globally unique (identity namespace is correct)
4. **Connector device auth** — `connector_devices` table exists; no registration API, no JWT, no hashed token issuance, no revoke UI/API.
5. **Sync apply pipeline** — idempotent upsert by `(identity_id, source_ref)` + `content_hash` change detection; **no** `sync_runs` writer in app/connector yet.
6. **`sync_runs` retention** — no TTL, partition, or archival job.
7. **Registry summary RPC** — one DB function or materialized view, not 8+ HTTP round-trips per page load.
8. **Audit log** — who synced what, when, from which device (for trust at scale).
9. **Memory layer** — deferred until registry sync is proven; do not skip registry proof.
10. **Graph layer** — deferred until memory exists.

### Explicitly deferred (correct)

- Marketplace, agent store, workflow builder UI
- Chat-first experiences
- JYSON runtime on production hot path
- Vercel reading user vault filesystem

---

## 3. Architecture risks (trust & correctness)

| Risk | Severity | Current state |
|------|----------|---------------|
| **Service role on all server actions** | Critical | `createSupabaseAdmin()` in every `lib/actions/*` — bypasses RLS entirely. Fine for 1 operator; catastrophic at 10+ untrusted tenants. |
| **RLS disabled** | Critical | Lines commented in `schema.sql`; v3 does not enable RLS. |
| **Global `system_handle` unique** | High | Two users cannot both register `mybrand.access`-style handles under different identities. Breaks multi-tenant registry. |
| **`clerk_user_id` as app owner key** | High | Clerk IDs are auth binding, not canonical ownership. Provider migration / org accounts need `identity_id`. |
| **Provenance columns unused** | High | Sync cannot be idempotent or auditable until writes populate `source_ref`, `content_hash`, `vault_connection_id`. |
| **Vercel filesystem reads** | High | `lib/access-handle/build-handle-context.ts`, `package-loader.ts` read `process.cwd()` paths — violates “cloud never reads local vault” for handle packages. OK for dev fixtures; **must not be production path for user vaults**. |
| **Large JSON blobs in registry** | Medium | `builder_projects.architecture`, `blueprints.answers`, task/milestone JSON — risk of storing document bodies in Supabase. Sync policy must cap size and strip bodies. |
| **`system_files.url`** | Medium | Could become exfil path if used for local file URLs. |
| **Provisioning on read** | Low–Med | `getRegistrySummary` calls `ensureVaultConnectionsForIdentity` — side effect on read; move to identity create / explicit setup. |
| **Dev seed env** | Low | Isolated in `dev-seed.ts` — acceptable if **never** set in production multi-tenant. |

---

## 4. Scale risks (performance & operations)

| Risk | At 1K users | At 1M users |
|------|-------------|-------------|
| **Registry summary = 8+ count queries + vault queries + provision** | Noticeable latency on every OS load | Unacceptable without single RPC / cache |
| **No sync job queue** | Manual connector runs only | Requires worker tier (Edge Function, queue, or dedicated sync service) |
| **No `sync_runs` retention** | Table bloat | Storage cost + slow history queries |
| **No connection pooling strategy** | Supabase default may suffice | Need PgBouncer, read replicas for summary |
| **Count queries without covering indexes** | OK small data | Need composite indexes `(identity_id, status)` on each registry table |
| **No rate limits on connector API** | Abuse possible | Per-device + per-identity quotas |
| **Single-region Supabase** | OK | Multi-region / DR plan for government/enterprise tier later |

---

## 5. Public-scale hardening checklist (pre-launch gates)

Each item is a **hard gate** before syncing real metadata to production or opening beyond trusted operators.

| # | Requirement | Today | Gate |
|---|-------------|-------|------|
| H1 | RLS on tenant tables | Off | Enable + policies tested |
| H2 | `identity_id` canonical in writes/reads | SQL only | All mutations include `identity_id`; RLS uses it |
| H3 | Scoped unique constraints | Global handles on systems/keys | Migration + app validation |
| H4 | No service role in connector | Removed from connector package | Device-scoped connector JWT only |
| H5 | Connector auth: scoped, revocable, identity-bound | Table only | Register → activate → rotate → revoke |
| H6 | Sync idempotent: `source_ref` + `content_hash` | Plan only | Upsert contract + tests |
| H7 | `sync_runs` retention policy | None | e.g. 90-day hot + archive |
| H8 | `registry_summary` one read path | 8+ queries | SQL function / RPC |
| H9 | No Jerry-only hot path | Dev seed env only | CI check: no hardcoded handles in `lib/` |
| H10 | No file bodies / secrets / abs paths in DB | Policy documented | Sync validator rejects violations |
| H11 | No Vercel filesystem for user vaults | Handle package loader uses fs | Connector-only ingestion |
| H12 | No UI expansion until JD_AI_System sync proven | OS shell OK | E2E: scan → compile → apply → summary reflects counts |

---

## 6. Required platform milestones

### M0 — Schema truth (now)

- Apply `schema.sql` → `schema_v2.sql` → `schema_v3_vault.sql`
- Verify tables + provenance columns in Supabase
- Document operator env vs production env

### M1 — Ownership model (blocking)

- Backfill `identity_id` on all registry rows from `clerk_user_id`
- Make `identity_id` NOT NULL on new writes
- Migrate global uniques → scoped uniques
- Add composite indexes `(identity_id, status)` per registry table

### M2 — Security perimeter (blocking public)

- Enable RLS on: `access_identities`, `vault_connections`, `sync_runs`, `connector_devices`, all registry tables
- Policies: `identity_id = auth.jwt() -> identity_id` (via Clerk JWT custom claim or mapping table)
- Replace admin client in user paths with **user-scoped Supabase client** where possible; reserve service role for cron/sync worker only

### M3 — Connector trust (blocking sync)

- Device registration API (server): create `connector_devices` row, return one-time token
- Connector stores token locally (keychain), never service role
- Heartbeat: `last_seen_at`, `vault_connections.status`
- Revoke device → invalidate token_hash

### M4 — Metadata sync proof (blocking UI expansion)

**Success definition:** JD_AI_System scan → compile → **apply** → Supabase registry rows updated → `getRegistrySummary` reflects new counts **without** manual SQL.

- Sync worker: upsert metadata only
- Idempotency: same `source_ref` + same `content_hash` = no-op
- Change: bump `sync_version`, set `last_synced_at`
- Record `sync_runs` start/complete/fail
- Reject: body > N KB, absolute paths, `.env`, secrets

### M5 — Read path optimization

- `get_registry_summary(identity_id)` Postgres function returning JSON
- Optional: Redis/edge cache 30–60s per identity

### M6 — Operations

- `sync_runs` retention job (nightly)
- Audit table: `sync_events` or append to `sync_runs.stats`
- Observability: failed sync rate per identity

### M7 — Memory & graph (post-proof)

- Memory objects reference registry `id` + `source_ref`
- Graph edges reference memory nodes
- Agents read scoped views only — never raw filesystem

---

## 7. Recommended implementation order

**Do not reorder** without accepting security debt.

```
M0  Apply SQL + verify
    ↓
M1  identity_id backfill + scoped uniques + app writes ownership
    ↓
M2  RLS + JWT claim mapping + remove admin from user hot paths
    ↓
M3  Connector device auth (no service role in connector)
    ↓
M4  Sync apply (JD_AI_System E2E proof) — THE unlock for everything else
    ↓
M5  registry_summary RPC
    ↓
M6  sync_runs retention + audit
    ↓
M7  Memory → Graph → Agent (platformized)
```

**Parallel safe only after M2:** connector scan/compile improvements, docs, tests.

---

## 8. What should never be built yet

Until **M4 sync proof** passes for JD_AI_System:

| Never build | Why |
|-------------|-----|
| Chat UI / conversational shell | No grounded registry memory |
| JYSON runtime on production path | Agents without provenance = liability |
| Marketplace / agent store | No trust perimeter |
| Workflow builder UI | Registry not source of truth yet |
| Extra dashboards / analytics vanity | Hides missing sync |
| New public routes / growth features | Expands attack surface |
| Founder/Companion experimental UI expansion | Frozen; not platform core |
| Supabase storage of markdown bodies / PDFs | Violates vault-compute model |
| Vercel reading `ACCESS_VAULT_ROOT` | Violates architecture |
| Service role in connector binary or config | One leak = all tenants |
| Global handles for systems/projects | Breaks 1M-user namespace |
| Investor-demo “fake sync” | Destroys trust narrative |

---

## 9. What must be built next (after roadmap confirmation)

**Confirmed next slice (recommended):**

1. **`schema_v4_ownership.sql`** (name TBD)
   - Backfill + NOT NULL `identity_id`
   - Drop global uniques; add scoped uniques
   - RLS enable + baseline policies

2. **`schema_v4_connector_auth.sql`**
   - Device token issuance functions
   - Connector-facing RPC with security definer + narrow scope

3. **Sync apply module** (connector + server worker)
   - Validates metadata contract (H10)
   - Writes `sync_runs`
   - Idempotent upsert

4. **`get_registry_summary` SQL function** + thin server action wrapper

5. **E2E test script:** `scripts/e2e-vault-sync-proof.ts`

**Not next:** UI polish, chat, marketplace, graph UI.

---

## 10. Layer ownership answers (platform contract)

For every registry object at scale:

| Question | Required answer |
|----------|-----------------|
| Who owns it? | `access_identities.id` |
| Which vault produced it? | `vault_connection_id` + `source_vault_key` |
| Which connector? | `connector_devices.id` on sync run |
| What source? | `source_ref` (stable hash key), `source_path` (relative only) |
| Sync again? | Yes — same `source_ref`, compare `content_hash` |
| Revoke? | Device revoke + vault `revoked` status |
| Version? | `sync_version` monotonic per row |
| Audit? | `sync_runs` + future `sync_events` |
| Scale 1M? | RLS + scoped unique + async sync + single summary RPC |

---

## 11. Decision rule applied

When choosing between:

- **Fast feature** (new OS panel, chat, founder wizard polish)
- **Stronger foundation** (RLS, identity_id writes, connector auth, sync proof)

→ **Always foundation** until M4 is green.

Phase 3 was correctly aimed at schema + local compiler, not demo UI. Phase 4 must be **security + sync proof**, not “upload button” without H1–H6.

---

## 12. Confirmation requested

Before any code changes, confirm:

- [ ] Milestone order M0 → M7 is approved
- [ ] M4 success criteria (JD_AI_System E2E sync proof) is the UI expansion gate
- [ ] Founder/Companion/JYSON remain frozen
- [ ] First implementation slice = **M0 + M1 + M2** (SQL + identity ownership + RLS), then **M3 + M4**

Reply with **“approved”** or adjustments (e.g. defer RLS until after sync proof — **not recommended** for any public tenant).

---

## Related docs

- [REGISTRY_SOURCE_OF_TRUTH.md](./REGISTRY_SOURCE_OF_TRUTH.md)
- [PHASE_3_PLATFORM_FOUNDATION.md](./PHASE_3_PLATFORM_FOUNDATION.md)
