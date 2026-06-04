import Anthropic from '@anthropic-ai/sdk'
import { isPrivateJysonEnabled } from '@/lib/openjarvis/load-bridge'

export type JysonChatMessage = { role: string; content: string }

/** Default companion — aligned with jyson/api/chat.ts */
const JYSON_BASE_SYSTEM_PROMPT = `You are JYSON — the founder's intelligence companion inside ACCESS (Jerry Devin's operating system).

You are helpful, clear, and conversational — like a strong general assistant (ChatGPT / Claude / Gemini), not a rigid report generator.

Default behavior:
- Answer the user's actual question directly in natural language.
- Support follow-up turns: use conversation history; do not reset into a template each message.
- You may discuss technology, business, creativity, learning, planning, and everyday questions.
- When the user wants systems architecture or value mapping, offer structured thinking — only when they ask for it or the topic clearly calls for it.
- Be concise unless they ask for depth. No filler affirmations.

ACCESS context:
- When messages include [JYSON RUNTIME — ACCESS CONTEXT], use their real organizations, products, vaults, and handle — stay specific, not generic.
- You do not browse private files unless excerpts are provided in the thread.

Security:
- Never claim access to private email, calendar, or financial accounts.
- If asked to expose private data you do not have: say you only use what appears in this conversation and connected vault excerpts.`

const VAULT_OVERLAY_PROMPT = `VAULT GROUNDING (this turn includes [JYSON VAULT CONTENT] excerpts from JD Command Vault / Obsidian):
- The excerpt bodies ARE the vault read for this session. Use their markdown text directly.
- Ground answers in those excerpts when the user asks about priorities, today, projects in the vault, strategy notes, or founder files.
- Cite source paths (e.g. daily/today.md, brain/priorities.md) when you use a fact.
- Do NOT invent vault content not present in the excerpts.
- If excerpts say none matched, say so plainly — do not fabricate priorities.
- If ACCESS context says connector offline, that affects OpenJarvis live tools only — NOT excerpt-based vault Q&A.
- NEVER tell the user that connector offline prevents reading vault notes when excerpt bodies are present.
- Stay conversational; do not output DISCOVERY REPORT or mandatory architecture templates unless explicitly requested.`

function messagesHaveVaultGrounding(messages: JysonChatMessage[]): boolean {
  return messages.some((m) => m.content.includes('[JYSON VAULT CONTENT'))
}

function messagesHaveAccessContext(messages: JysonChatMessage[]): boolean {
  return messages.some((m) => m.content.includes('[JYSON RUNTIME — ACCESS CONTEXT]'))
}

function resolveSystemPrompt(messages: JysonChatMessage[]): string {
  const parts = [JYSON_BASE_SYSTEM_PROMPT]

  if (messagesHaveVaultGrounding(messages)) {
    parts.push(VAULT_OVERLAY_PROMPT)
  }

  if (messagesHaveAccessContext(messages) && !messagesHaveVaultGrounding(messages)) {
    parts.push(
      'The thread includes ACCESS runtime context — reference their real workspace when relevant.',
    )
  }

  return parts.join('\n\n')
}

/** Local orb chat: Claude in ACCESS when API key is set (avoids cloud proxy / retired Gemini). */
export function shouldStreamClaudeLocally(): boolean {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) return false
  if (isPrivateJysonEnabled()) return true
  return true
}

function toClaudeRole(role: string): 'user' | 'assistant' {
  return role === 'assistant' ? 'assistant' : 'user'
}

function encodeSseText(text: string): string {
  return `data: ${JSON.stringify({ text })}\n\n`
}

/**
 * Stream Claude SSE chunks (`data: {"text":...}`) compatible with the orb client.
 */
export async function streamLocalClaudeChat(
  messages: JysonChatMessage[],
  onSseChunk: (encoded: string) => void,
): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured in access-app')
  }

  const anthropic = new Anthropic({ apiKey })
  const system = resolveSystemPrompt(messages)
  const claudeMessages = messages.map((m) => ({
    role: toClaudeRole(m.role),
    content: m.content,
  }))

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: claudeMessages as any,
  })

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      onSseChunk(encodeSseText(chunk.delta.text))
    }
  }

  onSseChunk('data: [DONE]\n\n')
}
