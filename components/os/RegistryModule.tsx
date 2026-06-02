'use client'

import RegistryPanel from '@/components/access/RegistryPanel'
import type { RegistrySummary } from '@/types/db'
import { REGISTRY_STAT_KEYS, REGISTRY_ROW_LABELS, type RegistryRowKey } from './registry-types'

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
      <div className="access-os-registry-status">
        <p className="access-os-registry-loading">Loading registry…</p>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="access-os-registry-status">
        <p className="access-os-registry-error">Registry unavailable. Check Supabase configuration.</p>
      </div>
    )
  }

  return (
    <>
      {identityError && (
        <div className="access-os-registry-alert" role="alert">
          {identityError}
        </div>
      )}

      <div className="access-os-workspace-placeholder">
        <div className="access-os-placeholder-grid">
          {REGISTRY_STAT_KEYS.map((key) => {
            const count = summary.counts[key]
            return (
              <button
                key={key}
                type="button"
                className={[
                  'access-os-placeholder-card',
                  'access-os-stat-card',
                  selectedKey === key ? 'is-selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSelectKey(key)}
              >
                <span className="access-os-placeholder-label">{REGISTRY_ROW_LABELS[key]}</span>
                <span className="access-os-placeholder-value">{count}</span>
              </button>
            )
          })}
        </div>

        <RegistryPanel
          summary={summary}
          mode="os"
          selectedKey={selectedKey}
          onSelectKey={onSelectKey}
          onCommand={() => {}}
        />
      </div>
    </>
  )
}
