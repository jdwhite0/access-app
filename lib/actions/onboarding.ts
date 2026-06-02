'use server'

import { auth } from '@clerk/nextjs/server'
import { getIdentity } from '@/lib/actions/identity'
import { getFounderBlueprint } from '@/lib/actions/founder-blueprint'

export type OnboardingStatus =
  | 'unauthenticated'
  | 'no_identity'              // signed in, no ACCESS identity row
  | 'identity_only'            // has identity, no blueprint (Regular User OR Founder not started)
  | 'founder_blueprint_draft'  // Founder, blueprint saved but not exported
  | 'founder_ready'            // Founder, blueprint exported/materialized — full access
  | 'complete'                 // synonym for founder_ready / identity_only (depending on type)

export type OnboardingState = {
  status: OnboardingStatus
  /** Route to redirect to — null means the user is good where they are */
  redirectTo: string | null
  handle: string | null
  isFounder: boolean
  hasBlueprint: boolean
  blueprintStatus: string | null
  /** Whether all required setup is done for this account type */
  setupComplete: boolean
}

/**
 * Determines the current user's onboarding completion state.
 * Used by route guards to redirect first-time or incomplete users.
 *
 * Rules:
 * - No identity → /onboarding (must claim handle and select account type)
 * - Has identity, no blueprint → Regular User → dashboard allowed
 * - Has identity, blueprint draft → Founder, must export → /founder
 * - Has identity, blueprint exported/materialized → Founder fully set up → dashboard
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

  const blueprint = await getFounderBlueprint()
  const hasBlueprint = !!blueprint?.spec
  const blueprintStatus = blueprint?.spec?.status ?? null
  const isFounder = hasBlueprint

  if (!hasBlueprint) {
    // Identity exists, no blueprint — Regular User path or Founder who hasn't started.
    // Allow dashboard access. Dashboard shows "Start Founder Blueprint" prompt.
    return {
      status: 'identity_only',
      redirectTo: null,
      handle: identity.handle,
      isFounder: false,
      hasBlueprint: false,
      blueprintStatus: null,
      setupComplete: true,
    }
  }

  if (blueprintStatus === 'draft') {
    return {
      status: 'founder_blueprint_draft',
      redirectTo: '/founder',
      handle: identity.handle,
      isFounder: true,
      hasBlueprint: true,
      blueprintStatus,
      setupComplete: false,
    }
  }

  // Blueprint is exported or materialized — Founder is fully set up
  return {
    status: 'founder_ready',
    redirectTo: null,
    handle: identity.handle,
    isFounder: true,
    hasBlueprint: true,
    blueprintStatus,
    setupComplete: true,
  }
}
