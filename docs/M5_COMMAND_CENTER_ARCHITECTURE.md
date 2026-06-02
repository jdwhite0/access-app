# M5 — JD AI Systems Command Center
## Architecture Blueprint

> **Canonical operator architecture:** [`JD_AI_SYSTEMS_COMMAND_CENTER_ARCHITECTURE.md`](../../JD_AI_SYSTEMS_COMMAND_CENTER_ARCHITECTURE.md) at repo root — inputs, pipeline, recommendations, operator workflow, and why Command Center precedes status/alerts/AI operators.  
> **Status pages (three views):** [`STATUS_PAGE_ARCHITECTURE.md`](../../STATUS_PAGE_ARCHITECTURE.md) — how Operator / Developer / Consumer surfaces inherit from Command Center.

**Platform:** JD AI Systems  
**Milestone:** M5  
**Status:** Implementation in progress — Health API + Command Center API + recommendations engine landed; persistence, probes, alerts per sections below  
**Predecessor:** M4 complete (connector sync, platform health layer 7/7 verified)  
**Author:** Principal Platform Architect  
**Date:** 2026-06-02

---

## 1. Mission

M4 proved the platform can classify and surface failures. M5 makes the platform self-aware at runtime.

The Command Center is not a product feature. It is the nervous system of JD AI Systems — the shared infrastructure layer that watches every provider, aggregates health across every product, routes classified incidents to the right audience, and gives operators, engineers, and consumers exactly the right signal at the right time.

Every current and future product — ACCESS OS, JYSON, Build, Vault — consumes it identically. No product gets a private version. No provider is hardcoded into product logic. The Command Center is the single source of platform truth.

---

## 2. Architectural Premise

### What exists after M4

```
lib/platform-health/
  status-types.ts      — enums, IDs, severity levels
  product-registry.ts  — 6 products catalogued
  provider-registry.ts — 10 providers catalogued
  error-classifier.ts  — classifyError() — 7/7 patterns proven
  health-event.ts      — stamped incident records
  health-snapshot.ts   — aggregate rollup
  status-message.ts    — audience-safe messages + sanitization
  index.ts             — clean exports
```

This is the classification engine. M5 builds the operating infrastructure around it:
the probing system that feeds it, the persistence layer that stores it, the API that
exposes it, and the alert routing that acts on it.

### What M5 adds

| Layer | M4 State | M5 Target |
|-------|----------|-----------|
| Classification | Done (classifyError) | Consumed by probing + ingestion |
| Probing | None | Provider adapters probing on schedule |
| Persistence | None | Database tables for events, incidents, snapshots |
| API | None | REST surface for all platform health data |
| Alert routing | None | Audience-aware dispatch (Slack, webhook, dashboard) |
| Status surface | None | Internal diagnostic + public consumer endpoint |
| Incident lifecycle | None | Open → investigating → monitoring → resolved |

---

## 3. The Four Levels

This architecture is organized into four levels. Each level has a defined contract
with the levels above and below it. No level reaches past its adjacent neighbor.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  LEVEL 3  —  PROVIDERS                                                   │
│                                                                          │
│  The external and local services the platform depends on.               │
│  Providers are watched, not trusted.                                     │
│                                                                          │
│  anthropic_claude  openai  supabase  vercel  clerk                      │
│  local_connector   local_filesystem  local_runtime  browser_client      │
│  [future: stripe  twilio  sendgrid  google  github  upstash  railway]   │
└──────────────────────────────────────────────────────────────────────────┘
         ↓ probed by Provider Monitor
┌──────────────────────────────────────────────────────────────────────────┐
│  LEVEL 1  —  PLATFORM SERVICES                                           │
│                                                                          │
│  The shared infrastructure consumed by all products.                    │
│  This is where M4 classification lives and M5 builds upon.             │
│                                                                          │
│  Health Engine    Provider Monitor    Event Bus    Snapshot Engine      │
│  Alert Router     Log Collector       Incident Tracker  Command API     │
└──────────────────────────────────────────────────────────────────────────┘
         ↓ consumed by Products
┌──────────────────────────────────────────────────────────────────────────┐
│  LEVEL 2  —  PRODUCTS                                                    │
│                                                                          │
│  Products report into L1 and read status from L1.                      │
│  No product manages its own provider health.                            │
│                                                                          │
│  ACCESS OS    JYSON    Build    Vault    [future products]              │
└──────────────────────────────────────────────────────────────────────────┘
         ↓ hosted on Infrastructure
