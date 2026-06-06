import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { AgentActivityLog } from '@/lib/revenue-agents/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function verifyAgentAuth(req: NextRequest): boolean {
  const key = req.headers.get('x-agent-key') ?? req.headers.get('authorization')?.replace('Bearer ', '')
  return key === process.env.ACCESS_INTERNAL_KEY
}

// POST /api/agents/log
// Log an agent activity. Used by all agents after every meaningful action.
export async function POST(req: NextRequest) {
  if (!verifyAgentAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as AgentActivityLog | AgentActivityLog[]
  const entries = Array.isArray(body) ? body : [body]

  const { error } = await supabase.from('agent_activity_logs').insert(entries)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ logged: entries.length })
}

// GET /api/agents/log?agent=SCOUT-CON&date=2026-06-06&limit=50
export async function GET(req: NextRequest) {
  if (!verifyAgentAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const agent = searchParams.get('agent')
  const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0]
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500)

  const start = `${date}T00:00:00Z`
  const end = `${date}T23:59:59Z`

  let query = supabase
    .from('agent_activity_logs')
    .select('*')
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (agent) query = query.eq('agent_code', agent)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ logs: data, count: data?.length ?? 0 })
}
