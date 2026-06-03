# OpenJarvis Execution-Layer Contract — Technical Decision Report

**Date:** 2026-06-02  
**Status:** Decision only — **no implementation**  
**Trigger:** Milestone 9 live E2E — `POST http://localhost:8000/api/files/list` returns `404 {"detail":"Not Found"}` while `GET /health` returns `200 {"status":"ok"}`  
**Evidence:** `access-app/lib/openjarvis-bridge/adapter.ts`, OpenJarvis `0.1.1` at `~/.openjarvis/src`, live probe 2026-06-02  

---

## Executive summary

The ACCESS OpenJarvis adapter assumes a **custom per-tool REST API** (`/api/files/*`, `/api/email/*`, …) that **does not exist** in upstream OpenJarvis `jarvis serve`.

OpenJarvis exposes an **OpenAI-compatible inference server** plus **`/v1/*` platform routes**. Tools are registered internally (`file_read`, `file_write`, `shell_exec`, …) and are normally invoked **inside agent / chat completion loops**, not via dedicated HTTP handlers per JYSON tool ID.

**Recommended fix: Option A — update the ACCESS OpenJarvis adapter** (and keep the canonical bridge in `jyson/backend/openjarvis-bridge/` in sync). Do **not** fork OpenJarvis for JD-specific routes (B). Use a **local shim (C)** only if a short-term M9 proof is needed before adapter v2 is ready — the shim should be treated as **temporary**, not canonical.

---

## 1. What ACCESS calls today

### Entry points (ACCESS OS)

| Layer | Route / function | Auth |
|-------|------------------|------|
| Browser / Companion | `POST /api/jyson/openjarvis/execute` | Clerk session |
| Server action | `executeOpenJarvisTool()` → `executeTool()` | Session + `allowedActions` |
| Health | `GET /api/jyson/openjarvis/health` → `resolveOpenJarvisRuntimeState()` + `checkOpenJarvisHealth()` | Clerk session |

### Downstream call (adapter)

**Base URL:** `process.env.OPENJARVIS_LOCAL_URL ?? 'http://localhost:8000'`

**Health (works today):**

```http
GET /health
```

No request body. Adapter treats optional JSON field `version`; OpenJarvis returns `{"status":"ok"}` only.

**Tool execution (fails today):**

```http
POST {OPENJARVIS_LOCAL_URL}{TOOL_ENDPOINTS[toolId]}
Content-Type: application/json
```

**Body (all tools):**

```json
{
  ...toolParamsFromClient,
  "_jyson_handle": "<ACCESS handle>",
  "_jyson_founder_os_path": "<absolute or null Founder OS package path>"
}
```

### ACCESS `TOOL_ENDPOINTS` map (full)

| ACCESS `toolId` | HTTP method | Path ACCESS calls | Client `params` (registry) |
|-----------------|-------------|-------------------|----------------------------|
| `read_file` | POST | `/api/files/read` | `{ path: string }` |
| `write_file` | POST | `/api/files/write` | `{ path, content }` |
| `list_files` | POST | `/api/files/list` | `{ directory?: string }` |
| `read_vault_note` | POST | `/api/vault/read` | `{ notePath }` |
| `write_vault_note` | POST | `/api/vault/write` | `{ notePath, content }` |
| `read_email` | POST | `/api/email/read` | `{ query?, limit? }` |
| `compose_email` | POST | `/api/email/compose` | `{ to, subject, body }` |
| `read_calendar` | POST | `/api/calendar/read` | `{ days? }` |
| `create_event` | POST | `/api/calendar/create` | `{ title, start, end, description? }` |
| `run_local_model` | POST | `/api/models/run` | `{ prompt, model? }` |
| `browser_open` | POST | `/api/browser/open` | `{ url }` |

**Registry-only IDs (no endpoint in map):** `list_tasks`, `create_task` — adapter returns `No endpoint mapped` if invoked.

**Source:** `access-app/lib/openjarvis-bridge/adapter.ts` (`callOpenJarvis`, `TOOL_ENDPOINTS`).

### Planned but unbuilt JYSON route

`jyson/backend/openjarvis-bridge/api-design.md` describes a **future** unified:

```http
POST /api/jyson/private-dispatch
Authorization: Bearer <PRIVATE_KEY>
{ intent, context, tools: ['files', 'email', 'calendar'] }
```

That route is **not implemented** in JYSON or ACCESS. Phase 8 wired **per-tool REST** instead, which aligned with the design doc’s *intent* but not with **shipping** OpenJarvis HTTP surface.

---

## 2. What OpenJarvis actually exposes

### Server process

```bash
jarvis serve --port 8000
```

FastAPI app from `openjarvis.server.app.create_app` — OpenAI-compatible API + extensions.

### Health (matches ACCESS probe)

```http
GET /health
→ 200 {"status":"ok"}
```

Engine must pass `engine.health()` or **503**.

### Primary execution model (canonical for OpenJarvis)

Tools are **not** exposed as `/api/files/read`. They are:

