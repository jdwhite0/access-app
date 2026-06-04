import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { buildRecoveryPlanFromCompanion, buildRecoveryPlanFromVaultSync, deviceHintFromClass } from '@/lib/access/recovery-plans'
import type { CompanionDiagnostic } from '@/lib/jyson-bridge/companion-diagnostic'
import type { VaultSyncRequestResult } from '@/lib/actions/vaults'
import type { DeviceClass } from '@/lib/vault/device-detection'

type Body = {
  source: 'companion' | 'vault'
  deviceClass?: DeviceClass
  deviceLabel?: string
  diagnostic?: CompanionDiagnostic
  vaultSync?: VaultSyncRequestResult
}

/**
 * POST /api/access/recovery/plan
 * Intelligence layer + UI: unified recovery plan for any account.
 */
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const deviceClass = body.deviceClass ?? 'unknown'
  const deviceLabel = body.deviceLabel ?? 'This device'
  const hint = deviceHintFromClass(deviceClass, deviceLabel)

  if (body.source === 'companion' && body.diagnostic) {
    const plan = buildRecoveryPlanFromCompanion(body.diagnostic, hint)
    return NextResponse.json({ plan })
  }

  if (body.source === 'vault' && body.vaultSync) {
    const plan = buildRecoveryPlanFromVaultSync(body.vaultSync, hint)
    return NextResponse.json({ plan: plan ?? null })
  }

  return NextResponse.json({ error: 'Unknown source' }, { status: 400 })
}
