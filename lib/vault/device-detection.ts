/**
 * Client- and server-safe device classification from User-Agent / platform hints.
 */

export type DeviceClass =
  | 'mac'
  | 'windows'
  | 'linux'
  | 'iphone'
  | 'ipad'
  | 'android'
  | 'unknown'

export type DetectedDevice = {
  deviceClass: DeviceClass
  deviceLabel: string
  isMobile: boolean
  isDesktop: boolean
}

const LABELS: Record<DeviceClass, string> = {
  mac: 'Mac',
  windows: 'Windows PC',
  linux: 'Linux PC',
  iphone: 'iPhone',
  ipad: 'iPad',
  android: 'Android phone',
  unknown: 'This device',
}

export function deviceLabelFromClass(deviceClass: DeviceClass): string {
  return LABELS[deviceClass] ?? LABELS.unknown
}

export function isMobileDeviceClass(deviceClass: DeviceClass): boolean {
  return deviceClass === 'iphone' || deviceClass === 'ipad' || deviceClass === 'android'
}

export function isDesktopDeviceClass(deviceClass: DeviceClass): boolean {
  return deviceClass === 'mac' || deviceClass === 'windows' || deviceClass === 'linux'
}

/** Parse UA string (browser or request header). */
export function parseDeviceClassFromUserAgent(
  ua: string,
  platformHint?: string,
  maxTouchPoints = 0,
): DeviceClass {
  const lower = ua.toLowerCase()
  const platform = (platformHint ?? '').toLowerCase()

  if (/iphone|ipod/.test(lower) || platform === 'iphone') return 'iphone'
  if (/ipad/.test(lower) || (platform === 'macintel' && maxTouchPoints > 1)) return 'ipad'
  if (/android/.test(lower)) {
    if (/mobile/.test(lower) || /phone/.test(lower)) return 'android'
    if (/tablet|ipad/.test(lower)) return 'ipad'
    return 'android'
  }
  if (/macintosh|mac os x|macintel/.test(lower) || platform.includes('mac')) return 'mac'
  if (/windows/.test(lower) || platform.includes('win')) return 'windows'
  if (/linux|cros/.test(lower) || platform.includes('linux')) return 'linux'

  return 'unknown'
}

export function toDetectedDevice(deviceClass: DeviceClass): DetectedDevice {
  const isMobile = isMobileDeviceClass(deviceClass)
  return {
    deviceClass,
    deviceLabel: deviceLabelFromClass(deviceClass),
    isMobile,
    isDesktop: isDesktopDeviceClass(deviceClass) || (!isMobile && deviceClass === 'unknown'),
  }
}

/** Prefer client `navigator` when available. */
export function detectDeviceFromNavigator(): DetectedDevice {
  if (typeof navigator === 'undefined') {
    return toDetectedDevice('unknown')
  }
  const ua = navigator.userAgent ?? ''
  const platform = navigator.platform ?? ''
  const maxTouchPoints =
    typeof navigator.maxTouchPoints === 'number' ? navigator.maxTouchPoints : 0
  const deviceClass = parseDeviceClassFromUserAgent(ua, platform, maxTouchPoints)
  return toDetectedDevice(deviceClass)
}

export function deviceTalkingHeadline(deviceLabel: string, bridgeOnline: boolean): string {
  if (bridgeOnline) return `Your ${deviceLabel} is talking to ACCESS`
  return `Your ${deviceLabel} isn't connected to ACCESS yet`
}

/** Shown while connection status loads — uses client-detected device label immediately. */
export function deviceTalkingHeadlineOptimistic(deviceLabel: string): string {
  return `Your ${deviceLabel} is talking to ACCESS`
}

export function deviceTalkingSubhead(
  deviceLabel: string,
  bridgeOnline: boolean,
  isMobile: boolean,
): string {
  if (bridgeOnline) {
    return isMobile
      ? "You're signed in on this device. Your cloud vault and JYSON stay in sync with ACCESS."
      : 'Your local connection is active. Vault sync and JYSON can use files on this device when you sync.'
  }
  if (isMobile) {
    return 'On phone and tablet, ACCESS keeps your cloud vault and intelligence layer — local folder sync lives on a Mac or PC.'
  }
  return `Start ACCESS on your ${deviceLabel} when you want vault folders to sync securely from this machine.`
}
