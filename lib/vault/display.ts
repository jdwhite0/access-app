/** Client-safe vault UI labels (no server env). */

export function vaultStatusLabel(status: string): string {
  switch (status) {
    case 'connected':
      return 'Connected'
    case 'pending_connector':
      return 'Pending Connector'
    case 'syncing':
      return 'Syncing'
    case 'error':
      return 'Error'
    case 'revoked':
      return 'Revoked'
    default:
      return status
  }
}
