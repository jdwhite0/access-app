'use client'

type Props = {
  username: string
  connectedSystems?: number
}

export default function AccessIdCard({ username, connectedSystems = 0 }: Props) {
  const accessId = `${username.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')}.access`

  return (
    <div style={{
      border: '1px solid rgba(64,192,208,0.2)',
      borderRadius: '2px',
      padding: '20px 24px',
      background: 'rgba(64,192,208,0.025)',
      maxWidth: '420px',
    }}>
      {/* Header */}
      <div style={{ fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
        ACCESS ID
      </div>

      {/* ID */}
      <div style={{ fontSize: '22px', letterSpacing: '0.08em', color: 'var(--accent)', fontFamily: 'var(--mono)', marginBottom: '20px', fontWeight: 300 }}>
        {accessId}
      </div>

      {/* Status rows */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
        {[
          ['Presence',      'Active',       'var(--success)'],
          ['Identity',      'Verified',     'var(--success)'],
          ['Access Level',  'Builder',      'var(--text)'],
          ['AI Systems',    `${connectedSystems} connected`, connectedSystems > 0 ? 'var(--accent)' : 'var(--text-muted)'],
        ].map(([k, v, color]) => (
          <div key={k} style={{ display: 'contents' }}>
            <span style={{ fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{k}</span>
            <span style={{ fontSize: '11px', color }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Description */}
      <p style={{
        fontSize: '10px', lineHeight: '1.7', color: 'var(--text-muted)',
        marginTop: '18px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '14px',
        fontFamily: 'var(--mono)',
      }}>
        Your ACCESS ID is your digital presence inside the ACCESS ecosystem.
        In the future, this ID may represent your account, systems, AI agents, and network identity.
      </p>
    </div>
  )
}