1. Registered in `ToolRegistry` (e.g. `file_read`, `file_write`, `shell_exec`, `browser_navigate`, …).
2. Listed for operators/UI via `GET /v1/tools` (metadata only — **no execute** on that route).
3. Invoked during **`POST /v1/chat/completions`** (tool definitions in body → model returns `tool_calls` → server executes tools in-loop), or via **agent** flows (`POST /v1/agents`, message endpoints, orchestrator).

There is **no** `POST /v1/tools/{name}/execute` in OpenJarvis 0.1.1 source reviewed.

### Representative OpenJarvis HTTP routes (not exhaustive)

| Method | Path | Role |
|--------|------|------|
| GET | `/health` | Liveness |
| POST | `/v1/chat/completions` | Chat + optional tools (streaming supported) |
| GET | `/v1/models` | Model list |
| GET | `/v1/info` | Server config |
| GET | `/v1/tools` | Tool **catalog** (name, description, category) |
| POST | `/v1/tools/{tool_name}/credentials` | Store credentials |
| GET | `/v1/tools/{tool_name}/credentials/status` | Credential status |
| POST | `/v1/agents` | Spawn agent |
| POST | `/v1/agents/{id}/message` | Message agent |
| POST | `/v1/memory/*` | Memory store/search/index |
| POST | `/api/digest/*` | Digest subsystem |
| POST | `/api/research` | Research over knowledge store |
| POST | `/ingest/files` | Upload ingest (multipart) — **not** Founder OS list |

Auth middleware applies to paths starting with `/v1/` or `/api/` when API key is configured (`auth_middleware.py`).

### OpenJarvis native tool names (filesystem-relevant)

| OpenJarvis `tool_id` | Purpose | Params (OpenAI schema) |
|----------------------|---------|-------------------------|
| `file_read` | Read file | `{ path, max_lines? }` |
| `file_write` | Write file | `{ path, content }` |
| `shell_exec` | Run shell | `{ command, working_dir? }` |
| `browser_navigate` | Browser | (not `browser_open`) |

There is **no** `list_files` tool; directory listing would be `shell_exec` (e.g. `ls`) or another tool, subject to OpenJarvis path policy — not the ACCESS `directory` param as-is.

### Live probe (M9)

```bash
curl -X POST http://localhost:8000/api/files/list \
  -H 'Content-Type: application/json' \
  -d '{"directory":"."}'
# → 404 {"detail":"Not Found"}

curl http://localhost:8000/health
# → 200 {"status":"ok"}
```

---

## 3. Contract mismatch matrix

| ACCESS `toolId` | ACCESS HTTP path | OpenJarvis equivalent | Match? |
|-----------------|------------------|------------------------|--------|
| `read_file` | `POST /api/files/read` | `file_read` (in-process / via chat tools) | **No HTTP route** |
| `write_file` | `POST /api/files/write` | `file_write` | **No HTTP route** |
| `list_files` | `POST /api/files/list` | No direct tool; ~`shell_exec` | **No HTTP route** |
| `read_vault_note` | `POST /api/vault/read` | No JD vault route | **No** |
| `write_vault_note` | `POST /api/vault/write` | No JD vault route | **No** |
| `read_email` | `POST /api/email/read` | Channel/email tools differ | **No** |
| `compose_email` | `POST /api/email/compose` | Channel tools | **No** |
| `read_calendar` | `POST /api/calendar/read` | Not mapped | **No** |
| `create_event` | `POST /api/calendar/create` | Not mapped | **No** |
| `run_local_model` | `POST /api/models/run` | `POST /v1/chat/completions` or engine | **Different API** |
| `browser_open` | `POST /api/browser/open` | `browser_navigate` (+ family) | **Name + path mismatch** |
| Health | `GET /health` | `GET /health` | **Yes** |

**Root cause:** ACCESS adapter encodes a **fictional JYSON Operations API** on port 8000. OpenJarvis implements a **general-purpose agent server**, not that API.

---

## 4. Options analysis

### A. Update ACCESS OpenJarvis adapter (recommended)

**What:** Change `callOpenJarvis` / `TOOL_ENDPOINTS` to invoke OpenJarvis through its **native** execution surfaces.

**Viable adapter strategies (pick one for implementation phase):**

| Strategy | Mechanism | Pros | Cons |
|----------|-----------|------|------|
| **A1 — Tool runner HTTP (preferred long-term)** | Contribute or call `POST /v1/tools/{name}/invoke` if/when upstream adds it; until then, ACCESS hosts a **minimal invoke** only in adapter layer | Deterministic M9; clear contract | Requires small new code path (ACCESS-side invoke client) |
| **A2 — Chat completions bridge** | `POST /v1/chat/completions` with `tools: [{name: "file_read", ...}]` and a system prompt forcing one tool call | Uses stock OpenJarvis | Non-deterministic; model latency; harder to test |
| **A3 — Direct tool registry (sidecar)** | Thin local process importing `openjarvis.tools.*` and exposing JD paths | Fastest M9 proof | Essentially option C; maintain two processes |