┌──────────────────────────────────────────────────────────────────────────┐
│  LEVEL 0  —  INFRASTRUCTURE                                              │
│                                                                          │
│  The physical and cloud substrate everything runs on.                   │
│                                                                          │
│  Vercel (hosting + edge)   Supabase (DB + realtime + RLS)              │
│  Squarespace DNS           Local filesystem    Node runtime             │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. System Architecture Diagram

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    JD AI SYSTEMS — COMMAND CENTER                           ║
║                         Platform Services  (L1)                             ║
╠══════════════╦══════════════════╦═══════════════════╦════════════════════════╣
║              ║                  ║                   ║                        ║
║  HEALTH      ║  PROVIDER        ║  EVENT BUS        ║  SNAPSHOT ENGINE       ║
║  ENGINE      ║  MONITOR         ║                   ║                        ║
║              ║                  ║  PlatformEvent    ║  PlatformHealthSnapshot ║
║  classifyErr ║  adapter.probe() ║  published on:    ║  built from:           ║
║  buildMsgs   ║  → HealthEvent   ║  - incident.open  ║  - all open events     ║
║  sanitize    ║  per provider    ║  - status.change  ║  - per product/prov    ║
║  M4 ✓        ║  scheduled       ║  - probe.done     ║  - worst-status rollup ║
║              ║                  ║  - alert.sent     ║  - periodic + on-demand ║
╠══════════════╩══════════════════╩═══════════════════╩════════════════════════╣
║                                                                              ║
║  ALERT ROUTER              INCIDENT TRACKER         LOG COLLECTOR           ║
║                                                                              ║
║  classified event          open/investigating/       structured platform     ║
║  → determine audience      monitoring/resolved       logs per product,       ║
║  → route to channel:       lifecycle, grouped        provider, service       ║
║    slack | webhook |        by root kind and         leveled: debug|info|    ║
║    dashboard | email        affected products        warn|error|critical     ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                     COMMAND CENTER API                                       ║
║                                                                              ║
║  GET /api/platform/health                → PlatformHealthSnapshot           ║
║  GET /api/platform/health/providers      → ProviderHealthSlice[]            ║
║  GET /api/platform/health/products       → ProductHealthSlice[]             ║
║  GET /api/platform/health/events         → HealthEvent[] (paginated)        ║
║  POST /api/platform/health/events        → ingest external event            ║
║  POST /api/platform/health/probe/:id     → trigger manual provider probe    ║
║  GET /api/platform/incidents             → Incident[] (open)                ║
║  GET /api/platform/incidents/:id         → IncidentDetail                   ║
║  PATCH /api/platform/incidents/:id       → operator lifecycle update        ║
║  GET /api/platform/logs                  → structured logs (engineering)    ║
║  GET /api/platform/status                → public-safe snapshot (consumer)  ║
╠═══════════════════╦══════════════════════╦═══════════════════════════════════╣
║  OPERATOR VIEW    ║  DEVELOPER VIEW      ║  CONSUMER VIEW                   ║
║                   ║                      ║                                  ║
║  Auth: Clerk JWT  ║  Auth: Clerk JWT     ║  Public (no auth)                ║
║                   ║  (engineering role)  ║                                  ║
║  Status grid      ║  Raw event stream    ║  Overall status                  ║
║  Active incidents ║  Full classification ║  (green/yellow/red)              ║
║  Alert history    ║  Provider probe log  ║  Per-product status              ║
║  Incident mgmt    ║  Log viewer          ║  (consumer-safe names)           ║
║  Provider probes  ║  Snapshot history    ║  Active incidents                ║
║  Recommend. action║  Adapter debug       ║  (audience messages only)        ║
╚═══════════════════╩══════════════════════╩═══════════════════════════════════╝
         ↑                    ↑                           ↑
         │ reports events     │ classifyError()           │ reads /status
         │ reads /health      │ reads /logs               │
┌────────┴────────┐  ┌────────┴────────┐  ┌────────────┴───────┐
│   ACCESS OS     │  │     JYSON       │  │  Build / Vault /   │
│                 │  │                 │  │  future products   │
│  connector sync │  │  AI companion   │  │                    │
│  vault scan     │  │  command bridge │  │                    │
└─────────────────┘  └─────────────────┘  └────────────────────┘
         Products (L2) — consume platform services, report to Command Center
```

---

## 5. Required Services (Level 1 Detail)

### 5.1 Health Engine
**Status:** M4 complete — `lib/platform-health/`  
**Contract:** `classifyError(input) → ClassifiedError` + audience messages + sanitization  
**M5 role:** Health Engine is the classification core that all other services feed into and read from. No changes to the engine itself in M5 — it is extended by the services around it.

### 5.2 Provider Monitor
**Status:** New in M5  
**Purpose:** Probes each registered provider on a schedule and ingests the result as a `HealthEvent`.

The Provider Monitor implements the **Provider Adapter Pattern** — the core extensibility mechanism of the entire Command Center. Every provider, current or future, is a `ProviderAdapter` implementation. The monitor iterates all registered adapters, calls `probe()`, and feeds results to the Health Engine.

**Scheduling:** Vercel Edge Functions with cron, or scheduled server action  
**Probe frequency per tier:**

| Provider Tier | Probe Interval | Rationale |
|--------------|----------------|-----------|
| External AI (Anthropic, OpenAI) | 60s | High-impact, volatile |
| External Data (Supabase) | 120s | Foundation, moderate volatility |
| Auth (Clerk) | 120s | Session-critical |
| Hosting (Vercel) | 300s | Self-monitoring |
| Local (connector, filesystem) | On-demand + heartbeat | Not continuously probeable |
| Unknown | N/A | No probing |

### 5.3 Event Bus
**Status:** New in M5  
**Purpose:** Publishes platform events so all consumers receive them in order.

**M5 implementation:** Supabase Realtime (existing infra, no new dependencies)  
**M6+ path:** Redis Streams or Kafka when multi-region or high-frequency needs emerge

**Event types:**

| Event | When Published |
|-------|---------------|
| `provider.probe.completed` | After every adapter probe |
| `provider.status.changed` | When provider status differs from previous probe |
| `product.status.changed` | When a product's worst-status rollup changes |
| `incident.opened` | When a new unresolved incident is created |
| `incident.status.updated` | When operator updates lifecycle |
| `incident.resolved` | When incident marked resolved |
| `alert.dispatched` | After alert router sends to a channel |
| `snapshot.built` | After snapshot engine completes a build |

### 5.4 Snapshot Engine
**Status:** Logic exists in `health-snapshot.ts` — persistence and scheduling are M5  
**Purpose:** Periodically builds and stores `PlatformHealthSnapshot` rows in the database. Provides historical record, fast reads for dashboards, and the public status endpoint.

**Build triggers:**
- Scheduled: every 5 minutes
- On-demand: when `provider.status.changed` is received
- Manual: via `POST /api/platform/health/probe/:id`

### 5.5 Alert Router
**Status:** New in M5  
**Purpose:** Receives classified `HealthEvent`, determines the correct audience, selects the correct channel, and dispatches.

**Audience → Channel mapping:**

| Audience | Default Channel | Required? |
|----------|----------------|-----------|
| `internal_engineering` | Slack `#platform-alerts` | Required |
| `operator` | Slack `#jd-ops` + dashboard notification | Required |
| `consumer_public` | Status page update | Automatic |
| `enterprise_admin` | Webhook to enterprise endpoint | Optional (M6+) |

