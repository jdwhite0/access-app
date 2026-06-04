/**
 * JYSON processing indicator — phased labels for the persistent chat layer.
 */

export type JysonProcessingPhase =
  | 'idle'
  | 'receiving'
  | 'reading_context'
  | 'searching_vault'
  | 'retrieving'
  | 'reasoning'
  | 'preparing'
  | 'completed'

export type JysonProcessingErrorKind =
  | 'connection'
  | 'model'
  | 'vault'
  | 'generic'

export type JysonProcessingError = {
  kind: JysonProcessingErrorKind
  title: string
  detail?: string
  retryable: boolean
}

/** Stepped phases before the response stream begins */
export const PRE_STREAM_PHASES: Exclude<
  JysonProcessingPhase,
  'idle' | 'preparing' | 'completed'
>[] = [
  'receiving',
  'reading_context',
  'searching_vault',
  'retrieving',
  'reasoning',
]

export const PROCESSING_PHASE_LABELS: Record<
  Exclude<JysonProcessingPhase, 'idle' | 'completed'>,
  string
> = {
  receiving: 'Receiving your message',
  reading_context: 'Reading workspace context',
  searching_vault: 'Searching vault memory',
  retrieving: 'Pulling relevant excerpts',
  reasoning: 'Working through priorities',
  preparing: 'Preparing response',
}

export const PROCESSING_ERROR_TITLES: Record<JysonProcessingErrorKind, string> = {
  connection: 'Connection interrupted',
  model: 'Model unavailable',
  vault: 'Vault context unavailable',
  generic: 'Something went wrong',
}

const PHASE_STEP_MS = 720

/** Shown when processing is active but phase has not advanced yet */
export const PROCESSING_FALLBACK_LABEL = 'Receiving request…'

export function labelForPhase(phase: JysonProcessingPhase): string | null {
  if (phase === 'idle' || phase === 'completed') return null
  return PROCESSING_PHASE_LABELS[phase] ?? null
}

export function labelForPhaseOrFallback(phase: JysonProcessingPhase): string {
  return labelForPhase(phase) ?? PROCESSING_FALLBACK_LABEL
}

export function classifyJysonChatError(
  text: string,
  status?: number
): JysonProcessingError {
  const lower = text.toLowerCase()

  if (
    status === 0 ||
    /connection failed|network|fetch failed|aborted|interrupted|unavailable \(\d+\)/i.test(
      text
    ) ||
    lower.includes('connection')
  ) {
    return {
      kind: 'connection',
      title: PROCESSING_ERROR_TITLES.connection,
      detail: text.slice(0, 240) || undefined,
      retryable: true,
    }
  }

  if (
    /retired gemini|model.*not found|model.*not available|models\//i.test(text) ||
    lower.includes('cloud error')
  ) {
    return {
      kind: 'model',
      title: PROCESSING_ERROR_TITLES.model,
      detail: text.slice(0, 240) || undefined,
      retryable: true,
    }
  }

  if (
    /vault path unavailable|no jd command vault path was found|\[jyson vault content — vault path unavailable\]/i.test(
      text
    )
  ) {
    return {
      kind: 'vault',
      title: PROCESSING_ERROR_TITLES.vault,
      detail: text.slice(0, 240) || undefined,
      retryable: true,
    }
  }

  return {
    kind: 'generic',
    title: PROCESSING_ERROR_TITLES.generic,
    detail: text.slice(0, 240) || undefined,
    retryable: true,
  }
}

/** Advance pre-stream phases on a timer until `shouldStop` returns true. */
export function startPreStreamPhaseTimer(
  onPhase: (phase: JysonProcessingPhase) => void,
  shouldStop: () => boolean
): () => void {
  let index = 0
  onPhase(PRE_STREAM_PHASES[0] ?? 'receiving')

  const id = window.setInterval(() => {
    if (shouldStop()) {
      window.clearInterval(id)
      return
    }
    index += 1
    if (index >= PRE_STREAM_PHASES.length) {
      window.clearInterval(id)
      return
    }
    onPhase(PRE_STREAM_PHASES[index]!)
  }, PHASE_STEP_MS)

  return () => window.clearInterval(id)
}

/** Optional dev-only: map harness header to an early phase hint. */
export function phaseHintFromHarnessHeader(header: string | null): JysonProcessingPhase | null {
  if (!header) return null
  if (header.includes('local-claude')) return 'reasoning'
  return 'searching_vault'
}
