'use server'

import { auth } from '@clerk/nextjs/server'
import { getOrCreateIdentity } from '@/lib/actions/identity'
import { getOrCreateFounderBlueprint } from '@/lib/actions/founder-blueprint'
import { generateFounderOsFromBlueprint } from '@/lib/actions/founder-os-generate'
import { deriveAccessHandleForSession } from '@/lib/jyson-bridge/companion-handle'
import { diagnoseCompanionWorld } from '@/lib/jyson-bridge/companion-world-diagnostic'
import {
  resolveCompanionWorld,
  type CompanionLoadResult,
} from '@/lib/jyson-bridge/resolve-companion-world'

async function ensureIdentityAndBlueprint(): Promise<{ ok: boolean; message?: string }> {
  const derivedHandle = await deriveAccessHandleForSession()
  const { identity, error } = await getOrCreateIdentity(derivedHandle)
  if (!identity?.handle) {
    return { ok: false, message: error ?? 'Could not create ACCESS identity.' }
  }
  const blueprint = await getOrCreateFounderBlueprint()
  if (!blueprint?.spec) {
    return { ok: false, message: 'Could not create Founder Blueprint.' }
  }
  return { ok: true }
}

/**
 * Generate Founder OS package from canonical blueprint (P4). User-approved.
 */
export async function generateAccessWorld(): Promise<
  CompanionLoadResult & { repairMessage?: string }
> {
  const { userId } = await auth()
  if (!userId) {
    return { ...(await resolveCompanionWorld()), repairMessage: 'Sign in first.' }
  }

  try {
    const prep = await ensureIdentityAndBlueprint()
    if (!prep.ok) {
      return { ...(await resolveCompanionWorld()), repairMessage: prep.message }
    }

    const generated = await generateFounderOsFromBlueprint()
    if (!generated.success) {
      return {
        ...(await resolveCompanionWorld()),
        repairMessage: generated.message,
      }
    }

    const loaded = await resolveCompanionWorld()
    return {
      ...loaded,
      repairMessage: loaded.context
        ? 'ACCESS world generated. JYSON is ready.'
        : generated.message,
    }
  } catch (e) {
    return {
      ...(await resolveCompanionWorld()),
      repairMessage: e instanceof Error ? e.message : 'Generation failed.',
    }
  }
}

/**
 * Full repair: identity + blueprint + generate package + reload.
 */
export async function repairAccessWorld(): Promise<
  CompanionLoadResult & { repairMessage?: string }
> {
  return generateAccessWorld()
}

/** Re-run load without regenerating. */
export async function refreshJysonCompanion(): Promise<CompanionLoadResult> {
  return resolveCompanionWorld()
}

/** Detailed diagnostics for recovery panel. */
export async function getCompanionDiagnostics() {
  const { userId } = await auth()
  if (!userId) {
    return {
      checks: [],
      missingStep: 'Authentication',
      recommendedFix: 'Sign in to ACCESS.',
      diagnostic: (await resolveCompanionWorld()).diagnostic,
    }
  }
  return diagnoseCompanionWorld()
}
