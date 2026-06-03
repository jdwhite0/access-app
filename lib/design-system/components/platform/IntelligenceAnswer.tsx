'use client'

import { cn } from '../cn'

export type IntelligenceSection = {
  situation?: string
  diagnosis?: string
  opportunity?: string
  risk?: string
  recommendation?: string
  nextAction?: string
}

const SECTIONS: { key: keyof IntelligenceSection; label: string }[] = [
  { key: 'situation', label: 'Situation' },
  { key: 'diagnosis', label: 'Diagnosis' },
  { key: 'opportunity', label: 'Opportunity' },
  { key: 'risk', label: 'Risk' },
  { key: 'recommendation', label: 'Recommendation' },
  { key: 'nextAction', label: 'Next action' },
]

type IntelligenceAnswerProps = {
  title?: string
  sections: IntelligenceSection
  technical?: React.ReactNode
  className?: string
}

export function IntelligenceAnswer({
  title = 'JYSON',
  sections,
  technical,
  className,
}: IntelligenceAnswerProps) {
  const filled = SECTIONS.filter((s) => sections[s.key]?.trim())

  return (
    <article className={cn('access-intelligence-answer', className)}>
      <header className="access-intelligence-answer__head">
        <span className="access-platform-eyebrow">{title}</span>
      </header>
      <div className="access-intelligence-answer__body">
        {filled.length > 0 ? (
          filled.map(({ key, label }) => (
            <section key={key} className="access-intelligence-answer__section">
              <h3 className="access-intelligence-answer__section-label">{label}</h3>
              <p className="access-platform-body">{sections[key]}</p>
            </section>
          ))
        ) : (
          <p className="access-platform-body">No structured response yet.</p>
        )}
      </div>
      {technical ? (
        <details className="access-intelligence-answer__technical">
          <summary>Technical output</summary>
          <div className="access-intelligence-answer__technical-body">{technical}</div>
        </details>
      ) : null}
    </article>
  )
}

const PARSE_KEYS: { key: keyof IntelligenceSection; patterns: RegExp[] }[] = [
  { key: 'situation', patterns: [/^situation\s*:/i, /^##\s*situation/i, /^\*\*situation\*\*/i] },
  { key: 'diagnosis', patterns: [/^diagnosis\s*:/i, /^##\s*diagnosis/i, /^\*\*diagnosis\*\*/i] },
  { key: 'opportunity', patterns: [/^opportunity\s*:/i, /^##\s*opportunity/i, /^\*\*opportunity\*\*/i] },
  { key: 'risk', patterns: [/^risk\s*:/i, /^##\s*risk/i, /^\*\*risk\*\*/i] },
  { key: 'recommendation', patterns: [/^recommendation\s*:/i, /^##\s*recommendation/i, /^\*\*recommendation\*\*/i] },
  {
    key: 'nextAction',
    patterns: [
      /^next\s*action\s*:/i,
      /^##\s*next\s*action/i,
      /^\*\*next\s*action\*\*/i,
      /^next\s*step\s*:/i,
    ],
  },
]

function matchSectionHeader(line: string): keyof IntelligenceSection | null {
  const trimmed = line.trim()
  for (const { key, patterns } of PARSE_KEYS) {
    if (patterns.some((p) => p.test(trimmed))) return key
  }
  return null
}

function stripHeaderPrefix(line: string): string {
  return line
    .replace(/^#+\s*/i, '')
    .replace(/^\*\*|\*\*$/g, '')
    .replace(/^[a-z\s]+:\s*/i, '')
    .trim()
}

/** Build sections from assistant text — structured headers or fallback narrative. */
export function sectionsFromMessage(text: string): IntelligenceSection {
  const trimmed = text.trim()
  if (!trimmed) return {}

  const jsonBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim()
  if (jsonBlock) {
    try {
      const parsed = JSON.parse(jsonBlock) as Record<string, unknown>
      const mapped: IntelligenceSection = {}
      for (const { key } of PARSE_KEYS) {
        const raw = parsed[key] ?? parsed[key === 'nextAction' ? 'next_action' : key]
        if (typeof raw === 'string' && raw.trim()) mapped[key] = raw.trim()
      }
      if (Object.keys(mapped).length > 0) return mapped
    } catch {
      /* fall through */
    }
  }

  const lines = trimmed.split('\n')
  const sections: IntelligenceSection = {}
  let current: keyof IntelligenceSection | null = null
  const buffers: Partial<Record<keyof IntelligenceSection, string[]>> = {}

  const flush = () => {
    if (current && buffers[current]?.length) {
      sections[current] = buffers[current]!.join('\n').trim()
    }
  }

  for (const line of lines) {
    const headerKey = matchSectionHeader(line)
    if (headerKey) {
      flush()
      current = headerKey
      buffers[current] = []
      const inline = stripHeaderPrefix(line.replace(/^#+\s*/i, '').replace(/^\*\*[^*]+\*\*:?\s*/i, ''))
      if (inline && !/^situation|diagnosis|opportunity|risk|recommendation|next/i.test(inline)) {
        buffers[current]!.push(inline)
      }
      continue
    }
    if (current) buffers[current]!.push(line)
  }
  flush()

  if (Object.keys(sections).length > 0) return sections

  return {
    situation: trimmed,
    recommendation: 'Continue the conversation or run a local command from the input above.',
    nextAction: 'Refine your ask with a specific file, folder, or strategic goal.',
  }
}
