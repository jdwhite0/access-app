import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyCronOrInternalAuth } from '@/lib/email/agents/cron-auth'
import type { PipelineStage, Arm } from '@/lib/revenue-agents/types'
import {
  FOLLOW_UP_ADVANCE_DAYS,
  STAGE_AFTER_FOLLOW_UP,
} from '@/lib/revenue-agents/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * PIPE-MGR — Pipeline Manager Cron
 * Runs 3x daily (7am, 12pm, 5pm EDT).
 *
 * Responsibilities:
 * 1. Advance leads that are overdue for follow-up to the next stage
 * 2. Flag hot leads (REPLIED/CALL_BOOKED) for Jerry's attention
 * 3. Move NURTURE_30 leads back to QUEUED when their nurture window expires
 * 4. Reset daily quotas at midnight (handled by Vercel cron schedule)
 * 5. Log all actions
 *
 * GET /api/cron/agent-pipe
 */
export async function GET(request: NextRequest) {
  const denied = verifyCronOrInternalAuth(request)
  if (denied) return denied

  const now = new Date()
  const results: Record<string, number> = {
    advanced: 0,
    flagged: 0,
    reactivated: 0,
    errors: 0,
  }

  // ── 1. Advance overdue follow-up stages ─────────────────────────
  const followUpStages: PipelineStage[] = ['OUTREACH_SENT', 'FOLLOW_UP_1', 'FOLLOW_UP_2']

  for (const stage of followUpStages) {
    const daysThreshold = FOLLOW_UP_ADVANCE_DAYS[stage] ?? 3
    const cutoff = new Date(now)
    cutoff.setDate(cutoff.getDate() - daysThreshold)

    const { data: overdueLeads } = await supabase
      .from('pipeline_leads')
      .select('id, arm, stage, email, last_outreach_at, outreach_count')
      .eq('stage', stage)
      .lt('last_outreach_at', cutoff.toISOString())
      .limit(100)

    if (!overdueLeads?.length) continue

    const nextStage = STAGE_AFTER_FOLLOW_UP[stage]!
    const logEntries = []

    for (const lead of overdueLeads) {
      const updateData: Record<string, unknown> = {
        stage: nextStage,
        updated_at: now.toISOString(),
      }

      if (nextStage === 'NURTURE_30') {
        const nurtureUntil = new Date()
        nurtureUntil.setDate(nurtureUntil.getDate() + 30)
        updateData.nurture_until = nurtureUntil.toISOString()
        updateData.loss_reason = 'No response after 3 follow-ups — moved to 30-day nurture'
      }

      const { error: updateErr } = await supabase
        .from('pipeline_leads')
        .update(updateData)
        .eq('id', lead.id)

      if (updateErr) {
        results.errors++
        continue
      }

      // Record stage history
      await supabase.from('pipeline_stage_history').insert({
        lead_id: lead.id,
        from_stage: stage,
        to_stage: nextStage,
        changed_by: 'PIPE-MGR',
        notes: `Auto-advanced after ${daysThreshold} days of no reply`,
      })

      logEntries.push({
        agent_code: 'PIPE-MGR',
        action: 'STAGE_ADVANCED',
        lead_id: lead.id,
        arm: lead.arm as Arm,
        success: true,
        details: { from_stage: stage, to_stage: nextStage, days_elapsed: daysThreshold },
      })

      results.advanced++
    }

    if (logEntries.length) {
      await supabase.from('agent_activity_logs').insert(logEntries)
    }
  }

  // ── 2. Flag hot leads (REPLIED, CALL_BOOKED) that aren't flagged yet ──
  const { data: hotLeads } = await supabase
    .from('pipeline_leads')
    .select('id, arm, stage, email, first_name, company')
    .in('stage', ['REPLIED', 'CALL_BOOKED'])
    .eq('flagged_for_jerry', false)
    .limit(50)

  if (hotLeads?.length) {
    for (const lead of hotLeads) {
      await supabase
        .from('pipeline_leads')
        .update({
          flagged_for_jerry: true,
          flag_reason: `${lead.stage}: ${lead.first_name ?? lead.email} from ${lead.company ?? 'unknown'} — needs your attention`,
          updated_at: now.toISOString(),
        })
        .eq('id', lead.id)

      results.flagged++
    }

    await supabase.from('agent_activity_logs').insert(
      hotLeads.map(l => ({
        agent_code: 'PIPE-MGR',
        action: 'HOT_LEAD_FLAGGED',
        lead_id: l.id,
        arm: l.arm as Arm,
        success: true,
        details: { stage: l.stage, email: l.email },
      }))
    )
  }

  // ── 3. Reactivate NURTURE_30 leads whose window expired ──────────
  const { data: readyToReactivate } = await supabase
    .from('pipeline_leads')
    .select('id, arm')
    .eq('stage', 'NURTURE_30')
    .lt('nurture_until', now.toISOString())
    .limit(50)

  if (readyToReactivate?.length) {
    for (const lead of readyToReactivate) {
      await supabase
        .from('pipeline_leads')
        .update({ stage: 'QUEUED', nurture_until: null, updated_at: now.toISOString() })
        .eq('id', lead.id)

      await supabase.from('pipeline_stage_history').insert({
        lead_id: lead.id,
        from_stage: 'NURTURE_30',
        to_stage: 'QUEUED',
        changed_by: 'PIPE-MGR',
        notes: '30-day nurture window expired — re-queued for outreach',
      })

      results.reactivated++
    }
  }

  // ── 4. Update PIPE-MGR quota ─────────────────────────────────────
  const today = now.toISOString().split('T')[0]
  const totalActioned = results.advanced + results.flagged + results.reactivated
  await supabase
    .from('agent_daily_quotas')
    .update({ last_run_at: now.toISOString(), updated_at: now.toISOString() })
    .eq('agent_code', 'PIPE-MGR')
    .eq('date', today)

  return NextResponse.json({
    ok: true,
    run_at: now.toISOString(),
    results,
    total_actioned: totalActioned,
  })
}
