'use client'

import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'

const REDIRECT_ROUTES: Record<string, string> = {
  founder: '/founder',
  companion: '/companion',
}

/**
 * After Clerk sign-in on /, honor ?redirect=founder|companion from protected routes.
 */
export default function PostLoginRedirect() {
  const { isLoaded, isSignedIn } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    const target = searchParams.get('redirect')
    if (!target) return
    const path = REDIRECT_ROUTES[target]
    if (!path) return
    router.replace(path)
  }, [isLoaded, isSignedIn, searchParams, router])

  return null
}
