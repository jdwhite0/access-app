import { NextRequest, NextResponse } from 'next/server'
import { verifyCronOrInternalAuth } from '@/lib/email/agents/cron-auth'
import { runAllAgents } from '@/lib/revenue-agents/agent-runner'
import { slackPostMessage } from '@/lib/slack/client'

export const maxDuration = 300 // Allow up to 300 seconds (5 minutes) for Vercel Hobby/Pro plan limits

/**
 * GET /api/cron/run-all-agents
 * 
 * Vercel Cron trigger that executes all 7 revenue agents sequentially:
 * SCOUT-CON, SCOUT-BV, SCOUT-WP, REACH-CON, REACH-BV, REACH-WP, PUB-ACCESS
 * 
 * Secure: Requires Authorization: Bearer CRON_SECRET or internal secret header.
 */
export async function GET(request: NextRequest) {
  const denied = verifyCronOrInternalAuth(request)
  if (denied) return denied

  const now = new Date()
  console.log(`[cron] Triggering all revenue agents sequential run at ${now.toISOString()}...`)

  try {
    const start = Date.now()
    const { results } = await runAllAgents()
    const elapsed = ((Date.now() - start) / 1000).toFixed(1)

    // Post run summary to #empire-pipeline — individual agents already post to their own channels
    const totalLeads = results.reduce((s, r) => s + ((r as { leadsAdded?: number }).leadsAdded ?? 0), 0)
    const totalEmails = results.reduce((s, r) => s + ((r as { emailsSent?: number }).emailsSent ?? 0), 0)
    const failed = results.filter(r => !r.success).length
    const summary = `🤖 *Daily agent run complete* (${elapsed}s) — ${totalLeads} leads added, ${totalEmails} emails sent${failed > 0 ? ` | ${failed} agent(s) failed` : ''}`
    await slackPostMessage({ channel: 'C0B8KJXKYCB', text: summary }).catch(err => {
      console.error('[cron] Failed to send Slack alert:', err)
    })

    return NextResponse.json({
      ok: true,
      run_at: now.toISOString(),
      duration_seconds: parseFloat(elapsed),
      results,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[cron] Failed to run revenue agents:', msg)
    await slackPostMessage({ channel: 'C0B8KJXKYCB', text: `🚨 CRITICAL: Daily revenue agents cron run failed with error: ${msg}` }).catch(() => {})

    return NextResponse.json({
      error: `Cron failed: ${msg}`,
    }, { status: 500 })
  }
}
