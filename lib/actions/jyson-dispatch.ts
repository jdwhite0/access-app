'use server'

import { loadJysonContextForSession } from '@/lib/jyson-bridge/load-jyson-context'
import { runJysonDispatchViaCli } from '@/lib/jyson-bridge/run-dispatch-via-cli'

/** Server actions invoke P7 via CLI so Next does not bundle monorepo runtimes. */
async function dispatchCommand(handle: string, commandText: string) {
  return runJysonDispatchViaCli(handle, commandText)
}
import type { CompanionDispatchDecision } from '@/lib/jyson-bridge/build-agent-context-for-dispatch'

export async function dispatchJysonCommand(
  commandText: string
): Promise<{
  decision: CompanionDispatchDecision | null
  handle?: string
  error?: string
}> {
  const { context, error } = await loadJysonContextForSession()
  if (!context) {
    return { decision: null, error: error ?? 'Sign in to route commands.' }
  }

  const result = await dispatchCommand(context.handle, commandText)
  return { ...result, handle: context.handle }
}

/** Dev fixture preview — same pipeline without Clerk session. */
export async function dispatchJysonCommandForHandle(
  handle: string,
  commandText: string
): Promise<{
  decision: CompanionDispatchDecision | null
  handle?: string
  error?: string
}> {
  const result = await dispatchCommand(handle, commandText)
  return { ...result, handle }
}
