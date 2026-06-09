/**
 * Agent Runner — executes any revenue agent by code.
 * Usage: npx tsx scripts/run-agent.ts SCOUT-CON
 *
 * All agents use ACCESS_API to interact with the pipeline.
 * AI layer: OpenAI (primary) → Ollama (fallback)
 */

import { loadAccessEnv } from '../email/agents/load-env'

type AgentModule = () => Promise<{ success: boolean; summary: string; leadsAdded?: number; emailsSent?: number; piecesPublished?: number }>

interface AgentDef {
  code: string
  name: string
  schedule: string
  run: AgentModule
}

const AGENTS: Record<string, AgentDef> = {}

async function lazyLoad(code: string): Promise<AgentModule | null> {
  switch (code) {
    case 'SCOUT-CON': {
      const m = await import('./agents/scout-con')
      return m.run
    }
    case 'SCOUT-BV': {
      const m = await import('./agents/scout-bv')
      return m.run
    }
    case 'SCOUT-WP': {
      const m = await import('./agents/scout-wp')
      return m.run
    }
    case 'REACH-CON': {
      const m = await import('./agents/reach-con')
      return m.run
    }
    case 'REACH-BV': {
      const m = await import('./agents/reach-bv')
      return m.run
    }
    case 'REACH-WP': {
      const m = await import('./agents/reach-wp')
      return m.run
    }
    case 'PUB-ACCESS': {
      const m = await import('./agents/pub-access')
      return m.run
    }
    default:
      return null
  }
}

export async function runAgent(agentCode: string): Promise<{ success: boolean; summary: string }> {
  loadAccessEnv()

  const code = agentCode.toUpperCase()
  const runner = await lazyLoad(code)

  if (!runner) {
    return { success: false, summary: `Unknown agent: ${code}. Valid: SCOUT-CON, SCOUT-BV, SCOUT-WP, REACH-CON, REACH-BV, REACH-WP, PUB-ACCESS` }
  }

  const start = Date.now()
  console.log(`[runner] ${code} starting...`)

  try {
    const result = await runner()
    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    console.log(`[runner] ${code} done in ${elapsed}s — ${result.summary}`)
    return result
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[runner] ${code} failed:`, msg)
    return { success: false, summary: `${code} error: ${msg}` }
  }
}

export async function runAllAgents(): Promise<{ results: Array<{ code: string; success: boolean; summary: string }> }> {
  loadAccessEnv()
  const agents = ['SCOUT-CON', 'SCOUT-BV', 'SCOUT-WP', 'REACH-CON', 'REACH-BV', 'REACH-WP', 'PUB-ACCESS']
  const results: Array<{ code: string; success: boolean; summary: string }> = []

  for (const code of agents) {
    const result = await runAgent(code)
    results.push({ code, ...result })
  }

  return { results }
}

export function getAgentList(): Array<{ code: string; target: number; schedule: string }> {
  return [
    { code: 'SCOUT-CON', target: 10, schedule: 'Daily, 7am EDT — Tampa Bay creative entrepreneurs' },
    { code: 'SCOUT-BV', target: 15, schedule: 'Daily, 7:15am EDT — Tampa Bay businesses without video' },
    { code: 'SCOUT-WP', target: 75, schedule: 'Daily, 7:30am EDT — Independent merchants (multi-city)' },
    { code: 'REACH-CON', target: 10, schedule: 'Daily, 8am EDT — Personalized emails to QUEUED consulting' },
    { code: 'REACH-BV', target: 15, schedule: 'Daily, 8:15am EDT — Personalized emails to QUEUED BV' },
    { code: 'REACH-WP', target: 75, schedule: 'Daily, 8:30am EDT — Personalized emails to QUEUED WP' },
    { code: 'PUB-ACCESS', target: 3, schedule: 'Daily, 9am EDT — Content generation' },
  ]
}
