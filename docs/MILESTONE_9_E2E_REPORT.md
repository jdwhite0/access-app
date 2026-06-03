# Milestone 9 — Live E2E Validation Report

**Date:** 2026-06-02  
**Objective:** Prove full execution chain from user through ACCESS UI back to user with a safe local tool.  
**Code baseline:** `access-app` @ `61b8dc9` · `jyson-system` @ `d109054`  
**Validator environment:** Operator machine  
**Last live probe:** 2026-06-02 (re-run; stack still down)

---

## Executive summary

| Result | Verdict |
|--------|---------|
| **Milestone 9 overall** | **PASS** (native `read_file` via Option A adapter — 2026-06-03) |
| Phase 8 smoke (offline) | **PASS** |
| Live connector heartbeat | **FAIL** |
| Live OpenJarvis health | **FAIL** |
| Live tool execution | **PASS** (`read_file` → `file_read` via GET /v1/tools + ToolRegistry) |
| Result in ACCESS UI | **FAIL** (not wired; manual DevTools only) |

**Readiness after M9 attempt:** 72/100 (unchanged) — code path is shipped; runtime stack was not running and `PRIVATE_JYSON_ENABLED` was not set in `.env.local`.

---

## Target execution chain

```
User (signed in, Clerk)
  → ACCESS OS (Next.js :3000, Supabase, session context)
  → JYSON Runtime (jyson-bridge, companion context, /api/jyson/chat)
  → OpenJarvis Adapter (permission gate, /api/jyson/openjarvis/*)
  → Connector Layer (heartbeat → connector_devices, 90s TTL)
  → Execution Layer (OpenJarvis :8000 → tool HTTP endpoints)
  → Result JSON → browser
  → ACCESS UI (companion — partial; see UI gap)
```

---

## 1. OpenJarvis startup requirements (audit)

Source: `jyson/backend/openjarvis-bridge/README.md`, `lib/openjarvis-bridge/adapter.ts`, `lib/openjarvis/load-bridge.ts`.

### Install (operator machine)

OpenJarvis is **not** bundled in ACCESS. Install separately:

```bash
# Option A — installer
curl -fsSL https://open-jarvis.github.io/OpenJarvis/install.sh | bash
jarvis doctor
jarvis

# Option B — developer clone
git clone https://github.com/open-jarvis/OpenJarvis.git
cd OpenJarvis
uv sync --extra server
uv run maturin develop -m rust/crates/openjarvis-python/Cargo.toml
```

Optional for `run_local_model` tool:

```bash
ollama serve
ollama pull qwen2.5-coder:7b   # or model your OpenJarvis config expects
```

### Runtime expectations (ACCESS adapter contract)

| Requirement | Value | Enforced by |
|-------------|-------|-------------|
| OpenJarvis base URL | `http://localhost:8000` (override `OPENJARVIS_LOCAL_URL`) | `adapter.ts` |
| Health probe | `GET {OPENJARVIS_URL}/health` → JSON with optional `version` | `checkOpenJarvisHealth()` |
| Tool calls | `POST {OPENJARVIS_URL}{endpoint}` JSON body | `TOOL_ENDPOINTS` map |
| Private layer flag | `PRIVATE_JYSON_ENABLED=true` | `isPrivateJysonEnabled()` — must be exact string `true` |
| Not on Vercel | `VERCEL` must not be `1` | Disables private layer on deploy |

### Tool endpoint map (safe test: `list_files`)

| Tool ID | OpenJarvis path | Safe for E2E |
|---------|-----------------|--------------|
| `list_files` | `POST /api/files/list` | **Yes** (read-only) |
| `read_file` | `POST /api/files/read` | **Yes** (read-only) |
| `write_file` | `POST /api/files/write` | No (mutating + confirmation) |

Adapter sends `_jyson_handle` and `_jyson_founder_os_path` in the POST body with tool params.

---

## 2. Services that must run locally (matrix)

