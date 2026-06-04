'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import AccessAppLayout from '@/components/navigation/AccessAppLayout'
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
import JysonCompanionCommand from '@/components/jyson/JysonCompanionCommand'
import CompanionExecutePanel from '@/components/jyson/CompanionExecutePanel'
import { PageHeader } from '@/lib/design-system/components/platform'

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
  const autoRetriedRef = useRef(false)

  const loadCompanion = useCallback(async () => {
    const { context, diagnostic: diag, worldDiagnostics: world } =
      await fetchJysonCompanionContext()
    setCtx(context)
    setDiagnostic(diag ?? null)
    setWorldDiagnostics(world ?? null)
    return { context, diagnostic: diag }
  }, [])

  useEffect(() => {
    if (devFixtureContext) return
    if (!isLoaded) return
    if (!isSignedIn) {
      setLoading(false)
      return
    }
    setLoading(true)
    autoRetriedRef.current = false
    loadCompanion()
      .catch((err) => {
        setCtx(null)
        setDiagnostic({
          status: 'unknown_error',
          title: 'Your ACCESS world is not ready yet.',
          body: 'JYSON needs your Founder blueprint and ACCESS package before context can load.',
          message: err instanceof Error ? err.message : 'Load failed.',
          canRepair: true,
          repairAction: 'repair_connection',
          panelActions: ['retry_loading', 'view_diagnostics'],
          steps: [],
          cloudReady: false,
          localReady: false,
          connectorOnline: false,
        })
        setWorldDiagnostics(null)
      })
      .finally(() => setLoading(false))
  }, [isLoaded, isSignedIn, devFixtureContext, loadCompanion])

  /** Cloud-ready accounts: retry once after first paint (mobile hydration / package load). */
  useEffect(() => {
    if (devFixtureContext || loading || ctx || !diagnostic?.cloudReady) return
    if (autoRetriedRef.current) return
    const retryable =
      diagnostic.status === 'cloud_package_ready' ||
      diagnostic.status === 'local_sync_pending' ||
      diagnostic.status === 'local_founder_os_ready' ||
      diagnostic.status === 'companion_ready' ||
      diagnostic.status === 'blueprint_draft'
    if (!retryable) return
    autoRetriedRef.current = true
    setLoading(true)
    void loadCompanion()
      .then(({ context: loaded }) => {
        if (loaded) setCtx(loaded)
      })
      .finally(() => setLoading(false))
  }, [devFixtureContext, loading, ctx, diagnostic, loadCompanion])

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
      <AccessAppLayout variant="companion">
        <div className="jyson-companion jyson-companion--center">
          <p className="jyson-companion-muted">
            Loading your world<span className="cursor" />
          </p>
        </div>
      </AccessAppLayout>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="jyson-companion jyson-companion--center">
        <div className="jyson-companion-card fade-in">
          <p className="jyson-companion-eyebrow">ACCESS</p>
          <h1 className="jyson-companion-title">JYSON</h1>
          <p className="jyson-companion-lead">Sign in to talk to your world.</p>
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
          title: 'Setting up your ACCESS world',
          body: 'JYSON is connecting to your identity and vault. Tap Retry below if this takes more than a few seconds.',
          message: 'World not loaded.',
          canRepair: true,
          repairAction: 'repair_connection',
          panelActions: ['retry_loading', 'view_diagnostics'],
          steps: ['Retry loading', 'View diagnostics'],
          cloudReady: false,
          localReady: false,
          connectorOnline: false,
        }}
        onLoaded={handleRepaired}
      />
    )
  }

  // Show cloud/local warning when companion is loaded but local context is pending
  const localPending =
    ctx.companionState.status === 'cloud_package_ready' ||
    ctx.companionState.status === 'local_sync_pending'
  const agentWarning = localPending
    ? 'Loaded from cloud. Local Founder OS not yet synced to this machine.'
    : undefined

  return (
    <CompanionLoadedView
      ctx={ctx}
      agentWarning={agentWarning}
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
    <AccessAppLayout variant="companion" userLabel={ctx.handle}>
    <div className="jyson-companion access-platform access-platform-page access-shell-page access-companion-page">
      <PageHeader
        title="JYSON"
        description="Your AI companion for navigating, remembering, and building inside ACCESS."
      />

      <main className="jyson-companion-main fade-in">
        <section className="jyson-companion-hero access-companion-hero">
          {agentWarning && <p className="jyson-companion-warn">{agentWarning}</p>}
          <JysonCompanionCommand
            handle={ctx.handle}
            cloudReady={ctx.companionState.cloudReady}
            localConnected={ctx.companionState.localConnected}
          />
        </section>

        <details className="jyson-companion-drawer" id="overview">
          <summary className="jyson-companion-drawer-summary">Workspace context</summary>
          <div className="jyson-companion-card jyson-companion-card--nested">
            <p className="jyson-companion-loaded">Profile and blueprint context are loaded.</p>
            <div className="jyson-hybrid-state">
              <span className={`jyson-hybrid-badge ${ctx.companionState.cloudReady ? 'ok' : 'pending'}`}>
                {ctx.companionState.cloudReady ? 'Cloud data connected' : 'Cloud data pending'}
              </span>
              <span className={`jyson-hybrid-badge ${ctx.companionState.localConnected ? 'ok' : 'pending'}`}>
                {ctx.companionState.localConnected ? 'Local tools connected' : 'Local tools not connected'}
              </span>
            </div>
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
            <div id="memory" className="jyson-companion-block">
              <span className="jyson-companion-label">Identity summary</span>
              <p className="jyson-companion-body">{identitySummary}</p>
            </div>
            <div id="projects" className="jyson-companion-block">
              <span className="jyson-companion-label">Projects &amp; catalog</span>
              <p className="jyson-companion-body muted">
                {ctx.products.length} products · {ctx.experiences.length} experiences ·{' '}
                {ctx.organizations.length} organizations
              </p>
            </div>
            <div className="jyson-companion-columns">
              <div className="jyson-companion-perms">
                <span className="jyson-companion-label">Allowed</span>
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
            <div id="diagnostics" className="jyson-companion-block">
              <span className="jyson-companion-label">Diagnostics</span>
              <p className="jyson-companion-body muted">
                Agent package {ctx.layers.agentContext ? 'linked' : 'pending'} ·{' '}
                {ctx.companionState.cloudReady ? 'Cloud data connected' : 'Cloud data pending'} ·{' '}
                {ctx.companionState.localConnected ? 'Local tools connected' : 'Local tools not connected'}
              </p>
            </div>
          </div>
        </details>

        <details className="jyson-companion-drawer">
          <summary className="jyson-companion-drawer-summary">Advanced — agent routing</summary>
          <div id="agents" className="jyson-companion-card jyson-companion-card--nested">
            <JysonCommandLayer handle={ctx.handle} useFixtureDispatch={useFixtureDispatch} />
          </div>
        </details>

        <details className="jyson-companion-drawer">
          <summary className="jyson-companion-drawer-summary">Advanced — local OpenJarvis tools</summary>
          <div id="tools" className="jyson-companion-card jyson-companion-card--nested">
            <CompanionExecutePanel allowedActions={ctx.allowedActions} advancedOnly />
          </div>
        </details>
      </main>
    </div>
    </AccessAppLayout>
  )
}
