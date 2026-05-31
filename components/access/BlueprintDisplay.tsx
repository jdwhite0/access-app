'use client'

export type FlowType = 'ai' | 'business' | 'content' | 'knowledge'

export const FLOW_TYPE_LABELS: Record<FlowType, string> = {
  ai: 'AI System',
  business: 'Business System',
  content: 'Content System',
  knowledge: 'Knowledge System',
}

type Props = {
  flowType: FlowType
  answers: string[]
  username: string
  savedState: 'unsaved' | 'saved'
  copiedState: boolean
  onSave: () => void
  onCopy: () => void
  onExport: () => void
  onStartOver: () => void
}

function deriveSystemName(purpose: string, suffix: string): string {
  const stopWords = new Set(['a','an','the','to','for','my','i','and','or','with','in','of','on','that','it','is','be','do'])
  const words = purpose.trim().split(/\s+/).filter(w => !stopWords.has(w.toLowerCase())).slice(0, 3)
  if (!words.length) return suffix
  const key = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  return `${key} ${suffix}`
}

export function generateBlueprintText(flowType: FlowType, answers: string[], username: string): string {
  const accessId = `${username.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')}.access`
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const line = '─'.repeat(44)

  if (flowType === 'ai') {
    const systemName = deriveSystemName(answers[0] ?? '', 'AI System')
    return `AI SYSTEM BLUEPRINT
${line}
Generated via ACCESS  ·  ${date}
${line}

ACCESS ID      ${accessId}
System Name    ${systemName}

${line}

PURPOSE
${answers[0] ?? '—'}

PRIMARY USER
${answers[1] ?? '—'}

CORE TASKS
${answers[2] ?? '—'}

INTERFACE
${answers[3] ?? '—'}

TOOL CONNECTIONS
${answers[4] ?? '—'}

${line}

SUGGESTED STACK

Frontend        Next.js or React
Intelligence    Claude / OpenAI / Gemini
Local Option    Ollama / OpenJarvis
Memory          Obsidian / database / document vault
Authentication  Clerk
Deployment      Vercel
Future Layer    ACCESS ID network

${line}

BUILD PHASES

Phase 1   Define purpose
Phase 2   Build interface
Phase 3   Connect model
Phase 4   Add memory
Phase 5   Add tools
Phase 6   Add automation
Phase 7   Register with ACCESS

${line}

NEXT 3 STEPS

1   Write the system purpose in one sentence.
2   Choose the first interface.
3   Build a prototype with one useful function.
`
  }

  if (flowType === 'business') {
    return `BUSINESS SYSTEM BLUEPRINT
${line}
Generated via ACCESS  ·  ${date}
${line}

ACCESS ID      ${accessId}

${line}

BUSINESS IDEA
${answers[0] ?? '—'}

TARGET CUSTOMER
${answers[1] ?? '—'}

CORE OUTCOME
${answers[2] ?? '—'}

OFFER STRUCTURE
${answers[3] ?? '—'}

AI SUPPORT LAYER
${answers[4] ?? '—'}

${line}

SUGGESTED SYSTEMS

  Lead system
  Content system
  Sales system
  Delivery system
  Follow-up system
  Knowledge system

${line}

NEXT 3 STEPS

1   Define the offer clearly in one sentence.
2   Create a simple lead capture path.
3   Build one repeatable delivery process.
`
  }

  if (flowType === 'content') {
    return `CONTENT SYSTEM BLUEPRINT
${line}
Generated via ACCESS  ·  ${date}
${line}

ACCESS ID      ${accessId}

${line}

MESSAGE
${answers[0] ?? '—'}

AUDIENCE
${answers[1] ?? '—'}

PLATFORMS
${answers[2] ?? '—'}

CONTENT FORMATS
${answers[3] ?? '—'}

CONVERSION GOAL
${answers[4] ?? '—'}

${line}

SYSTEM LAYERS

  Idea capture
  Script generation
  Production workflow
  Editing workflow
  Publishing calendar
  Repurposing system
  Analytics review

${line}

NEXT 3 STEPS

1   Create 3 content pillars.
2   Build a weekly production rhythm.
3   Create one repeatable content template.
`
  }

  // knowledge
  return `KNOWLEDGE SYSTEM BLUEPRINT
${line}
Generated via ACCESS  ·  ${date}
${line}

ACCESS ID      ${accessId}

${line}

KNOWLEDGE AREA
${answers[0] ?? '—'}

PURPOSE
${answers[1] ?? '—'}

CURRENT STORAGE
${answers[2] ?? '—'}

AI USE CASE
${answers[3] ?? '—'}

DESIRED OUTPUT
${answers[4] ?? '—'}

${line}

SUGGESTED STRUCTURE

  Inbox
  Notes
  Projects
  Systems
  References
  Outputs
  Archive

SUGGESTED TOOLS

  Obsidian
  Notion
  Google Drive
  Local folders
  Vector database (later)

${line}

NEXT 3 STEPS

1   Create one central vault or folder.
2   Organize existing notes into 5 categories.
3   Connect the knowledge base to one AI workflow.
`
}

