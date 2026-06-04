'use client'

import {
  labelForPhaseOrFallback,
  type JysonProcessingError,
  type JysonProcessingPhase,
} from '@/lib/jyson-layer/processing-states'

type Props = {
  phase: JysonProcessingPhase
  isStreaming: boolean
  /** When false, nothing is rendered (processing finished and no error). */
  active: boolean
  error: JysonProcessingError | null
  onRetry?: () => void
}

function ActivityMark({ streaming }: { streaming: boolean }) {
  return (
    <span
      className="access-jyson-layer__activity-mark"
      aria-hidden
      data-streaming={streaming ? 'true' : 'false'}
    >
      <span className="access-jyson-layer__activity-mark-dot" />
      <span className="access-jyson-layer__activity-mark-dot" />
      <span className="access-jyson-layer__activity-mark-dot" />
    </span>
  )
}

export function JysonProcessingActivityCard({
  phase,
  isStreaming,
  active,
  error,
  onRetry,
}: Props) {
  if (!active && !error) return null

  if (error) {
    return (
      <div
        className="access-jyson-layer__activity access-jyson-layer__activity--error"
        role="alert"
        aria-live="assertive"
      >
        <div className="access-jyson-layer__activity-row">
          <div className="access-jyson-layer__activity-body access-jyson-layer__activity-body--error">
            <p className="access-jyson-layer__activity-name">JYSON</p>
            <p className="access-jyson-layer__activity-title">{error.title}</p>
            {error.detail ? (
              <p className="access-jyson-layer__activity-detail">{error.detail}</p>
            ) : null}
            {error.retryable && onRetry ? (
              <button
                type="button"
                className="access-platform-btn-secondary access-jyson-layer__activity-retry"
                onClick={onRetry}
              >
                Retry
              </button>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  const label = labelForPhaseOrFallback(phase)
  const busy = isStreaming || phase !== 'completed'

  return (
    <div
      className="access-jyson-layer__activity"
      role="status"
      aria-live="polite"
      aria-busy={busy}
      data-streaming={isStreaming ? 'true' : 'false'}
      data-phase={phase}
    >
      <div className="access-jyson-layer__activity-row">
        <ActivityMark streaming={busy} />
        <div className="access-jyson-layer__activity-body">
          <div className="access-jyson-layer__activity-brand">
            <span className="access-jyson-layer__activity-name">JYSON</span>
            <span className="access-jyson-layer__activity-verb">
              {isStreaming ? 'Responding' : 'Working'}
            </span>
          </div>
          <p key={phase} className="access-jyson-layer__activity-status">
            {label}
          </p>
        </div>
      </div>
    </div>
  )
}