**Severity threshold for alerting:**

| Severity | Engineering | Operator | Consumer |
|----------|-------------|----------|----------|
| `info` | Log only | Log only | No update |
| `warning` | Slack message | Slack message | Status page note |
| `error` | Slack + incident open | Slack + dashboard badge | Status page update |
| `critical` | All channels + page | All channels | Status page banner |

### 5.6 Log Collector
**Status:** New in M5  
**Purpose:** Structured platform-level logging that every product can write to. Separate from application logs (Next.js/Vercel logs). Persisted to `platform_logs` table.

**Contract:** `platformLog({ level, product, provider, service, message, context })`  
**Access:** Engineering only via `/api/platform/logs`

### 5.7 Incident Tracker
**Status:** New in M5  
**Purpose:** Groups related `HealthEvent` records into a lifecycle-managed `Incident`. A single Claude 529 is an event. Three consecutive 529s within a window is an incident.

**Incident lifecycle:**

```
[event received]
     ↓
 incident exists for this provider+kind within window?
     ↓ no                              ↓ yes
 open new incident               append event to existing incident
 status: investigating            re-evaluate severity
     ↓
 operator acknowledges
 status: identified
     ↓
 operator applies fix or provider recovers
 status: monitoring
     ↓
 provider probes clean for N consecutive cycles
 status: resolved
 resolved_at stamped
```

**Grouping keys:** `(provider_id, kind)` within a 30-minute rolling window  
**Auto-resolution:** If provider probe returns `operational` for 3 consecutive cycles with no new events, incident auto-resolves.

---

## 6. Provider Adapter Pattern

This is the architectural mechanism that makes the Command Center permanently extensible. Adding a new provider — Stripe, Twilio, Google, SendGrid, any future service — requires implementing one interface and registering one entry. Nothing else changes.

### 6.1 Interface contract

```
ProviderAdapter {
  id: PlatformProviderId                           — stable machine identifier
  displayName: string                              — human label
  category: ProviderCategory                       — ai | data | auth | hosting | local | ...
  isExternal: boolean                              — external = probeable via HTTP

  probe(): Promise<ProviderProbeResult>            — run health check
  classifyError(err: unknown): ProviderClassification | null — classify known errors
  getDependentServices(): PlatformServiceId[]      — what services this powers
  getDependentProducts(): PlatformProductId[]      — which products depend on this
  getStatusPageUrl(): string | undefined           — link for operator view
}
```

### 6.2 ProviderProbeResult

```
{
  provider: PlatformProviderId
  status: HealthStatus
  responseMs?: number
  probedAt: string          — ISO 8601
  httpStatus?: number
  detail?: string           — engineering only, sanitized before consumer display
  raw?: unknown             — never persisted, dropped after classification
}
```

### 6.3 Registered adapters (M5 scope)

| Adapter | Probe mechanism | Auto-classifies |
|---------|----------------|-----------------|
| `AnthropicAdapter` | POST to `/v1/messages` with timeout | 529, rate limits, network errors |
| `SupabaseAdapter` | Call `pg_stat_activity` or health RPC | Connection failure, schema errors |
| `ClerkAdapter` | GET to Clerk JWKS endpoint | Auth endpoint down, JWT errors |
| `VercelAdapter` | GET to status API | Deployment blocked, edge errors |
| `LocalConnectorAdapter` | Reads last heartbeat timestamp | Stale heartbeat, pairing expired |
| `LocalFilesystemAdapter` | Stat on `ACCESS_VAULT_ROOT` | Missing root, permission error |

### 6.4 Adding a future provider (example: Stripe)

1. Create `adapters/stripe.ts` implementing `ProviderAdapter`
2. Add `'stripe'` to `PlatformProviderId` union in `status-types.ts`
3. Add entry to `PROVIDER_REGISTRY` in `provider-registry.ts`
4. Register adapter instance in `provider-monitor/registry.ts`
5. Add Stripe-specific error patterns to `error-classifier.ts`

**That is the complete change set.** No modifications to the Health Engine, Event Bus, Alert Router, Incident Tracker, API routes, database schema, or product-level code.

---

## 7. Outage Propagation Model

When a provider degrades, the failure must propagate correctly through the stack — reaching the right products, generating the right audience messages, and routing to the right channels without over-alerting.

### 7.1 Propagation algorithm

```
Step 1  Provider probe returns degraded/blocked/offline status
             ↓
Step 2  ProviderAdapter.probe() returns ProviderProbeResult
             ↓
Step 3  Health Engine classifies into HealthEvent (classifyError)
             ↓
Step 4  Dependency map resolves: which services does this provider power?
             ↓
Step 5  Dependency map resolves: which products depend on those services?
             ↓
Step 6  HealthEvent created for each affected product with correct severity
             ↓
Step 7  Snapshot Engine rebuilds PlatformHealthSnapshot
             ↓
Step 8  Incident Tracker groups event into open or existing incident
             ↓
Step 9  Alert Router dispatches to correct audiences per severity threshold
             ↓
Step 10 Event Bus publishes provider.status.changed and incident.opened
             ↓
Step 11 Consumer status page reflects safe audience message automatically
```

### 7.2 Provider → Service → Product dependency tree

