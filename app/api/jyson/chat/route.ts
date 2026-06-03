/**
 * JYSON Chat API — ACCESS Runtime Harness
 *
 * This is the bridge between ACCESS and JYSON Core.
 * It enriches the conversation with the user's ACCESS context
 * (identity, handle, blueprint, organizations, products, experiences)
 * and proxies to the JYSON chat API for actual intelligence.
 *
 * Architecture:
 *   Client → POST /api/jyson/chat
 *           → loads JysonContext from Supabase
 *           → injects ACCESS context into messages
 *           → streams from JYSON API
 *           → SSE back to client
 */
import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { loadJysonContextForSession } from '@/lib/jyson-bridge/load-jyson-context'

const JYSON_API_URL = process.env.JYSON_INTERNAL_API_URL
  ?? process.env.NEXT_PUBLIC_JYSON_URL
  ?? 'https://jyson.vercel.app'

export const runtime = 'nodejs'
export const maxDuration = 60

function buildAccessContextBlock(ctx: Awaited<ReturnType<typeof loadJysonContextForSession>>['context']): string {
  if (!ctx) return ''

  const orgs = ctx.organizations.map((o) => `  - ${o.name} (${o.id})`).join('\n') || '  (none yet)'
  const products = ctx.products
    .map((p) => `  - ${p.name} [${p.type}]${p.organization_id ? ` @ ${p.organization_id}` : ''}`)
    .join('\n') || '  (none yet)'
  const experiences = ctx.experiences
    .map((e) => `  - ${e.name}${e.url ? ` → ${e.url}` : ''}`)
    .join('\n') || '  (none yet)'

  return `
[JYSON RUNTIME — ACCESS CONTEXT]
You are speaking with ${ctx.identity.displayName}.
Their ACCESS handle is: ${ctx.handle}
Their Founder OS: ${ctx.userSystemId ?? 'pending generation'}
Cloud package: ${ctx.companionState?.cloudReady ? 'ready' : 'pending'}
Local OS: ${ctx.companionState?.localConnected ? 'connected' : 'sync pending'}

Their registered world:
Organizations:
${orgs}

Products:
${products}

Experiences:
${experiences}

System summary: ${ctx.summary.consumer}

You are their personal JYSON companion. Speak from knowledge of their specific world above.
Do not be generic. Reference their actual orgs, products, and experiences when relevant.
[END ACCESS CONTEXT]
`.trim()
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return new Response(
      `data: ${JSON.stringify({ text: 'Sign in to talk to JYSON.' })}\n\ndata: [DONE]\n\n`,
      { status: 401, headers: { 'Content-Type': 'text/event-stream' } }
    )
  }

  let body: { messages: Array<{ role: string; content: string }> }
  try {
    body = await req.json() as typeof body
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const { messages } = body
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response('Invalid messages', { status: 400 })
  }

  // Load ACCESS context to enrich the conversation
  const { context } = await loadJysonContextForSession()
  const contextBlock = buildAccessContextBlock(context)

  // Inject ACCESS context as the first user message (JYSON reads it as system context)
  const enrichedMessages = contextBlock
    ? [{ role: 'user', content: contextBlock }, { role: 'assistant', content: "Understood. I have your ACCESS context loaded. I'm ready." }, ...messages]
    : messages

  // Proxy to JYSON chat API with SSE streaming
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()

      try {
        const jysonRes = await fetch(`${JYSON_API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: enrichedMessages }),
          signal: AbortSignal.timeout(55_000),
        })

        if (!jysonRes.ok || !jysonRes.body) {
          controller.enqueue(enc.encode(`data: ${JSON.stringify({ text: `JYSON unavailable (${jysonRes.status}). Check JYSON deployment.` })}\n\ndata: [DONE]\n\n`))
          controller.close()
          return
        }

        const reader = jysonRes.body.getReader()
        const dec = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          controller.enqueue(enc.encode(dec.decode(value)))
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Connection failed.'
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ text: `\n\n[JYSON Error: ${msg}]` })}\n\ndata: [DONE]\n\n`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-JYSON-Harness': 'access-runtime',
    },
  })
}
