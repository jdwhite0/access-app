'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { usePathname, useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { routeCompanionCommand } from '@/lib/jyson-bridge/companion-command-router'
import { pushRecentIntent } from '@/lib/design-system/components/platform/HomeCommandHero'
import { displayTextFromJysonReply } from '@/lib/design-system/components/platform'
import {
  buildContextLine,
  buildGreeting,
} from '@/lib/jyson-layer/context-lines'
import { resolveAccessPageContext } from '@/lib/access/page-context'
import { buildLayerOpener, recordLastPlace } from '@/lib/jyson-layer/contextual-awareness'
import { answerFromWorld, resolveNavIntent } from '@/lib/jyson-layer/route-intents'
import { readPanelCollapsed, writePanelCollapsed } from '@/lib/jyson-layer/storage'
import { resolvePrimaryNavId, resolveSettingsContext } from '@/lib/navigation/resolve-nav'
import { resolveCompanionContext } from '@/lib/navigation/resolve-nav'
import { useRegistryData } from '@/components/os/useRegistryData'
import {
  formatJysonChatReply,
  isJysonErrorReply,
} from '@/lib/jyson-layer/format-chat-error'
import {
  classifyJysonChatError,
  phaseHintFromHarnessHeader,
  startPreStreamPhaseTimer,
  type JysonProcessingError,
  type JysonProcessingPhase,
} from '@/lib/jyson-layer/processing-states'
import type { OpenJarvisRuntimeState } from '@/lib/openjarvis/resolve-runtime-state'
import type { JysonLayerContextValue, JysonLayerMessage, JysonRouteContext } from '@/lib/jyson-layer/types'

const JysonLayerContext = createContext<JysonLayerContextValue | null>(null)

let msgId = 0
function nextMsgId() {
  return `jyson-${++msgId}`
}

export function useJysonLayer(): JysonLayerContextValue {
  const ctx = useContext(JysonLayerContext)
  if (!ctx) throw new Error('useJysonLayer must be used within JysonLayerProvider')
  return ctx
}

export function useJysonLayerOptional(): JysonLayerContextValue | null {
  return useContext(JysonLayerContext)
}

type Props = { children: ReactNode }

type SubmitOptions = {
  skipUserMessage?: boolean
  anchorMessageId?: string
}

type RunChatHandlers = {
  stopPhaseTimer: () => void
  onStreamStart: () => void
  onPhase: (phase: JysonProcessingPhase) => void
}

