/** Client-safe vault UI labels (no server env). */

import type { VaultType } from '@/types/db'

/** DB types that read from a folder on the user's device. */
export const LOCAL_DEVICE_VAULT_TYPES: readonly VaultType[] = ['obsidian', 'local'] as const

/** Short label on vault cards and lists — product language, not DB enum names. */
export const VAULT_TYPE_BADGE_LABELS: Record<VaultType, string> = {
  obsidian: 'Local vault',
  local: 'Local vault',
  manual: 'In ACCESS only',
  notion: 'Cloud source',
  google_drive: 'Cloud source',
  drive: 'Cloud source',
  other: 'Cloud source',
}

/** Muted subline under vault name on cards (type-specific detail). */
export const VAULT_TYPE_SUBLINES: Record<VaultType, string> = {
  obsidian: 'Markdown files in a folder you choose',
  local: 'Folder on your computer or phone path',
  manual: 'No folder linked on this device',
  notion: 'Pages and databases from your Notion workspace',
  google_drive: 'Files stored in Google Drive',
  drive: 'Remote files synced to ACCESS',
  other: 'Custom knowledge source',
}

/** Tooltip / title text for type badges. */
export const VAULT_TYPE_HINTS: Record<VaultType, string> = {
  obsidian:
    'A brain folder on this device — markdown notes, priorities, and system context. ACCESS reads the folder you choose.',
  local: 'Any folder on this device that ACCESS can read.',
  manual: 'Content managed in ACCESS without a linked folder path on this device.',
  notion: 'Connected via your Notion workspace.',
  google_drive: 'Files stored in Google Drive.',
  drive: 'Remote file storage linked to ACCESS.',
  other: 'Custom knowledge source.',
}

/** Plain-English labels for the registration type dropdown. */
export const VAULT_TYPE_REGISTER_OPTIONS: Array<{ value: VaultType; label: string }> = [
  { value: 'obsidian', label: 'A folder on this device (recommended)' },
  { value: 'local', label: 'Another folder on this device' },
  { value: 'manual', label: 'Managed inside ACCESS only' },
  { value: 'notion', label: 'Notion workspace' },
  { value: 'google_drive', label: 'Google Drive' },
  { value: 'drive', label: 'Other cloud storage' },
  { value: 'other', label: 'Other source' },
]

/** Extra hint under the type field in the register form (per type). */
export const VAULT_TYPE_REGISTER_FIELD_HINTS: Partial<Record<VaultType, string>> = {
  obsidian:
    'Your brain folder for AI — priorities, notes, and context as markdown files. Pick the folder; ACCESS reads files on disk.',
  local: 'Pick any folder on this device that ACCESS should scan.',
  manual: 'Use when there is no local path — content lives in ACCESS or the cloud.',
  notion: 'Connect through Notion when that integration is available.',
  google_drive: 'Files synced or linked from Google Drive.',
  drive: 'Generic cloud or remote file storage.',
  other: 'Describe the source in the vault name or description.',
}

/** On cards: hide per-type badge for device-local vaults; show location + subline instead. */
export function vaultCardShowsTypeBadge(vaultType: VaultType | string | null | undefined): boolean {
  if (!vaultType) return false
  return !LOCAL_DEVICE_VAULT_TYPES.includes(vaultType as VaultType)
}

/** Primary location line on vault cards (local vs cloud). */
export function vaultCardLocationLine(vaultType: VaultType | string | null | undefined): string | undefined {
  if (!vaultType) return undefined
  if (LOCAL_DEVICE_VAULT_TYPES.includes(vaultType as VaultType)) {
    return 'Lives on this device'
  }
  if (vaultType === 'manual') return undefined
  return 'Cloud copy for JYSON'
}

export function vaultTypeBadgeLabel(vaultType: VaultType | string | null | undefined): string {
  if (!vaultType) return 'Knowledge source'
  return VAULT_TYPE_BADGE_LABELS[vaultType as VaultType] ?? String(vaultType)
}

export function vaultCardSubline(vaultType: VaultType | string | null | undefined): string | undefined {
  if (!vaultType) return undefined
  return VAULT_TYPE_SUBLINES[vaultType as VaultType]
}

export function vaultTypeHint(vaultType: VaultType | string | null | undefined): string | undefined {
  if (!vaultType) return undefined
  return VAULT_TYPE_HINTS[vaultType as VaultType]
}

export function vaultTypeRegisterFieldHint(vaultType: VaultType): string | undefined {
  return VAULT_TYPE_REGISTER_FIELD_HINTS[vaultType]
}

export function vaultStatusLabel(status: string): string {
  switch (status) {
    case 'connected':
      return 'Connected'
    case 'pending_connector':
      return 'Pending Connector'
    case 'syncing':
      return 'Syncing'
    case 'stale':
      return 'Stale'
    case 'disconnected':
      return 'Disconnected'
    case 'error':
      return 'Error'
    case 'revoked':
      return 'Revoked'
    default:
      return status
  }
}
