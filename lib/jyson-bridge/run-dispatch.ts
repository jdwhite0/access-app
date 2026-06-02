import { labelForIntent, normalizeCommandForDispatch } from './dispatch-labels'
import {
  resolveAgentContextForHandle,
  type CompanionDispatchDecision,
} from './build-agent-context-for-dispatch'
import { loadJysonRuntimeModules } from './jyson-runtime-loader'

/**
 * P10 — Run P7 dispatch() for a single user command (routing only).
 * No execution, LLM, mutations, or external APIs.
 */
export async function runJysonDispatch(
  handle: string,
  commandText: string
): Promise<{ decision: CompanionDispatchDecision | null; error?: string }> {
  const trimmed = normalizeCommandForDispatch(commandText)
  if (!trimmed) {
    return { decision: null, error: 'Enter a command to classify.' }
  }

  const { context, error } = await resolveAgentContextForHandle(handle)
  if (!context) return { decision: null, error: error ?? 'Could not load ACCESS context.' }

  const { dispatch, createUserIntent } = await loadJysonRuntimeModules()
  const decision = dispatch({
    context: context as never,
    userIntent: createUserIntent(trimmed),
  })

  return {
    decision: {
      intent: decision.intent,
      destination: decision.destination,
      confidence: decision.confidence,
      allowed: decision.allowed,
      reason: decision.reason,
      userMessage: decision.userMessage,
      commandLabel: labelForIntent(decision.intent),
    },
  }
}
