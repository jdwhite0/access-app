'use server'

import { auth } from '@clerk/nextjs/server'
import { getIdentity } from '@/lib/actions/identity'
import { getFounderBlueprint } from '@/lib/actions/founder-blueprint'

export type OnboardingStatus =
  | 'unauthenticated'
  | 'no_identity'    // signed in, no ACCESS identity row — must go through onboarding
  | 'ready'          // has identity — can access dashboard regardless of blueprint state

export type OnboardingState = {
  status: OnboardingStatus
  redirectTo: string
  handle: string | null
  isFounder: boolean
  hasBlueprint: boolean
  blueprintStatus: string | null
  setupComplete: boolean
}

/**
 * Routing gate for authenticated users landing on /.
 *
 * One rule: if you have an ACCESS identity, you go to /dashboard.
 * Blueprint status is never a routing gate — it only affects what the
 * dashboard and companion show. The wizard is enrichment, not a wall.
 *
 * Only no_identity forces /onboarding.
 */
export async function getOnboardingState(): Promise<OnboardingState> {
  const { userId } = await auth()

  if (!userId) {
    return {
      status: 'unauthenticated',
      redirectTo: '/',
      handle: null,
      isFounder: false,
      hasBlueprint: false,
      blueprintStatus: null,
      setupComplete: false,
    }
  }

  const identity = await getIdentity()

  if (!identity?.handle) {
    return {
      status: 'no_identity',
      redirectTo: '/onboarding',
      handle: null,
      isFounder: false,
      hasBlueprint: false,
      blueprintStatus: null,
      setupComplete: false,
    }
  }

  // Identity exists — user owns the dashboard regardless of blueprint state
  const blueprint = await getFounderBlueprint()
  const hasBlueprint = !!blueprint?.spec
  const blueprintStatus = blueprint?.spec?.status ?? null

  return {
    status: 'ready',
    redirectTo: '/dashboard',
    handle: identity.handle,
    isFounder: hasBlueprint,
    hasBlueprint,
    blueprintStatus,
    setupComplete: true,
  }
}
