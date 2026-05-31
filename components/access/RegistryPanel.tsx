'use client'

import type { RegistrySummary } from '@/types/db'

type Props = {
  summary: RegistrySummary
  onCommand: (cmd: string) => void
}

const REGISTRY_ROWS: Array<{
  label: string
  key: keyof RegistrySummary['counts']
  registerCmd: string
  listCmd: string
  note?: string
}> = [
  { label: 'Systems',     key: 'systems',     registerCmd: '/register-system',   listCmd: '/my-systems' },
  { label: 'Agents',      key: 'agents',       registerCmd: '/register-agent',    listCmd: '/my-agents' },
  { label: 'Projects',    key: 'projects',     registerCmd: '/register-project',  listCmd: '/my-projects' },
  { label: 'Blueprints',  key: 'blueprints',   registerCmd: '/start',             listCmd: '/my-blueprints' },
  { label: 'Assets',      key: 'assets',       registerCmd: '/register-asset',    listCmd: '/my-assets' },
  { label: 'Workflows',   key: 'workflows',    registerCmd: '/register-workflow',  listCmd: '/my-workflows' },
  { label: 'Vaults',      key: 'vaults',       registerCmd: '/register-vault',    listCmd: '/my-vaults' },
  { label: 'Connections', key: 'connections',  registerCmd: '',                   listCmd: '', note: 'Phase 3' },
  { label: 'Offers',      key: 'offers',       registerCmd: '/register-offer',    listCmd: '/my-offers' },
]

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function RegistryPanel({ summary, onCommand }: Props) {
  const div = { borderTop: '1px solid rgba(255,255,255,0.07)', margin: '14px 0' }

  return (
    <div style={{
      maxWidth: '600px',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '2px',
      padding: '0',
      background: 'rgba(255,255,255,0.012)',
      marginBottom: '24px',
      fontFamily: 'var(--mono)',
    }}>

      {/* Header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
            ACCESS REGISTRY
          </div>
          <div style={{ fontSize: '15px', color: 'var(--accent)', letterSpacing: '0.06em', fontWeight: 300 }}>
            {summary.identityHandle}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '9px', color: 'var(--success)', letterSpacing: '0.14em', marginBottom: '3px' }}>ACTIVE</div>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
            since {fmtDate(summary.identityCreatedAt)}
          </div>
        </div>
      </div>

      {/* Registry rows */}
      <div style={{ padding: '4px 0' }}>
        {REGISTRY_ROWS.map(({ label, key, registerCmd, listCmd, note }) => {
          const count = summary.counts[key]
          const hasItems = count > 0
          const isPhase3 = !!note
          const actionCmd = hasItems ? listCmd : registerCmd

          return (
            <button
              key={key}
              onClick={() => !isPhase3 && actionCmd && onCommand(actionCmd)}
              disabled={isPhase3 || !actionCmd}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '9px 20px',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                cursor: isPhase3 || !actionCmd ? 'default' : 'pointer',
                transition: 'background 0.1s',
                textAlign: 'left',
              }}
              onMouseEnter={e => {
                if (!isPhase3 && actionCmd) e.currentTarget.style.background = 'rgba(64,192,208,0.03)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              {/* Label */}
              <span style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                width: '110px',
                flexShrink: 0,
              }}>
                {label}
              </span>

              {/* Count */}
              <span style={{
                fontSize: '12px',
                color: hasItems ? 'var(--text)' : 'var(--text-muted)',
                fontWeight: hasItems ? 500 : 400,
                flex: 1,
              }}>
                {isPhase3
                  ? <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>— {note}</span>
                  : hasItems
                  ? `${count} registered`
                  : '—'
                }
              </span>

              {/* Command */}
              {!isPhase3 && (
                <span style={{
                  fontSize: '10px',
                  color: hasItems ? 'var(--accent)' : 'rgba(64,192,208,0.4)',
                  letterSpacing: '0.04em',
                  opacity: hasItems ? 1 : 0.7,
                }}>
                  {actionCmd}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 20px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
          {summary.totalRegistered} object{summary.totalRegistered !== 1 ? 's' : ''} registered
          {'  ·  '}
          Phase 1: Registry
        </span>
        <button
          onClick={() => onCommand('/registry')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '9px', color: 'rgba(64,192,208,0.4)',
            letterSpacing: '0.08em', fontFamily: 'var(--mono)',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(64,192,208,0.4)')}
        >
          /registry
        </button>
      </div>
    </div>
  )
}
