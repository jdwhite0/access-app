/** Plain status copy — no internal jargon in user-facing UI */

export function cloudStatusLabel(ready: boolean): string {
  return ready ? 'Cloud data connected' : 'Cloud data pending'
}

export function localToolsLabel(connected: boolean): string {
  return connected
    ? 'File tools on this Mac'
    : 'Optional: enable file tools on this computer'
}

export function localIntelligenceActiveLabel(active: boolean): string {
  return active ? 'Local intelligence active' : 'Local intelligence offline'
}

/** JYSON orb status line when file tools are fully available. */
export function fileToolsActiveLabel(active: boolean): string {
  return active ? 'File tools active' : 'File tools optional'
}

export function connectorLabel(online: boolean): string {
  return online ? 'Connector online' : 'Connector offline'
}

export function blueprintStatusLabel(materialized: boolean): string {
  return materialized ? 'Profile loaded' : 'Profile not set up'
}

export function registryStatusLabel(active: boolean): string {
  return active ? 'System records connected' : 'No system records yet'
}

export function companionPackageLabel(cloudReady: boolean): string {
  return cloudReady ? 'Cloud data connected' : 'Cloud data pending'
}

export function localSyncLabel(localConnected: boolean): string {
  return localToolsLabel(localConnected)
}
