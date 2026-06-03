/** Plain status copy — no internal jargon in user-facing UI */

export function cloudStatusLabel(ready: boolean): string {
  return ready ? 'Cloud data connected' : 'Cloud data pending'
}

export function localToolsLabel(connected: boolean): string {
  return connected ? 'Local tools connected' : 'Local tools not connected'
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
  return localConnected ? 'Local tools connected' : 'Local tools not connected'
}