export function JysonLayerProvider({ children }: Props) {
  const router = useRouter()
  const pathname = usePathname() ?? '/'
  const params = useParams()
  const { user, isLoaded } = useUser()
  const { summary, loading: summaryLoading } = useRegistryData(user, isLoaded)

  const [collapsed, setCollapsedState] = useState(true)
  const [messages, setMessages] = useState<JysonLayerMessage[]>([
    {
      id: nextMsgId(),
      role: 'jyson',
      text: 'Ask anything — general chat, vault priorities, or workspace navigation. I use your page context and vault excerpts when they apply.',
    },
  ])
  const [busy, setBusy] = useState(false)
  const [companionHash, setCompanionHash] = useState<string | null>(null)
  const [processingAnchorId, setProcessingAnchorId] = useState<string | null>(null)
  const [processingPhase, setProcessingPhase] = useState<JysonProcessingPhase>('idle')
  const [processingError, setProcessingError] = useState<JysonProcessingError | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [lastRetryText, setLastRetryText] = useState<string | null>(null)

  const streamStartedRef = useRef(false)
  const phaseTimerStopRef = useRef<(() => void) | null>(null)
  const lastUserAnchorIdRef = useRef<string | null>(null)

  const clearProcessing = useCallback(() => {
    phaseTimerStopRef.current?.()
    phaseTimerStopRef.current = null
    streamStartedRef.current = false
    setProcessingPhase('idle')
    setProcessingAnchorId(null)
    setProcessingError(null)
    setIsStreaming(false)
  }, [])

  const beginProcessing = useCallback(
    (anchorId: string) => {
      phaseTimerStopRef.current?.()
      streamStartedRef.current = false
      setProcessingError(null)
      setProcessingAnchorId(anchorId)
      setProcessingPhase('receiving')
      setIsStreaming(false)
      phaseTimerStopRef.current = startPreStreamPhaseTimer(
        (phase) => {
          if (!streamStartedRef.current) setProcessingPhase(phase)
        },
        () => streamStartedRef.current
      )
    },
    []
  )

  useEffect(() => {
    setCollapsedState(readPanelCollapsed())
  }, [])

  useEffect(() => {
    const readHash = () => {
      if (typeof window === 'undefined') return
      const h = window.location.hash.replace(/^#/, '')
      setCompanionHash(h || null)
    }
    readHash()
    window.addEventListener('hashchange', readHash)
    return () => window.removeEventListener('hashchange', readHash)
  }, [pathname])

  const setCollapsed = useCallback((next: boolean) => {
    setCollapsedState(next)
    writePanelCollapsed(next)
  }, [])

  const setOpen = useCallback(
    (next: boolean) => {
      setCollapsed(!next)
    },
    [setCollapsed]
  )

  const open = !collapsed

  const toggle = useCallback(() => setCollapsed(!collapsed), [collapsed, setCollapsed])

  const displayName =
    user?.firstName ??
    user?.fullName ??
    user?.username ??
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ??
    null

  const route: JysonRouteContext = useMemo(() => {
    const projectId =
      typeof params?.id === 'string' && pathname.startsWith('/projects')
        ? params.id
        : null
    return {
      pathname,
      primary: resolvePrimaryNavId(pathname),
      projectId,
      companionSection:
        pathname.startsWith('/companion') && companionHash
          ? resolveCompanionContext(companionHash) ?? companionHash
          : null,
      settingsSection: pathname.startsWith('/settings') || pathname.startsWith('/internal')
        ? resolveSettingsContext(pathname)
        : null,
    }
  }, [pathname, params, companionHash])

  useEffect(() => {
    recordLastPlace(pathname, route.primary)
  }, [pathname, route.primary])

  const contextLine = useMemo(
    () => buildContextLine(route, summary),
    [route, summary]
  )

  const greeting = useMemo(
    () => buildGreeting(displayName, summary),
    [displayName, summary]
  )

  const layerInsight = useMemo(
    () => buildLayerOpener(route, summary),
    [route, summary]
  )

  const pageContext = useMemo(
    () => resolveAccessPageContext(pathname),
    [pathname]
  )

  const runChat = useCallback(
    async (text: string, prior: JysonLayerMessage[], handlers: RunChatHandlers) => {
      const history = prior
        .filter((m) => m.role === 'user' || m.role === 'jyson')
        .map((m) => ({
          role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
          content: m.text,
        }))
      history.push({ role: 'user', content: text })

      const res = await fetch('/api/jyson/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })

      if (process.env.NODE_ENV === 'development') {
        const hint = phaseHintFromHarnessHeader(res.headers.get('X-JYSON-Harness'))
        if (hint && !streamStartedRef.current) handlers.onPhase(hint)
      }

      if (!res.ok || !res.body) {
        const errBody = await res.text().catch(() => '')
        const statusHint = errBody.trim()
          ? `${res.status}: ${errBody.slice(0, 200)}`
          : String(res.status)
        throw new Error(`JYSON cloud chat is unavailable (${statusHint}).`)
      }

      handlers.stopPhaseTimer()
      streamStartedRef.current = true
      handlers.onStreamStart()

      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let accumulated = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of dec.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data) as { text?: string }
            if (parsed.text) accumulated += parsed.text
          } catch {
            /* partial */
          }
        }
      }
      const reply = accumulated || '…'
      return formatJysonChatReply(reply)
    },
    []
  )

  const submitInternal = useCallback(
    async (text: string, options?: SubmitOptions) => {
      const trimmed = text.trim()
      if (!trimmed || busy) return
      setCollapsed(false)
      pushRecentIntent(trimmed)
      setLastRetryText(trimmed)

      let anchorId: string =
        options?.anchorMessageId ?? lastUserAnchorIdRef.current ?? nextMsgId()
      if (!options?.skipUserMessage) {
        anchorId = nextMsgId()
        lastUserAnchorIdRef.current = anchorId
        setMessages((prev) => [...prev, { id: anchorId, role: 'user', text: trimmed }])
      } else {
        lastUserAnchorIdRef.current = anchorId
      }

      beginProcessing(anchorId)
      setBusy(true)

      const stopPhaseTimer = () => {
        phaseTimerStopRef.current?.()
        phaseTimerStopRef.current = null
      }

      const chatHandlers: RunChatHandlers = {
        stopPhaseTimer,
        onStreamStart: () => {
          stopPhaseTimer()
          streamStartedRef.current = true
          setProcessingPhase('preparing')
          setIsStreaming(true)
        },
        onPhase: setProcessingPhase,
      }

      let pendingError: JysonProcessingError | null = null

      try {
        const nav = resolveNavIntent(trimmed)
        if (nav) {
          setMessages((prev) => [...prev, { id: nextMsgId(), role: 'jyson', text: nav.ack }])
          router.push(nav.href)
          return
        }

        const routeResult = routeCompanionCommand(trimmed)
        if (routeResult.kind === 'clarify') {
          setMessages((prev) => [
            ...prev,
            { id: nextMsgId(), role: 'jyson', text: routeResult.message },
          ])
          return
        }

        if (routeResult.kind === 'execute') {
          setProcessingPhase('reading_context')
          const healthRes = await fetch('/api/jyson/openjarvis/health', { cache: 'no-store' })
          const healthBody = (await healthRes.json().catch(() => ({}))) as OpenJarvisRuntimeState & {
            runtime?: OpenJarvisRuntimeState
          }
          const runtime = healthBody.runtime ?? healthBody
          if (!runtime.localToolsAvailable) {
            const hint = [runtime.message, runtime.setupHint].filter(Boolean).join(' ')
            setMessages((prev) => [
              ...prev,
              {
                id: nextMsgId(),
                role: 'jyson',
                text:
                  hint ||
                  'File tools on this Mac are not on yet. Open Agents → set up on this Mac, or keep chatting — vault excerpts still work without file tools.',
              },
            ])
            return
          }

          const res = await fetch('/api/jyson/openjarvis/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              toolId: routeResult.toolId,
              params: routeResult.params,
            }),
          })
          const body = (await res.json()) as {
            success?: boolean
            runtimeCard?: { success?: boolean; error?: string }
            error?: string
          }
          const ok = body.success && body.runtimeCard?.success
          const reply = ok
            ? `Done — ${routeResult.intent}`
            : body.runtimeCard?.error ?? body.error ?? 'Execution failed.'
          setMessages((prev) => [...prev, { id: nextMsgId(), role: 'jyson', text: reply }])
          return
        }

        const world = answerFromWorld(trimmed, summary)
        if (world) {
          setMessages((prev) => [...prev, { id: nextMsgId(), role: 'jyson', text: world }])
          return
        }

        const prior = [...messages, { id: nextMsgId(), role: 'user' as const, text: trimmed }]
        const reply = await runChat(trimmed, prior, chatHandlers)
        const summaryText = displayTextFromJysonReply(reply)

        if (
          isJysonErrorReply(reply) ||
          /vault path unavailable|no jd command vault path was found/i.test(reply)
        ) {
          pendingError = classifyJysonChatError(reply)
          setMessages((prev) => [
            ...prev,
            { id: nextMsgId(), role: 'jyson', text: summaryText || reply },
          ])
        } else {
          setMessages((prev) => [
            ...prev,
            { id: nextMsgId(), role: 'jyson', text: summaryText || reply },
          ])
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Connection failed.'
        pendingError = classifyJysonChatError(msg, 0)
        setMessages((prev) => [
          ...prev,
          { id: nextMsgId(), role: 'jyson', text: 'Something went wrong. Try again.' },
        ])
      } finally {
        stopPhaseTimer()
        setBusy(false)
        setIsStreaming(false)
        streamStartedRef.current = false
        if (pendingError) {
          setProcessingError(pendingError)
          setProcessingPhase('idle')
        } else {
          clearProcessing()
        }
      }
    },
    [busy, messages, router, runChat, setCollapsed, summary, beginProcessing, clearProcessing]
  )

  const submit = useCallback(
    (text: string) => submitInternal(text),
    [submitInternal]
  )

  const retryLastSubmit = useCallback(() => {
    if (!lastRetryText || busy) return
    setProcessingError(null)
    void submitInternal(lastRetryText, { skipUserMessage: true })
  }, [lastRetryText, busy, submitInternal])

  const isProcessing = busy && processingAnchorId !== null

  const value: JysonLayerContextValue = useMemo(
    () => ({
      open,
      collapsed,
      setOpen,
      setCollapsed,
      toggle,
      messages,
      busy,
      isProcessing,
      processingAnchorId,
      processingPhase,
      processingError,
      isStreaming,
      submit,
      retryLastSubmit,
      contextLine,
      greeting,
      summary,
      summaryLoading,
      route,
      displayName,
      layerInsight,
      pageContext,
    }),
    [
      open,
      collapsed,
      setOpen,
      setCollapsed,
      toggle,
      messages,
      busy,
      isProcessing,
      processingAnchorId,
      processingPhase,
      processingError,
      isStreaming,
      submit,
      retryLastSubmit,
      contextLine,
      greeting,
      summary,
      summaryLoading,
      route,
      displayName,
      layerInsight,
      pageContext,
    ]
  )

  return (
    <JysonLayerContext.Provider value={value}>{children}</JysonLayerContext.Provider>
  )
}
