'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import AppSystemNav from '@/components/access/AppSystemNav'
import { fetchJysonCompanionContext } from '@/lib/actions/jyson-companion'
import type { CompanionDiagnostic } from '@/lib/jyson-bridge/companion-diagnostic'
import type { CompanionWorldDiagnostics } from '@/lib/jyson-bridge/companion-world-diagnostic'
import type { JysonContext } from '@/lib/jyson-bridge/types'
import JysonCompanionRepairPanel from '@/components/jyson/JysonCompanionRepairPanel'
import {
  COMPANION_ALLOWED_DISPLAY,
  COMPANION_DENIED_DISPLAY,
  labelForAction,
} from '@/lib/jyson-bridge/action-labels'
import JysonCommandLayer from '@/components/jyson/JysonCommandLayer'

type JysonCompanionPanelProps = {
  /** Dev-only: `?preview=fixture` on /companion loads jdwhite.access without sign-in. */
  devFixtureContext?: JysonContext | null
}

export default function JysonCompanionPanel({ devFixtureContext = null }: JysonCompanionPanelProps) {
  const { isLoaded, isSignedIn } = useAuth()
  const [ctx, setCtx] = useState<JysonContext | null>(devFixtureContext)
  const [diagnostic, setDiagnostic] = useState<CompanionDiagnostic | null>(null)
  const [worldDiagnostics, setWorldDiagnostics] = useState<CompanionWorldDiagnostics | null>(
    null
  )
  const [loading, setLoading] = useState(!devFixtureContext)

  useEffect(() => {
    if (devFixtureContext) return
    if (!isLoaded) return
    if (!isSignedIn) {
      setLoading(false)
      return
    }
    setLoading(true)
    fetchJysonCompanionContext()
      .then(({ context, diagnostic: diag, worldDiagnostics: world }) => {
        setCtx(context)
        setDiagnostic(diag ?? null)
        setWorldDiagnostics(world ?? null)
      })
      .catch((err) => {
        setCtx(null)
        setDiagnostic({
          status: 'unknown_error',
          title: 'Your ACCESS world is not ready yet.',
          body: 'JYSON needs your Blueprint and ACCESS system package before it can load your world.',
          message: err instanceof Error ? err.message : 'Load failed.',
          canRepair: true,
          repairAction: 'repair_connection',
          panelActions: ['retry_loading', 'view_diagnostics'],
          steps: [],
        })
        setWorldDiagnostics(null)
      })
      .finally(() => setLoading(false))
  }, [isLoaded, isSignedIn, devFixtureContext])

  function handleRepaired(loaded: JysonContext, diag: CompanionDiagnostic) {
    setCtx(loaded)
    setDiagnostic(diag)
  }

  if (devFixtureContext && ctx) {
    return (
      <>
        <p className="jyson-companion-dev-banner">Dev fixture preview · jdwhite.access</p>
        <CompanionLoadedView ctx={ctx} useFixtureDispatch />
      </>
    )
  }

  if (!isLoaded || loading) {
    return (
      <div className="jyson-companion">
        <AppSystemNav active="companion" />
        <div className="jyson-companion jyson-companion--center">
          <p className="jyson-companion-muted">
            Loading your world<span className="cursor" />
          </p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="jyson-companion jyson-companion--center">
        <div className="jyson-companion-card fade-in">
          <p className="jyson-companion-eyebrow">JYSON</p>
          <h1 className="jyson-companion-title">Companion</h1>
          <p className="jyson-companion-lead">Sign in to ACCESS to load your digital world.</p>
          <Link href="/" className="jyson-companion-link">
            Go to ACCESS
          </Link>
        </div>
      </div>
    )
  }

  if (!ctx) {
    if (diagnostic) {
      return (
        <JysonCompanionRepairPanel
          diagnostic={diagnostic}
          worldDiagnostics={worldDiagnostics ?? undefined}
          onLoaded={handleRepaired}
        />
      )
    }
    return (
      <JysonCompanionRepairPanel
        diagnostic={{
          status: 'unknown_error',
          title: 'Your ACCESS world is not ready yet.',
          body: 'JYSON needs your Blueprint and ACCESS system package before it can load your world.',
          message: 'World not loaded.',
          canRepair: true,
          repairAction: 'repair_connection',
          panelActions: ['generate_access_world', 'retry_loading', 'view_diagnostics'],
          steps: ['Generate ACCESS world', 'Retry loading'],
        }}
        onLoaded={handleRepaired}
      />
    )
  }

  return (
    <CompanionLoadedView
      ctx={ctx}
      agentWarning={
        diagnostic?.status === 'missing_agent_context' ? diagnostic.message : undefined
      }
    />
  )
}

