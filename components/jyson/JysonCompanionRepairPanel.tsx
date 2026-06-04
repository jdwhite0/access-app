'use client'

import { useMemo, useState } from 'react'
import AccessAppLayout from '@/components/navigation/AccessAppLayout'
import { AccessRecoveryGuide } from '@/components/platform/AccessRecoveryGuide'
import { buildRecoveryPlanFromCompanion } from '@/lib/access/recovery-plans'
import { detectDeviceFromNavigator } from '@/lib/vault/device-detection'
import { getCompanionDiagnostics, refreshJysonCompanion } from '@/lib/actions/jyson-companion-repair'
import type { CompanionDiagnostic } from '@/lib/jyson-bridge/companion-diagnostic'
import type {
  CompanionWorldDiagnostics,
  DiagnosticCheck,
} from '@/lib/jyson-bridge/companion-world-diagnostic'
import type { JysonContext } from '@/lib/jyson-bridge/types'

type Props = {
  diagnostic: CompanionDiagnostic
  worldDiagnostics?: CompanionWorldDiagnostics
  onLoaded: (ctx: JysonContext, diagnostic: CompanionDiagnostic) => void
}

export default function JysonCompanionRepairPanel({
  diagnostic,
  worldDiagnostics: initialWorld,
  onLoaded,
}: Props) {
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [checks, setChecks] = useState<DiagnosticCheck[]>(initialWorld?.checks ?? [])

  const device = detectDeviceFromNavigator()
  const plan = useMemo(
    () =>
      buildRecoveryPlanFromCompanion(diagnostic, {
        isMobile: device.isMobile,
        deviceLabel: device.deviceLabel,
      }),
    [diagnostic, device.isMobile, device.deviceLabel]
  )

  async function handleCompanionLoaded() {
    const result = await refreshJysonCompanion()
    if (result.context) onLoaded(result.context, result.diagnostic)
  }

  async function loadDiagnostics() {
    setShowDiagnostics(true)
    try {
      const world = await getCompanionDiagnostics()
      setChecks(world.checks)
    } catch {
      /* ignore */
    }
  }

  return (
    <AccessAppLayout variant="companion" userLabel={diagnostic.handle ?? null}>
      <div className="jyson-companion jyson-companion--center access-companion-recovery-wrap">
        <AccessRecoveryGuide
          plan={plan}
          autoFix={plan.jysonCanAutoFix}
          onCompanionLoaded={() => void handleCompanionLoaded()}
          showTechnical={process.env.NODE_ENV === 'development'}
        />
        <div className="access-recovery__extras">
          <button
            type="button"
            className="access-recovery__link-secondary"
            onClick={() => void loadDiagnostics()}
          >
            {showDiagnostics ? 'Refresh diagnostics' : 'What is blocking me?'}
          </button>
        </div>
        {showDiagnostics && checks.length > 0 && (
          <div className="jyson-diagnostics-table access-recovery__diagnostics">
            <ul>
              {checks.map((c) => (
                <li key={c.id} className={c.ok ? 'ok' : 'fail'}>
                  <span className="mark">{c.ok ? '✓' : '✕'}</span>
                  <span className="name">{c.label}</span>
                  <span className="detail">{c.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AccessAppLayout>
  )
}
