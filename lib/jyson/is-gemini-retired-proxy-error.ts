/**
 * Detect stale JYSON cloud responses that still call retired Gemini 1.5 models.
 * Used to auto-fallback to ACCESS-local Claude when ANTHROPIC_API_KEY is set.
 */
export function isGeminiRetiredProxyError(text: string): boolean {
  const lower = text.toLowerCase()
  if (!lower.includes('gemini')) return false

  const retiredSignals = [
    /gemini-1\.5/i,
    /models\/gemini[^.\s]*\s+is not found/i,
    /model\s+[^\s]+\s+is retired/i,
    /googlegenerativeai error/i,
    /\[jyson error:/i,
  ]

  return retiredSignals.some((re) => re.test(text))
}
