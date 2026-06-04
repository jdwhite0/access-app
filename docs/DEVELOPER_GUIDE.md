# ACCESS app — Developer guide

Repo root: `/Users/jdproductions/Documents/JD_Ai_System/access-app`

See also: `docs/ACCESS_TERMINAL_CHEATSHEET.md`, `docs/JYSON_ENV_MATRIX.md`, `docs/project_openjarvis_integration.md`.

---

## OpenJarvis local setup

OpenJarvis is **not** vendored in this monorepo. ACCESS talks to a separate HTTP server (default `http://localhost:8000`) and invokes tools via `~/.openjarvis` Python venv + `scripts/openjarvis-invoke-tool.py`.

### Founder machine (required for “Connected”)

1. **`.env.local`** in `access-app/`:

   ```env
   PRIVATE_JYSON_ENABLED=true
   OPENJARVIS_LOCAL_URL=http://localhost:8000
   ```

   `PRIVATE_JYSON_ENABLED` is ignored on Vercel (`VERCEL=1`).

2. **Install OpenJarvis** (once per machine):

   ```bash
   # Typical layout — venv at ~/.openjarvis/.venv
   pip install openjarvis
   jarvis --version
   ```

   ACCESS detects `~/.openjarvis/.venv/bin/python`. Override with `OPENJARVIS_PYTHON` if needed.

3. **Start the server** (separate terminal):

   ```bash
   cd /Users/jdproductions/Documents/JD_Ai_System/access-app
   npm run openjarvis:serve
   ```

   Equivalent: `~/.openjarvis/.venv/bin/jarvis serve --host 127.0.0.1 --port 8000`

4. **Start ACCESS**:

   ```bash
   npm run dev
   ```

5. **Verify health**:

   ```bash
   curl -s http://localhost:8000/health
   # {"status":"ok"}
   ```

   Signed-in browser: `GET /api/jyson/openjarvis/health` → `localToolsAvailable: true` when private layer + server are up.

6. **Optional — connector heartbeat** (vault sync / remote pairing, not required for file tools on this Mac):

   ```bash
   npm run connector:heartbeat
   ```

### UI surfaces

| Surface | Data source |
|---------|-------------|
| **Agents → Execution layer** | `GET /api/jyson/openjarvis/health` |
| JYSON orb panel | Same health endpoint |
| Command center | `GET /api/jyson/openjarvis/tools` |
| Tool run (orb / companion) | `POST /api/jyson/openjarvis/execute` |

`read_file` and `list_files` are **Ready** when connected. Other listed tools show **Planned** until mapped in `lib/openjarvis-bridge/openjarvis-tool-map.ts`.

### Vault excerpt chat (no OpenJarvis)

Orb chat via `POST /api/jyson/chat` and vault excerpts do **not** require OpenJarvis or connector. See `docs/JYSON_ENV_MATRIX.md`.

---

## Future ACCESS users (local tools)

Production Vercel users stay **cloud-only** (`PRIVATE_JYSON_ENABLED` off).

When you onboard another builder for **local** execution:

1. Pair ACCESS connector (`npm run connector:register` + heartbeat).
2. Document machine install (OpenJarvis venv + `npm run openjarvis:serve`).
3. Grant `allowedActions` on their ACCESS identity for tools they need.
4. Do **not** enable `PRIVATE_JYSON_ENABLED` on Vercel — local-only flag by design.

Multi-tenant OpenJarvis hosting is out of scope; each user runs their own local server today.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| “Local tools not connected” | Set `PRIVATE_JYSON_ENABLED=true`, run `npm run openjarvis:serve` |
| Health 401 | Sign in to ACCESS (Clerk) |
| `fetch failed` on health | Server not running or wrong `OPENJARVIS_LOCAL_URL` |
| Tool “Planned” | Not mapped yet — only `read_file` / `list_files` execute |
| Execute permission denied | Missing `read_vault_seeds` (or tool action) on identity |
| Connector offline message but tools work | Expected — connector is for sync; tools use OpenJarvis on host |

```bash
npm run openjarvis:verify-phase8
npm run build
```
