'use client'

import RegistryPanel from '@/components/access/RegistryPanel'
import { PlatformEmptyState } from '@/lib/design-system/components/platform'
import type { RegistrySummary } from '@/types/db'
import {
  REGISTRY_STAT_KEYS,
  REGISTRY_ROW_LABELS,
  REGISTRY_RELATIONSHIP_HINTS,
  type RegistryRowKey,
} from './registry-types'

type Props = {
  summary: RegistrySummary | null
  loading: boolean
  identityError: string | null
  selectedKey: RegistryRowKey | null
  onSelectKey: (key: RegistryRowKey) => void
}

export default function RegistryModule({
  summary,
  loading,
  identityError,
  selectedKey,
  onSelectKey,
}: Props) {
  if (loading) {
    return (
      <div className="access-platform-card" style={{ marginTop: 20 }}>
        <p className="access-platform-body">Loading registry…</p>
      </div>
    )
  }

  if (!summary) {
    return (
      <div style={{ marginTop: 20 }}>
        <PlatformEmptyState
          title="Registry unavailable"
          description="Check Supabase configuration and your ACCESS identity."
        />
      </div>
    )
  }

  return (
    <>
      {identityError ? (
        <div className="access-platform-card" role="alert" style={{ marginTop: 16 }}>
          <p className="access-platform-body">{identityError}</p>
        </div>
      ) : null}

      <div className="access-platform-registry-grid" style={{ marginTop: 20 }}>
        {REGISTRY_STAT_KEYS.map((key) => {
          const count = summary.counts[key]
          const hint = REGISTRY_RELATIONSHIP_HINTS[key]
          return (
            <button
              key={key}
              type="button"
              className={[
                'access-platform-card',
                'access-platform-registry-stat',
                selectedKey === key ? 'is-selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelectKey(key)}
            >
              <p className="access-platform-meta">{REGISTRY_ROW_LABELS[key]}</p>
              <p className="access-platform-metric-card__value">{count}</p>
              {hint ? <p className="access-platform-registry-hint">{hint}</p> : null}
            </button>
          )
        })}
      </div>

      <div className="access-platform-card" style={{ marginTop: 20 }}>
        <p className="access-platform-meta">World relationships</p>
        <p className="access-platform-body" style={{ marginTop: 8 }}>
          <span className="font-mono" style={{ fontFamily: 'var(--font-mono)' }}>
            {summary.identityHandle}
          </span>
          {' · '}
          {summary.totalRegistered} registered · {summary.connectionsCount} connection
          {summary.connectionsCount === 1 ? '' : 's'}
          {summary.syncStatus ? ` · sync ${summary.syncStatus}` : ''}
        </p>
      </div>

      <RegistryPanel
        summary={summary}
        mode="os"
        selectedKey={selectedKey}
        onSelectKey={onSelectKey}
        onCommand={() => {}}
      />
    </>
  )
}
