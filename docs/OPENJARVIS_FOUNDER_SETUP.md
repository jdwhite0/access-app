# OpenJarvis — Founder 3-terminal setup

Local tool execution in ACCESS runs on your Mac. Vault excerpt chat works after **Sync now** on Vaults; live file tools need OpenJarvis plus the local bridge.

**Recommended (one terminal):** `cd access-app && npm run dev:founder` — starts ACCESS, OpenJarvis, and the bridge heartbeat loop. Alias: `npm run dev:seamless`.

**In-site activation:** Agents → **Connect local tools** (or Vaults bridge banner) — see [LOCAL_TOOLS_SITE_UX.md](./LOCAL_TOOLS_SITE_UX.md) and [VAULT_LOCAL_BRAIN.md](./VAULT_LOCAL_BRAIN.md).

## Terminals

| # | Command | Purpose |
|---|---------|---------|
| **1 (recommended)** | `cd access-app && npm run dev:founder` | ACCESS + OpenJarvis + bridge loop |
| **Legacy split** | `dev` + `connector:heartbeat` + `openjarvis:serve` | Debugging only — see founder-setup.ts |

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