```
anthropic_claude
  └── services: ai_inference
        └── products: jyson (companion commands)
                      access_os (founder wizard, AI-assisted workflows)
                      build (future: AI-powered delivery)

openai
  └── services: ai_inference
        └── products: jyson (multi-model fallback)
                      [future products] (multi-model routing)

supabase
  └── services: database, auth, registry, sync_engine
        └── products: access_os (all persisted operations)
                      jyson (context persistence)
                      vault (sync apply, sync_runs)
                      build (project registry)

clerk
  └── services: auth
        └── products: access_os (login, session)
                      jyson (operator auth)
                      build (enterprise auth)

vercel
  └── services: deployment, api, runtime
        └── products: ALL (all web-facing products deploy to Vercel)

local_connector
  └── services: connector, sync_engine
        └── products: access_os (vault sync, device pairing)

local_filesystem
  └── services: vault
        └── products: vault (scan, compile)
                      access_os (connector scan)
```

### 7.3 Named outage scenarios

| Scenario | Provider | Affected Services | Affected Products | Audience | Action |
|----------|----------|------------------|-------------------|----------|--------|
| Claude 529 | anthropic_claude | ai_inference | jyson, access_os | operator + engineering | Pause AI ops, retry after recovery |
| Supabase down | supabase | database, auth, registry | access_os, jyson, vault | operator + engineering | Read-only degraded mode |
| Supabase schema missing | supabase | database | access_os | engineering only | Apply migration per APPLY_ORDER.md |
| Clerk JWKS unreachable | clerk | auth | access_os | operator + engineering | Sessions using cached JWTs degrade after TTL |
| Vercel build failure | vercel | deployment | ALL | operator only | Block release, do not affect runtime |
| Connector pairing expired | local_connector | connector | access_os | operator + engineering | Re-register device |
| Vault root missing | local_filesystem | vault | vault, access_os | engineering only | Set ACCESS_VAULT_ROOT |
| Port conflict | local_runtime | runtime | local dev | engineering only | Kill conflicting process |

### 7.4 Blast radius rules

- A local dev environment issue (`local_dev_conflict`, `local_env_missing`) never elevates to `consumer_public` level. Engineering audience only.
- A provider outage that affects only one product does not affect other products' statuses in the snapshot.
- A Supabase schema error affects `access_os` status but does not mark `jyson` as degraded unless JYSON has its own Supabase dependency path.
- Vercel outages are `deployment` service issues — they do not mark running apps as degraded unless runtime is also impacted.

---

## 8. Database Design

All tables live in the existing Supabase project used by ACCESS OS.
No new Supabase project is required for M5.
Platform health tables are prefixed `platform_` to distinguish from product tables.

### 8.1 Table: `platform_provider_health`
Current and historical state of each provider.

```sql
platform_provider_health (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id       text         NOT NULL,
  status            text         NOT NULL,           -- HealthStatus enum
  probed_at         timestamptz  NOT NULL DEFAULT now(),
  response_ms       integer,                         -- null for non-HTTP probes
  http_status       integer,
  probe_detail      text,                            -- engineering only
  is_current        boolean      NOT NULL DEFAULT true,
  created_at        timestamptz  NOT NULL DEFAULT now()
)

INDEXES:
  (provider_id, is_current) WHERE is_current = true   — fast current state lookup
  (provider_id, probed_at DESC)                        — history queries
  (status, probed_at DESC)                             — find all degraded providers
```

**Pattern:** When a probe completes, set the previous `is_current = false` for that provider, then insert a new row with `is_current = true`. Never mutate probe records.

### 8.2 Table: `platform_product_health`
Computed health state per product, derived from event rollups.

```sql
platform_product_health (
  id                    uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            text         NOT NULL,
  status                text         NOT NULL,           -- HealthStatus enum
  computed_at           timestamptz  NOT NULL DEFAULT now(),
  open_incident_count   integer      NOT NULL DEFAULT 0,
  worst_provider_id     text,
  worst_kind            text,
  is_current            boolean      NOT NULL DEFAULT true
)

INDEXES:
  (product_id, is_current) WHERE is_current = true
```

### 8.3 Table: `platform_health_events`
Persistent store for all classified `HealthEvent` records.
This is the M4 `HealthEvent` type written to disk.

```sql
platform_health_events (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  at            timestamptz  NOT NULL DEFAULT now(),
  platform      text         NOT NULL DEFAULT 'jd_ai_systems',
  product_id    text         NOT NULL,
  provider_id   text         NOT NULL,
  service_id    text         NOT NULL,
  status        text         NOT NULL,
  category      text         NOT NULL,
  kind          text         NOT NULL,
  severity      text         NOT NULL,
  summary       text         NOT NULL,
  http_status   integer,
  code          text,
  messages      jsonb        NOT NULL,   -- AudienceMessages object
  raw_detail    text,                    -- engineering only, never exposed
  incident_id   uuid         REFERENCES platform_incidents(id),
  session_id    text,
  handle        text
)

INDEXES:
  (at DESC)
  (provider_id, at DESC)
  (product_id, at DESC)
  (kind, at DESC)
  (incident_id) WHERE incident_id IS NOT NULL
  (severity, at DESC) WHERE severity IN ('error', 'critical')
```

### 8.4 Table: `platform_incidents`
Grouped, lifecycle-managed records for related events.

```sql
platform_incidents (
  id                    uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  opened_at             timestamptz  NOT NULL DEFAULT now(),
  resolved_at           timestamptz,
  title                 text         NOT NULL,
  lifecycle_status      text         NOT NULL,   -- investigating | identified | monitoring | resolved
  severity              text         NOT NULL,
  affected_products     text[]       NOT NULL,
  affected_providers    text[]       NOT NULL,
  root_kind             text         NOT NULL,   -- ClassifiedIssueKind
  root_provider         text         NOT NULL,
  event_count           integer      NOT NULL DEFAULT 1,
  engineering_notes     text,
  operator_notes        text,
  consumer_message      text         NOT NULL,  -- sanitized, audience-safe
  auto_resolved         boolean      NOT NULL DEFAULT false,
  probe_clear_count     integer      NOT NULL DEFAULT 0  -- for auto-resolution
)

INDEXES:
  (lifecycle_status, opened_at DESC)
  (root_provider, lifecycle_status)
  (opened_at DESC)
  (resolved_at DESC) WHERE resolved_at IS NOT NULL
```

