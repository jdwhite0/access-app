/**
 * JYSON Chat API — ACCESS Runtime Harness
 *
 * This is the bridge between ACCESS and JYSON Core.
 * It enriches the conversation with the user's ACCESS context
 * (identity, handle, blueprint, organizations, products, experiences)
 * and streams intelligence back to the orb.
 *
 * Local dev (preferred): when PRIVATE_JYSON_ENABLED + ANTHROPIC_API_KEY,
 * stream Claude directly in ACCESS — no proxy to jyson.vercel.app.
 * Fallback: proxy to JYSON Core; on retired-Gemini errors, retry local Claude.
 *
 * Architecture:
 *   Client → POST /api/jyson/chat
 *           → loads JysonContext from Supabase
 *           → injects ACCESS + vault context into messages
 *           → local Claude OR JYSON API proxy
 *           → SSE back to client
 */
import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { loadJysonContextForSession } from '@/lib/jyson-bridge/load-jyson-context'
import { isGeminiRetiredProxyError } from '@/lib/jyson/is-gemini-retired-proxy-error'
import {
  shouldStreamClaudeLocally,
  streamLocalClaudeChat,
} from '@/lib/jyson/local-chat-stream'
import {
  isVaultIntelligenceEnabled,
  resolveJdCommandVaultFromRows,
} from '@/lib/jyson/resolve-founder-vault-path'
import { retrieveVaultContextForQuery } from '@/lib/jyson/vault-context'
import { checkUsageLimit, recordUsageEvent } from '@/lib/usage/enforce'
import { listVaults } from '@/lib/actions/vaults'
import { createSupabaseAdmin } from '@/lib/supabase'

/** JYSON Core chat API. Local: optional JYSON_INTERNAL_API_URL when not using direct Claude. */
const JYSON_API_URL = (
  process.env.JYSON_INTERNAL_API_URL
  ?? process.env.NEXT_PUBLIC_JYSON_URL
  ?? 'https://jyson.vercel.app'
).replace(/\/$/, '')

export const runtime = 'nodejs'
export const maxDuration = 60

type VaultRow = {
  id: string
  name: string
  vault_type: string | null
  local_path: string | null
  last_synced_at: string | null
  file_count: number
}

function buildAccessContextBlock(
  ctx: Awaited<ReturnType<typeof loadJysonContextForSession>>['context'],
  vaults: VaultRow[],
): string {
  if (!ctx) return ''

  const orgs = ctx.organizations.map((o) => `  - ${o.name}`).join('\n') || '  (none yet)'
  const products = ctx.products
    .map((p) => `  - ${p.name} [${p.type}]`)
    .join('\n') || '  (none yet)'
  const experiences = ctx.experiences
    .map((e) => `  - ${e.name}${e.url ? ` → ${e.url}` : ''}`)
    .join('\n') || '  (none yet)'

  const vaultLines = vaults.length
    ? vaults.map((v) => {
        const synced = v.last_synced_at ? `last synced ${new Date(v.last_synced_at).toLocaleDateString()}` : 'not yet synced'
        const path = v.local_path ? ` at ${v.local_path}` : ''
        return `  - ${v.name} [${v.vault_type ?? 'vault'}]${path} — ${v.file_count} files, ${synced}`
      }).join('\n')
    : '  (no vaults connected yet)'

  const connectorLine = ctx.companionState?.connectorOnline
    ? 'online (OpenJarvis live tools available)'
    : 'offline (OpenJarvis live tools unavailable — does NOT block vault excerpt Q&A)'

  return `
[JYSON RUNTIME — ACCESS CONTEXT]
You are speaking with ${ctx.identity.displayName}.
Their ACCESS handle is: ${ctx.handle}
Their Founder OS: ${ctx.userSystemId ?? 'pending generation'}
Cloud package: ${ctx.companionState?.cloudReady ? 'ready' : 'pending'}
Local connector: ${connectorLine}

KNOWLEDGE VAULTS (Obsidian / JD Command Vault on their Mac):
${vaultLines}

Vault intelligence in chat: when a later message includes [JYSON VAULT CONTENT] with excerpt bodies,
those excerpts ARE the vault read for this session — answer from them and cite paths.
Connector offline does NOT mean you cannot read vault notes for that turn.
Connector offline only blocks OpenJarvis live tools (read_file, list_files via connector), not excerpt-based Q&A.

Their registered world:
Organizations:
${orgs}

Products:
${products}

Experiences:
${experiences}

Context summary: ${ctx.summary.consumer}

You are their personal JYSON companion. Reference their actual organizations, products, vaults, and vault paths.
Do not be generic. When they ask "what am I building?" or "what's in my vault?" — answer from the context above.
[END ACCESS CONTEXT]
`.trim()
}

