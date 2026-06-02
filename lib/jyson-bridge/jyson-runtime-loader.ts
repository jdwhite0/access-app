import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const REPO_ROOT = join(process.cwd(), '..')

/** Load P7 dispatch from monorepo (tsx / Node scripts only). */
export async function loadJysonRuntimeModules() {
  const dispatchPolicy = await import(
    pathToFileURL(join(REPO_ROOT, 'jyson-runtime/dispatch-policy.js')).href
  )
  const intent = await import(pathToFileURL(join(REPO_ROOT, 'jyson-runtime/intent.js')).href)
  const agentBuilder = await import(
    pathToFileURL(join(REPO_ROOT, 'access-agent-runtime/build-agent-context.js')).href
  )

  return {
    dispatch: dispatchPolicy.dispatch as (input: {
      context: unknown
      userIntent: { text: string }
    }) => {
      intent: string
      destination: string
      confidence: number
      allowed: boolean
      reason: string
      userMessage: string
    },
    createUserIntent: intent.createUserIntent as (text: string) => { text: string },
    buildAgentContext: agentBuilder.buildAgentContext as (
      packagePath: string
    ) => Promise<unknown>,
  }
}
