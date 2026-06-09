import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { AgentCode, QuotaStatus } from '@/lib/revenue-agents/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function verifyAgentAuth(req: NextRequest): boolean {
  const key = req.headers.get('x-agent-key') ?? req.headers.get('authorization')?.replace('Bearer ', '')
  return key === process.env.ACCESS_INTERNAL_KEY
}

// GET /api/agents/quota?agent=SCOUT-CON
// Returns today's quota for the given agent. Creates it if missing.
export async function GET(req: NextRequest) {
  if (!verifyAgentAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const agent = req.nextUrl.searchParams.get('agent') as AgentCode | null
  if (!agent) return NextResponse.json({ error: 'agent param required' }, { status: 400 })

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('agent_daily_quotas')
    .select('*')
    .eq('agent_code', agent)
    .eq('date', today)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Auto-create if missing (happens on first run of the day)
  if (!data) {
    const defaultTargets: Record<string, number> = {
      'SCOUT-CON': 10, 'SCOUT-BV': 15, 'SCOUT-WP': 75,
      'REACH-CON': 10, 'REACH-BV': 15, 'REACH-WP': 75,
      'PUB-ACCESS': 3, 'PIPE-MGR': 999, 'REPORT-2X': 2,
    }
    const { data: created, error: createErr } = await supabase
      .from('agent_daily_quotas')
      .insert({ agent_code: agent, date: today, target: defaultTargets[agent] ?? 10 })
      .select()
      .single()

    if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 })
    return NextResponse.json({ quota: created, remaining: created.target })
  }

  return NextResponse.json({
    quota: data,
    remaining: Math.max(0, data.target - data.completed),
    percent_complete: Math.round((data.completed / data.target) * 100),
  })
}

// PATCH /api/agents/quota
// Body: { agent: AgentCode, increment: number, status?: QuotaStatus, notes?: string }
export async function PATCH(req: NextRequest) {
  if (!verifyAgentAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    agent: AgentCode
    increment?: number
    status?: QuotaStatus
    notes?: string
  }

  const today = new Date().toISOString().split('T')[0]

  const { data: current } = await supabase
    .from('agent_daily_quotas')
    .select('completed, target')
    .eq('agent_code', body.agent)
    .eq('date', today)
    .single()

  const newCompleted = (current?.completed ?? 0) + (body.increment ?? 0)
  const newStatus: QuotaStatus = body.status ?? (
    newCompleted >= (current?.target ?? 1) ? 'COMPLETE' :
    newCompleted >= (current?.target ?? 1) * 0.5 ? 'ON_TRACK' :
    'BEHIND'
  )

  const { data, error } = await supabase
    .from('agent_daily_quotas')
    .update({
      completed: newCompleted,
      status: newStatus,
      last_run_at: new Date().toISOString(),
      notes: body.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('agent_code', body.agent)
    .eq('date', today)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ quota: data, remaining: Math.max(0, data.target - data.completed) })
}