function lastUserMessageText(messages: Array<{ role: string; content: string }>): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === 'user' && messages[i].content?.trim()) {
      return messages[i].content.trim()
    }
  }
  return ''
}

async function proxyJysonToChunks(
  enrichedMessages: Array<{ role: string; content: string }>,
): Promise<{ ok: boolean; chunks: string[]; combinedText: string }> {
  const chunks: string[] = []
  let combinedText = ''

  const jysonRes = await fetch(`${JYSON_API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: enrichedMessages }),
    signal: AbortSignal.timeout(55_000),
  })

  if (!jysonRes.ok || !jysonRes.body) {
    return { ok: false, chunks: [], combinedText: '' }
  }

  const reader = jysonRes.body.getReader()
  const dec = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const piece = dec.decode(value)
    chunks.push(piece)
    for (const line of piece.split('\n')) {
      if (!line.startsWith('data: ')) continue
      const payload = line.slice(6).trim()
      if (!payload || payload === '[DONE]') continue
      try {
        const parsed = JSON.parse(payload) as { text?: string }
        if (parsed.text) combinedText += parsed.text
      } catch {
        // ignore non-JSON lines
      }
    }
  }

  return { ok: true, chunks, combinedText }
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

  const limitCheck = await checkUsageLimit('jyson_message')
  if (!limitCheck.allowed) {
    return new Response(
      `data: ${JSON.stringify({ text: `${limitCheck.reason} [Upgrade at ${limitCheck.upgradeHref}]` })}\n\ndata: [DONE]\n\n`,
      { status: 200, headers: { 'Content-Type': 'text/event-stream' } }
    )
  }

  void recordUsageEvent('jyson_message', { message_count: messages.length })

  const [{ context }, vaults] = await Promise.all([
    loadJysonContextForSession(),
    listVaults().catch(() => []),
  ])
  const contextBlock = buildAccessContextBlock(context, vaults)

  const vaultContextEnabled = isVaultIntelligenceEnabled()
  const query = lastUserMessageText(messages)
  let vaultContextBlock = ''
  let retrievedChunkCount = 0
  let firstSource: string | null = null
  let vaultPathSource: string | null = null
  let vaultRetrievalSource: string | null = null

  if (vaultContextEnabled && query) {
    const resolved = resolveJdCommandVaultFromRows(vaults)
    vaultPathSource = resolved.source
    const supabase = createSupabaseAdmin()

    if (resolved.vaultId || resolved.path) {
      const retrieved = await retrieveVaultContextForQuery({
        query,
        clerkUserId: userId,
        vaultRoot: resolved.path,
        vaultId: resolved.vaultId,
        supabase,
        vaultLabel: resolved.name ?? 'JD Command Vault',
      })
      vaultContextBlock = retrieved.block
      retrievedChunkCount = retrieved.chunkCount
      vaultRetrievalSource = retrieved.source
      const excerptMatch = vaultContextBlock.match(/### Excerpt 1: ([^\s(]+)/)
      firstSource = excerptMatch?.[1] ?? null
    } else {
      vaultContextBlock = `
[JYSON VAULT CONTENT — vault path unavailable]
No JD Command Vault is registered or indexed for this account.
Connect the vault in ACCESS → Vaults and sync from your Mac (connector online).
Query focus: ${query.slice(0, 200)}
Do not invent vault facts. Do not output a DISCOVERY REPORT for this turn.
[END JYSON VAULT CONTENT]`.trim()
      vaultRetrievalSource = 'none'
    }
  }

  const preamble: Array<{ role: string; content: string }> = []
  if (contextBlock) {
    preamble.push({ role: 'user', content: contextBlock })
    preamble.push({
      role: 'assistant',
      content: "Understood. I have your ACCESS context loaded. I'm ready.",
    })
  }
  if (vaultContextBlock) {
    preamble.push({ role: 'user', content: vaultContextBlock })
    preamble.push({
      role: 'assistant',
      content:
        'Understood. I have grounded vault excerpts with full note text. I will answer from those excerpts, cite paths, and will not ask you to connect the connector for vault Q&A on this turn.',
    })
  }

  const enrichedMessages = preamble.length > 0 ? [...preamble, ...messages] : messages
  const finalPromptHasVaultContext = enrichedMessages.some((m) =>
    m.content.includes('[JYSON VAULT CONTENT'),
  )
  const useLocalClaude = shouldStreamClaudeLocally()

  const logVaultChat =
    process.env.NODE_ENV === 'development' || process.env.VERCEL === '1'
  if (logVaultChat) {
    console.info('[jyson/chat]', {
      jysonApiUrl: useLocalClaude ? '(local Claude in ACCESS)' : JYSON_API_URL,
      useLocalClaude,
      query: query.slice(0, 120),
      vaultContextEnabled,
      vaultPathSource,
      vaultRetrievalSource,
      retrievedChunkCount,
      firstSource,
      finalPromptHasVaultContext,
      deployment: process.env.VERCEL === '1' ? 'vercel' : 'local',
    })
  }

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      const enqueue = (s: string) => controller.enqueue(enc.encode(s))

      const runLocal = async (reason?: string) => {
        if (reason && process.env.NODE_ENV === 'development') {
          console.info('[jyson/chat] local Claude:', reason)
        }
        await streamLocalClaudeChat(enrichedMessages, enqueue)
      }

      try {
        if (useLocalClaude) {
          await runLocal('PRIVATE_JYSON + ANTHROPIC_API_KEY')
          return
        }

        const proxied = await proxyJysonToChunks(enrichedMessages)

        if (!proxied.ok) {
          if (process.env.ANTHROPIC_API_KEY?.trim()) {
            await runLocal('JYSON proxy unavailable')
          } else {
            enqueue(`data: ${JSON.stringify({ text: 'JYSON unavailable. Add ANTHROPIC_API_KEY to access-app/.env.local for local orb chat.' })}\n\ndata: [DONE]\n\n`)
          }
          return
        }

        const geminiStale = isGeminiRetiredProxyError(proxied.combinedText)
        if (geminiStale && process.env.ANTHROPIC_API_KEY?.trim()) {
          await runLocal('retired Gemini error from JYSON proxy — retrying with Claude')
          return
        }

        for (const chunk of proxied.chunks) {
          enqueue(chunk)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Connection failed.'
        if (process.env.ANTHROPIC_API_KEY?.trim()) {
          try {
            await runLocal(`error fallback: ${msg}`)
          } catch (localErr) {
            const localMsg = localErr instanceof Error ? localErr.message : 'Local Claude failed.'
            enqueue(`data: ${JSON.stringify({ text: `\n\n[JYSON Error: ${localMsg}]` })}\n\ndata: [DONE]\n\n`)
          }
        } else {
          enqueue(`data: ${JSON.stringify({ text: `\n\n[JYSON Error: ${msg}]` })}\n\ndata: [DONE]\n\n`)
        }
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
      'X-JYSON-Harness': useLocalClaude ? 'access-local-claude' : 'access-runtime',
    },
  })
}
