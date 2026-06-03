'use server'

import { loadJysonContextForSession } from '@/lib/jyson-bridge/load-jyson-context'
import type { CompanionDispatchDecision } from '@/lib/jyson-bridge/build-agent-context-for-dispatch'

/**
 * Cloud-safe JYSON intent classification.
 *
 * In production (Vercel), the local monorepo runtime is not available.
 * execFileSync/tsx calls fail. This fallback classifies intent from the
 * blueprint context using keyword matching — enough to show meaningful
 * routing decisions without a local agent.
 */
function cloudClassifyIntent(
  commandText: string,
  handle: string
): CompanionDispatchDecision {
  const text = commandText.toLowerCase()

  const rules: Array<{ keywords: string[]; intent: string; destination: string }> = [
    { keywords: ['blueprint', 'update', 'edit founder', 'change org', 'add product'], intent: 'update_blueprint_draft', destination: 'founder_blueprint' },
    { keywords: ['show product', 'list product', 'my product', 'products'], intent: 'list_products', destination: 'registry' },
    { keywords: ['experience', 'website', 'site', 'url', 'portal'], intent: 'list_experiences', destination: 'registry' },
    { keywords: ['org', 'company', 'companies', 'organization'], intent: 'list_organizations', destination: 'registry' },
    { keywords: ['summarize', 'overview', 'describe my', 'what is my'], intent: 'summarize_system', destination: 'jyson_companion' },
    { keywords: ['export', 'generate', 'materialize', 'create package'], intent: 'materialize_user_system', destination: 'founder_blueprint' },
    { keywords: ['registry', 'systems', 'catalog'], intent: 'read_registry', destination: 'registry' },
    { keywords: ['vault', 'obsidian', 'notes', 'files'], intent: 'read_vault_seeds', destination: 'vault' },
    { keywords: ['content', 'write', 'create content', 'draft'], intent: 'create_content', destination: 'jyson_companion' },
  ]

  for (const rule of rules) {
    if (rule.keywords.some((k) => text.includes(k))) {
      return {
        intent: rule.intent,
        destination: rule.destination,
        confidence: 0.72,
        allowed: true,
        reason: 'Keyword match (cloud routing mode)',
        userMessage: `Routing to ${rule.destination}. Full intent classification available when local connector is running.`,
        commandLabel: rule.intent.replace(/_/g, ' '),
      }
    }
  }

  return {
    intent: 'unknown',
    destination: 'jyson_companion',
    confidence: 0.3,
    allowed: true,
    reason: 'No keyword match — defaulting to companion',
    userMessage: 'Intent unclear. Try describing what you want more specifically. Full routing available with local connector.',
    commandLabel: 'unknown command',
  }
}

async function dispatchCommand(
  handle: string,
  commandText: string
): Promise<{ decision: CompanionDispatchDecision | null; error?: string }> {
  // Try local runtime first (works in dev with monorepo)
  const isServerless =
    !process.env.FOUNDER_OS_OUTPUT_ROOT &&
    (!!process.env.VERCEL || process.env.NODE_ENV === 'production')

  if (!isServerless) {
    try {
      const { runJysonDispatchViaCli } = await import('@/lib/jyson-bridge/run-dispatch-via-cli')
      return runJysonDispatchViaCli(handle, commandText)
    } catch {
      // Fall through to cloud classifier
    }
  }

  // Cloud fallback — keyword-based routing, no local runtime needed
  const decision = cloudClassifyIntent(commandText, handle)
  return { decision }
}

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