function CompanionLoadedView({
  ctx,
  useFixtureDispatch = false,
  agentWarning,
}: {
  ctx: JysonContext
  useFixtureDispatch?: boolean
  agentWarning?: string
}) {
  const firstName = ctx.identity.displayName.split(' ')[0]
  const allowedSet = new Set(ctx.allowedActions)
  const deniedSet = new Set(ctx.deniedActions)

  const allowedLines = [
    ...COMPANION_ALLOWED_DISPLAY.filter((a) => allowedSet.has(a)).map(labelForAction),
    ...(allowedSet.has('list_products') && allowedSet.has('update_blueprint_draft')
      ? ['Create products']
      : []),
    ...(allowedSet.has('list_experiences') && allowedSet.has('update_blueprint_draft')
      ? ['Create experiences']
      : []),
    ...(allowedSet.has('summarize_system') ? ['Create content'] : []),
  ]
  const deniedLines = COMPANION_DENIED_DISPLAY.filter((a) => deniedSet.has(a)).map(labelForAction)

  const identitySummary = ctx.summary.consumer.split('\n').slice(0, 4).join(' ')

  return (
    <div className="jyson-companion">
      <AppSystemNav active="companion" accessId={ctx.handle} />
      <header className="jyson-companion-header jyson-companion-header--below-nav">
        <div>
          <p className="jyson-companion-eyebrow">JYSON · COMPANION</p>
          <p className="jyson-companion-tagline">Intelligence inside your ACCESS world</p>
        </div>
      </header>

      <main className="jyson-companion-main fade-in">
        <section className="jyson-companion-card">
          {agentWarning && (
            <p className="jyson-companion-warn">{agentWarning}</p>
          )}
          <h1 className="jyson-companion-greeting">Hello {firstName}.</h1>
          <p className="jyson-companion-loaded">Your ACCESS world is loaded.</p>
          <p className="jyson-companion-sub">
            JYSON reads your handle and blueprint. ACCESS remains the source of truth.
          </p>

          <div className="jyson-companion-block">
            <span className="jyson-companion-label">Handle</span>
            <span className="jyson-companion-value accent">{ctx.handle}</span>
          </div>

          <div className="jyson-companion-stats">
            <div className="jyson-companion-stat">
              <span className="jyson-companion-stat-num">{ctx.organizations.length}</span>
              <span className="jyson-companion-stat-label">Organizations</span>
            </div>
            <div className="jyson-companion-stat">
              <span className="jyson-companion-stat-num">{ctx.products.length}</span>
              <span className="jyson-companion-stat-label">Products</span>
            </div>
            <div className="jyson-companion-stat">
              <span className="jyson-companion-stat-num">{ctx.experiences.length}</span>
              <span className="jyson-companion-stat-label">Experiences</span>
            </div>
          </div>

          <div className="jyson-companion-block">
            <span className="jyson-companion-label">Identity summary</span>
            <p className="jyson-companion-body">{identitySummary}</p>
          </div>

          <div className="jyson-companion-block">
            <span className="jyson-companion-label">System summary</span>
            <p className="jyson-companion-body">{ctx.summary.headline}</p>
            <p className="jyson-companion-body muted">
              User system: {ctx.userSystemId}
              {ctx.layers.agentContext ? ' · Package linked' : ' · Blueprint context'}
            </p>
          </div>

          <div className="jyson-companion-columns">
            <div className="jyson-companion-perms">
              <span className="jyson-companion-label">You currently have access to</span>
              <ul className="jyson-companion-list allowed">
                {allowedLines.map((line) => (
                  <li key={line}>
                    <span className="mark">✓</span> {line}
                  </li>
                ))}
              </ul>
            </div>
            <div className="jyson-companion-perms">
              <span className="jyson-companion-label">Restricted</span>
              <ul className="jyson-companion-list denied">
                {deniedLines.map((line) => (
                  <li key={line}>
                    <span className="mark">✕</span> {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <JysonCommandLayer handle={ctx.handle} useFixtureDispatch={useFixtureDispatch} />

          <p className="jyson-companion-footnote">
            Read-only companion · Intent routing only · No chat · No LLM · P10
          </p>
        </section>
      </main>
    </div>
  )
}
