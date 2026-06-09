/**
 * WebSocket server for Twilio Media Streams ↔ Gemini Multimodal Live API.
 *
 * This bridges:
 *   Twilio (µ-law audio via WebSocket) → Gemini Multimodal Live API
 *   Gemini response → Twilio audio stream
 *
 * Deployment: This runs as a standalone WebSocket server, NOT inside Next.js.
 * Start with: npx tsx lib/communications/integrations/ws-server.ts
 *
 * Environment: GOOGLE_API_KEY required.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createSupabaseAdmin } from '../../supabase'

// Load environment variables locally if not already set (e.g. on Railway)
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env.local')
    const file = readFileSync(envPath, 'utf8')
    for (const line of file.split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const eq = t.indexOf('=')
      if (eq < 1) continue
      const k = t.slice(0, eq).trim()
      let v = t.slice(eq + 1).trim()
      const commentIdx = v.lastIndexOf('#')
      if (commentIdx >= 0) v = v.slice(0, commentIdx).trim()
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
      if (!process.env[k]) process.env[k] = v
    }
  } catch {
    // Fail silently if .env.local does not exist (e.g. in cloud production)
  }
}

loadEnv()

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY?.trim()
const GEMINI_WS_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent'
const SYSTEM_INSTRUCTION = `You are the AI receptionist for JD ACCESS. You answer calls professionally and warmly.

Greet: "Thank you for calling JD ACCESS. This is the AI receptionist, how can I help you today?"

Collect: name, company, phone, email, service interest, budget, timeline, how they heard.

Services: JD Productions (video/photo/content), Bridge Video (business video), ACCESS (AI/automation), REGAL (nonprofit).

End every call with a clear next step. Keep calls under 3 minutes. Never promise pricing.

If caller asks for Jerry: "I'll make sure Jerry gets your message."`

let streamSid = ''
let callSid = ''
let transcript = ''
let callStartTime = 0

export function handleTwilioMediaStream(ws: WebSocket): void {
  console.log('[Twilio Media Stream] Connected')

  let geminiWs: WebSocket | null = null

  // Connect to Gemini Multimodal Live API
  function connectGemini(systemInstruction: string) {
    if (!GOOGLE_API_KEY) {
      console.error('[Gemini] No API key — falling back to forward-only mode')
      return
    }

    const url = `${GEMINI_WS_URL}?key=${GOOGLE_API_KEY}`
    geminiWs = new WebSocket(url)

    geminiWs.onopen = () => {
      console.log('[Gemini] Connected')

      // Send setup message
      const setupPayload = {
        setup: {
          model: 'models/gemini-3.5-flash',
          generation_config: {
            temperature: 0.5,
            max_output_tokens: 4096,
          },
          system_instruction: {
            parts: [{ text: systemInstruction }],
          },
        },
      }
      geminiWs?.send(JSON.stringify(setupPayload))
    }

    geminiWs.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string)
        handleGeminiMessage(msg, ws)
      } catch (err) {
        console.error('[Gemini] Parse error:', err)
      }
    }

    geminiWs.onerror = (err) => {
      console.error('[Gemini] Error:', err)
    }

    geminiWs.onclose = () => {
      console.log('[Gemini] Disconnected')
      geminiWs = null
    }
  }

  // Handle incoming messages from Twilio
  ws.onmessage = async (event) => {
    try {
      const msg = JSON.parse(event.data as string)

      switch (msg.event) {
        case 'connected':
          console.log('[Twilio] Connected')
          break

        case 'start':
          streamSid = msg.streamSid
          callSid = msg.start?.callSid ?? ''
          callStartTime = Date.now()
          const customParams = msg.start?.customParameters || {}
          console.log(`[Twilio] Stream started — call ${callSid}`, customParams)

          // Load custom instruction script if outbound
          let activeInstruction = SYSTEM_INSTRUCTION
          if (customParams.direction === 'outbound' && customParams.leadId) {
            const supabase = createSupabaseAdmin()
            if (supabase) {
              const { data: lead } = await supabase
                .from('pipeline_leads')
                .select('*')
                .eq('id', customParams.leadId)
                .maybeSingle()

              if (lead) {
                const customScript = lead.raw_data?.callbacks?.[0]?.suggested_script ||
                                     lead.raw_data?.suggested_script ||
                                     lead.notes
                if (customScript) {
                  activeInstruction = `${customScript}\n\nKeep call under 3 minutes. Greet them by name: ${lead.first_name || ''}.`
                  console.log(`[Twilio] Loaded outbound callback instruction for ${lead.first_name || 'lead'}:`, activeInstruction)
                }
              }
            }
          }

          connectGemini(activeInstruction)
          break

        case 'media':
          // Forward audio to Gemini
          if (geminiWs?.readyState === WebSocket.OPEN) {
            geminiWs.send(JSON.stringify({
              realtime_input: {
                media_chunks: [{
                  mime_type: 'audio/wav',
                  data: msg.media?.payload ?? '',
                }],
              },
            }))
          }
          break

        case 'stop':
          console.log(`[Twilio] Stream ended — duration: ${(Date.now() - callStartTime) / 1000}s`)
          processCallEnd(ws)
          break
      }
    } catch (err) {
      console.error('[Handler] Error:', err)
    }
  }

  ws.onerror = (err) => {
    console.error('[Twilio] Error:', err)
  }

  ws.onclose = () => {
    console.log('[Twilio] Disconnected')
    geminiWs?.close()
  }
}

function handleGeminiMessage(msg: any, twilioWs: WebSocket): void {
  // Handle audio responses from Gemini — forward to Twilio
  if (msg.setupComplete) {
    console.log('[Gemini] Setup complete')
    return
  }

  if (msg.serverContent?.modelTurn?.parts) {
    for (const part of msg.serverContent.modelTurn.parts as any[]) {
      if (part.inlineData?.mimeType?.startsWith('audio/')) {
        // Forward audio response to Twilio
        if (twilioWs.readyState === WebSocket.OPEN) {
          twilioWs.send(JSON.stringify({
            event: 'media',
            streamSid,
            media: {
              payload: part.inlineData.data as string,
            },
          }))
        }
      }

      if (part.text) {
        transcript += (part.text as string) + ' '
      }
    }
  }

  if (msg.serverContent?.turnComplete) {
    console.log('[Gemini] Turn complete')
  }
}

async function processCallEnd(ws: WebSocket): Promise<void> {
  // Process the call via the voice-call-processor
  try {
    const { processVoiceCall } = await import('../services/voice-call-processor')

    await processVoiceCall({
      fromNumber: callSid,
      toNumber: streamSid,
      transcript: transcript.trim(),
      durationSeconds: Math.floor((Date.now() - callStartTime) / 1000),
    })
  } catch (err) {
    console.error('[Post-Call] Processing error:', err)
  }
}

// Standalone server entry point
export function startWebSocketServer(port = 8080): void {
  const { WebSocketServer } = require('ws')
  const http = require('http')
  const server = http.createServer()
  const wss = new WebSocketServer({ server })

  wss.on('connection', (ws: WebSocket) => {
    handleTwilioMediaStream(ws)
  })

  server.listen(port, () => {
    console.log(`[WS Server] Listening on ws://0.0.0.0:${port}`)
    console.log(`[WS Server] Twilio Media Stream endpoint: wss://your-domain.com:${port}`)
  })
}

// Auto-start if run directly
if (process.argv[1]?.endsWith('ws-server.mjs') || process.argv[1]?.endsWith('ws-server.ts')) {
  startWebSocketServer()
}
