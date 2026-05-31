'use client'

type Props = { command: string; userName?: string }

export default function CommandOutput({ command, userName }: Props) {
  switch (command) {

    /* ─────────────────────────── /start ────────────────────────────── */
    case '/start':
      return (
        <Block label="START HERE">
          <Body>
            ACCESS helps you build AI systems, businesses, content systems, and
            knowledge infrastructure. Choose a path to begin.
          </Body>
          <div style={{ marginTop: '12px' }}>
            {[
              ['1', 'My first AI system',           '/build-ai-system'],
              ['2', 'My business system',            '/build-business'],
              ['3', 'My content system',             '/build-content-system'],
              ['4', 'My personal knowledge system',  '/build-knowledge-system'],
              ['5', 'I just want to explore',        '/explore'],
            ].map(([n, label, cmd]) => (
              <div key={n} style={{ display: 'flex', gap: '20px', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                <span style={{ color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: '12px', width: '16px', flexShrink: 0 }}>{n}</span>
                <span style={{ color: 'var(--text)', fontSize: '13px', flex: 1 }}>{label}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.08em' }}>{cmd}</span>
              </div>
            ))}
          </div>
          <Note>Type a number (1–5) or the command shown. ACCESS will ask a few questions and generate a starter blueprint.</Note>
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

    /* ─────────────────────── /presence ─────────────────────────────── */
    case '/presence': {
      const handle = userName
        ? `${userName.toLowerCase().replace(/\s+/g, '')}.access`
        : 'guest.access'
      return (
        <Block label="PRESENCE STATUS">
          <Body>
            Your presence is your identity inside the JD AI System ecosystem.
            This is not a profile. This is your position inside the network.
          </Body>

          {/* Status grid */}
          {[
            ['Identity',       'Verified',                       'var(--success)'],
            ['Presence',       'Active',                         'var(--success)'],
            ['ACCESS ID',      handle,                           'var(--accent)'],
            ['Access Level',   'Builder',                        'var(--text)'],
            ['Network Status', 'Local — not yet connected',      'var(--gold)'],
          ].map(([k, v, color]) => (
            <div key={k} style={{ display: 'flex', gap: '24px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', width: '120px', flexShrink: 0 }}>{k}</span>
              <span style={{ color, fontSize: '12px' }}>{v}</span>
            </div>
          ))}

          {/* Capabilities unlocked */}
          <div style={{ marginTop: '20px', marginBottom: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '10px' }}>Capabilities Unlocked</div>
            {['Explore Systems', 'Explore Blueprints', 'Build AI Systems', 'Create Digital Presence', 'Access Frameworks and Tools'].map(c => (
              <div key={c} style={{ padding: '6px 0', color: 'var(--text-dim)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--success)', fontSize: '10px' }}>✓</span>{c}
              </div>
            ))}
          </div>

          {/* Future capabilities */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '10px' }}>Future Capabilities</div>
            {['Register AI Systems', 'Connect AI Systems', 'Network Routing', 'Shared Intelligence', 'AI-to-AI Communication'].map(c => (
              <div key={c} style={{ padding: '6px 0', color: 'var(--text-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>○</span>{c}
              </div>
            ))}
          </div>
          <NextCommands cmds={['/pathways', '/access-id', '/network']} />
        </Block>
      )
    }

    /* ─────────────────────── /pathways ─────────────────────────────── */
    case '/pathways':
      return (
        <Block label="BUILDER PATH">
          <Body>
            ACCESS is not a destination. It is a progression.
            Every person who enters goes through these stages — at their own pace.
          </Body>
          {[
            ['1', 'Explore',  'Understand the ecosystem, tools, systems, and blueprints.',        'Current'],
            ['2', 'Learn',    'Study the frameworks. Understand how AI systems are built.',       'Next'],
            ['3', 'Build',    'Create your first AI system, content system, or business system.', 'Upcoming'],
            ['4', 'Connect',  'Register your system. Establish your AI identity.',               'Future'],
            ['5', 'Deploy',   'Make your system live. Operate it inside the ecosystem.',          'Future'],
            ['6', 'Network',  'Your system connects with others. Intelligence flows.',            'Future'],
          ].map(([stage, name, desc, status]) => (
            <div key={stage} style={{ display: 'flex', gap: '16px', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, width: '60px' }}>
                <div style={{ color: status === 'Current' ? 'var(--accent)' : 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.1em', marginBottom: '2px' }}>Stage {stage}</div>
                <div style={{
                  color: status === 'Current' ? 'var(--success)' : status === 'Next' ? 'var(--gold)' : 'var(--text-muted)',
                  fontSize: '9px', letterSpacing: '0.08em',
                }}>{status}</div>
              </div>
              <div>
                <div style={{ color: status === 'Current' ? 'var(--text)' : 'var(--text-dim)', fontSize: '13px', fontWeight: 500, marginBottom: '3px' }}>{name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', lineHeight: '1.6' }}>{desc}</div>
              </div>
            </div>
          ))}
          <Note>You are at Stage 1: Explore. Type /start to choose a direction.</Note>
          <NextCommands cmds={['/start', '/presence', '/build-ai-system']} />
        </Block>
      )

    /* ─────────────────────── /systems-registry ─────────────────────── */
    case '/systems-registry':
      return (
        <Block label="SYSTEM REGISTRY">
          <Body>
            In the future, every AI system in the ecosystem will have a registered identity.
            This is what a registered system looks like.
          </Body>

          {/* Example: JYSON */}
          <div style={{ background: 'rgba(64,192,208,0.04)', border: '1px solid rgba(64,192,208,0.12)', borderRadius: '2px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div style={{ color: 'var(--text)', fontSize: '14px', fontWeight: 600, letterSpacing: '0.1em', marginBottom: '3px' }}>JYSON</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.08em' }}>JD AI System — Public Intelligence</div>
              </div>
              <span style={{ color: 'var(--success)', fontSize: '9px', letterSpacing: '0.14em', border: '1px solid rgba(75,189,160,0.3)', padding: '3px 8px', borderRadius: '2px' }}>ACTIVE</span>
            </div>
            {[
              ['Purpose',     'Public intelligence portal — educates, guides, and demonstrates AI system building'],
              ['Capabilities','Reasoning  ·  Planning  ·  Research  ·  Creation  ·  Dispatch'],
              ['Models',      'Claude  ·  GPT-4o  ·  Gemini  (automatic routing)'],
              ['Owned by',    'JD White  ·  JD Productions'],
              ['Connection',  'Internal only — external connection coming'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: '16px', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', width: '90px', flexShrink: 0 }}>{k}</span>
                <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>{v}</span>
              </div>
            ))}
          </div>

          <Body>
            When ACCESS opens system registration, you will be able to register your own
            AI system — giving it an identity, capabilities, and a connection slot in the network.
          </Body>
          <Note>This is an educational preview. System registration is not yet active.</Note>
          <NextCommands cmds={['/connect-ai', '/network', '/build-ai-system']} />
        </Block>
      )

    /* ─────────────────────── /network ──────────────────────────────── */
    case '/network':
      return (
        <Block label="FUTURE NETWORK">
          <Body>
            ACCESS will eventually allow AI systems to identify, discover, verify,
            and communicate with one another — forming an intelligence network
            for founders, creators, and builders.
          </Body>

          <div style={{ margin: '16px 0' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>Example Connections</div>
            {[
              ['JYSON  ↔  Business AI',     'Dispatch intelligence routes work to a specialized business system'],
              ['Creator AI  ↔  Content AI', 'One AI hands content context to a specialized publishing system'],
              ['Research AI  ↔  Knowledge AI', 'Findings are automatically routed to a knowledge vault system'],
              ['Builder AI  ↔  Project AI', 'Build requests trigger coordinated project management responses'],
            ].map(([pair, desc]) => (
              <div key={pair} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ color: 'var(--accent)', fontSize: '12px', marginBottom: '4px', letterSpacing: '0.04em' }}>{pair}</div>
                <div style={{ color: 'var(--text-dim)', fontSize: '11px', lineHeight: '1.6' }}>{desc}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '2px', marginTop: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '6px' }}>Preview Only</div>
            <div style={{ color: 'var(--text-dim)', fontSize: '11px', lineHeight: '1.7' }}>
              This network does not yet exist. ACCESS is building toward it.
              Your ACCESS ID is your future node in this network.
            </div>
          </div>
          <NextCommands cmds={['/capabilities', '/systems-registry', '/access-id']} />
        </Block>
      )

    /* ─────────────────────── /capabilities ─────────────────────────── */
    case '/capabilities':
      return (
        <Block label="WHAT BECOMES POSSIBLE">
          <Body>
            When your AI system is registered and connected inside the ACCESS network,
            here is what becomes possible:
          </Body>
          {[
            ['Route work',               'Give your system a task. It routes the work to the right intelligence layer and returns an output.'],
            ['Share information',        'Your system shares structured knowledge with other registered systems — securely, with permission.'],
            ['Trigger automations',      'An event in one system triggers an action in another — without a human in the loop.'],
            ['Exchange structured data', 'Systems pass structured outputs — not just messages — enabling real collaboration between AI.'],
            ['Coordinate tasks',         'Multiple systems can work on parts of the same task and merge results.'],
            ['Access specialized intelligence', 'Route specific domains to systems built for them: research, content, code, finance, legal.'],
            ['Build without limits',     'Once systems can communicate, the ceiling for what you can build becomes defined by vision, not tools.'],
          ].map(([title, desc]) => (
            <div key={title} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ color: 'var(--text)', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>{title}</div>
              <div style={{ color: 'var(--text-dim)', fontSize: '11px', lineHeight: '1.65' }}>{desc}</div>
            </div>
          ))}
          <Note>None of this requires a team. It requires the right infrastructure. ACCESS is that infrastructure.</Note>
          <NextCommands cmds={['/network', '/systems-registry', '/connect-ai']} />
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
          <Body>Blueprints are operating architectures — structured plans for building real systems. Each includes purpose, tools, stack, and next steps.</Body>

          {[
            {
              name:    'AI Operating System',
              purpose: 'Build an intelligent, self-improving system around your work and identity.',
              benefit: 'Offload thinking, execution, and memory to a system that runs 24/7.',
              tools:   'Claude  ·  GPT-4o  ·  Obsidian  ·  Ollama  ·  GitHub',
              stack:   'Next.js  ·  Clerk  ·  Vercel  ·  Anthropic API',
              next:    '/build-ai-system  /tools  /frameworks',
            },
            {
              name:    'Content System',
              purpose: 'Turn ideas into consistent, scalable content output across all platforms.',
              benefit: 'Stop creating from scratch every time. Build once, produce continuously.',
              tools:   'Notion  ·  CapCut  ·  Claude  ·  Make  ·  Buffer',
              stack:   'Script engine  ·  Publishing pipeline  ·  Analytics layer',
              next:    '/build-content-system  /frameworks',
            },
            {
              name:    'Knowledge System',
              purpose: 'Structure everything you know into a searchable, connected intelligence layer.',
              benefit: 'Never lose an idea, decision, or insight again. Build compound knowledge.',
              tools:   'Obsidian  ·  NotebookLM  ·  Claude  ·  Readwise',
              stack:   'Vault  ·  Templates  ·  Link graph  ·  AI layer',
              next:    '/tools  /frameworks',
            },
            {
              name:    'Business System',
              purpose: 'Build a complete operating architecture for revenue, delivery, and growth.',
              benefit: 'Stop reacting. Start running a system. Every layer connected to the next.',
              tools:   'Notion  ·  Stripe  ·  Claude  ·  Make  ·  Vercel',
              stack:   'Offer  ·  CRM  ·  Delivery  ·  Automation  ·  Analytics',
              next:    '/build-business  /capabilities',
            },
            {
              name:    'Automation System',
              purpose: 'Identify every repeatable task and build systems to run them without you.',
              benefit: 'Your time is freed for decisions. The system handles execution.',
              tools:   'Make  ·  Zapier  ·  Claude  ·  Gmail  ·  Calendar',
              stack:   'Trigger  ·  Logic  ·  Action  ·  Notification  ·  Audit',
              next:    '/capabilities  /connect-ai',
            },
            {
              name:    'Digital Presence',
              purpose: 'Establish your identity, worlds, and infrastructure across the ecosystem.',
              benefit: 'Own your presence. Build it once. Expand it everywhere.',
              tools:   'Vercel  ·  GitHub  ·  Next.js  ·  Three.js  ·  Clerk',
              stack:   'Domain  ·  Portal  ·  Identity layer  ·  ACCESS account',
              next:    '/presence  /access-id  /worlds',
            },
          ].map(bp => (
            <div key={bp.name} style={{ padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '2px' }}>
              <div style={{ color: 'var(--text)', fontSize: '13px', fontWeight: 600, marginBottom: '6px', letterSpacing: '0.04em' }}>{bp.name}</div>
              {[
                ['Purpose',  bp.purpose],
                ['Benefit',  bp.benefit],
                ['Tools',    bp.tools],
                ['Stack',    bp.stack],
                ['Next',     bp.next],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: '16px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', width: '54px', flexShrink: 0, paddingTop: '2px' }}>{k}</span>
                  <span style={{ color: k === 'Next' ? 'var(--accent)' : 'var(--text-dim)', fontSize: '11px', lineHeight: '1.6' }}>{v}</span>
                </div>
              ))}
            </div>
          ))}
          <Note>Type any Next command shown above to continue building.</Note>
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
    case '/help': {
      const sections: Array<{ heading?: string; cmd?: string; desc?: string }> = [
        { heading: 'Identity' },
        { cmd: '/my-id',                     desc: 'Your ACCESS ID — username.access format' },
        { cmd: '/presence',                  desc: 'Your digital presence status in the ecosystem' },
        { cmd: '/access-id',                 desc: 'Your ACCESS ID and future AI identity' },
        { cmd: '/pathways',                  desc: 'Builder stages: Explore → Learn → Build → Connect → Deploy → Network' },
        { heading: 'Build' },
        { cmd: '/start',                     desc: 'Choose a path — generates a blueprint via Q&A' },
        { cmd: '/build-ai-system',           desc: 'Generate an AI system blueprint (5 questions)' },
        { cmd: '/build-business',            desc: 'Generate a business system blueprint (5 questions)' },
        { cmd: '/build-content-system',      desc: 'Generate a content system blueprint (5 questions)' },
        { cmd: '/build-knowledge-system',    desc: 'Generate a knowledge system blueprint (5 questions)' },
        { heading: 'Blueprints' },
        { cmd: '/my-blueprints',             desc: 'View your saved blueprints' },
        { cmd: '/save-blueprint',            desc: 'Save current blueprint to ACCESS workspace' },
        { cmd: '/copy-blueprint',            desc: 'Copy current blueprint to clipboard' },
        { cmd: '/export-blueprint',          desc: 'Download current blueprint as .md file' },
        { cmd: '/start-over',                desc: 'Clear current blueprint flow and choose a new path' },
        { cmd: '/open-blueprint [n]',        desc: 'Reopen a saved blueprint by number' },
        { cmd: '/delete-blueprint [n]',      desc: 'Delete a saved blueprint by number' },
        { heading: 'Explore' },
        { cmd: '/explore',                   desc: 'Browse systems, blueprints, tools, and frameworks' },
        { cmd: '/blueprints',                desc: 'Pre-built operating architectures for reference' },
        { cmd: '/frameworks',                desc: 'Mental models for thinking and building' },
        { cmd: '/tools',                     desc: 'Every tool in the ecosystem — in plain language' },
        { cmd: '/capabilities',              desc: 'What becomes possible when AI systems are connected' },
        { heading: 'Ecosystem' },
        { cmd: '/jd-ecosystem',              desc: 'Overview of the JD AI System ecosystem' },
        { cmd: '/systems',                   desc: 'All systems in the ecosystem' },
        { cmd: '/systems-registry',          desc: 'What a registered AI system looks like (preview)' },
        { cmd: '/network',                   desc: 'Future vision: AI-to-AI network (preview)' },
        { cmd: '/worlds',                    desc: 'All worlds, domains, and their status' },
        { cmd: '/view-stack',                desc: 'Current technology stack' },
        { heading: 'Session' },
        { cmd: '/connect-ai',                desc: 'Future: connect your own AI system' },
        { cmd: '/help',                      desc: 'Show this reference' },
        { cmd: '/logout',                    desc: 'End session' },
      ]
      return (
        <Block label="AVAILABLE COMMANDS">
          {sections.map((s, i) => s.heading ? (
            <div key={i} style={{ padding: '10px 0 4px', color: 'var(--text-muted)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none', marginTop: i > 0 ? '4px' : 0 }}>
              {s.heading}
            </div>
          ) : (
            <div key={i} style={{ display: 'flex', gap: '24px', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--accent)', fontSize: '11px', width: '196px', flexShrink: 0 }}>{s.cmd}</span>
              <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>{s.desc}</span>
            </div>
          ))}
          <Note>After /start, type 1–5 to jump directly to a build path. Use /build-knowledge-system for path 4.</Note>
        </Block>
      )
    }

    /* ─── /build-knowledge-system ─── */
    case '/build-knowledge-system':
      return (
        <Block label="BUILD A KNOWLEDGE SYSTEM">
          <Body>A knowledge system turns everything you learn into something you can use. It compounds over time.</Body>
          {[
            ['1', 'Capture',    'Every idea, note, article, and insight goes into one place.'],
            ['2', 'Organize',   'Structure what you capture so you can find and use it later.'],
            ['3', 'Connect',    'Link related ideas. Build a graph, not just a list.'],
            ['4', 'AI layer',   'Let AI search, summarize, and surface relevant knowledge on demand.'],
            ['5', 'Outputs',    'Turn structured knowledge into documents, decisions, and systems.'],
            ['6', 'Review',     'Revisit and refine. Knowledge improves with time and attention.'],
          ].map(([n, title, desc]) => (
            <div key={n} style={{ display: 'flex', gap: '16px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ color: 'var(--accent)', fontSize: '11px', width: '16px', flexShrink: 0, paddingTop: '2px' }}>{n}</span>
              <div>
                <div style={{ color: 'var(--text)', fontSize: '13px', marginBottom: '3px', fontWeight: 500 }}>{title}</div>
                <div style={{ color: 'var(--text-dim)', fontSize: '11px', lineHeight: '1.6' }}>{desc}</div>
              </div>
            </div>
          ))}
          <Body style={{ marginTop: '16px' }}>ACCESS will help you design the architecture before you build.</Body>
          <NextCommands cmds={['/blueprints', '/tools', '/frameworks']} />
        </Block>
      )

    /* ─── /explore ─── */
    case '/explore':
      return (
        <Block label="EXPLORE ACCESS">
          <Body>
            ACCESS helps you explore systems, blueprints, frameworks, tools, and the future of AI identity.
            No obligation to build yet. Start by understanding the landscape.
          </Body>
          <div style={{ marginTop: '8px', marginBottom: '4px' }}>
            {[
              ['/systems',         'All systems in the ecosystem'],
              ['/blueprints',      'Operating architectures for real builds'],
              ['/frameworks',      'Mental models for thinking and building'],
              ['/tools',           'Every tool in the ecosystem — in plain language'],
              ['/connect-ai',      'Future: connect your AI system to the network'],
              ['/worlds',          'All JD ecosystem worlds and their status'],
              ['/my-id',           'Your ACCESS identity'],
            ].map(([cmd, desc]) => (
              <div key={cmd} style={{ display: 'flex', gap: '24px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                <span style={{ color: 'var(--accent)', fontSize: '11px', width: '140px', flexShrink: 0 }}>{cmd}</span>
                <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>{desc}</span>
              </div>
            ))}
          </div>
          <Note>Ready to build? Type /start to choose a path and generate your first blueprint.</Note>
        </Block>
      )

    /* ─── /my-id ─── */
    case '/my-id': {
      const handle = userName
        ? `${userName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')}.access`
        : 'guest-builder.access'
      return (
        <Block label="ACCESS ID">
          <div style={{ fontSize: '20px', color: 'var(--accent)', letterSpacing: '0.08em', fontWeight: 300, marginBottom: '20px', fontFamily: 'var(--mono)' }}>
            {handle}
          </div>
          {[
            ['Status',                'Active',       'var(--success)'],
            ['Presence',              'Verified',     'var(--success)'],
            ['Connected Systems',     '0',            'var(--text-muted)'],
            ['Future AI Connections', 'Available',    'var(--text-dim)'],
          ].map(([k, v, color]) => (
            <div key={k} style={{ display: 'flex', gap: '24px', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', width: '160px', flexShrink: 0 }}>{k}</span>
              <span style={{ color, fontSize: '12px' }}>{v}</span>
            </div>
          ))}
          <p style={{ fontSize: '11px', lineHeight: '1.75', color: 'var(--text-dim)', marginTop: '18px', maxWidth: '56ch', fontFamily: 'var(--mono)' }}>
            This identifier will eventually represent you, your systems, and your AI presence
            within the ACCESS network.
          </p>
        </Block>
      )
    }

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
