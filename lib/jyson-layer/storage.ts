const LEGACY_OPEN_KEY = 'access_jyson_layer_open'
/** Collapsed = orb only; expanded = drawer open. Default collapsed for desktop nav. */
const COLLAPSED_KEY = 'access-jyson-panel-collapsed'

export function readPanelCollapsed(): boolean {
  try {
    const stored = localStorage.getItem(COLLAPSED_KEY)
    if (stored === '1') return true
    if (stored === '0') return false
    // One-time: legacy “always open” pinned the drawer over the dashboard — default orb-only
    if (localStorage.getItem(LEGACY_OPEN_KEY) === '1') {
      localStorage.setItem(COLLAPSED_KEY, '1')
      localStorage.setItem(LEGACY_OPEN_KEY, '0')
    }
    return true
  } catch {
    return true
  }
}

export function writePanelCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0')
    localStorage.setItem(LEGACY_OPEN_KEY, collapsed ? '0' : '1')
  } catch {
    /* ignore */
  }
}

/** @deprecated Use readPanelCollapsed — open === !collapsed */
export function readLayerOpen(): boolean {
  return !readPanelCollapsed()
}

/** @deprecated Use writePanelCollapsed */
export function writeLayerOpen(open: boolean) {
  writePanelCollapsed(!open)
}