### 8.5 Table: `platform_snapshots`
Periodic and event-triggered aggregate snapshots.

```sql
platform_snapshots (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  at                timestamptz  NOT NULL DEFAULT now(),
  overall_status    text         NOT NULL,
  product_statuses  jsonb        NOT NULL,   -- ProductHealthSlice[]
  provider_statuses jsonb        NOT NULL,   -- ProviderHealthSlice[]
  open_incident_count integer   NOT NULL DEFAULT 0,
  trigger           text         NOT NULL    -- 'scheduled' | 'probe' | 'incident' | 'manual'
)

INDEXES:
  (at DESC)
  (trigger, at DESC)
```

**Retention policy:** Keep last 7 days of snapshots at full resolution. Downsample to hourly after 7 days. Monthly summary indefinitely.

### 8.6 Table: `platform_logs`
Structured platform-level logs. Not application logs.

```sql
platform_logs (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  at          timestamptz  NOT NULL DEFAULT now(),
  level       text         NOT NULL,     -- debug | info | warn | error | critical
  product_id  text,
  provider_id text,
  service_id  text,
  message     text         NOT NULL,
  context     jsonb,
  session_id  text,
  handle      text
)

INDEXES:
  (at DESC)
  (level, at DESC) WHERE level IN ('warn', 'error', 'critical')
  (product_id, at DESC) WHERE product_id IS NOT NULL
  (provider_id, at DESC) WHERE provider_id IS NOT NULL
```

**Retention policy:** 30 days full, then aggregate error/critical indefinitely.

### 8.7 Table: `platform_alert_log`
Record of every alert dispatched — for audit and deduplication.

```sql
platform_alert_log (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  at           timestamptz  NOT NULL DEFAULT now(),
  event_id     uuid         REFERENCES platform_health_events(id),
  incident_id  uuid         REFERENCES platform_incidents(id),
  channel      text         NOT NULL,   -- slack | webhook | dashboard | email
  audience     text         NOT NULL,
  severity     text         NOT NULL,
  status       text         NOT NULL,   -- pending | sent | failed
  payload      jsonb        NOT NULL,   -- sanitized, audience-appropriate
  response     jsonb,                   -- channel response or error
  dedup_key    text                     -- prevents duplicate alerts within window
)

INDEXES:
  (dedup_key) WHERE dedup_key IS NOT NULL   — deduplication lookups
  (incident_id, channel)                    — alert history per incident
  (at DESC)
```

### 8.8 Row-Level Security posture

All `platform_*` tables require authenticated reads (Clerk JWT) except:

| Table | Read rule | Write rule |
|-------|-----------|------------|
| `platform_snapshots` | Public (anon) for `overall_status` column only | Service role + device JWT |
| `platform_incidents` | Authenticated for full record; `consumer_message` + `lifecycle_status` public | Service role |
| `platform_health_events` | Engineering role (Clerk JWT with claim) | Service role |
| `platform_logs` | Engineering role | Service role |
| `platform_alert_log` | Operator role | Service role |
| `platform_provider_health` | Operator role | Service role |
| `platform_product_health` | Authenticated | Service role |

No `raw_detail`, `engineering_notes`, or `messages.internal_engineering` fields are exposed to anon or consumer roles. RLS policies enforce this at the row level, not just at the API layer.

---

## 9. API Design

### 9.1 API surface overview

All routes live under `/api/platform/`. Auth is Clerk JWT for operator and engineering routes. The `/status` endpoint is public.

```
─── Public (no auth) ───────────────────────────────────────────────────
GET  /api/platform/status
     Returns: { overall, products[], activeIncidents[], updatedAt }
     — consumer_public messages only, no raw_detail, no secrets, no paths

─── Operator (Clerk JWT) ────────────────────────────────────────────────
GET  /api/platform/health
     Returns: PlatformHealthSnapshot (latest snapshot)
     Query: ?trigger=manual to force rebuild

GET  /api/platform/health/providers
     Returns: ProviderHealthSlice[] with last probe time and detail
     Query: ?status=degraded|blocked|offline (filter)

GET  /api/platform/health/providers/:providerId
     Returns: ProviderHealthDetail (current + last 10 probes)

GET  /api/platform/health/products
     Returns: ProductHealthSlice[] (current state)

GET  /api/platform/health/products/:productId
     Returns: ProductHealthDetail (current + recent events)

GET  /api/platform/incidents
     Returns: Incident[] (open incidents by default)
     Query: ?status=investigating|identified|monitoring|resolved
     Query: ?provider=anthropic_claude
     Query: ?product=access_os

GET  /api/platform/incidents/:incidentId
     Returns: IncidentDetail (full record + related events)

PATCH /api/platform/incidents/:incidentId
     Body: { lifecycle_status, operator_notes }
     — operator updates lifecycle, notes

─── Engineering (Clerk JWT + engineering claim) ─────────────────────────
GET  /api/platform/health/events
     Returns: HealthEvent[] (paginated, full records)
     Query: ?product= ?provider= ?kind= ?severity= ?since= ?limit=

POST /api/platform/health/events
     Body: ClassifyErrorInput
     — ingest an event from any product (cross-product ingestion point)
     Returns: ClassifiedError + persisted HealthEvent

POST /api/platform/health/probe/:providerId
     — trigger manual probe for a specific provider
     Returns: ProviderProbeResult + resulting HealthEvent if degraded

GET  /api/platform/logs
     Returns: PlatformLog[] (paginated)
     Query: ?level= ?product= ?provider= ?since= ?limit=

GET  /api/platform/health/snapshots
     Returns: PlatformSnapshot[] (history)
     Query: ?since= ?trigger= ?limit=
```