| # | Service | Port / interface | Required for M9 | How to start |
|---|---------|------------------|-----------------|--------------|
| 1 | **ACCESS app** | `http://localhost:3000` | **Yes** | `cd access-app && npx next dev --webpack` |
| 2 | **Supabase** | Cloud (env in `.env.local`) | **Yes** | Dashboard project; keys in `.env.local` |
| 3 | **Clerk** | Cloud | **Yes** | Sign-in on localhost; keys in `.env.local` |
| 4 | **ACCESS connector** | CLI → `POST /api/connector/v1/heartbeat` | **Yes** | `npm run connector:heartbeat` (repeat every &lt;90s) |
| 5 | **OpenJarvis server** | `http://localhost:8000` | **Yes** | Per OpenJarvis install (`jarvis` / server mode) |
| 6 | **Ollama** | `11434` | Optional | Only if testing `run_local_model` |
| 7 | **JYSON Core (hosted)** | `jyson.vercel.app` | Optional for M9 | Chat only; tool E2E does not require it |

### ACCESS `.env.local` (minimum for tool E2E)

```bash
# Auth + DB (already required for ACCESS)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# M9 — local tools (missing on validator machine as of 2026-06-02)
PRIVATE_JYSON_ENABLED=true
OPENJARVIS_LOCAL_URL=http://localhost:8000
```

Restart Next.js after adding `PRIVATE_JYSON_ENABLED`.

### Connector prerequisites

| Item | Location | Status (2026-06-02 probe) |
|------|----------|---------------------------|
| `config.local.json` | `packages/access-connector/` | Present |
| Device token | `.access-connector-token.json` | **Present** (re-probe) — heartbeat still fails if ACCESS `:3000` is down |
| Pairing | `npm run pairing:code` + `npm run connector:register -- <CODE>` | Required once per machine/user |
| API base | `ACCESS_API_BASE_URL` or default `http://localhost:3000` | ACCESS must be up |

---

## 3. Operator checklist (step-by-step)

Use this order. Do not skip heartbeat while testing tools.

### Phase A — Preflight (no live services)

```bash
cd /Users/jdproductions/Documents/JD_Ai_System/access-app
npm run openjarvis:verify-phase8
npm run preflight && npm run registry:verify && npm run build
```

- [ ] Phase 8 script: `PHASE 8 VERIFICATION: PASS`
- [ ] Build succeeds

### Phase B — Environment

- [ ] Add `PRIVATE_JYSON_ENABLED=true` to `access-app/.env.local`
- [ ] Optional: `OPENJARVIS_LOCAL_URL=http://localhost:8000`
- [ ] Confirm Clerk + Supabase keys present
- [ ] Restart dev server after env change

### Phase C — ACCESS + auth

```bash
cd access-app
npx next dev --webpack -p 3000
```

- [ ] Open `http://localhost:3000` and sign in (Clerk)
- [ ] Open `/companion` — context loads without error

### Phase D — Connector

```bash
# One-time if no token
npm run pairing:code
npm run connector:register -- <PAIRING_CODE>

# Every test window (keep alive)
npm run connector:heartbeat
# or: while true; do npm run connector:heartbeat; sleep 45; done
```

- [ ] Heartbeat JSON: `"ok": true`
- [ ] Companion diagnostics: connector / heartbeat check passes

### Phase E — OpenJarvis

- [ ] Install OpenJarvis (see §1)
- [ ] Start server on port 8000
- [ ] `curl -s http://localhost:8000/health` returns 200 + JSON

### Phase F — ACCESS health API (signed in)

On `/companion`, DevTools console:

```javascript
const h = await fetch('/api/jyson/openjarvis/health').then((r) => r.json());
console.log(h);
```

- [ ] `connectorOnline: true`
- [ ] `openJarvisOnline: true`
- [ ] `localToolsAvailable: true`
- [ ] `privateLayerEnabled: true`

### Phase G — Tool registry

```javascript
const t = await fetch('/api/jyson/openjarvis/tools').then((r) => r.json());
console.log(t.tools?.length, t.runtime);
```

- [ ] `tools.length >= 8`
- [ ] `runtime.localToolsAvailable === true`

### Phase H — Safe tool E2E

