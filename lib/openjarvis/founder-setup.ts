/**
 * Copy-paste commands for founder local tool activation (ACCESS UI).
 * The browser cannot start these processes — the site guides and polls health only.
 */

export const OPENJARVIS_SERVE_CMD = 'npm run openjarvis:serve'
export const CONNECTOR_HEARTBEAT_CMD = 'npm run connector:heartbeat'
export const DEV_FOUNDER_CMD = 'npm run dev:founder'
export const DEV_CMD = 'npm run dev'

/** All three processes — three terminals (canonical). */
export const FOUNDER_THREE_TERMINAL_SCRIPT = `# Terminal 1 — ACCESS UI
cd access-app && ${DEV_CMD}

# Terminal 2 — connector heartbeat (required for localToolsAvailable)
cd access-app && ${CONNECTOR_HEARTBEAT_CMD}

# Terminal 3 — OpenJarvis HTTP
cd access-app && ${OPENJARVIS_SERVE_CMD}`

/** Two processes in one terminal; connector still needs its own terminal. */
export const FOUNDER_TWO_PLUS_ONE_SCRIPT = `# Terminal 1 — ACCESS + OpenJarvis (one terminal)
cd access-app && ${DEV_FOUNDER_CMD}

# Terminal 2 — connector heartbeat
cd access-app && ${CONNECTOR_HEARTBEAT_CMD}`

export const PRIVATE_JYSON_ENV_HINT =
  'PRIVATE_JYSON_ENABLED=true in access-app/.env.local (restart npm run dev after changing)'