### 9.2 API design rules

1. **Audience enforcement at the API layer.** Even if the database allows a read, the API strips `raw_detail`, `engineering_notes`, and `messages.internal_engineering` from any response to a non-engineering audience.

2. **No write operations from product code.** Products do not call `PATCH /incidents`. They call `POST /health/events` and the platform routes the rest.

3. **Idempotent event ingestion.** `POST /health/events` uses a `dedup_key` (derived from provider + kind + window) to prevent duplicate records from rapid-fire errors.

4. **Rate limiting on probe endpoint.** `POST /probe/:providerId` is rate-limited to once per 15 seconds per provider to prevent thundering herd.

5. **Pagination is required.** No endpoint returns unbounded arrays. Default limit: 50. Max: 200.

6. **The public `/status` endpoint is cacheable.** Cache-Control: `public, max-age=30`. Stale-while-revalidate: 60. It does not hit the database on every request.

### 9.3 Cross-product ingestion contract

Every product can report a classified event by calling:

```
POST /api/platform/health/events
Authorization: Bearer <device-jwt-or-clerk-jwt>
Content-Type: application/json

{
  "error": "...",           — or error object
  "message": "...",         — optional context
  "httpStatus": 529,        — optional
  "product": "jyson",       — which product is reporting
  "service": "ai_inference" — which service failed
}
```

The Command Center runs `classifyError()`, persists the event, groups into incidents,
routes alerts, and rebuilds the snapshot. The reporting product does not manage any
of this — it only fires and forgets.

---

## 10. Three Views

### 10.1 Operator View
**Auth:** Clerk JWT (standard authenticated session)  
**Purpose:** Real-time operational awareness and incident management  
**Not:** Raw technical logs or consumer-facing status

**Data surfaces:**
- Platform status grid — products (rows) × status (color indicator)
- Provider rail — each provider's last probe result and status badge
- Active incidents panel — open incidents with title, severity, affected products, time since open
- Alert history — last 24h of dispatched alerts with channel and delivery status
- Incident action panel — update lifecycle, add operator notes, mark resolved
- Recommended action — sourced from `messages.operator` of the active incident's root event

**Update cadence:** Realtime via Supabase Realtime subscription on `platform_incidents` and `platform_snapshots`

**Hard rule:** The Operator View never displays `raw_detail`, absolute paths, API keys, or `messages.internal_engineering`. It reads `messages.operator` exclusively.

### 10.2 Developer View
**Auth:** Clerk JWT with `engineering` claim  
**Purpose:** Full technical diagnostics — classify, debug, investigate

**Data surfaces:**
- Raw event stream — full `HealthEvent` records with all fields including `raw_detail`
- Provider probe log — full probe history with response times and HTTP details
- Classification inspector — input → classification → messages for any arbitrary error string
- Log viewer — structured `platform_logs` with level, service, product filtering
- Snapshot diff — compare two snapshots to see what changed and when
- Incident timeline — ordered event list per incident with full records
- Adapter debug — last probe result per adapter with raw response

**Update cadence:** Polling or manual refresh (not realtime — this is a diagnostic tool, not a live dashboard)

### 10.3 Consumer View
**Auth:** None — fully public  
**Purpose:** Simple, safe signal that the platform is working

**Data surfaces:**
- Overall status indicator: "All Systems Operational" / "Degraded Performance" / "Partial Outage" / "Service Disruption"
- Per-product status (consumer-safe display names only — no internal IDs)
- Active incidents (if any): title and `messages.consumer_public` only
- Incident history: last 30 days, resolved incidents only

**Consumer-safe product display names:**

| Internal ID | Consumer Display Name |
|-------------|----------------------|
| `access_os` | ACCESS |
| `jyson` | JYSON |
| `build` | Build Platform |
| `vault` | Intelligence Vault |
| `jd_ai_systems_core` | Platform Core |

**Hard rules for Consumer View:**
- Never display `raw_detail`
- Never display absolute file paths
- Never display environment variable names
- Never display internal product IDs or provider IDs
- Never display stack traces
- Never display HTTP status codes
- Only display messages that have passed through `sanitizeForAudience('consumer_public')`
- The underlying API route (`/api/platform/status`) enforces all of the above regardless of frontend behavior

---

## 11. Folder Structure

