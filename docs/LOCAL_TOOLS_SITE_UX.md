# Local tools — founder vs developer paths

ACCESS connects to local file tools **through the web UI as guidance and status**, not as a process launcher.

## User path (in the product)

1. Open **Agents** → **Set up on this Mac** (or JYSON orb → **Set up on this Mac**).
2. Click **Copy setup command** — one line: `npm run dev:founder`.
3. Paste into **Terminal** on the same Mac, in your `access-app` folder.
4. Keep the setup panel open until the big green **Connected** appears.

Vault chat and cloud intelligence work without this step. File tools are optional.

## Developer path (repo docs)

For the full 3-terminal stack, connector heartbeat, and OpenJarvis install:

- [OPENJARVIS_FOUNDER_SETUP.md](./OPENJARVIS_FOUNDER_SETUP.md)
- [JYSON_ENV_MATRIX.md](./JYSON_ENV_MATRIX.md)

`localToolsAvailable` still requires private layer, connector heartbeat, OpenJarvis HTTP, and install detection — the simplified UI hides that detail unless you expand **Advanced setup**.

UI connected state also uses `localIntelligenceActive` (local deploy + OpenJarvis reachable). See `docs/INTELLIGENCE_LAYER_STATE.md`.

## What the browser cannot do

A normal browser tab cannot start `jarvis serve`, run `connector:heartbeat`, or read arbitrary disk paths without you running a local server first.

## Production (Vercel)

`deploymentMode: cloud` — local file tools are founder/dev on your Mac only, not a production outage.
