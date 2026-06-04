'use client'

import { useCallback, useEffect, useState } from 'react'
import { detectDeviceFromNavigator } from '@/lib/vault/device-detection'
import type { DeviceConnectionStatusPayload } from '@/lib/vault/device-connection-types'

const POLL_MS = 8000

export function useDeviceConnectionStatus() {
  const [device] = useState(() => detectDeviceFromNavigator())
  const [status, setStatus] = useState<DeviceConnectionStatusPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiUnavailable, setApiUnavailable] = useState(false)

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ deviceClass: device.deviceClass })
      const res = await fetch(`/api/vault/device-connection-status?${params}`, {
        cache: 'no-store',
        headers: { 'x-access-device-class': device.deviceClass },
      })
      if (!res.ok) {
        setApiUnavailable(true)
        return
      }
      const json = (await res.json()) as DeviceConnectionStatusPayload
      setStatus(json)
      setApiUnavailable(false)
    } catch {
      setApiUnavailable(true)
    } finally {
      setLoading(false)
    }
  }, [device.deviceClass])

  useEffect(() => {
    void load()
    const id = window.setInterval(() => void load(), POLL_MS)
    return () => window.clearInterval(id)
  }, [load])

  return { device, status, loading, apiUnavailable, reload: load }
}
