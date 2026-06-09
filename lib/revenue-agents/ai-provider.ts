/**
 * AI Provider — Optimized fallback chain for revenue agents.
 *
 * Gemini 3.1 Pro (smartest) → Gemini 3.5 Flash (fast) → Anthropic Claude → Ollama
 *
 * Optimizations:
 *   - Transient error retry (503/429 → retry once with 2s backoff)
 *   - Rate-limit cooldown tracking (skip models on cooldown)
 *   - SCOUTs route Flash-first for speed + no guardrails
 *   - Ollama is absolute last resort (slowest)
 */

const SMART_MODEL = 'gemini-3.1-pro-preview'
const FAST_MODEL = 'gemini-3.5-flash'
const ANTHROPIC_MODEL = 'claude-sonnet-4-6'
const OLLAMA_MODEL = 'qwen2.5-coder:7b'
const OLLAMA_ENDPOINT = 'http://127.0.0.1:11434'
const FETCH_TIMEOUT = 180000
const OLLAMA_TIMEOUT = 300000
const DEFAULT_MAX_TOKENS = 16384
const COOLDOWN_MS = 5000
const RETRY_DELAY_MS = 2000
const MAX_RETRIES = 1

interface AiResponse {
  content: string
  provider: 'gemini-pro' | 'gemini-flash' | 'anthropic' | 'ollama'
}

const cooldowns = new Map<string, number>()

function isOnCooldown(model: string): boolean {
  const until = cooldowns.get(model)
  if (!until) return false
  if (Date.now() >= until) {
    cooldowns.delete(model)
    return false
  }
  return true
}

function setCooldown(model: string): void {
  cooldowns.set(model, Date.now() + COOLDOWN_MS)
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

function isTransient(status: number): boolean {
  return status === 429 || status === 503
}

async function tryGemini(model: string, systemPrompt: string, userPrompt: string, options?: { json?: boolean; maxTokens?: number }): Promise<AiResponse | null> {
  const key = process.env.GOOGLE_API_KEY?.trim()
  if (!key) return null
  if (isOnCooldown(model)) return null

  const attempt = async (): Promise<AiResponse | null> => {
    try {
      const body: Record<string, unknown> = {
        contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
          ...(options?.json ? { responseMimeType: 'application/json' } : {}),
        },
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        }
      )
      clearTimeout(timeout)

      if (!res.ok) {
        const errBody = await res.text().catch(() => '')
        if (isTransient(res.status)) {
          setCooldown(model)
          throw new Error(`Gemini ${model} transient ${res.status}`)
        }
        throw new Error(`Gemini ${model} error ${res.status}: ${errBody.slice(0, 200)}`)
      }

      const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
      if (!text) throw new Error('Empty Gemini response')
      return {
        content: text,
        provider: model === SMART_MODEL ? 'gemini-pro' : 'gemini-flash',
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`[ai-provider] Gemini ${model} failed:`, msg)
      return null
    }
  }

  for (let i = 0; i <= MAX_RETRIES; i++) {
    const result = await attempt()
    if (result) return result
    if (i < MAX_RETRIES) await sleep(RETRY_DELAY_MS)
  }
  return null
}

async function tryAnthropic(systemPrompt: string, userPrompt: string, options?: { maxTokens?: number }): Promise<AiResponse | null> {
  const key = process.env.ANTHROPIC_API_KEY?.trim()
  if (!key) return null
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: options?.maxTokens ?? 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      const errBody = await res.text()
      throw new Error(`Anthropic error ${res.status}: ${errBody.slice(0, 200)}`)
    }

    const data = await res.json() as { content: { text: string }[] }
    return { content: data.content?.map(c => c.text).join('') ?? '', provider: 'anthropic' }
  } catch (err) {
    console.warn('[ai-provider] Anthropic failed:', err instanceof Error ? err.message : String(err))
    return null
  }
}

async function tryOllama(systemPrompt: string, userPrompt: string, options?: { maxTokens?: number }): Promise<AiResponse | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT)
    const res = await fetch(`${OLLAMA_ENDPOINT}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
        options: { temperature: 0.5, num_predict: options?.maxTokens ?? 2048 },
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      const errText = await res.text().catch(() => 'no body')
      throw new Error(`Ollama error ${res.status}: ${errText.slice(0, 200)}`)
    }
    const data = await res.json() as { message: { content: string } }
    return { content: data.message.content, provider: 'ollama' }
  } catch (err) {
    console.warn('[ai-provider] Ollama failed:', err instanceof Error ? err.message : String(err))
    return null
  }
}

export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  options?: { json?: boolean; maxTokens?: number }
): Promise<AiResponse> {
  const isScout = systemPrompt.includes('SCOUT-')

  let result: AiResponse | null = null

  if (isScout) {
    result = await tryGemini(FAST_MODEL, systemPrompt, userPrompt, options)
    if (!result) result = await tryGemini(SMART_MODEL, systemPrompt, userPrompt, options)
    if (!result) result = await tryOllama(systemPrompt, userPrompt, options)
    if (!result) result = await tryAnthropic(systemPrompt, userPrompt, options)
  } else {
    result = await tryGemini(SMART_MODEL, systemPrompt, userPrompt, options)
    if (!result) result = await tryGemini(FAST_MODEL, systemPrompt, userPrompt, options)
    if (!result) result = await tryAnthropic(systemPrompt, userPrompt, options)
    if (!result) result = await tryOllama(systemPrompt, userPrompt, options)
  }

  if (!result) {
    throw new Error('All AI providers failed: Gemini Pro, Gemini Flash, Anthropic, Ollama.')
  }
  return result
}

export async function generateJson<T>(
  systemPrompt: string,
  userPrompt: string,
  options?: { maxTokens?: number }
): Promise<{ data: T; provider: string }> {
  // Non-Gemini fallbacks can't use responseMimeType, so append format instruction to prompt
  const enhancedUserPrompt = `${userPrompt}\n\nRespond with ONLY valid JSON. No markdown, no explanation, no code fences. Just raw JSON.`
  const result = await generateText(systemPrompt, enhancedUserPrompt, { json: true, maxTokens: options?.maxTokens })

  // Multi-stage extraction — handle every provider's output style
  const extract = (text: string): string => {
    // Strip code fences
    let t = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    // Strip "here is" / "sure" / explanatory prefix
    t = t.replace(/^(here['’]?s|sure|okay|ok|here are|certainly|absolutely)[:\s]*/i, '')
    // Strip any text before first { or [
    const objStart = t.search(/[{[]/)
    if (objStart > 0) t = t.slice(objStart)
    // Strip any text after last } or ]
    const objEnd = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'))
    if (objEnd >= 0) t = t.slice(0, objEnd + 1)
    return t.trim()
  }

  const cleaned = extract(result.content)
  if (!cleaned) {
    throw new Error(`AI returned empty after extraction:\n${result.content.slice(0, 300)}`)
  }

  try {
    const parsed = JSON.parse(cleaned) as T
    return { data: parsed, provider: result.provider }
  } catch {
    throw new Error(`AI returned invalid JSON (provider: ${result.provider}):\n${cleaned.slice(0, 500)}`)
  }
}
