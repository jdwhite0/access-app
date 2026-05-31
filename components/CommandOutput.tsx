'use client'

type Props = { command: string }

const DIVIDER = '─'.repeat(52)

export default function CommandOutput({ command }: Props) {
  switch (command) {

    case '/systems':
      return (
        <Block label="AVAILABLE SYSTEMS">
          <table className="cmd-table">
            <thead>
              <tr><th>System</th><th>Description</th><th>Status</th></tr>
            </thead>
            <tbody>
              {[
                ['JD Productions',    'Creative + media production engine',        'Active'],
                ['LINC',             'Value system — Love Is The New Currency',   'Active'],
                ['ACCESS',           'Operating layer — identity + capability',   'Active'],
                ['Future Systems',   'Additional worlds and operating layers',    'Coming Soon'],
              ].map(([s, d, st]) => (
                <tr key={s}>
                  <td>{s}</td>
                  <td>{d}</td>
                  <td style={{ color: st === 'Active' ? 'var(--success)' : 'var(--text-muted)' }}>{st}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Block>
      )

    case '/blueprints':
      return (
        <Block label="AVAILABLE BLUEPRINTS">
          <table className="cmd-table">
            <thead><tr><th>Blueprint</th><th>Description</th></tr></thead>
            <tbody>
              {[
                ['AI Operating System',  'Build an intelligent, self-improving OS around your work'],
                ['Content System',       'From idea to output — consistent, scalable content engine'],
                ['Knowledge System',     'Obsidian-based second brain architecture'],
                ['Creator System',       'Brand + output + monetization infrastructure'],
                ['Business System',      'Operations, revenue, capital, and growth architecture'],
                ['Automation System',    'Eliminate manual work — automate the repeatable'],
              ].map(([b, d]) => (
                <tr key={b}><td>{b}</td><td>{d}</td></tr>
              ))}
            </tbody>
          </table>
          <Note>Blueprints will be available as access levels expand.</Note>
        </Block>
      )

    case '/frameworks':
      return (
        <Block label="AVAILABLE FRAMEWORKS">
          <table className="cmd-table">
            <thead><tr><th>Framework</th><th>Purpose</th></tr></thead>
            <tbody>
              {[
                ['System Planning',         'Map any problem into a buildable operating architecture'],
                ['Knowledge Architecture',  'Structure information for intelligence, not just storage'],
                ['AI Integration',          'Connect AI capabilities to real workflows and outputs'],
                ['Automation Design',       'Design systems that run without constant human input'],
                ['Digital Infrastructure',  'Build a sovereign digital presence across ecosystems'],
              ].map(([f, p]) => (
                <tr key={f}><td>{f}</td><td>{p}</td></tr>
              ))}
            </tbody>
          </table>
        </Block>
      )

    case '/tools':
      return (
        <Block label="TOOLS USED IN THE ECOSYSTEM">
          <table className="cmd-table">
            <thead><tr><th>Tool</th><th>Role</th></tr></thead>
            <tbody>
              {[
                ['Claude',      'Primary AI reasoning and execution layer'],
                ['JYSON',       'Multi-model intelligence routing system'],
                ['Ollama',      'Local AI model runtime'],
                ['Obsidian',    'Knowledge base and second brain'],
                ['GitHub',      'Version control and deployment pipeline'],
                ['Next.js',     'Application framework'],
                ['Three.js',    'WebGL 3D — portal and world rendering'],
                ['Vercel',      'Global deployment infrastructure'],
                ['Clerk',       'Identity and access management'],
              ].map(([t, r]) => (
                <tr key={t}><td>{t}</td><td>{r}</td></tr>
              ))}
            </tbody>
          </table>
        </Block>
      )

    case '/future':
      return (
        <Block label="FUTURE CAPABILITIES">
          <Prose>
            The ecosystem is at Phase 1. What exists today is infrastructure.
            What is being built is a living operating environment.
          </Prose>
          <table className="cmd-table mt-4">
            <thead><tr><th>Capability</th><th>Status</th></tr></thead>
            <tbody>
              {[
                ['AI System Connection',         'Planned'],
                ['Blueprint Access',             'Planned'],
                ['Custom Framework Builder',     'Planned'],
                ['Ecosystem API',                'Planned'],
                ['World Builder Access',         'Planned'],
                ['Intelligence Routing Layer',   'Planned'],
                ['Multi-world Identity Layer',   'Planned'],
              ].map(([c, s]) => (
                <tr key={c}>
                  <td>{c}</td>
                  <td style={{ color: 'var(--gold)' }}>{s}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Block>
      )

    case '/worlds':
      return (
        <Block label="ECOSYSTEM WORLDS">
          <table className="cmd-table">
            <thead><tr><th>World</th><th>Domain</th><th>Identity</th><th>Status</th></tr></thead>
            <tbody>
              {[
                ['JD White',      'jdwhite.world',                  'Identity / Portal Layer',   'Live'],
                ['JD Productions','jdproductions.io',               'Production / Media Engine', 'Live'],
                ['LINC',          'loveisthenewcurrency.world',     'Value / Cultural Movement', 'Live'],
                ['Lil Dev',       'lildev.world',                   'Character / IP Universe',   'Building'],
                ['ACCESS',        'access.jdproductions.io',        'Operating Layer',           'Live'],
              ].map(([w, d, id, st]) => (
                <tr key={w}>
                  <td>{w}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{d}</td>
                  <td>{id}</td>
                  <td style={{ color: st === 'Live' ? 'var(--success)' : 'var(--gold)' }}>{st}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Block>
      )

    case '/connect-ai':
      return (
        <Block label="AI SYSTEM CONNECTION">
          <Prose>
            Future capability. One day you will be able to connect your own AI systems
            to the JD ecosystem — routing requests, sharing context, and building on
            the same intelligence infrastructure.
          </Prose>
          <table className="cmd-table mt-4">
            <thead><tr><th>System</th><th>Status</th></tr></thead>
            <tbody>
              {[
                ['Claude',                   'Ecosystem native'],
                ['JYSON (multi-model)',       'Ecosystem native'],
                ['Ollama (local)',            'Ecosystem native'],
                ['Custom AI OS',             'Future connection'],
                ['External AI platforms',    'Future connection'],
              ].map(([s, st]) => (
                <tr key={s}>
                  <td>{s}</td>
                  <td style={{ color: st === 'Ecosystem native' ? 'var(--success)' : 'var(--text-muted)' }}>{st}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Note>Current status: ecosystem AI is internal. External connections are not yet available.</Note>
        </Block>
      )

    case '/view-stack':
      return (
        <Block label="CURRENT ECOSYSTEM STACK">
          {[
            { layer: 'Frontend', items: ['Next.js', 'React', 'Three.js', 'Tailwind CSS'] },
            { layer: 'Identity',  items: ['Clerk'] },
            { layer: 'Knowledge', items: ['Obsidian', 'JYSON'] },
            { layer: 'AI',        items: ['Claude', 'Ollama', 'JYSON (router)'] },
            { layer: 'Infra',     items: ['Vercel', 'GitHub', 'Squarespace DNS'] },
            { layer: 'Future',    items: ['Ecosystem API', 'AI routing layer', 'World builder'] },
          ].map(({ layer, items }) => (
            <div key={layer} className="flex gap-6 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="w-28 shrink-0 text-[10px] tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>{layer}</div>
              <div className="text-xs" style={{ color: 'var(--text-dim)' }}>{items.join('  ·  ')}</div>
            </div>
          ))}
        </Block>
      )

    case '/help':
      return (
        <Block label="AVAILABLE COMMANDS">
          <table className="cmd-table">
            <thead><tr><th>Command</th><th>Description</th></tr></thead>
            <tbody>
              {[
                ['/systems',     'View all systems in the ecosystem'],
                ['/blueprints',  'View available operation blueprints'],
                ['/frameworks',  'View thinking and planning frameworks'],
                ['/tools',       'View tools used across the ecosystem'],
                ['/future',      'View planned future capabilities'],
                ['/worlds',      'View all ecosystem worlds and domains'],
                ['/connect-ai',  'Explore AI system connection capability'],
                ['/view-stack',  'View the current technology stack'],
                ['/help',        'Show this help reference'],
                ['/logout',      'End session and exit'],
              ].map(([c, d]) => (
                <tr key={c}>
                  <td style={{ color: 'var(--accent)' }}>{c}</td>
                  <td>{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Block>
      )

    default:
      return null
  }
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-1">
      <div className="text-[10px] tracking-[0.22em] uppercase mb-3" style={{ color: 'var(--accent)' }}>
        {label}
      </div>
      <div style={{ paddingLeft: '2px' }}>{children}</div>
    </div>
  )
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs leading-6 mb-3" style={{ color: 'var(--text-dim)', maxWidth: '56ch' }}>
      {children}
    </p>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] leading-5 mt-3" style={{ color: 'var(--text-muted)' }}>
      {children}
    </p>
  )
}
