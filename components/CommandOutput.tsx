'use client'

type Props = { command: string; userName?: string }

const DIVIDER = '─'.repeat(52)
void DIVIDER

export default function CommandOutput({ command, userName }: Props) {
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
                ['/start',       'Choose your path — what do you want to build?'],
                ['/build',       'Guided build menu — AI system, business, content, and more'],
                ['/systems',     'View all systems in the ecosystem'],
                ['/blueprints',  'View available operation blueprints'],
                ['/frameworks',  'View thinking and planning frameworks'],
                ['/tools',       'View tools used across the ecosystem'],
                ['/access-id',   'View your ACCESS ID and future AI identity'],
                ['/connect-ai',  'Explore AI system connection capability'],
                ['/worlds',      'View all ecosystem worlds and domains'],
                ['/view-stack',  'View the current technology stack'],
                ['/future',      'View planned future capabilities'],
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

    case '/start':
      return (
        <Block label="START HERE">
          <Prose>
            ACCESS helps you explore the systems, tools, frameworks, and blueprints
            used to build AI-powered digital infrastructure. Choose a path:
          </Prose>
          {[
            ['1', 'Build an AI system',                  '/build ai-system'],
            ['2', 'Build a business',                    '/build business'],
            ['3', 'Build a content system',              '/build content'],
            ['4', 'Understand the JD ecosystem',         '/systems'],
            ['5', 'Connect my AI system',                '/connect-ai'],
          ].map(([n, label, cmd]) => (
            <div key={n} style={{ display: 'flex', gap: '16px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: '11px', width: '16px', flexShrink: 0 }}>{n}</span>
              <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>{label}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '10px', marginLeft: 'auto' }}>{cmd}</span>
            </div>
          ))}
          <Note>Type a number or the command shown to begin.</Note>
        </Block>
      )

    case '/build':
      return (
        <Block label="WHAT DO YOU WANT TO BUILD?">
          {[
            ['AI SYSTEM',       'Build a personal AI operating system around your work and identity.',  '/build ai-system'],
            ['BUSINESS',        'Operations, revenue, capital, and growth architecture.',               '/build business'],
            ['CONTENT SYSTEM',  'From idea to output — consistent, scalable content engine.',           '/build content'],
            ['AUTOMATION',      'Remove repeatable manual work. Let systems run themselves.',           '/build automation'],
            ['BRAND',           'Visual identity, voice, positioning, and market presence.',            '/build brand'],
            ['DIGITAL PRESENCE','Establish your sovereign digital presence across the ecosystem.',      '/build presence'],
          ].map(([name, desc, cmd]) => (
            <div key={name} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text)', fontSize: '11px', letterSpacing: '0.1em', fontFamily: 'var(--mono)' }}>{name}</span>
                <span style={{ color: 'var(--accent)', fontSize: '9px', letterSpacing: '0.12em', fontFamily: 'var(--mono)' }}>{cmd}</span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </Block>
      )

    case '/build ai-system':
      return (
        <Block label="BUILD: AI SYSTEM">
          <Prose>An AI operating system is built in 7 layers. Each layer is a decision.</Prose>
          {[
            ['1', 'Define purpose',      'What does your system help you do?'],
            ['2', 'Choose interface',    'Terminal, web app, or voice?'],
            ['3', 'Choose model',        'Claude, GPT-4o, Gemini, or local (Ollama)?'],
            ['4', 'Create memory layer', 'Obsidian, Notion, or structured database?'],
            ['5', 'Connect tools',       'Email, calendar, files, browser automation?'],
            ['6', 'Add automation',      'Make, Zapier, or custom scripts?'],
            ['7', 'Deploy',              'Vercel, local server, or both?'],
          ].map(([n, step, desc]) => (
            <div key={n} style={{ display: 'flex', gap: '12px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ color: 'var(--accent)', fontSize: '10px', width: '14px', flexShrink: 0, paddingTop: '2px' }}>{n}</span>
              <div>
                <div style={{ color: 'var(--text)', fontSize: '12px', marginBottom: '2px' }}>{step}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{desc}</div>
              </div>
            </div>
          ))}
          <Note>Type /blueprints to see the full AI Operating System blueprint.</Note>
        </Block>
      )

    case '/access-id': {
      const handle = userName
        ? `${userName.toLowerCase().replace(/\s+/g, '.')}.access`
        : 'guest.access'
      const joined = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      return (
        <Block label="ACCESS ID">
          <Prose>
            Your ACCESS ID is your future digital presence inside the ecosystem.
            One day, this ID will represent your AI system across the network.
          </Prose>
          {[
            ['Handle',  handle],
            ['Status',  'Active'],
            ['Joined',  joined],
            ['AI Slot', 'Not connected — type /connect-ai'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: '24px', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.14em', width: '72px', flexShrink: 0, textTransform: 'uppercase' }}>{k}</span>
              <span style={{ color: k === 'Handle' ? 'var(--accent)' : 'var(--text-dim)', fontSize: '12px' }}>{v}</span>
            </div>
          ))}
          <Note>Future: this ID will identify your account, systems, and AI presence across the network.</Note>
        </Block>
      )
    }

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
