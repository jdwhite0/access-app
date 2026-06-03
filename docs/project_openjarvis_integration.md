# OpenJarvis Integration — Session Handoff

**Status:** Phases 1–7 implemented in codebase (no prior handoff file existed). **Phase 8 completed** in this session (2026-06-02).

**Canonical architecture:** `jyson/backend/openjarvis-bridge/ARCHITECTURE.md`  
**ACCESS runtime copy (build):** `access-app/lib/openjarvis-bridge/` — keep in sync with jyson bridge when changing tools or gates.

---

## Layer model

```
ACCESS OS (identity, blueprint, permissions, connector_devices)
  → JYSON Runtime Harness (access-app/lib/jyson-bridge/)
  → JYSON Core (/api/jyson/chat → jyson.vercel.app/api/chat)
  → OpenJarvis Adapter (local tools, gated by allowedActions + connector heartbeat)
  → OpenJarvis HTTP server (OPENJARVIS_LOCAL_URL, default :8000)
```

**Cloud (Vercel):** JYSON chat works from blueprint context; local tools disabled (`PRIVATE_JYSON_ENABLED` never true on Vercel).  
**Local dev:** `PRIVATE_JYSON_ENABLED=true` + ACCESS connector heartbeat + OpenJarvis server → tool execution.

---

## Phase status

| Phase | Scope | Status |
|-------|--------|--------|
| 1 | JYSON companion architecture (reference for all accounts) | Done — `resolve-companion-world`, companion diagnostics |
| 2 | ACCESS OS shell + registry | Done — platform Phases 2a/2b |
| 3 | Platform foundation (Supabase, connector scaffold) | Done — `PHASE_3_PLATFORM_FOUNDATION.md` |
| 4 | Connector JWT, sync apply, RLS, queue | Done — `PHASE_4_IMPLEMENTATION.md` |
| 5 | Command center / health | Done — M5 docs + internal APIs |
| 6 | Multi-product deploy architecture | Done — `M6_PLATFORM_DEPLOYMENT_ARCHITECTURE.md` |
| 7 | OpenJarvis bridge (adapter, registry, permission gate) | Done — `jyson/backend/openjarvis-bridge/` |
| **8** | **Production wiring: real connector health, tool APIs, graceful degradation** | **Done — this session** |

---

## Phase 8 deliverables

### Real connector health (not hardcoded)

- `lib/connector/connector-online.ts` — `connector_devices.last_seen_at` within **90s** TTL, scoped by `identity_id` / Clerk user.
- `resolve-companion-world.ts` — sets `companionState.connectorOnline` from Supabase.
- `load-jyson-context.ts` (`loadJysonContextFromAccessHandle`) — `isConnectorOnlineForHandle` by ACCESS handle.
- `companion-world-diagnostic.ts` — adds `connector_heartbeat` check in finalize.

### OpenJarvis API (Clerk-authenticated)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/jyson/openjarvis/health` | GET | Connector + OpenJarvis `/health` state |
| `/api/jyson/openjarvis/tools` | GET | Tool registry + runtime flags |
| `/api/jyson/openjarvis/execute` | POST | `{ toolId, params, userConfirmed? }` |

Server actions: `lib/actions/openjarvis-tools.ts`  
Runtime resolver: `lib/openjarvis/resolve-runtime-state.ts`

### Adapter fix

- `connectorOnline` is passed from ACCESS (heartbeat), not inferred from `PRIVATE_JYSON_ENABLED` alone.
- Cloud mode when `VERCEL=1` or connector offline.

### Verification

```bash
cd access-app
npm run openjarvis:verify-phase8
npm run build
```

Also run standard ACCESS checks per `ACCESS_AGENT.md`: `preflight`, `registry:verify`, `platform-health:verify`, `status-page:verify`.

---

## Environment

| Variable | Vercel | Local dev |
|----------|--------|-----------|
| `PRIVATE_JYSON_ENABLED` | `false` | `true` for local tools |
| `OPENJARVIS_LOCAL_URL` | n/a | `http://localhost:8000` |
| `JYSON_INTERNAL_API_URL` | optional override | defaults to public JYSON URL |

---

## Multi-user isolation

- Tool execution requires Clerk session → `loadJysonContextForSession()` → per-user `allowedActions`.
- Connector heartbeat queries `connector_devices` for **session identity only** (via `access_identities.clerk_user_id`).
- Connector API routes unchanged: JWT middleware + `identity_id` on device rows (Phase 4 RLS).

---

## Graceful degradation (JYSON without OpenJarvis)

- `/api/jyson/chat` proxies to JYSON Core; failures return SSE error text, not 500 crash.
- `dispatchJysonCommand` uses cloud keyword classifier when monorepo runtime unavailable.
- OpenJarvis tools return structured `success: false` with message when connector or OpenJarvis offline.

---

## Remaining (post–Phase 8)

1. Install and run OpenJarvis locally; confirm `/health` and file endpoints match `TOOL_ENDPOINTS` in adapter.
2. Wire companion UI to `/api/jyson/openjarvis/health` and execute flow (optional product polish).
3. Add `list_tasks`, `create_task`, `browser_open` to `TOOL_REGISTRY` when OpenJarvis endpoints exist.
4. `POST /api/jyson/private-dispatch` on jyson (local only) — designed in `api-design.md`, not implemented.
5. Keep `access-app/lib/openjarvis-bridge/` in sync when editing `jyson/backend/openjarvis-bridge/`.

---

## Files touched (Phase 8)

**New:** `lib/connector/connector-online.ts`, `lib/openjarvis-bridge/*`, `lib/openjarvis/*`, `lib/actions/openjarvis-tools.ts`, `app/api/jyson/openjarvis/*`, `scripts/verify-openjarvis-phase8.ts`, this doc.

**Updated:** `resolve-companion-world.ts`, `companion-world-diagnostic.ts`, `jyson/backend/openjarvis-bridge/adapter.ts`, `tool-registry.ts`, `package.json`.

---

## OpenJarvis readiness score: **72 / 100**

**Rationale:** Bridge, permission gate, registry, ACCESS APIs, and real connector heartbeat are wired and build-verified. Live OpenJarvis server integration, UI execution loop, and private-dispatch route are not yet end-to-end proven in production.

**Recommended next step:** Run local stack (`connector:heartbeat` + OpenJarvis on `:8000` + `PRIVATE_JYSON_ENABLED=true`) and execute one gated tool via `POST /api/jyson/openjarvis/execute`.