```
access-app/
├── lib/
│   ├── platform-health/              — M4 (complete — do not modify)
│   │   ├── status-types.ts
│   │   ├── product-registry.ts
│   │   ├── provider-registry.ts
│   │   ├── error-classifier.ts
│   │   ├── health-event.ts
│   │   ├── health-snapshot.ts
│   │   ├── status-message.ts
│   │   └── index.ts
│   │
│   └── command-center/               — M5 (new)
│       │
│       ├── provider-monitor/
│       │   ├── base-adapter.ts       — ProviderAdapter interface + ProviderProbeResult type
│       │   ├── registry.ts           — registerAdapter(), getAllAdapters(), getAdapter(id)
│       │   ├── scheduler.ts          — runProbeRound(), scheduleProbes(), runManualProbe(id)
│       │   └── adapters/
│       │       ├── anthropic.ts      — AnthropicAdapter
│       │       ├── supabase.ts       — SupabaseAdapter
│       │       ├── clerk.ts          — ClerkAdapter
│       │       ├── vercel.ts         — VercelAdapter
│       │       ├── local-connector.ts — LocalConnectorAdapter
│       │       └── local-filesystem.ts — LocalFilesystemAdapter
│       │
│       ├── event-bus/
│       │   ├── types.ts              — PlatformEventType union, PlatformEvent type
│       │   ├── publisher.ts          — publishEvent(event)
│       │   └── subscriber.ts         — subscribeToEvents(handler), unsubscribe(id)
│       │
│       ├── incident-tracker/
│       │   ├── types.ts              — Incident, IncidentLifecycleStatus
│       │   ├── tracker.ts            — processEvent(), resolveIfClear(), getOpenIncidents()
│       │   └── grouping.ts           — dedupKey(), windowKey(), shouldGroup()
│       │
│       ├── alert-router/
│       │   ├── types.ts              — AlertChannel, AlertPayload, AlertRule
│       │   ├── router.ts             — routeAlert(event, incident)
│       │   ├── rules.ts              — audience + severity → channels mapping
│       │   └── channels/
│       │       ├── slack.ts          — SlackChannel.dispatch(payload)
│       │       ├── webhook.ts        — WebhookChannel.dispatch(payload)
│       │       └── dashboard.ts      — DashboardChannel.dispatch(payload)
│       │
│       ├── snapshot-engine/
│       │   ├── builder.ts            — buildSnapshot(events) — wraps health-snapshot.ts
│       │   └── persistence.ts        — persistSnapshot(snapshot), getLatestSnapshot()
│       │
│       ├── log-collector/
│       │   └── logger.ts             — platformLog({ level, product, provider, service, message, context })
│       │
│       └── index.ts                  — public exports for command-center
│
├── app/
│   └── api/
│       └── platform/
│           ├── status/
│           │   └── route.ts          — GET (public, cached)
│           ├── health/
│           │   ├── route.ts          — GET (operator)
│           │   ├── events/
│           │   │   └── route.ts      — GET (engineering) + POST (cross-product ingest)
│           │   ├── providers/
│           │   │   ├── route.ts      — GET (operator)
│           │   │   └── [providerId]/
│           │   │       ├── route.ts  — GET (operator)
│           │   │       └── probe/
│           │   │           └── route.ts — POST (engineering)
│           │   ├── products/
│           │   │   ├── route.ts      — GET (operator)
│           │   │   └── [productId]/
│           │   │       └── route.ts  — GET (operator)
│           │   └── snapshots/
│           │       └── route.ts      — GET (engineering)
│           ├── incidents/
│           │   ├── route.ts          — GET (operator)
│           │   └── [incidentId]/
│           │       └── route.ts      — GET + PATCH (operator)
│           └── logs/
│               └── route.ts          — GET (engineering)
│
├── supabase/
│   └── schema_v5_platform_health.sql — new M5 migration
│
├── scripts/
│   ├── verify-platform-health.ts     — M4 (keep, 7/7 passing)
│   └── verify-command-center.ts      — M5 verification script
│
└── docs/
    └── M5_COMMAND_CENTER_ARCHITECTURE.md  — this document
```

### Monorepo-level additions

```
JD_Ai_System/                         — monorepo root
└── scripts/
    └── lib/                          — currently: .mjs scripts
        └── (no changes required in M5 — command center lives in access-app)
```

**Note on monorepo placement:** The Command Center is hosted in `access-app` for M5 because that is the only Vercel-deployed project with a Supabase connection. When JYSON becomes independently deployed in a later milestone, the Command Center API moves to its own Vercel project and all products call it externally. The adapter pattern and database schema do not change — only the hosting boundary shifts.

---

## 12. Deployment Strategy

### Phase 1 — M5: Collocated (access-app/Vercel)
The Command Center API lives inside `access-app` at `/api/platform/*`. It deploys automatically whenever `access-app` deploys. Probing runs via Vercel Cron Jobs (configured in `vercel.json`).

```
vercel.json additions:
{
  "crons": [
    { "path": "/api/platform/health/probe/all", "schedule": "* * * * *" },      — every 1 minute
    { "path": "/api/platform/health/snapshots/build", "schedule": "*/5 * * * *" } — every 5 minutes
  ]
}
```

**Deployment dependencies:**
- `schema_v5_platform_health.sql` must be applied to Supabase before deploying M5 code
- `PLATFORM_HEALTH_PROBE_SECRET` env var required on Vercel to authenticate cron routes
- No new Supabase project needed
- No new Vercel project needed

### Phase 2 — M6: Extracted Service
When JYSON deploys independently, the Command Center becomes its own Vercel project (`platform.jdaisystems.com` or similar).

**What changes:**
- Command Center API moves to a new Vercel project
- All products call the Command Center externally (authenticated with product API key)
- Supabase platform tables remain in the existing project
- Products no longer import from `lib/platform-health` — they call the HTTP API instead

**What does not change:**
- Database schema
- Classification logic
- Provider adapter interfaces
- Alert routing rules
- Three view data contracts

### Phase 3 — M7+: Platform-as-Service
The Command Center becomes a product in its own right — an observable infrastructure layer that could serve enterprise customers or be licensed.

