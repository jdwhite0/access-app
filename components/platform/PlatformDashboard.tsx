'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  PageHeader,
  ConnectionStatus,
  ActionCard,
  SectionPanel,
  MetricCard,
  BlueprintHealthCard,
  RecommendationCard,
  PlatformEmptyState,
} from '@/lib/design-system/components/platform'
import type { RegistrySummary } from '@/types/db'

type PlatformDashboardProps = {
  summary: RegistrySummary | null
  loading: boolean
  identityError: string | null
}

type LocalStackPayload = {
  runtime?: { localToolsAvailable?: boolean }
}

export default function PlatformDashboard({
  summary,
  loading,
  identityError,
}: PlatformDashboardProps) {
  const [localToolsOnline, setLocalToolsOnline] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/jyson/openjarvis/tools', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: LocalStackPayload | null) => {
        if (cancelled) return
        setLocalToolsOnline(!!data?.runtime?.localToolsAvailable)
      })
      .catch(() => {
        if (!cancelled) setLocalToolsOnline(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handle = summary?.identityHandle ?? '—'
  const counts = summary?.registryCounts ?? summary?.counts
  const total = summary?.totalRegistered ?? 0
  const blueprintCount = counts?.blueprints ?? 0
  const projectCount = counts?.projects ?? 0

  const founderStatus =
    blueprintCount > 0 ? ('operational' as const) : summary ? ('degraded' as const) : ('offline' as const)
  const founderLabel = blueprintCount > 0 ? 'Materialized' : summary ? 'Draft or pending' : 'Pending'

  const activity = useMemo(() => {
    const items: { label: string; when: string }[] = []
    if (summary?.identityCreatedAt) {
      items.push({
        label: 'ACCESS identity registered',
        when: new Date(summary.identityCreatedAt).toLocaleString(),
      })
    }
    if (summary?.vaultConnection?.lastSyncAt) {
      items.push({
        label: `Vault sync (${summary.vaultConnection.displayName})`,
        when: new Date(summary.vaultConnection.lastSyncAt).toLocaleString(),
      })
    }
    if (blueprintCount === 0 && summary) {
      items.push({ label: 'Founder blueprint not materialized', when: 'Suggested' })
    }
    if (projectCount === 0 && summary) {
      items.push({ label: 'No builder projects in registry yet', when: 'Suggested' })
    }
    return items
  }, [summary, blueprintCount, projectCount])

  return (
    <div className="access-platform access-platform-page access-platform-page--wide">
      <PageHeader
        eyebrow="ACCESS OS"
        title="Command center"
        description="World overview, Founder OS, JYSON, local/cloud connection, and what deserves attention next."
      />

      <div className="access-platform-grid access-platform-grid--4" style={{ marginTop: 24 }}>
        <MetricCard
          label="ACCESS world"
          value={loading ? 'Loading…' : handle}
          hint={
            identityError ??
            (summary ? `${total} registered objects.` : 'Claim your handle to activate your world.')
          }
        />
        <BlueprintHealthCard
          status={founderStatus}
          statusLabel={founderLabel}
          summary={
            blueprintCount > 0
              ? `${blueprintCount} blueprint${blueprintCount === 1 ? '' : 's'} in registry.`
              : 'Blueprint aligns Founder OS and JYSON to your ventures.'
          }
          items={
            counts
              ? [
                  { label: 'Blueprints', value: String(blueprintCount) },
                  { label: 'Projects', value: String(projectCount) },
                ]
              : undefined
          }
          href="/founder"
        />
        <div className="access-platform-card access-platform-metric-card">
          <p className="access-platform-meta">JYSON</p>
          <p className="access-platform-metric-card__value">Intelligence layer</p>
          <div className="access-platform-connection-row" style={{ marginTop: 12 }}>
            <ConnectionStatus label="Cloud package" online={!!summary} />
            <ConnectionStatus label="Local tools" online={localToolsOnline === true} />
          </div>
        </div>
        <MetricCard
          label="Local / cloud"
          value={
            localToolsOnline === null
              ? 'Checking…'
              : localToolsOnline
                ? 'Hybrid ready'
                : 'Cloud only'
          }
          hint={
            localToolsOnline
              ? 'Connector + OpenJarvis available on this machine.'
              : 'Enable connector heartbeat for local Founder OS and file tools.'
          }
        />
      </div>

      <SectionPanel
        title="Current projects"
        description="Builder projects and active catalog in your registry."
      >
        {loading ? (
          <p className="access-platform-body">Loading…</p>
        ) : !summary ? (
          <PlatformEmptyState title="Registry unavailable" description="Identity or Supabase may need configuration." />
        ) : (
          <div className="access-platform-grid access-platform-grid--3">
            <MetricCard label="Projects" value={projectCount} hint="Registered builder work" />
            <MetricCard label="Systems" value={counts?.systems ?? 0} hint="Connected infrastructure" />
            <MetricCard label="Agents" value={counts?.agents ?? 0} hint="Routed through JYSON" />
          </div>
        )}
      </SectionPanel>

      <SectionPanel title="Suggested next actions">
        <div className="access-platform-grid access-platform-grid--3">
          {blueprintCount === 0 && summary ? (
            <RecommendationCard
              title="Complete Founder blueprint"
              description="Materialize identity and ventures so JYSON can load your world."
              href="/founder"
              meta="Founder OS"
              priority="high"
            />
          ) : null}
          <ActionCard
            title="Talk to JYSON"
            description="Context-aware guidance and local tools when connected."
            href="/companion"
            meta="Primary"
          />
          <ActionCard
            title="Review registry"
            description="Organizations, products, systems, and agents."
            href="/registry"
            meta={
              counts
                ? `${counts.projects} projects · ${counts.systems} systems`
                : 'World map'
            }
          />
        </div>
      </SectionPanel>

      <SectionPanel title="Recent activity">
        {activity.length === 0 ? (
          <PlatformEmptyState
            title="No events yet"
            description="Identity and vault sync activity will appear as your world grows."
          />
        ) : (
          <ul className="access-platform-activity-list">
            {activity.map((item) => (
              <li key={`${item.label}-${item.when}`} className="access-platform-activity-item">
                <span className="access-platform-body">{item.label}</span>
                <time>{item.when}</time>
              </li>
            ))}
          </ul>
        )}
      </SectionPanel>

      <SectionPanel title="System health">
        <div className="access-platform-card">
          <div className="access-platform-grid access-platform-grid--2">
            <div>
              <p className="access-platform-meta">Vault &amp; sync</p>
              <p className="access-platform-body" style={{ marginTop: 6 }}>
                {summary?.syncStatus ?? summary?.vaultConnection?.status ?? 'No connector'}
              </p>
            </div>
            <div>
              <p className="access-platform-meta">Operator</p>
              <p className="access-platform-body" style={{ marginTop: 6 }}>
                <Link href="/status" className="access-platform-link">
                  Public status
                </Link>
                {' · '}
                <Link href="/internal/status" className="access-platform-link">
                  Internal
                </Link>
                {' · '}
                <Link href="/terminal" className="access-platform-link">
                  Terminal
                </Link>
              </p>
            </div>
          </div>
        </div>
      </SectionPanel>
    </div>
  )
}
