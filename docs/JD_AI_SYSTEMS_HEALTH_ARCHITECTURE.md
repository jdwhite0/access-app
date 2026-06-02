# JD AI Systems — Health & Resilience Architecture

**Platform:** JD AI Systems  
**Module:** `lib/platform-health/` (hosted in `access-app`, consumed cross-product)  
**Status:** v1 foundation — no UI, no mutations

---

## Why this exists

Provider instability (e.g. Anthropic Claude HTTP 529 overloaded), partial Supabase migrations, connector pairing expiry, and local dev conflicts are **different failure classes**. Treating them as generic errors slows operators and risks mis-fixing schema when the real issue is external AI capacity.

JD AI Systems needs a **reusable platform layer** that:

- Classifies incidents by product, provider, service, and category
- Produces audience-safe messages (engineering, operator, consumer, enterprise)
- Aggregates snapshots for diagnostics and future dashboards
- Stays independent of any single product UI

---

## Conceptual model

| Concept | Description |
|---------|-------------|
| **Platform** | `jd_ai_systems` |
| **Product** | `access_os`, `jyson`, `build`, `vault`, `jd_ai_systems_core` |
| **Provider** | `anthropic_claude`, `openai`, `supabase`, `vercel`, `clerk`, `local_connector`, … |
| **Service** | `api`, `database`, `auth`, `connector`, `sync_engine`, `registry`, `vault`, … |
| **Incident** | Classified `HealthEvent` |
| **Status** | `operational` → `degraded` → `partial_outage` → `blocked` → `offline` → `unknown` |
| **Audience** | `internal_engineering`, `operator`, `consumer_public`, `enterprise_admin` |

---

## Module map

```
lib/platform-health/
├── status-types.ts       # Enums and input types
├── product-registry.ts   # Product catalog
├── provider-registry.ts  # Provider catalog
├── error-classifier.ts   # Rules + classifyError()
├── health-event.ts       # Incident records
├── health-snapshot.ts    # Aggregate platform snapshot
├── status-message.ts     # Audience messages + sanitization
└── index.ts              # Public exports
```

**Verification:** `npm run platform-health:verify` → `scripts/verify-platform-health.ts`

---

## Classification rules (v1)

| Signal | Kind | Provider |
|--------|------|----------|
| HTTP 529 / overloaded | `provider_degraded` | `anthropic_claude` |
| Missing table/function | `schema_blocked` | `supabase` |
| Invalid Supabase URL | `env_invalid` | `supabase` |
| Expired pairing code | `connector_pairing_expired` | `local_connector` |
| EADDRINUSE / port in use | `local_dev_conflict` | `local_runtime` |
| ACCESS_VAULT_ROOT missing | `local_env_missing` | `local_filesystem` |
| Sync not ready | `sync_not_ready` | `local_connector` |
| Missing env / RLS / JWT | `env_missing` / `auth_or_policy_blocked` | varies |
| Unmatched | `unknown_unclassified` | `unknown_provider` |

---

## Consumption patterns

### ACCESS OS

```ts
import { classifyErrorFromUnknown } from '@/lib/platform-health'

try {
  await supabase.from('connector_pairing_codes').insert(...)
} catch (e) {
  const c = classifyErrorFromUnknown(e, { product: 'access_os', service: 'database' })
  console.error(c.event.messages.internal_engineering)
  // Surface c.event.messages.operator in Command Center later
}
```

Use in: connector routes, `verify-platform-m0`, pairing script, sync worker, server actions.

### JYSON

```ts
import { classifyError } from '../../access-app/lib/platform-health' // or shared package later

const c = classifyError({
  error: dispatchError,
  product: 'jyson',
  service: 'ai_inference',
  providerHint: 'anthropic_claude',
})
```

JYSON dispatch and companion diagnostics return `c.event.messages.operator` without exposing vault paths to consumers.

### Build

Classify registry/build pipeline failures as `product: 'build'`, `service: 'registry'`. Schema issues inherit `schema_blocked`; local builder env uses `configuration_env`.

### Vault

Connector scan/compile failures with missing `ACCESS_VAULT_ROOT` → `local_env_missing`, `product: 'vault'`.

---

## Constraints (v1)

- No secrets in consumer messages
- No absolute paths in `consumer_public` / `enterprise_admin`
- No Supabase mutations from this module
- No sync apply
- No UI components

---

## Next milestone

1. Wire `classifyErrorFromUnknown` into ACCESS connector API routes (JSON error envelope).
2. ~~Add optional `GET /api/internal/platform-health` snapshot for operators.~~ **Done** — operator / developer / consumer audiences.
3. **Command Center** — `GET /api/internal/command-center` + `buildRecommendations()` — see [`JD_AI_SYSTEMS_COMMAND_CENTER_ARCHITECTURE.md`](../../../JD_AI_SYSTEMS_COMMAND_CENTER_ARCHITECTURE.md).
4. Extract `lib/platform-health` to monorepo `packages/platform-health` when a second deployable product needs npm import.
5. Provider probe adapters (Claude status, Supabase ping) as separate scheduled jobs — M5.
