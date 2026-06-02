'use client'

import { useEffect, useMemo, useState } from 'react'
import type { useUser } from '@clerk/nextjs'
import { deriveUsername, toAccessId } from '@/lib/access-id'
import { getOrCreateIdentity } from '@/lib/actions/identity'
import { getRegistrySummary } from '@/lib/actions/registry'
import type { RegistrySummary } from '@/types/db'

type ClerkUser = ReturnType<typeof useUser>['user']

export function useRegistryData(user: ClerkUser, isLoaded: boolean) {
  const [summary, setSummary] = useState<RegistrySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [identityError, setIdentityError] = useState<string | null>(null)

  const username = useMemo(() => deriveUsername(user), [user])
  const accessId = useMemo(() => toAccessId(username), [username])

  useEffect(() => {
    if (!isLoaded) return

    if (!user) {
      setLoading(false)
      setSummary(null)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setIdentityError(null)

      try {
        const idResult = await getOrCreateIdentity(accessId)
        if (cancelled) return
        if (idResult.error) setIdentityError(idResult.error)

        const nextSummary = await getRegistrySummary(accessId)
        if (cancelled) return
        setSummary(nextSummary)
      } catch {
        if (!cancelled) setSummary(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [isLoaded, user, accessId])

  return { summary, loading, identityError, accessId, username }
}
