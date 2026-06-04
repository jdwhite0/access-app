# OpenJarvis — Founder 3-terminal setup

Local tool execution in ACCESS requires **three processes** on your Mac. Vault excerpt chat in the JYSON orb works with only Terminal 1 + `npm run jyson:vault:index`; live file tools need all three.

**In-site activation:** Agents → **Connect local tools** (or JYSON orb → **Connect tools**) copies commands and polls health — see [LOCAL_TOOLS_SITE_UX.md](./LOCAL_TOOLS_SITE_UX.md). The browser does not start OpenJarvis for you.

## Terminals

| # | Command | Purpose |
|---|---------|---------|
| **1** | `cd access-app && npm run dev` | ACCESS UI + `/api/jyson/*` |
| **2** | `cd access-app && npm run connector:heartbeat` | Supabase `connector_devices` heartbeat (90s TTL) |
| **3** | `cd access-app && npm run openjarvis:serve` | OpenJarvis HTTP on `http://localhost:8000` |

**Optional (2 processes, one terminal):** `npm run dev:founder` runs `dev` + `openjarvis:serve` together. You still need Terminal 2 for `connector:heartbeat`.

## Required `.env.local` (Terminal 1)

```bash
PRIVATE_JYSON_ENABLED=true
ANTHROPIC_API_KEY=sk-...
OPENJARVIS_LOCAL_URL=http://localhost:8000
```

Restart `npm run dev` after changing env.

## Verify

1. **Health API** (signed in as founder):

   ```bash
   curl -s http://localhost:3000/api/jyson/openjarvis/health -H "Cookie: …" | jq '.localToolsAvailable, .message'
   ```

   Expect `localToolsAvailable: true` when all three terminals are running.

2. **Team → Execution layer** — `read_file` / `list_files` show **Ready**; `read_vault_note`, `run_local_model`, `read_calendar` show **Planned** until mapped.

3. **Orb** — “list files in docs” routes to OpenJarvis when tools are online.

## Production (Vercel)

`VERCEL=1` disables Private JYSON. Team page shows cloud copy — local tools are **founder dev only**, not a production outage.

## Stub server (health only)

If `jarvis` CLI is missing but you need UI health checks:

```bash
npm run openjarvis:stub
```

This serves `GET /health` and `GET /v1/tools` only. Native tool execution still needs `~/.openjarvis` venv + `openjarvis-invoke-tool.py`.

## Install OpenJarvis

See [DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md#openjarvis-local-setup) or `jyson/backend/openjarvis-bridge/README.md`.

## Multi-tenant (future signups)

- Tool execution is scoped per Clerk session → `allowedActions` on `access_identities`.
- Connector devices are per `identity_id` / `clerk_user_id` (Phase 4 RLS).
- New users pair connector once, then run the same 3-terminal pattern on their machine; cloud ACCESS never exposes local tools without Private JYSON.