**New capabilities at Phase 3:**
- External product registration API (register any product externally)
- SLA-backed uptime guarantees for the Command Center itself
- Enterprise alert channels (PagerDuty, Opsgenie, enterprise webhooks)
- Multi-tenant isolation (each enterprise customer's events are isolated)
- Public status page at `status.jdaisystems.com`

---

## 13. Future Provider Expansion

The following providers are anticipated additions, in priority order based on the JD AI Systems product roadmap.

| Provider | Category | Products Affected | Probe Mechanism | Adds to Classifier |
|----------|----------|------------------|-----------------|-------------------|
| `stripe` | payments | build, future consumer products | GET to Stripe health endpoint | Payment failure, rate limit, webhook failure |
| `sendgrid` / `resend` | email | access_os (notifications), future products | SMTP check or API ping | Email delivery failure, bounce rate spike |
| `google_cloud` | ai, storage | future products (Gemini, Vision) | GET to GCP health | API quota exceeded, regional outage |
| `github` | developer | build (code delivery) | GET to GitHub status API | Actions blocked, API degraded |
| `twilio` | communication | future products | GET to Twilio status | SMS/voice delivery failure |
| `upstash` | cache, queue | future event bus upgrade | Redis PING | Cache miss, queue lag |
| `railway` | hosting | future backend services | GET to health endpoint | Deploy blocked, service down |
| `planetscale` | database | future database tier | MySQL ping | Connection failure, branching blocked |

**Adding any of these requires only:**
1. One new adapter file in `command-center/provider-monitor/adapters/`
2. One new string in `PlatformProviderId` union
3. One new entry in `PROVIDER_REGISTRY`
4. One new adapter registration in `command-center/provider-monitor/registry.ts`
5. Optional: new error patterns in `error-classifier.ts` for provider-specific errors

---

## 14. M5 Definition of Done

M5 is complete when all of the following are verified:

| Check | Mechanism |
|-------|-----------|
| All M5 database tables applied | `npm run platform:verify-m5` |
| All 6 provider adapters probe without error | `npm run command-center:verify` |
| Claude 529 probe → classified + persisted event | Verification script |
| Supabase probe → classified + persisted event | Verification script |
| Two events → correct incident grouping | Verification script |
| Incident auto-resolves after 3 clean probes | Verification script |
| `GET /api/platform/health` returns valid snapshot | API smoke test |
| `GET /api/platform/status` returns consumer-safe response | API smoke test + safety check |
| Consumer response contains no secrets or paths | Sanitization test (extends M4 verify) |
| `POST /api/platform/health/events` from JYSON ingest | Cross-product test |
| Alert router dispatches to Slack on error severity | Alert channel test |
| Engineering audit: `raw_detail` not in consumer or operator API response | API audit |
| `npm run build` passes with no TypeScript errors | Build gate |

---

## 15. Implementation Sequence

Do not build all services simultaneously. The dependencies flow in one direction.

```
Week 1 — Database foundation
  1. Write schema_v5_platform_health.sql
  2. Apply to Supabase
  3. Write persistence helpers for each table
  4. Verify with npm run platform:verify-m5

Week 2 — Provider Monitor
  5. Define base-adapter interface and ProviderProbeResult type
  6. Implement AnthropicAdapter (probe + classify)
  7. Implement SupabaseAdapter
  8. Implement LocalConnectorAdapter + LocalFilesystemAdapter
  9. Implement ClerkAdapter + VercelAdapter
  10. Register all adapters in registry.ts
  11. Write runProbeRound() scheduler

Week 3 — Event Bus + Incident Tracker
  12. Define PlatformEvent types
  13. Implement Supabase Realtime publisher + subscriber
  14. Implement Incident Tracker (processEvent, grouping, auto-resolution)

Week 4 — Alert Router + Snapshot Engine
  15. Implement alert rules (audience → channel mapping)
  16. Implement Slack channel adapter
  17. Implement webhook channel stub
  18. Implement snapshot builder (wraps M4 buildHealthSnapshot)
  19. Implement snapshot persistence

Week 5 — API routes
  20. GET /api/platform/status (public)
  21. GET /api/platform/health (operator)
  22. POST /api/platform/health/events (cross-product ingest)
  23. GET/POST /api/platform/incidents (operator)
  24. GET /api/platform/logs (engineering)
  25. POST /api/platform/health/probe/:providerId (engineering)

Week 6 — Verification + Cron
  26. Write scripts/verify-command-center.ts
  27. Add Vercel cron configuration
  28. Run full verification suite
  29. Deploy to Vercel staging
  30. Mark M5 complete
```

---

## 16. What M5 Is Not

**Not a product dashboard.** The Operator View specified here is an internal tool. It is not a consumer product or a product feature. UI implementation for the dashboard surfaces is deferred to M6 unless a specific operator workflow is blocked.

**Not a replacement for Vercel or Supabase monitoring.** Those platforms have their own dashboards. The Command Center supplements them by classifying incidents through the JD AI Systems product lens — it knows that a Supabase error means vault sync is blocked for ACCESS OS, not just that a database query failed.

**Not an analytics platform.** `platform_logs` is structured operational logging, not product analytics. User behavior, conversion metrics, and product telemetry are separate concerns.

**Not a change to M4.** The platform health classification layer (`lib/platform-health/`) is complete and correct. M5 wraps it in operating infrastructure. The M4 files are not modified.

---

## 17. Open Questions for Operator Approval Before Build

The following decisions are ready for operator review before implementation begins:

1. **Probe frequency:** The schedule proposed (60s for AI providers, 120s for data/auth) is a starting point. Should probe frequency be configurable per provider, or is a fixed tier schedule acceptable for M5?

2. **Alert channels:** Slack is the primary alert channel. Is a Slack workspace and channel already configured for platform alerts, or does that need to be set up before M5 alert routing can be tested?

3. **Incident auto-resolution threshold:** 3 consecutive clean probe cycles is proposed. Is this the right sensitivity, or should it be higher (reduce false resolutions) or lower (faster recovery signal)?

4. **Consumer status page deployment:** Should `/api/platform/status` be the canonical status URL, or should a dedicated static page at `status.jdaisystems.com` be part of M5 scope?

5. **Schema migration gate:** Does `schema_v5_platform_health.sql` apply to the same Supabase project as ACCESS OS schema, or is a separate platform Supabase project preferred?

---

*Blueprint complete. Awaiting operator approval to begin M5 implementation.*
