'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AccessAppLayout from '@/components/navigation/AccessAppLayout'
import { PageHeader, SectionPanel, PlatformEmptyState, SecondaryButton } from '@/lib/design-system/components/platform'
import type { System, Blueprint, Asset, Workflow, Vault } from '@/types/db'
import { listSystems } from '@/lib/actions/systems'
import { listBlueprints } from '@/lib/actions/blueprints'
import { listAssets } from '@/lib/actions/assets'
import { listWorkflows } from '@/lib/actions/workflows'
import { listVaults } from '@/lib/actions/vaults'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatusBadge({ status }: { status: string }) {
  const color = status === 'active' ? 'operational' : status === 'archived' ? 'offline' : 'neutral'
  return <span className={`access-ds-badge access-ds-badge--${color}`}>{status}</span>
}

function RegistryRow({ children }: { children: React.ReactNode }) {
  return <div className="access-registry-row">{children}</div>
}

/* ── Systems ── */
function SystemsModule() {
  const [systems, setSystems] = useState<System[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { listSystems().then(setSystems).catch(() => []).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="access-platform-loading">Loading systems…</div>
  if (systems.length === 0) return (
    <PlatformEmptyState title="No systems registered" description="Register your first system from the terminal with /register-system." actionHref="/terminal" actionLabel="Open Terminal" />
  )
  return (
    <div className="access-registry-list">
      {systems.map(s => (
        <RegistryRow key={s.id}>
          <div className="access-registry-row__main">
            <p className="access-registry-row__name">{s.name}</p>
            <p className="access-registry-row__sub" style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem' }}>{s.system_handle}</p>
          </div>
          <span className="access-registry-row__type">{s.type}</span>
          <StatusBadge status={s.status} />
          <span className="access-platform-meta">{fmtDate(s.created_at)}</span>
        </RegistryRow>
      ))}
    </div>
  )
}

/* ── Blueprints ── */
const BP_LABELS: Record<string, string> = { ai: 'AI System', business: 'Business', content: 'Content', knowledge: 'Knowledge' }

function BlueprintsModule() {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { listBlueprints().then(setBlueprints).catch(() => []).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="access-platform-loading">Loading blueprints…</div>
  if (blueprints.length === 0) return (
    <PlatformEmptyState title="No blueprints yet" description="Generate a blueprint from the terminal with /build-ai-system or /build-business." actionHref="/terminal" actionLabel="Open Terminal" />
  )
  return (
    <div className="access-registry-list">
      {blueprints.map(bp => (
        <RegistryRow key={bp.id}>
          <div className="access-registry-row__main">
            <p className="access-registry-row__name">{BP_LABELS[bp.type] ?? bp.type} Blueprint</p>
            <p className="access-registry-row__sub">{bp.answers?.[0] ?? '—'}</p>
          </div>
          <span className={`access-ds-badge access-ds-badge--${bp.system_id ? 'operational' : 'neutral'}`}>
            {bp.system_id ? 'registered' : 'unregistered'}
          </span>
          <span className="access-platform-meta">{fmtDate(bp.created_at)}</span>
        </RegistryRow>
      ))}
    </div>
  )
}

/* ── Assets ── */
function AssetsModule() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { listAssets().then(setAssets).catch(() => []).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="access-platform-loading">Loading assets…</div>
  if (assets.length === 0) return (
    <PlatformEmptyState title="No assets registered" description="Register assets from the terminal with /register-asset." actionHref="/terminal" actionLabel="Open Terminal" />
  )
  return (
    <div className="access-registry-list">
      {assets.map(a => (
        <RegistryRow key={a.id}>
          <div className="access-registry-row__main">
            <p className="access-registry-row__name">{a.name}</p>
            {a.description && <p className="access-registry-row__sub">{a.description}</p>}
          </div>
          <span className="access-registry-row__type">{a.asset_type ?? '—'}</span>
          <StatusBadge status={a.status} />
          <span className="access-platform-meta">{fmtDate(a.created_at)}</span>
        </RegistryRow>
      ))}
    </div>
  )
}

/* ── Workflows ── */
function WorkflowsModule() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { listWorkflows().then(setWorkflows).catch(() => []).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="access-platform-loading">Loading workflows…</div>
  if (workflows.length === 0) return (
    <PlatformEmptyState title="No workflows registered" description="Register workflows from the terminal with /register-workflow." actionHref="/terminal" actionLabel="Open Terminal" />
  )
  return (
    <div className="access-registry-list">
      {workflows.map(w => (
        <RegistryRow key={w.id}>
          <div className="access-registry-row__main">
            <p className="access-registry-row__name">{w.name}</p>
            {w.description && <p className="access-registry-row__sub">{w.description}</p>}
          </div>
          <StatusBadge status={w.status} />
          <span className="access-platform-meta">{fmtDate(w.created_at)}</span>
        </RegistryRow>
      ))}
    </div>
  )
}

/* ── Vaults ── */
function VaultsModule() {
  const [vaults, setVaults] = useState<Vault[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { listVaults().then(setVaults).catch(() => []).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="access-platform-loading">Loading vaults…</div>
  if (vaults.length === 0) return (
    <PlatformEmptyState title="No vaults registered" description="Register knowledge vaults from the terminal with /register-vault." actionHref="/terminal" actionLabel="Open Terminal" />
  )
  return (
    <div className="access-registry-list">
      {vaults.map(v => (
        <RegistryRow key={v.id}>
          <div className="access-registry-row__main">
            <p className="access-registry-row__name">{v.name}</p>
            {v.description && <p className="access-registry-row__sub">{v.description}</p>}
          </div>
          {v.vault_type && <span className="access-registry-row__type">{v.vault_type}</span>}
          <StatusBadge status={v.status} />
          <span className="access-platform-meta">{fmtDate(v.created_at)}</span>
        </RegistryRow>
      ))}
    </div>
  )
}

/* ── Module map ── */
type ModuleId = 'systems' | 'blueprints' | 'assets' | 'workflows' | 'vaults'

const MODULES: Array<{ id: ModuleId; label: string; description: string }> = [
  { id: 'systems',    label: 'Systems',    description: 'Registered AI, business, content, and knowledge systems.' },
  { id: 'blueprints', label: 'Blueprints', description: 'Generated architecture blueprints, linked to your systems.' },
  { id: 'assets',     label: 'Assets',     description: 'Code, content, creative, data, and brand assets.' },
  { id: 'workflows',  label: 'Workflows',  description: 'Automations and process definitions.' },
  { id: 'vaults',     label: 'Vaults',     description: 'Knowledge stores — Obsidian, Notion, local folders.' },
]

function ModuleContent({ id }: { id: ModuleId }) {
  switch (id) {
    case 'systems':    return <SystemsModule />
    case 'blueprints': return <BlueprintsModule />
    case 'assets':     return <AssetsModule />
    case 'workflows':  return <WorkflowsModule />
    case 'vaults':     return <VaultsModule />
  }
}

export default function RegistryModuleClient({ module }: { module: ModuleId }) {
  const meta = MODULES.find(m => m.id === module) ?? MODULES[0]

  return (
    <AccessAppLayout variant="default">
      <div className="access-platform access-platform-page access-shell-page">
        <PageHeader
          eyebrow="Registry"
          title={meta.label}
          description={meta.description}
          actions={
            <SecondaryButton href="/registry">← Registry</SecondaryButton>
          }
        />

        {/* Module nav tabs */}
        <div className="access-registry-tabs">
          {MODULES.map(m => (
            <Link
              key={m.id}
              href={`/${m.id}`}
              className={`access-registry-tab${m.id === module ? ' access-registry-tab--active' : ''}`}
            >
              {m.label}
            </Link>
          ))}
        </div>

        <SectionPanel title={`All ${meta.label.toLowerCase()}`}>
          <div className="access-registry-list access-shell-panel">
            <ModuleContent id={module} />
          </div>
        </SectionPanel>
      </div>
    </AccessAppLayout>
  )
}
