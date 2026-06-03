'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type Role = 'user' | 'jyson'

interface Message {
  id: number
  role: Role
  text: string
  streaming?: boolean
}

let _id = 0
function nextId() { return ++_id }

const WELCOME: Message = {
  id: nextId(),
  role: 'jyson',
  text: 'Your ACCESS world is loaded. Tell me about what you\'re building, or ask me anything.',
}

interface JysonChatPanelProps {
  handle: string
  cloudReady: boolean
  localConnected: boolean
}

export default function JysonChatPanel({ handle, cloudReady, localConnected }: JysonChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || streaming) return

    setInput('')
    setStreaming(true)

    const userMsg: Message = { id: nextId(), role: 'user', text: trimmed }
    setMessages((prev) => [...prev, userMsg])

    const jysonMsgId = nextId()
    const placeholder: Message = { id: jysonMsgId, role: 'jyson', text: '', streaming: true }
    setMessages((prev) => [...prev, placeholder])

    const history = messages
      .filter((m) => !m.streaming)
      .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }))
    history.push({ role: 'user', content: trimmed })

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/jyson/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === jysonMsgId
              ? { ...m, text: 'JYSON is unavailable right now.', streaming: false }
              : m
          )
        )
        return
      }

      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = dec.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data) as { text?: string }
            if (parsed.text) {
              accumulated += parsed.text
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === jysonMsgId
                    ? { ...m, text: accumulated, streaming: true }
                    : m
                )
              )
            }
          } catch { /* partial chunk */ }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === jysonMsgId ? { ...m, streaming: false } : m
        )
      )
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setMessages((prev) =>
        prev.map((m) =>
          m.id === jysonMsgId
            ? { ...m, text: 'Connection interrupted.', streaming: false }
            : m
        )
      )
    } finally {
      setStreaming(false)
      inputRef.current?.focus()
    }
  }, [messages, streaming])

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send(input)
    }
  }

  return (
    <div className="jyson-chat-panel">
      <div className="jyson-chat-meta">
        <span className="jyson-chat-handle">{handle}</span>
        <span className={`jyson-chat-status ${cloudReady ? 'ok' : 'pending'}`}>
          {cloudReady ? '◈ Cloud' : '○ Cloud pending'}
        </span>
        <span className={`jyson-chat-status ${localConnected ? 'ok' : 'pending'}`}>
          {localConnected ? '◉ Local' : '○ Local pending'}
        </span>
      </div>

      <div className="jyson-chat-history">
        {messages.map((msg) => (
          <div key={msg.id} className={`jyson-chat-message jyson-chat-message--${msg.role}`}>
            <span className="jyson-chat-role">
              {msg.role === 'user' ? 'You' : 'JYSON'}
            </span>
            <div className="jyson-chat-text">
              {msg.text}
              {msg.streaming && <span className="cursor" />}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        className="jyson-chat-input-row"
        onSubmit={(e) => { e.preventDefault(); void send(input) }}
      >
        <textarea
          ref={inputRef}
          className="jyson-chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Tell JYSON what you're working on…"
          rows={2}
          disabled={streaming}
        />
        <button
          type="submit"
          className="jyson-chat-submit"
          disabled={streaming || !input.trim()}
        >
          {streaming ? '…' : '↵'}
        </button>
      </form>
      <p className="jyson-chat-footnote">Shift+Enter for new line · Enter to send</p>
    </div>
  )
}
