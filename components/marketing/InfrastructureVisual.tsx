'use client'

/**
 * Hero right-side visual — ACCESS OS product chrome.
 * Dark interface floating on white page, signals "operating system infrastructure."
 * Stripe pattern: real product UI on the right of an asymmetric hero.
 */
export default function InfrastructureVisual() {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: 560,
      marginLeft: 'auto',
    }}>
      {/* Subtle ambient glow behind the chrome */}
      <div style={{
        position: 'absolute',
        inset: '-40px',
        background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(64,192,208,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Main product chrome */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        background: '#0B0E14',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 32px 80px rgba(10,37,64,0.28), 0 4px 16px rgba(0,0,0,0.18)',
        overflow: 'hidden',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      }}>
        {/* Window chrome bar */}
        <div style={{
          height: 36,
          background: '#0F1318',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          gap: 12,
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F56', opacity: 0.8 }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E', opacity: 0.8 }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27C93F', opacity: 0.8 }} />
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 4,
              padding: '2px 16px',
              fontSize: 11,
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.04em',
            }}>
              ACCESS · Dashboard
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em' }}>jdwhite.access</span>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, #40C0D0, #7C6CF8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 700 }}>J</div>
          </div>
        </div>

        {/* App layout */}
        <div style={{ display: 'flex', height: 420 }}>
          {/* Left rail */}
          <div style={{
            width: 48,
            background: '#0D1017',
            borderRight: '1px solid rgba(255,255,255,0.04)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 12,
            gap: 4,
          }}>
            {['◈', '⬧', '⬡', '◉', '▣', '◎'].map((icon, i) => (
              <div key={i} style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                color: i === 0 ? '#40C0D0' : 'rgba(255,255,255,0.2)',
                background: i === 0 ? 'rgba(64,192,208,0.1)' : 'transparent',
              }}>
                {icon}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
            {/* Header */}
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 2px' }}>Dashboard</p>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#F0F0F0', margin: 0, letterSpacing: '-0.01em' }}>Good evening, Jerry.</p>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
              {[
                { label: 'Projects', value: '12', color: '#40C0D0', delta: '+2' },
                { label: 'Registry', value: '47', color: '#7C6CF8', delta: '+5' },
                { label: 'Plan', value: 'Builder', color: '#C9A46A', delta: null },
              ].map((s) => (
                <div key={s.label} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 7,
                  padding: '10px 12px',
                }}>
                  <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 4px' }}>{s.label}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</span>
                    {s.delta && <span style={{ fontSize: 9, color: 'rgba(74,189,160,0.8)' }}>{s.delta}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* JYSON command bar */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(64,192,208,0.15)',
              borderRadius: 7,
              padding: '9px 12px',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span style={{ fontSize: 11, color: '#40C0D0', fontWeight: 600, flexShrink: 0 }}>JYSON</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>Ask anything about your systems…</span>
              <div style={{ marginLeft: 'auto', width: 5, height: 14, background: '#40C0D0', opacity: 0.7, animation: 'none' }} />
            </div>

            {/* Activity feed */}
            <div>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>Recent</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { type: 'Registry write', detail: 'Bridge Video V1 planted', time: '4m ago', color: '#7C6CF8' },
                  { type: 'JYSON session', detail: 'Revenue strategy reviewed', time: '1h ago', color: '#40C0D0' },
                  { type: 'Workflow run', detail: 'Daily brief generated', time: '8h ago', color: '#4ABDA0' },
                  { type: 'Project update', detail: 'ACCESS — deploy complete', time: '12h ago', color: '#C9A46A' },
                ].map((row, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '7px 10px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 5,
                    border: '1px solid rgba(255,255,255,0.03)',
                  }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: row.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 10, color: 'rgba(240,240,240,0.6)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ color: 'rgba(240,240,240,0.4)' }}>{row.type}</span> · {row.detail}
                      </span>
                    </div>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>{row.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating secondary panel — registry nodes */}
      <div style={{
        position: 'absolute',
        bottom: -28,
        right: -28,
        width: 180,
        background: '#0F1318',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        padding: '12px 14px',
        boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
        zIndex: 2,
      }}>
        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px', fontFamily: 'var(--mono)' }}>Registry</p>
        {[
          { label: 'Systems', count: 8, color: '#40C0D0' },
          { label: 'Workflows', count: 5, color: '#7C6CF8' },
          { label: 'Assets', count: 31, color: '#4ABDA0' },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: item.color }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--mono)' }}>{item.label}</span>
            </div>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--mono)', fontWeight: 600 }}>{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
