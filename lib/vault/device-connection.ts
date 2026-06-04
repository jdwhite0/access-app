import { listVaults } from '@/lib/actions/vaults'
import { isConnectorOnlineForClerkUser } from '@/lib/connector/connector-online'
import { resolveJdCommandVaultFromRows } from '@/lib/jyson/resolve-founder-vault-path'
import { DEV_FOUNDER_CMD } from '@/lib/openjarvis/founder-setup'
import { resolveIntelligenceCapabilities } from '@/lib/openjarvis/runtime-capabilities'
import { resolveOpenJarvisRuntimeState } from '@/lib/openjarvis/resolve-runtime-state'
import { createSupabaseAdmin } from '@/lib/supabase'
import { countVaultChunksForVault } from '@/lib/vault/vault-chunks-store'
import {
  type DeviceClass,
  deviceLabelFromClass,
  isMobileDeviceClass,
  parseDeviceClassFromUserAgent,
  toDetectedDevice,
} from '@/lib/vault/device-detection'
import { isAccessLocalDevRuntime, isLocalDevVaultSyncAllowed } from '@/lib/vault/local-dev-sync'

export type { DeviceClass } from '@/lib/vault/device-detection'
export type {
  ConnectionLayerInfo,
  ConnectionLayerKey,
  DeviceConnectionCapabilities,
  DeviceConnectionLayers,
  DeviceConnectionStatusPayload,
  LayerStatusKind,
} from '@/lib/vault/device-connection-types'
import type {
  ConnectionLayerInfo,
  DeviceConnectionCapabilities,
  DeviceConnectionLayers,
  DeviceConnectionStatusPayload,
} from '@/lib/vault/device-connection-types'

export function resolveDeviceFromRequest(
  userAgent: string | null,
  clientDeviceClass?: string | null,
  platformHint?: string | null,
): { deviceClass: DeviceClass; deviceLabel: string } {
  const allowed: DeviceClass[] = [
    'mac',
    'windows',
    'linux',
    'iphone',
    'ipad',
    'android',
    'unknown',
  ]
  if (clientDeviceClass && allowed.includes(clientDeviceClass as DeviceClass)) {
    const deviceClass = clientDeviceClass as DeviceClass
    return { deviceClass, deviceLabel: deviceLabelFromClass(deviceClass) }
  }
  const parsed = parseDeviceClassFromUserAgent(userAgent ?? '', platformHint ?? undefined)
  return toDetectedDevice(parsed)
}

function buildAccessBridgeLayer(
  bridgeOnline: boolean,
  deviceLabel: string,
  isMobile: boolean,
  localDev: boolean,
  devicePaired: boolean,
): ConnectionLayerInfo {
  if (bridgeOnline) {
    return {
      status: 'connected',
      pillLabel: 'Connected',
      shortMessage: `ACCESS sees your ${deviceLabel} bridge online.`,
    }
  }
  if (isMobile) {
    return {
      status: 'unavailable',
      pillLabel: 'Not on mobile',
      shortMessage:
        'Local bridge runs on Mac or PC. This device uses your cloud vault — no folder sync here.',
    }
  }
  if (localDev) {
    return {
      status: 'partial',
      pillLabel: devicePaired ? 'Resting' : 'Setup',
      shortMessage: devicePaired
        ? `Bridge is resting. Start ACCESS on your ${deviceLabel}, or use Sync now in local dev.`
        : `Pair your ${deviceLabel} once, then start ACCESS with the setup command.`,
    }
  }
  return {
    status: 'offline',
    pillLabel: 'Offline',
    shortMessage: `Start ACCESS on your ${deviceLabel} so folders on this machine can sync.`,
  }
}

function buildVaultLayer(
  bridgeOnline: boolean,
  isMobile: boolean,
  cloudVaultReady: boolean,
  vaultCount: number,
  hasLocalPathVault: boolean,
  canSyncWithoutBridge: boolean,
  hasSyncedLocalVault: boolean,
): ConnectionLayerInfo {
  if (isMobile) {
    if (cloudVaultReady) {
      return {
        status: 'cloud_only',
        pillLabel: 'Cloud only',
        shortMessage:
          vaultCount > 0
            ? 'Your synced vault context is available in the cloud for JYSON on this device.'
            : 'Cloud vault is ready. Connect a vault on desktop to add more context.',
      }
    }
    return {
      status: 'offline',
      pillLabel: 'Cloud pending',
      shortMessage:
        'Sync a vault on your Mac or PC first — then your phone or tablet can use that context here.',
    }
  }

  if (bridgeOnline && (hasLocalPathVault || vaultCount > 0)) {
    return {
      status: 'connected',
      pillLabel: 'Connected',
      shortMessage: 'Vault folder on this device can sync through the bridge.',
    }
  }
  if (cloudVaultReady) {
    return {
      status: bridgeOnline ? 'connected' : 'cloud_only',
      pillLabel: bridgeOnline ? 'Connected' : 'Cloud only',
      shortMessage: bridgeOnline
        ? 'Indexed vault context is available; tap Sync now to refresh from disk.'
        : 'Last synced context is in the cloud. Bridge offline — local folder sync paused.',
    }
  }
  if (hasSyncedLocalVault) {
    return {
      status: cloudVaultReady ? 'connected' : 'partial',
      pillLabel: cloudVaultReady ? 'Connected' : 'Synced',
      shortMessage: cloudVaultReady
        ? 'Vault folder indexed on this device and available in the cloud for JYSON.'
        : 'Your brain folder was synced on this device. ACCESS reads the folder you connected — no notes app has to stay open.',
    }
  }
  if (canSyncWithoutBridge && hasLocalPathVault) {
    return {
      status: 'partial',
      pillLabel: 'Local dev',
      shortMessage: 'Local dev can read your vault folder on this machine without the bridge.',
    }
  }
  if (vaultCount > 0) {
    return {
      status: 'partial',
      pillLabel: 'Pending',
      shortMessage: 'Vault registered — start the bridge or tap Sync now when your folder is ready.',
    }
  }
  return {
    status: 'offline',
    pillLabel: 'Not connected',
    shortMessage: 'Connect a vault folder on this device to give JYSON your workspace context.',
  }
}