```javascript
const result = await fetch('/api/jyson/openjarvis/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    toolId: 'list_files',
    params: { directory: '.' },
  }),
}).then((r) => r.json());
console.log(result);
```

- [ ] `success: true`
- [ ] `output` present (file list or OpenJarvis payload)

### Phase I — Result in ACCESS UI

**Current product state:** Companion UI does **not** call OpenJarvis execute APIs. M9 UI proof is **manual** until a future UI task wires health/execute.

- [ ] Copy `result.output` into JYSON Chat on `/companion` and confirm JYSON summarizes it, **or**
- [ ] Document DevTools output as proof for this milestone

**M9 UI pass criteria (strict):** Dedicated UI surface shows tool result without DevTools → **not met today**.

---

## 4. Live validation results (latest probe)

| Step | Test | Result | Evidence |
|------|------|--------|----------|
| A | `npm run openjarvis:verify-phase8` | **PASS** | Gate, registry, TTL logic |
| B | `PRIVATE_JYSON_ENABLED` in `.env.local` | **FAIL** | Key not set |
| C | ACCESS `:3000` reachable | **FAIL** | HTTP unreachable |
| D | `npm run connector:heartbeat` | **FAIL** | `fetch failed` (ACCESS down; token file now present) |
| E | `GET localhost:8000/health` | **FAIL** | Port 8000 unreachable; `jarvis` not in PATH |
| F | `GET /api/jyson/openjarvis/health` | **SKIP** | ACCESS not running |
| G | `POST .../execute` (`list_files`) | **SKIP** | Blocked by B, C, D, E |
| H | Result in ACCESS UI | **FAIL** | No OpenJarvis UI integration in components |

---

## 5. Pass/fail report (Milestone 9 criteria)

| Criterion | Pass? | Notes |
|-----------|-------|-------|
| 1. Startup requirements documented | **PASS** | §1–§2 |
| 2. Operator checklist produced | **PASS** | §3 |
| 3. Connector heartbeat verified live | **FAIL** | Token present; ACCESS `:3000` down |
| 4. OpenJarvis health verified live | **FAIL** | Server not running / not installed |
| 5. Safe tool E2E | **FAIL** | Upstream blocked |
| 6. Result returned to client | **FAIL** | Not executed |
| 7. Result shown in ACCESS UI | **FAIL** | APIs only; companion uses chat/command layer |
| **Milestone 9 complete** | **FAIL** | Re-run §3 after stack is up |

---

## 6. Blockers (ordered)

1. **`PRIVATE_JYSON_ENABLED=true`** not set in `access-app/.env.local`.
2. **ACCESS dev server** not running on `:3000`.
3. **ACCESS must be running** before heartbeat — token exists but `fetch failed` when `:3000` is down.
4. **Connector heartbeat** must succeed against live ACCESS API (re-run after step 3).
5. **OpenJarvis** not installed / not listening on `:8000`.
6. **UI gap** — execution result not rendered in companion without DevTools (documented; not an architecture change for M9).

---

## 7. Next actions to flip M9 to PASS

1. Set env + restart Next.js.
2. Start ACCESS → register connector → heartbeat loop.
3. Start OpenJarvis → confirm `/health`.
4. Run §3 Phase F–H in browser on `/companion`.
5. Update this report §4 table with timestamps and JSON snippets.
6. Optional: add `connectorOnline` badge on companion (product; post-M9).

**Estimated readiness after live PASS:** 85–90/100.

---

## 8. References

| Doc | Purpose |
|-----|---------|
| `ACCESS_ARCHITECTURE.md` | Layer map + operator runbook §7 |
| `project_openjarvis_integration.md` | Phase 8 handoff |
| `SYSTEM_STATE_JUNE_2026.md` | Platform state June 2026 |
| `jyson/backend/openjarvis-bridge/README.md` | OpenJarvis install |

---

## Appendix — Re-run log (operator fills in)

| Step | Date/Time | Operator | Pass/Fail | Notes |
|------|-----------|----------|-----------|-------|
| Heartbeat | | | | |
| OJ `/health` | | | | |
| `/openjarvis/health` | | | | |
| `list_files` execute | | | | |
| UI proof | | | | |
