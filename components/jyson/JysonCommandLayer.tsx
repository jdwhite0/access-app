'use client'

import { useState, type FormEvent } from 'react'
import {
  dispatchJysonCommand,
  dispatchJysonCommandForHandle,
} from '@/lib/actions/jyson-dispatch'
import type { CompanionDispatchDecision } from '@/lib/jyson-bridge/build-agent-context-for-dispatch'
import {
  COMMAND_EXAMPLES,
  labelForDestination,
  labelForIntent,
} from '@/lib/jyson-bridge/dispatch-labels'

type JysonCommandLayerProps = {
  handle: string
  /** Dev-only fixture mode on /companion?preview=fixture */
  useFixtureDispatch?: boolean
}

export default function JysonCommandLayer({
  handle,
  useFixtureDispatch = false,
}: JysonCommandLayerProps) {
  const [command, setCommand] = useState('')
  const [decision, setDecision] = useState<CompanionDispatchDecision | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [routing, setRouting] = useState(false)

  async function runDispatch(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    setRouting(true)
    setError(null)
    setDecision(null)
    try {
      const result = useFixtureDispatch
        ? await dispatchJysonCommandForHandle(handle, trimmed)
        : await dispatchJysonCommand(trimmed)
      if (result.error) setError(result.error)
      else setDecision(result.decision)
    } catch {
      setError('Could not classify intent.')
    } finally {
      setRouting(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void runDispatch(command)
  }

  const confidencePct = decision
    ? `${Math.round(decision.confidence * 100)}%`
    : null

  return (
    <section className="jyson-command-layer">
      <h2 className="jyson-companion-label">Command layer</h2>
      <p className="jyson-command-prompt">What would you like to do?</p>

      <form className="jyson-command-form" onSubmit={onSubmit}>
        <input
          type="text"
          className="jyson-command-input"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Describe your intent in plain language…"
          autoComplete="off"
          spellCheck={false}
          disabled={routing}
        />
        <button type="submit" className="jyson-command-submit" disabled={routing || !command.trim()}>
          {routing ? 'Routing…' : 'Route intent'}
        </button>
      </form>

      <div className="jyson-command-examples">
        {COMMAND_EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            className="jyson-command-chip"
            disabled={routing}
            onClick={() => {
              setCommand(example)
              void runDispatch(example)
            }}
          >
            {example}
          </button>
        ))}
      </div>

      {error && <p className="jyson-companion-error">{error}</p>}

      {decision && (
        <div className="jyson-dispatch-card fade-in">
          <p className="jyson-dispatch-title">{decision.commandLabel}</p>

          <dl className="jyson-dispatch-grid">
            <div>
              <dt>Intent</dt>
              <dd>
                <code>{decision.intent}</code>
                <span className="jyson-dispatch-hint">{labelForIntent(decision.intent)}</span>
              </dd>
            </div>
            <div>
              <dt>Destination</dt>
              <dd>
                <code>{decision.destination}</code>
                <span className="jyson-dispatch-hint">
                  {labelForDestination(decision.destination)}
                </span>
              </dd>
            </div>
            <div>
              <dt>Confidence</dt>
              <dd>{confidencePct}</dd>
            </div>
            <div>
              <dt>Allowed</dt>
              <dd className={decision.allowed ? 'yes' : 'no'}>
                {decision.allowed ? 'Yes' : 'No'}
              </dd>
            </div>
            <div className="jyson-dispatch-span">
              <dt>Reason</dt>
              <dd>{decision.reason}</dd>
            </div>
            <div className="jyson-dispatch-span">
              <dt>Explanation</dt>
              <dd>{decision.userMessage}</dd>
            </div>
          </dl>

          <p className="jyson-command-footnote">
            Routing only · P7 dispatch · No execution · P10
          </p>
        </div>
      )}
    </section>
  )
}
