'use client'

import { useState } from 'react'
import Link from 'next/link'
import AccessAppLayout from '@/components/navigation/AccessAppLayout'
import {
  generateAccessWorld,
  getCompanionDiagnostics,
  refreshJysonCompanion,
} from '@/lib/actions/jyson-companion-repair'
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
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [checks, setChecks] = useState<DiagnosticCheck[]>(initialWorld?.checks ?? [])

  async function runGenerate() {
    setBusy(true)
    setNote(null)
    try {
      const result = await generateAccessWorld()
      setNote(result.repairMessage ?? null)
      if (result.context) onLoaded(result.context, result.diagnostic)
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Generation failed.')
    } finally {
      setBusy(false)
    }
  }

  async function runRefresh() {
    setBusy(true)
    setNote(null)
    try {
      const result = await refreshJysonCompanion()
      if (result.context) {
        onLoaded(result.context, result.diagnostic)
      } else {
        setNote(result.diagnostic.message)
      }
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Retry failed.')
    } finally {
      setBusy(false)
    }
  }

  async function loadDiagnostics() {
    setShowDiagnostics(true)
    setBusy(true)
    try {
      const world = await getCompanionDiagnostics()
      setChecks(world.checks)
    } catch {
      setNote('Could not load diagnostics.')
    } finally {
      setBusy(false)
    }
  }

  const actions = diagnostic.panelActions?.length
    ? diagnostic.panelActions
    : ['generate_access_world', 'retry_loading', 'view_diagnostics']

  return (
    <AccessAppLayout variant="companion" userLabel={diagnostic.handle ?? null}>
    <div className="jyson-companion jyson-companion--center">
      <div className="jyson-companion-card jyson-repair-card fade-in">
        <p className="jyson-companion-eyebrow">JYSON · COMPANION</p>
        <h1 className="jyson-companion-title">{diagnostic.title}</h1>
        <p className="jyson-companion-lead">{diagnostic.body}</p>

        {diagnostic.missingStep && (
          <div className="jyson-repair-block">
            <span className="jyson-companion-label">Detected missing step</span>
            <p className="jyson-repair-highlight">{diagnostic.missingStep}</p>
          </div>
        )}

        {diagnostic.recommendedFix && (
          <div className="jyson-repair-block">
            <span className="jyson-companion-label">Recommended fix</span>
            <p className="jyson-companion-body">{diagnostic.recommendedFix}</p>
          </div>
        )}

        {diagnostic.steps.length > 0 && (
          <ul className="jyson-repair-steps">
            {diagnostic.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        )}

        {(diagnostic.handle || diagnostic.founderOsId) && (
          <div className="jyson-repair-meta">
            {diagnostic.handle && (
              <p>
                <span className="jyson-companion-label">Handle</span>{' '}
                <code>{diagnostic.handle}</code>
              </p>
            )}
            {diagnostic.founderOsId && (
              <p>
                <span className="jyson-companion-label">Founder OS</span>{' '}
                <code>{diagnostic.founderOsId}</code>
              </p>
            )}
            {diagnostic.packagePath && (
              <p className="jyson-repair-path">{diagnostic.packagePath}</p>
            )}
          </div>
        )}

        <p className="jyson-companion-error subtle">Reason: {diagnostic.message}</p>

        {note && <p className="jyson-repair-note">{note}</p>}

        <div className="jyson-repair-actions">
          {actions.includes('complete_blueprint') && (
            <Link href="/founder" className="jyson-repair-secondary jyson-repair-link-btn">
              Complete Blueprint
            </Link>
          )}
          {actions.includes('generate_access_world') && diagnostic.canRepair && (
            <button
              type="button"
              className="jyson-command-submit"
              disabled={busy}
              onClick={() => void runGenerate()}
            >
              {busy ? 'Working…' : 'Generate ACCESS World'}
            </button>
          )}
          {actions.includes('retry_loading') && (
            <button
              type="button"
              className="jyson-repair-secondary"
              disabled={busy}
              onClick={() => void runRefresh()}
            >
              Retry Loading
            </button>
          )}
          {actions.includes('view_diagnostics') && (
            <button
              type="button"
              className="jyson-repair-secondary"
              disabled={busy}
              onClick={() => void loadDiagnostics()}
            >
              View Diagnostics
            </button>
          )}
        </div>

        {showDiagnostics && checks.length > 0 && (
          <div className="jyson-diagnostics-table">
            <span className="jyson-companion-label">Diagnostics</span>
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

        {diagnostic.repairAction === 'sign_in' && (
          <Link href="/" className="jyson-companion-link">
            Sign in to ACCESS
          </Link>
        )}
      </div>
    </div>
    </AccessAppLayout>
  )
}
