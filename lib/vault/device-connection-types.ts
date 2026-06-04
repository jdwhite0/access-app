import type { DeviceClass } from '@/lib/vault/device-detection'

export type LayerStatusKind =
  | 'connected'
  | 'offline'
  | 'cloud_only'
  | 'partial'
  | 'unavailable'

export type ConnectionLayerKey = 'accessBridge' | 'vault' | 'jyson'

export type ConnectionLayerInfo = {
  status: LayerStatusKind
  pillLabel: string
  shortMessage: string
}

export type DeviceConnectionLayers = Record<ConnectionLayerKey, ConnectionLayerInfo>

export type DeviceConnectionCapabilities = {
  canLocalSync: boolean
  canPickLocalFolder: boolean
  cloudVaultReady: boolean
  isLocalDevVaultSyncAllowed: boolean
  isMobile: boolean
  isDesktop: boolean
}

export type DeviceConnectionStatusPayload = {
  deviceClass: DeviceClass
  deviceLabel: string
  layers: DeviceConnectionLayers
  capabilities: DeviceConnectionCapabilities
  bridgeOnline: boolean
  lastSeenAt: string | null
  devicePaired: boolean
  localDev: boolean
  canSyncWithoutBridge: boolean
  startCommand: string
  setupDocPath: string
  vaultCount: number
  vaultChunkCount: number
}
