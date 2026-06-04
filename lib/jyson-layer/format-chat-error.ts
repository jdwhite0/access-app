/**
 * Normalize JYSON / provider errors for the persistent chat layer.
 * Google SDK messages are long; surface the actionable line for the user.
 */
export function formatJysonChatReply(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return text

  const marker = '[JYSON Error:'
  const idx = trimmed.indexOf(marker)
  if (idx === -1) return text

  const raw = trimmed.slice(idx + marker.length).replace(/\]\s*$/, '').trim()

  const modelNotFound = /models\/([^\s]+)\s+is not found/i.exec(raw)
    ?? /Model\s+([^\s]+)\s+is retired/i.exec(raw)
  if (modelNotFound) {
    return [
      'JYSON hit a retired Gemini model on the JYSON API (research route).',
      `Model "${modelNotFound[1]}" is not available.`,
      'Vault Q&A should use Claude — update jyson and redeploy, or point ACCESS at local JYSON:',
      '  jyson/: vercel dev  →  access-app/.env.local: JYSON_INTERNAL_API_URL=http://127.0.0.1:3000',
      '  jyson Vercel env: GEMINI_MODEL=gemini-2.5-flash (then redeploy jyson.vercel.app)',
    ].join('\n')
  }

  const googleErr = /\[GoogleGenerativeAI Error\]:\s*(.+)/i.exec(raw)
  if (googleErr) {
    const line = googleErr[1].split(/\n/)[0]?.trim() ?? googleErr[1]
    return `JYSON cloud error: ${line}`
  }

  if (raw.length > 480) {
    return `JYSON cloud error: ${raw.slice(0, 480)}…`
  }

  return `JYSON cloud error: ${raw}`
}

export function isJysonErrorReply(text: string): boolean {
  return text.includes('[JYSON Error:') || text.startsWith('JYSON cloud error:')
}
