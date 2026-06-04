import {
  deviceTalkingHeadline,
  deviceTalkingHeadlineOptimistic,
  deviceTalkingSubhead,
  type DetectedDevice,
} from '@/lib/vault/device-detection'
import type {
  ConnectionLayerInfo,
  DeviceConnectionLayers,
  DeviceConnectionStatusPayload,
} from '@/lib/vault/device-connection-types'

/** Client-only fallback when /api/vault/device-connection-status is loading or unavailable. */
export function buildFallbackConnectionLayers(
  device: DetectedDevice,
  opts?: { apiUnavailable?: boolean },
): DeviceConnectionLayers {
  const { deviceLabel, isMobile } = device
  const checking = opts?.apiUnavailable
    ? 'Could not load live status — showing what this device can do.'
    : 'Checking your connection to ACCESS…'

  const accessBridge: ConnectionLayerInfo = isMobile
    ? {
        status: 'unavailable',
        pillLabel: 'Checking',
        shortMessage: checking,
      }
    : {
        status: 'partial',
        pillLabel: 'Checking',
        shortMessage: checking,
      }

  const vault: ConnectionLayerInfo = isMobile
    ? {
        status: 'cloud_only',
        pillLabel: 'Checking',
        shortMessage:
          'Vault context on phone and tablet comes from your cloud sync on Mac or PC.',
      }
    : {
        status: 'partial',
        pillLabel: 'Checking',
        shortMessage:
          'Folder sync runs on this device when ACCESS bridge or local dev sync is active.',
      }

  const jyson: ConnectionLayerInfo = {
    status: 'partial',
    pillLabel: 'Checking',
    shortMessage: 'JYSON layer status loads after sign-in.',
  }

  return { accessBridge, vault, jyson }
}

export function buildFallbackDeviceStatus(
  device: DetectedDevice,
  opts?: { apiUnavailable?: boolean },
): DeviceConnectionStatusPayload {
  const layers = buildFallbackConnectionLayers(device, opts)
  return {
    deviceClass: device.deviceClass,
    deviceLabel: device.deviceLabel,
    layers,
    capabilities: {
      canLocalSync: device.isDesktop && !device.isMobile,
      canPickLocalFolder: device.isDesktop && !device.isMobile,
      cloudVaultReady: false,
      isLocalDevVaultSyncAllowed: false,
      isMobile: device.isMobile,
      isDesktop: device.isDesktop,
    },
    bridgeOnline: false,
    lastSeenAt: null,
    devicePaired: false,
    localDev: false,
    canSyncWithoutBridge: false,
    startCommand: '',
    setupDocPath: 'access-app/docs/VAULT_LOCAL_BRAIN.md',
    vaultCount: 0,
    vaultChunkCount: 0,
  }
}

export function resolveBannerCopy(
  device: DetectedDevice,
  status: DeviceConnectionStatusPayload | null,
  loading: boolean,
  apiUnavailable: boolean,
): { headline: string; subhead: string; tone: 'operational' | 'neutral' | 'warning' } {
  const deviceLabel = status?.deviceLabel ?? device.deviceLabel
  const bridgeOnline = status?.bridgeOnline ?? false
  const isMobile = status?.capabilities.isMobile ?? device.isMobile

  if (loading && !status) {
    return {
      headline: deviceTalkingHeadlineOptimistic(deviceLabel),
      subhead: 'Checking device bridge, vault folder, and JYSON layers…',
      tone: 'neutral',
    }
  }

  if (!status) {
    return {
      headline: deviceTalkingHeadlineOptimistic(deviceLabel),
      subhead: apiUnavailable
        ? 'Live status is temporarily unavailable. Your vault cards below still reflect the last sync.'
        : deviceTalkingSubhead(deviceLabel, false, isMobile),
      tone: apiUnavailable ? 'warning' : 'neutral',
    }
  }

  const tone = status.bridgeOnline
    ? ('operational' as const)
    : isMobile
      ? ('neutral' as const)
      : status.localDev
        ? ('neutral' as const)
        : ('warning' as const)

  return {
    headline: deviceTalkingHeadline(deviceLabel, status.bridgeOnline),
    subhead: deviceTalkingSubhead(deviceLabel, status.bridgeOnline, isMobile),
    tone,
  }
}
