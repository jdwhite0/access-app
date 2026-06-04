/**
 * Copy-paste commands for founder local tool activation (ACCESS UI).
 * The browser cannot start these processes — the site guides and polls health only.
 */

export const OPENJARVIS_SERVE_CMD = 'npm run openjarvis:serve'
export const CONNECTOR_HEARTBEAT_CMD = 'npm run connector:heartbeat'
/** One terminal: ACCESS + OpenJarvis + local bridge heartbeat loop. */
export const DEV_FOUNDER_CMD = 'npm run dev:founder'
export const DEV_SEAMLESS_CMD = 'npm run dev:seamless'
export const DEV_CMD = 'npm run dev'

/** All three processes — three terminals (legacy / debugging). */
export const FOUNDER_THREE_TERMINAL_SCRIPT = `# Recommended — one terminal
cd access-app && ${DEV_FOUNDER_CMD}

# Legacy split (debugging only)
# Terminal 1: cd access-app && ${DEV_CMD}
# Terminal 2: cd access-app && ${CONNECTOR_HEARTBEAT_CMD}
# Terminal 3: cd access-app && ${OPENJARVIS_SERVE_CMD}`

/** Alias for copy-paste in UI modals. */
export const FOUNDER_TWO_PLUS_ONE_SCRIPT = `# One terminal on your Mac
cd access-app && ${DEV_FOUNDER_CMD}`

export const PRIVATE_JYSON_ENV_HINT =
  'PRIVATE_JYSON_ENABLED=true in access-app/.env.local (restart npm run dev after changing)'
