'use client'

/**
 * Public marketing homepage — ACCESS.
 *
 *   /          → marketing homepage (public for all users)
 *   /dashboard → operating shell (signed in)
 *   /onboarding → account setup
 */
import AccessPublicHome from '@/components/marketing/AccessPublicHome'

export default function Page() {
  return <AccessPublicHome />
}
