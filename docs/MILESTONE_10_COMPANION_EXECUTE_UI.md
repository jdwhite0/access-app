# Milestone 10 — Companion Execute UI

**Scope:** `access-app` only. No OpenJarvis adapter or bridge execution changes.

## What shipped

- **`components/jyson/CompanionExecutePanel.tsx`** — client UI on `/companion` to load the tool catalog, edit parameters, execute tools, and render `RuntimeCard` results.
- **Integration** in `components/jyson/JysonCompanionPanel.tsx` under `#tools` (after Command layer).
- **Catalog enrichment** in `lib/actions/openjarvis-tools.ts` — `GET /api/jyson/openjarvis/tools` now includes `description`, `params`, and `mutates` from `TOOL_REGISTRY` (no adapter edits).

## Catalog URL

```
GET /api/jyson/openjarvis/tools
```

Clerk session required (401 if unsigned). Response shape:

```json
{
  "tools": [
    {
      "id": "read_file",
      "label": "Read file",
      "category": "files",
      "description": "...",
      "requiredAction": "read_vault_seeds",
      "requiresConfirmation": false,
      "mutates": false,
      "params": {
        "path": { "type": "string", "description": "...", "required": true }
      }
    }
  ],
  "runtime": {
    "privateLayerEnabled": true,
    "connectorOnline": true,
    "openJarvisOnline": true,
    "localToolsAvailable": true,
    "message": "..."
  }
}
```

## Execute URL

```
POST /api/jyson/openjarvis/execute
Content-Type: application/json

{ "toolId": "read_file", "params": { "path": "README.md" } }
```

Mutating / confirmation tools may require `"userConfirmed": true`.

## UI overview (screenshot-level)

1. **Section:** “Local tools (OpenJarvis)” below Command layer on the loaded Companion card.
2. **Runtime badges:** Private JYSON, Connector, OpenJarvis — same visual language as hybrid state chips.
3. **Warning strip** when `localToolsAvailable` is false (cloud mode, connector offline, or OpenJarvis down).
4. **Left column:** scrollable tool list (`read_file`, `list_files`, …) with id + category; active tool highlighted.
5. **Right column:** selected tool description, required ACCESS action hint, dynamic param fields (mono inputs / textarea for long content), optional confirmation checkbox, **Execute tool** button.
6. **Result:** `RuntimeCard` panel — permission allowed/denied, invoke path, OpenJarvis tool id, truncated content preview, metadata JSON, expandable full JSON.

Permission denied is shown when `runtimeCard.permission.allowed === false` (red-bordered card, reason text). No client-side bypass.

## Prerequisites (local dev)

| Variable / service | Purpose |
|---|---|
| `PRIVATE_JYSON_ENABLED=true` | Enables private layer (not on Vercel) |
| ACCESS connector + heartbeat | `connectorOnline` |
| OpenJarvis on `OPENJARVIS_LOCAL_URL` (default `:8000`) | `openJarvisOnline` |
| Signed-in Clerk user with Founder OS path | Execute context |

## Verification steps

1. **Build**
   ```bash
   cd access-app && npm run build
   ```

2. **Open Companion** (signed in): `/companion`

3. **Scroll to “Local tools (OpenJarvis)”** — confirm catalog loads (no 401).

4. **Runtime badges** — with stack down, expect warning + disabled Execute; with stack up, badges green and Execute enabled.

5. **Execute `read_file`**
   - Select **Read file**
   - Set `path` to an existing file under your Founder OS root (default `README.md`)
   - Click **Execute tool**
   - Expect `RuntimeCard` with `success: true`, `permission.allowed: true`, `content` preview (or structured error if path missing)

6. **Permission denied (optional)** — use a handle missing `read_vault_seeds` or stop connector; run `read_file` and confirm card shows `permission.allowed: false` and reason from gate.

7. **API sanity (browser console)**
   ```javascript
   const t = await fetch('/api/jyson/openjarvis/tools').then((r) => r.json())
   const e = await fetch('/api/jyson/openjarvis/execute', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ toolId: 'read_file', params: { path: 'README.md' } }),
   }).then((r) => r.json())
   console.log(t.runtime, e.runtimeCard ?? e)
   ```

## Example: `read_file` flow

1. User opens `/companion` → world loads → `#tools` section visible.
2. Panel `GET /api/jyson/openjarvis/tools` → lists registry tools + runtime flags.
3. User selects **Read file** → `path` prefilled `README.md`.
4. User clicks **Execute tool** → `POST /api/jyson/openjarvis/execute` with `{ toolId: "read_file", params: { path: "README.md" } }`.
5. Server runs `executeOpenJarvisTool` → permission gate → native OpenJarvis invoke for mapped tools.
6. UI renders `runtimeCard`: tool id, `invokePath`, `openJarvisToolId`, content preview, full JSON in `<details>`.

## Files touched

| File | Change |
|---|---|
| `components/jyson/CompanionExecutePanel.tsx` | **New** execute UI |
| `components/jyson/JysonCompanionPanel.tsx` | Mount panel + `allowedActions` hint |
| `lib/actions/openjarvis-tools.ts` | Expose `params` / `description` in catalog |
| `app/globals.css` | M10 styles |
| `docs/MILESTONE_10_COMPANION_EXECUTE_UI.md` | This doc |

**Not modified:** `lib/openjarvis-bridge/adapter.ts`, `native-tool-invoke.ts`, `openjarvis-tool-map.ts`.