function buildJysonLayer(
  jysonReachable: boolean,
  cloudVaultReady: boolean,
  isMobile: boolean,
  localTools: boolean,
): ConnectionLayerInfo {
  if (jysonReachable && localTools) {
    return {
      status: 'connected',
      pillLabel: 'Connected',
      shortMessage: 'JYSON chat with local tools and vault context on this device.',
    }
  }
  if (jysonReachable) {
    return {
      status: cloudVaultReady ? 'connected' : 'partial',
      pillLabel: cloudVaultReady ? 'Connected' : 'Limited',
      shortMessage: cloudVaultReady
        ? isMobile
          ? 'JYSON uses your cloud vault context in Companion.'
          : 'JYSON is reachable — cloud context ready; local tools need the bridge on desktop.'
        : 'JYSON is online. Sync a vault to unlock richer answers.',
    }
  }
  return {
    status: 'offline',
    pillLabel: 'Offline',
    shortMessage: isMobile
      ? 'Open Companion when signed in — intelligence uses your cloud session.'
      : 'Enable the intelligence layer or start ACCESS on desktop for full local context.',
  }
}

export async function resolveDeviceConnectionStatus(
  userId: string,
  deviceClass: DeviceClass,
): Promise<DeviceConnectionStatusPayload> {
  const { deviceLabel, isMobile, isDesktop } = toDetectedDevice(deviceClass)
  const localDev = isAccessLocalDevRuntime()
  const supabase = createSupabaseAdmin()

  let bridgeOnline = false
  let lastSeenAt: string | null = null
  let devicePaired = false

  if (supabase) {
    const connector = await isConnectorOnlineForClerkUser(supabase, userId)
    bridgeOnline = connector.online
    lastSeenAt = connector.lastSeenAt
    devicePaired = !!connector.deviceId
  }

  const vaults = await listVaults().catch(() => [])
  const resolved = resolveJdCommandVaultFromRows(vaults)
  const hasLocalPathVault = vaults.some((v) => !!v.local_path?.trim())
  const hasSyncedLocalVault = vaults.some(
    (v) => !!v.last_synced_at && (v.file_count ?? 0) > 0,
  )
  let vaultChunkCount = 0

  if (supabase && resolved.vaultId) {
    vaultChunkCount = await countVaultChunksForVault(supabase, resolved.vaultId, userId)
  }

  const cloudVaultReady = vaultChunkCount > 0
  const scanPath = resolved.path?.trim() ?? ''
  const localDevSyncAllowed =
    !isMobile && isLocalDevVaultSyncAllowed(scanPath)
  const canSyncWithoutBridge = localDevSyncAllowed || (localDev && !isMobile && !!scanPath)

  const runtime = await resolveOpenJarvisRuntimeState()
  const capabilitiesIntel = resolveIntelligenceCapabilities(runtime, {
    vaultCloudReady: cloudVaultReady,
  })
  const jysonReachable =
    capabilitiesIntel.cloudChat ||
    capabilitiesIntel.vaultChat ||
    capabilitiesIntel.localIntelligenceActive

  const layers: DeviceConnectionLayers = {
    accessBridge: buildAccessBridgeLayer(
      bridgeOnline,
      deviceLabel,
      isMobile,
      localDev,
      devicePaired,
    ),
    vault: buildVaultLayer(
      bridgeOnline,
      isMobile,
      cloudVaultReady,
      vaults.length,
      hasLocalPathVault,
      canSyncWithoutBridge,
      hasSyncedLocalVault,
    ),
    jyson: buildJysonLayer(
      jysonReachable,
      cloudVaultReady,
      isMobile,
      capabilitiesIntel.localTools,
    ),
  }

  const capabilities: DeviceConnectionCapabilities = {
    canLocalSync: !isMobile && (bridgeOnline || canSyncWithoutBridge),
    canPickLocalFolder: isDesktop && !isMobile,
    cloudVaultReady,
    isLocalDevVaultSyncAllowed: localDevSyncAllowed,
    isMobile,
    isDesktop,
  }

  return {
    deviceClass,
    deviceLabel,
    layers,
    capabilities,
    bridgeOnline,
    lastSeenAt,
    devicePaired,
    localDev,
    canSyncWithoutBridge,
    startCommand: DEV_FOUNDER_CMD,
    setupDocPath: 'access-app/docs/VAULT_LOCAL_BRAIN.md',
    vaultCount: vaults.length,
    vaultChunkCount,
  }
}
