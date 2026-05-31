'use client'

type Props = { command: string; userName?: string }

export default function CommandOutput({ command, userName }: Props) {
  switch (command) {

    /* ─────────────────────────── /start ────────────────────────────── */
    case '/start':
      return (
        <Block label="START HERE">
          <Body>
            ACCESS helps you understand and use AI systems, frameworks, tools, and
            blueprints to build in the digital world.
          </Body>
          <Body>Choose a path:</Body>
          <div style={{ marginTop: '12px' }}>
            {[
              ['1', 'Build an AI system',             '/build-ai-system'],
              ['2', 'Build a business',               '/build-business'],
              ['3', 'Build a content system',         '/build-content-system'],
              ['4', 'Understand the JD ecosystem',    '/jd-ecosystem'],
              ['5', 'Connect my AI system',           '/connect-ai'],
            ].map(([n, label, cmd]) => (
              <div key={n} style={{ display: 'flex', gap: '20px', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                <span style={{ color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: '12px', width: '16px', flexShrink: 0 }}>{n}</span>
                <span style={{ color: 'var(--text)', fontSize: '13px', flex: 1 }}>{label}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.08em' }}>{cmd}</span>
              </div>
            ))}
          </div>
          <Note>Type a number (1–5) or the command shown to begin.</Note>
        </Block>
      )

    /* ─────────────────────── /build-ai-system ───────────────────────── */
    case '/build-ai-system':
      return (
        <Block label="BUILD AN AI SYSTEM">
          <Body>An AI system is more than a chatbot. It usually needs:</Body>
          {[
            ['1', 'Purpose',    'What the system is built to do — be specific.'],
            ['2', 'Interface',  'How users interact: terminal, web app, voice, or API.'],
            ['3', 'Model',      'Claude, GPT-4o, Gemini, Ollama, or a combination.'],
            ['4', 'Memory',     'Documents, notes, a database, or a knowledge vault.'],
            ['5', 'Tools',      'Email, files, browser, code execution, calendar, APIs.'],
            ['6', 'Automation', 'Repeatable tasks the system can execute on its own.'],
            ['7', 'Access',     'Who can use it and what it can reach.'],
          ].map(([n, title, desc]) => (
            <div key={n} style={{ display: 'flex', gap: '16px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ color: 'var(--accent)', fontSize: '11px', width: '16px', flexShrink: 0, paddingTop: '2px' }}>{n}</span>
              <div>
                <div style={{ color: 'var(--text)', fontSize: '13px', marginBottom: '3px', fontWeight: 500 }}>{title}</div>
                <div style={{ color: 'var(--text-dim)', fontSize: '11px', lineHeight: '1.6' }}>{desc}</div>
              </div>
            </div>
          ))}
          <Body style={{ marginTop: '16px' }}>ACCESS helps you understand the stack before you build.</Body>
          <NextCommands cmds={['/tools', '/frameworks', '/connect-ai', '/view-stack']} />
        </Block>
      )

    /* ─────────────────────── /build-business ───────────────────────── */
    case '/build-business':
      return (
        <Block label="BUILD A BUSINESS">
          <Body>A business system needs these layers to function reliably:</Body>
          {[
            ['1', 'Offer',            'What you sell — specific, clear, and valuable.'],
            ['2', 'Audience',         'Who needs it — defined with real clarity.'],
            ['3', 'Content',          'How you communicate the offer and build trust.'],
            ['4', 'Sales process',    'How a stranger becomes a customer.'],
            ['5', 'Delivery system',  'How you fulfill what you promised.'],
            ['6', 'Automation',       'What runs without you being present.'],
            ['7', 'Knowledge layer',  'Data, decisions, and systems that improve over time.'],
          ].map(([n, title, desc]) => (
            <div key={n} style={{ display: 'flex', gap: '16px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ color: 'var(--accent)', fontSize: '11px', width: '16px', flexShrink: 0, paddingTop: '2px' }}>{n}</span>
              <div>
                <div style={{ color: 'var(--text)', fontSize: '13px', marginBottom: '3px', fontWeight: 500 }}>{title}</div>
                <div style={{ color: 'var(--text-dim)', fontSize: '11px', lineHeight: '1.6' }}>{desc}</div>
              </div>
            </div>
          ))}
          <Body style={{ marginTop: '16px' }}>ACCESS helps you see what systems and tools support each layer.</Body>
          <NextCommands cmds={['/blueprints', '/frameworks', '/tools']} />
        </Block>
      )

    /* ─────────────────────── /build-content-system ──────────────────── */
    case '/build-content-system':
      return (
        <Block label="BUILD A CONTENT SYSTEM">
          <Body>A content system turns ideas into repeatable, consistent output. Core layers:</Body>
          {[
            ['1', 'Message',           'The core thing you communicate — your perspective and voice.'],
            ['2', 'Content pillars',   'The 3–5 topics your content always lives inside.'],
            ['3', 'Script/workflow',   'How each piece of content gets created, consistently.'],
            ['4', 'Creation tools',    'Camera, script editor, design, AI assistance, editing.'],
            ['5', 'Publishing cadence','When and where content goes out — consistency matters.'],
            ['6', 'Analytics',         'What you measure to know what works.'],
            ['7', 'Repurposing system','How one piece becomes five across formats and platforms.'],
          ].map(([n, title, desc]) => (
            <div key={n} style={{ display: 'flex', gap: '16px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ color: 'var(--accent)', fontSize: '11px', width: '16px', flexShrink: 0, paddingTop: '2px' }}>{n}</span>
              <div>
                <div style={{ color: 'var(--text)', fontSize: '13px', marginBottom: '3px', fontWeight: 500 }}>{title}</div>
                <div style={{ color: 'var(--text-dim)', fontSize: '11px', lineHeight: '1.6' }}>{desc}</div>
              </div>
            </div>
          ))}
          <Body style={{ marginTop: '16px' }}>ACCESS helps you understand the blueprint before you execute.</Body>
          <NextCommands cmds={['/blueprints', '/tools']} />
        </Block>
      )

    /* ─────────────────────── /jd-ecosystem ─────────────────────────── */
    case '/jd-ecosystem':
      return (
        <Block label="JD ECOSYSTEM">
          <Body>
            JD Productions builds worlds, systems, and AI-powered infrastructure
            for founders, creators, and builders.
          </Body>
          <Body>Current worlds:</Body>
          {[
            ['JD AI System', 'The AI brand — intelligence infrastructure behind JYSON'],
            ['JYSON',        'Public AI intelligence portal — the visible face of the system'],
            ['ACCESS',       'Gateway and capability layer — how users enter the ecosystem'],
            ['LINC',         'Love Is The New Currency — value and culture layer'],
            ['Lil Dev',      'Character IP and franchise universe — building'],
          ].map(([name, desc]) => (
            <div key={name} style={{ display: 'flex', gap: '16px', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--text)', fontSize: '12px', width: '120px', flexShrink: 0, fontWeight: 500 }}>{name}</span>
              <span style={{ color: 'var(--text-dim)', fontSize: '11px', lineHeight: '1.6' }}>{desc}</span>
            </div>
          ))}
          <Body style={{ marginTop: '16px' }}>
            ACCESS is how users create presence and gain entry into the ecosystem.
          </Body>
          <NextCommands cmds={['/systems', '/worlds', '/access-id']} />
        </Block>
      )

    /* ─────────────────────── /systems ──────────────────────────────── */
    case '/systems':
      return (
        <Block label="AVAILABLE SYSTEMS">
          {[
            ['JD AI System', 'The AI brand and intelligence infrastructure — the company behind JYSON', 'Active'],
            ['JYSON',        'Public AI intelligence — powered by Claude, GPT-4o, and Gemini',           'Active'],
            ['ACCESS',       'Identity and capability gateway into the ecosystem',                       'Active'],
            ['LINC',         'Love Is The New Currency — value and culture layer',                       'Active'],
            ['Future Systems','Additional worlds and products in development',                           'Coming Soon'],
          ].map(([name, desc, status]) => (
            <div key={name} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text)', fontSize: '13px', fontWeight: 500 }}>{name}</span>
                <span style={{ color: status === 'Active' ? 'var(--success)' : 'var(--gold)', fontSize: '10px', letterSpacing: '0.12em' }}>{status}</span>
              </div>
              <div style={{ color: 'var(--text-dim)', fontSize: '11px', lineHeight: '1.6' }}>{desc}</div>
            </div>
          ))}
        </Block>
      )

    /* ─────────────────────── /blueprints ───────────────────────────── */
    case '/blueprints':
      return (
        <Block label="AVAILABLE BLUEPRINTS">
          <Body>Blueprints are operating architectures — structured plans for building real systems.</Body>
          {[
            ['AI Operating System',  'Build an intelligent, self-improving OS around your work and identity'],
            ['Content System',       'From idea to output — a consistent, scalable content engine'],
            ['Knowledge System',     'A structured second brain built on Obsidian or equivalent vaults'],
            ['Creator System',       'Brand, output, and monetization infrastructure for creators'],
            ['Business System',      'Operations, revenue, capital, and growth architecture'],
            ['Automation System',    'Eliminate manual work — automate everything repeatable'],
            ['Digital Presence',     'Establish your sovereign digital identity across the ecosystem'],
          ].map(([name, desc]) => (
            <div key={name} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ color: 'var(--text)', fontSize: '13px', fontWeight: 500, marginBottom: '3px' }}>{name}</div>
              <div style={{ color: 'var(--text-dim)', fontSize: '11px', lineHeight: '1.6' }}>{desc}</div>
            </div>
          ))}
          <Note>Blueprints will be accessible as access levels expand.</Note>
        </Block>
      )

    /* ─────────────────────── /frameworks ───────────────────────────── */
    case '/frameworks':
      return (
        <Block label="FRAMEWORKS">
          <Body>Frameworks are mental models and structured approaches for thinking and building.</Body>
          {[
            ['System Planning',         'Turn any problem or idea into a buildable, operating architecture'],
            ['Knowledge Architecture',  'Structure information for intelligence — not just storage'],
            ['AI Integration',          'Connect AI capabilities to real workflows and meaningful outputs'],
            ['Automation Design',       'Design systems that run without constant human input'],
            ['Digital Infrastructure',  'Build a sovereign digital presence across worlds and platforms'],
          ].map(([name, desc]) => (
            <div key={name} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ color: 'var(--text)', fontSize: '13px', fontWeight: 500, marginBottom: '3px' }}>{name}</div>
              <div style={{ color: 'var(--text-dim)', fontSize: '11px', lineHeight: '1.6' }}>{desc}</div>
            </div>
          ))}
        </Block>
      )

    /* ─────────────────────── /tools ────────────────────────────────── */
    case '/tools':
      return (
        <Block label="TOOLS IN THE ECOSYSTEM">
          <Body>These are the tools used to build, run, and operate the JD AI System.</Body>
          {[
            ['JYSON',       'JD AI System — the public intelligence interface. Reasons, builds, and dispatches work.'],
            ['Claude',      'Helps reason, write, code, plan, and execute complex work. Powers JYSON via Anthropic.'],
            ['GPT-4o',      'Fast general intelligence for broad tasks and structured output. Powers JYSON via OpenAI.'],
            ['Gemini',      'Research, real-time knowledge, and multimodal capability. Powers JYSON via Google.'],
            ['Ollama',      'Runs AI models locally — private inference without sending data to external servers.'],
            ['Obsidian',    'Knowledge vault — the structured second brain and memory layer for the system.'],
            ['GitHub',      'Version control — where code is stored, tracked, and deployed from.'],
            ['Next.js',     'The application framework. Powers ACCESS and other ecosystem web apps.'],
            ['Three.js',    'WebGL 3D rendering — the galaxy portal and world environments on jdwhite.world.'],
            ['Vercel',      'Global deployment — makes the ecosystem available everywhere, instantly.'],
            ['Clerk',       'Secure identity and access management. Powers the sign-in and user layer.'],
          ].map(([name, desc]) => (
            <div key={name} style={{ padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: '16px' }}>
              <span style={{ color: 'var(--text)', fontSize: '12px', width: '80px', flexShrink: 0, fontWeight: 500 }}>{name}</span>
              <span style={{ color: 'var(--text-dim)', fontSize: '11px', lineHeight: '1.65' }}>{desc}</span>
            </div>
          ))}
        </Block>
      )

    /* ─────────────────────── /connect-ai ───────────────────────────── */
    case '/connect-ai':
      return (
        <Block label="CONNECT AI SYSTEM">
          <Body>Future capability preview.</Body>
          <Body>
            The future vision: your AI system will have an identity. My AI system will have an identity.
            ACCESS becomes the layer where systems can verify, route, and communicate.
          </Body>
          <Body>Possible future connections:</Body>
          <div style={{ marginTop: '8px', marginBottom: '16px' }}>
            {['Claude API', 'OpenAI API', 'Gemini API', 'Ollama local endpoint', 'OpenJarvis endpoint', 'Custom AI OS endpoint'].map(c => (
              <div key={c} style={{ padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-dim)', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)', marginRight: '12px' }}>○</span>{c}
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 0', borderTop: '1px solid var(--border)', marginTop: '4px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '6px' }}>Current Status</div>
            <div style={{ color: 'var(--text-dim)', fontSize: '12px' }}>External AI system connection is not yet active.</div>
          </div>
          <Note>Reserve AI System Identity · Generate Future Access Key — coming in next phase.</Note>
        </Block>
      )

    /* ─────────────────────── /access-id ────────────────────────────── */
    case '/access-id': {
      const handle = userName
        ? `${userName.toLowerCase().replace(/\s+/g, '')}.access`
        : 'guest.access'
      const joined = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      return (
        <Block label="ACCESS ID">
          <Body>
            Your ACCESS ID is your identity inside the JD AI System ecosystem.
            This handle represents your account, your AI system, and your presence across the network.
          </Body>
          {[
            ['Handle',     handle,          'var(--accent)'],
            ['Ecosystem',  'JD AI System',  'var(--text)'],
            ['Status',     'Active',        'var(--success)'],
            ['Joined',     joined,          'var(--text-dim)'],
            ['AI System',  'Not connected', 'var(--text-muted)'],
          ].map(([k, v, color]) => (
            <div key={k} style={{ display: 'flex', gap: '24px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.14em', width: '80px', flexShrink: 0, textTransform: 'uppercase' }}>{k}</span>
              <span style={{ color, fontSize: '13px' }}>{v}</span>
            </div>
          ))}
          <Note>JYSON is to JD AI System what Claude is to Anthropic. Your ACCESS ID connects you to that ecosystem.</Note>
          <NextCommands cmds={['/connect-ai']} />
        </Block>
      )
    }

    /* ─────────────────────── /worlds ───────────────────────────────── */
    case '/worlds':
      return (
        <Block label="CONNECTED WORLDS">
          {[
            ['jdwhite.world',               'JD White',       'Identity and portal layer — the system entry point', 'Live'],
            ['jdproductions.io',            'JD Productions', 'Production and media engine',                       'Live'],
            ['jyson.vercel.app',            'JYSON',          'Public AI intelligence portal',                     'Live'],
            ['loveisthenewcurrency.world',  'LINC',           'Value and cultural movement',                       'Live'],
            ['lildev.world',                'Lil Dev',        'Character IP and franchise universe',               'Building'],
          ].map(([domain, name, desc, status]) => (
            <div key={name} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', alignItems: 'center' }}>
                <span style={{ color: 'var(--text)', fontSize: '13px', fontWeight: 500 }}>{name}</span>
                <span style={{ color: status === 'Live' ? 'var(--success)' : 'var(--gold)', fontSize: '10px', letterSpacing: '0.1em' }}>{status}</span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.05em', marginBottom: '3px' }}>{domain}</div>
              <div style={{ color: 'var(--text-dim)', fontSize: '11px' }}>{desc}</div>
            </div>
          ))}
        </Block>
      )

    /* ─────────────────────── /view-stack ───────────────────────────── */
    case '/view-stack':
      return (
        <Block label="CURRENT ECOSYSTEM STACK">
          {[
            ['AI Brand',   ['JD AI System', 'JYSON (public interface)']],
            ['AI Models',  ['Claude (Anthropic)', 'GPT-4o (OpenAI)', 'Gemini (Google)', 'Ollama (local)']],
            ['Frontend',   ['Next.js', 'React', 'Three.js', 'Tailwind CSS']],
            ['Identity',   ['Clerk', 'ACCESS']],
            ['Knowledge',  ['Obsidian vault', 'NotebookLM']],
            ['Infra',      ['Vercel', 'GitHub', 'Squarespace DNS']],
            ['Future',     ['ACCESS protocol', 'AI-to-AI network', 'World builder']],
          ].map(([layer, items]) => (
            <div key={layer as string} style={{ display: 'flex', gap: '24px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', width: '80px', flexShrink: 0, paddingTop: '2px' }}>{layer}</span>
              <span style={{ color: 'var(--text-dim)', fontSize: '12px', lineHeight: '1.7' }}>{(items as string[]).join('  ·  ')}</span>
            </div>
          ))}
        </Block>
      )

    /* ─────────────────────── /help ─────────────────────────────────── */
    case '/help':
      return (
        <Block label="AVAILABLE COMMANDS">
          {[
            ['/start',               'Choose your path — where do you want to begin?'],
            ['/build-ai-system',     'Step-by-step guide to building an AI system'],
            ['/build-business',      'Step-by-step guide to building a business system'],
            ['/build-content-system','Step-by-step guide to building a content system'],
            ['/jd-ecosystem',        'Overview of the JD AI System ecosystem and worlds'],
            ['/systems',             'View all systems in the ecosystem'],
            ['/blueprints',          'View available operation blueprints'],
            ['/frameworks',          'View thinking and planning frameworks'],
            ['/tools',               'View tools — what each one does in plain language'],
            ['/connect-ai',          'Future: connect your own AI system'],
            ['/access-id',           'View your ACCESS ID and ecosystem identity'],
            ['/worlds',              'View all worlds, domains, and their status'],
            ['/view-stack',          'View the current technology stack'],
            ['/help',                'Show this reference'],
            ['/logout',              'End session'],
          ].map(([cmd, desc]) => (
            <div key={cmd} style={{ display: 'flex', gap: '24px', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--accent)', fontSize: '11px', width: '180px', flexShrink: 0 }}>{cmd}</span>
              <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>{desc}</span>
            </div>
          ))}
          <Note>Tip: after /start, type 1–5 to jump directly to a path.</Note>
        </Block>
      )

    default:
      return null
  }
}

/* ─── Shared layout components ──────────────────────────── */

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: '2px' }}>
      <div style={{
        fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase',
        color: 'var(--accent)', marginBottom: '14px', fontFamily: 'var(--mono)',
      }}>
        {label}
      </div>
      <div style={{ paddingLeft: '2px' }}>{children}</div>
    </div>
  )
}

function Body({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p style={{
      fontSize: '12px', lineHeight: '1.75', color: 'var(--text-dim)',
      maxWidth: '60ch', marginBottom: '12px', fontFamily: 'var(--mono)',
      ...style,
    }}>
      {children}
    </p>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: '10px', lineHeight: '1.7', color: 'var(--text-muted)',
      marginTop: '14px', fontFamily: 'var(--mono)',
    }}>
      {children}
    </p>
  )
}

function NextCommands({ cmds }: { cmds: string[] }) {
  return (
    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', marginRight: '12px' }}>Next</span>
      {cmds.map(c => (
        <span key={c} style={{ color: 'var(--accent)', fontSize: '11px', marginRight: '16px' }}>{c}</span>
      ))}
    </div>
  )
}