**ACCESS-owned concerns (unchanged):**

- `enforceAction()` / permission gate before any invoke
- Map ACCESS `toolId` → OpenJarvis `tool_id` + param rename (`read_file` → `file_read`, `browser_open` → `browser_navigate`, `list_files` → `shell_exec` with bounded `ls`)
- Pass `_jyson_founder_os_path` as `allowed_dirs` / working directory in OpenJarvis tool config (today’s metadata is sent in JSON but **ignored** by 404 handler)

**Why canonical:** Architecture doc places the **adapter in ACCESS/JYSON bridge**, not inside OpenJarvis. Upstream stays generic; JD policy stays in ACCESS.

---

### B. Add compatibility routes inside OpenJarvis

**What:** Fork or PR to OpenJarvis adding `/api/files/read`, `/api/jyson/*`, etc.

| Pros | Cons |
|------|------|
| ACCESS code unchanged | Upstream maintenance burden; JD-specific API in generic project |
| | Duplicates tool logic already in `ToolRegistry` |
| | Violates boundary: OpenJarvis should not know ACCESS handles / Founder OS |

**Verdict:** **Not recommended** as canonical architecture. At most, upstream could add a **generic** `POST /v1/tools/{tool_name}/invoke` — that is not the same as JD-specific `/api/files/*`.

---

### C. Local shim / translator layer

**What:** Separate service on e.g. `:8001` implementing `/api/files/*` and delegating to OpenJarvis tools or CLI.

| Pros | Cons |
|------|------|
| Unblocks M9 without editing adapter immediately | Extra process, drift, duplicate mapping |
| | Two health checks, two failure modes |
| | Becomes permanent unless explicitly removed |

**Verdict:** Acceptable **only** as a **time-boxed M9 bridge** (e.g. `scripts/openjarvis-jyson-shim.py`). **Not** canonical. If used, plan deletion when **A** ships.

---

## 5. Recommended canonical architecture

```
User → ACCESS (/api/jyson/openjarvis/execute)
         │ permission gate (allowedActions, connectorOnline)
         │ ACCESS tool registry (JYSON-facing toolIds)
         ▼
     OpenJarvis Adapter (ACCESS-owned)
         │ maps toolId → OpenJarvis tool_id + params + founderOsPath policy
         │ invokes via NATIVE OpenJarvis mechanism (invoke API or approved bridge)
         ▼
     OpenJarvis jarvis serve (:8000)
         │ ToolRegistry.execute (file_read, file_write, …)
         ▼
     Local machine (Founder OS paths, Ollama, browser, …)
```

**Principles:**

1. **ACCESS** owns identity, permissions, and JYSON-facing tool IDs.
2. **OpenJarvis** owns how tools run on the machine; ACCESS does not redefine its HTTP surface as `/api/files/*` unless OpenJarvis officially adds that.
3. **JYSON Core** stays chat/personality; optional future `private-dispatch` is a **single** JYSON route, not a duplicate of per-tool REST on port 8000.
4. **`GET /health`** remains the only confirmed shared HTTP contract today.

---

## 6. Implementation checklist (future — not in this report)

When implementing **Option A**:

1. Publish **tool ID mapping table** in `project_openjarvis_integration.md`.
2. Replace `TOOL_ENDPOINTS` paths with invoke client (native OpenJarvis).
3. Configure `file_read` / `file_write` `allowed_dirs` from `founderOsPath` (OpenJarvis supports `allowed_dirs` on `FileReadTool`).
4. Re-run M9: heartbeat → health → `read_file` or `file_read` equivalent → companion/DevTools.
5. Deprecate any temporary shim (C) if used.

---

## 7. Decision

| Question | Answer |
|----------|--------|
| What is ACCESS calling? | `POST {base}{/api/files|vault|email|calendar|models|browser}/*` + metadata fields |
| What does OpenJarvis expose? | `GET /health`, `POST /v1/chat/completions`, `GET /v1/tools`, agents/memory/digest routes — **not** ACCESS paths |
| Correct fix? | **A — Update ACCESS adapter** to native OpenJarvis tool invocation + explicit tool ID mapping |
| Avoid? | **B** (JD routes in OpenJarvis upstream) as canonical |
| Temporary? | **C** only for expedited M9 proof, with explicit retirement |

---

## References

- `access-app/lib/openjarvis-bridge/adapter.ts`
- `access-app/lib/openjarvis-bridge/tool-registry.ts`
- `jyson/backend/openjarvis-bridge/api-design.md`
- OpenJarvis: `~/.openjarvis/src/src/openjarvis/server/routes.py` (`/health`, `/v1/chat/completions`)
- OpenJarvis: `~/.openjarvis/src/src/openjarvis/server/agent_manager_routes.py` (`GET /v1/tools`)
- OpenJarvis: `~/.openjarvis/src/src/openjarvis/tools/file_read.py`
- `access-app/docs/MILESTONE_9_E2E_REPORT.md`