export default function BlueprintDisplay({
  flowType, answers, username,
  savedState, copiedState,
  onSave, onCopy, onExport, onStartOver,
}: Props) {
  const accessId = `${username.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')}.access`
  const label = FLOW_TYPE_LABELS[flowType]
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const aiName = flowType === 'ai' ? deriveSystemName(answers[0] ?? '', 'AI System') : null

  const sections = (() => {
    if (flowType === 'ai') return [
      ['PURPOSE',         answers[0]],
      ['PRIMARY USER',    answers[1]],
      ['CORE TASKS',      answers[2]],
      ['INTERFACE',       answers[3]],
      ['TOOL CONNECTIONS',answers[4]],
    ]
    if (flowType === 'business') return [
      ['BUSINESS IDEA',    answers[0]],
      ['TARGET CUSTOMER',  answers[1]],
      ['CORE OUTCOME',     answers[2]],
      ['OFFER STRUCTURE',  answers[3]],
      ['AI SUPPORT LAYER', answers[4]],
    ]
    if (flowType === 'content') return [
      ['MESSAGE',          answers[0]],
      ['AUDIENCE',         answers[1]],
      ['PLATFORMS',        answers[2]],
      ['CONTENT FORMATS',  answers[3]],
      ['CONVERSION GOAL',  answers[4]],
    ]
    return [
      ['KNOWLEDGE AREA',  answers[0]],
      ['PURPOSE',         answers[1]],
      ['CURRENT STORAGE', answers[2]],
      ['AI USE CASE',     answers[3]],
      ['DESIRED OUTPUT',  answers[4]],
    ]
  })()

  const systemDetails = (() => {
    if (flowType === 'ai') return {
      detailLabel: 'SUGGESTED STACK',
      details: [
        ['Frontend',      'Next.js or React'],
        ['Intelligence',  'Claude / OpenAI / Gemini'],
        ['Local Option',  'Ollama / OpenJarvis'],
        ['Memory',        'Obsidian / database / document vault'],
        ['Auth',          'Clerk'],
        ['Deployment',    'Vercel'],
        ['Future Layer',  'ACCESS ID network'],
      ],
      phasesLabel: 'BUILD PHASES',
      phases: ['Define purpose','Build interface','Connect model','Add memory','Add tools','Add automation','Register with ACCESS'],
      nextLabel: 'NEXT 3 STEPS',
      next: ['Write the system purpose in one sentence.','Choose the first interface.','Build a prototype with one useful function.'],
    }
    if (flowType === 'business') return {
      detailLabel: 'SUGGESTED SYSTEMS',
      details: [['','Lead system'],['','Content system'],['','Sales system'],['','Delivery system'],['','Follow-up system'],['','Knowledge system']],
      phasesLabel: '',
      phases: [],
      nextLabel: 'NEXT 3 STEPS',
      next: ['Define the offer clearly in one sentence.','Create a simple lead capture path.','Build one repeatable delivery process.'],
    }
    if (flowType === 'content') return {
      detailLabel: 'SYSTEM LAYERS',
      details: [['','Idea capture'],['','Script generation'],['','Production workflow'],['','Editing workflow'],['','Publishing calendar'],['','Repurposing system'],['','Analytics review']],
      phasesLabel: '',
      phases: [],
      nextLabel: 'NEXT 3 STEPS',
      next: ['Create 3 content pillars.','Build a weekly production rhythm.','Create one repeatable content template.'],
    }
    return {
      detailLabel: 'SUGGESTED TOOLS',
      details: [['','Obsidian'],['','Notion'],['','Google Drive'],['','Local folders'],['','Vector database (later)']],
      phasesLabel: 'SUGGESTED STRUCTURE',
      phases: ['Inbox','Notes','Projects','Systems','References','Outputs','Archive'],
      nextLabel: 'NEXT 3 STEPS',
      next: ['Create one central vault or folder.','Organize existing notes into 5 categories.','Connect the knowledge base to one AI workflow.'],
    }
  })()

  const divider = { borderTop: '1px solid rgba(255,255,255,0.07)', margin: '18px 0' }

  return (
    <div style={{
      border: '1px solid rgba(64,192,208,0.18)',
      borderRadius: '2px',
      padding: '24px',
      background: 'rgba(64,192,208,0.02)',
      maxWidth: '680px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
        <div>
          <div style={{ fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
            {label.toUpperCase()} BLUEPRINT
          </div>
          {aiName && (
            <div style={{ fontSize: '15px', color: 'var(--text)', fontWeight: 500, marginBottom: '4px' }}>{aiName}</div>
          )}
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Generated {date}</div>
        </div>
        <div style={{
          fontSize: '9px', letterSpacing: '0.14em', color: 'var(--accent)',
          border: '1px solid rgba(64,192,208,0.3)', padding: '3px 8px', borderRadius: '2px',
        }}>
          {accessId}
        </div>
      </div>

      <div style={divider} />

      {/* Answer sections */}
      {sections.map(([k, v]) => (
        <div key={k} style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>{k}</div>
          <div style={{ fontSize: '12px', color: 'var(--text)', lineHeight: '1.65' }}>{v || '—'}</div>
        </div>
      ))}

      <div style={divider} />

      {/* System details */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
          {systemDetails.detailLabel}
        </div>
        {systemDetails.details.map(([k, v], i) => (
          <div key={i} style={{ display: 'flex', gap: '16px', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            {k && <span style={{ fontSize: '10px', color: 'var(--text-muted)', width: '90px', flexShrink: 0 }}>{k}</span>}
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', paddingLeft: k ? 0 : '8px' }}>{v}</span>
          </div>
        ))}
      </div>

      {systemDetails.phasesLabel && systemDetails.phases.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
            {systemDetails.phasesLabel}
          </div>
          {systemDetails.phases.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: '16px', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', width: '60px', flexShrink: 0 }}>
                {flowType === 'ai' ? `Phase ${i + 1}` : ''}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{p}</span>
            </div>
          ))}
        </div>
      )}

      <div style={divider} />

      {/* Next steps */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
          {systemDetails.nextLabel}
        </div>
        {systemDetails.next.map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: '16px', padding: '5px 0' }}>
            <span style={{ color: 'var(--accent)', fontSize: '11px', width: '16px', flexShrink: 0 }}>{i + 1}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.6' }}>{step}</span>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '18px' }}>
        <div style={{ fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Save or Export
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {[
            { label: savedState === 'saved' ? '✓ Saved' : '/save-blueprint', active: savedState === 'saved', onClick: onSave },
            { label: copiedState ? '✓ Copied' : '/copy-blueprint', active: copiedState, onClick: onCopy },
            { label: '/export-blueprint', active: false, onClick: onExport },
            { label: '/start-over', active: false, onClick: onStartOver, muted: true },
          ].map(({ label, active, onClick, muted }) => (
            <button
              key={label}
              onClick={onClick}
              style={{
                background: active ? 'rgba(64,192,208,0.1)' : 'var(--surface)',
                border: `1px solid ${active ? 'rgba(64,192,208,0.4)' : 'var(--border)'}`,
                borderRadius: '2px',
                padding: '7px 14px',
                color: active ? 'var(--accent)' : muted ? 'var(--text-muted)' : 'var(--text-dim)',
                fontSize: '10px',
                letterSpacing: '0.06em',
                cursor: 'pointer',
                transition: 'border-color 0.15s',
                fontFamily: 'var(--mono)',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = 'rgba(64,192,208,0.3)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              {label}
            </button>
          ))}
        </div>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '12px', lineHeight: '1.6', fontFamily: 'var(--mono)' }}>
          Your private files are not exposed. ACCESS uses your login to create your ecosystem identity.
          Blueprints are saved locally in this prototype.
        </p>
      </div>
    </div>
  )
}
