'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { usePathname, useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { routeCompanionCommand } from '@/lib/jyson-bridge/companion-command-router'
import { pushRecentIntent } from '@/lib/design-system/components/platform/HomeCommandHero'
import { sectionsFromMessage } from '@/lib/design-system/components/platform'
import {
  buildContextLine,
  buildGreeting,
} from '@/lib/jyson-layer/context-lines'
import { resolveAccessPageContext } from '@/lib/access/page-context'
import { buildLayerOpener, recordLastPlace } from '@/lib/jyson-layer/contextual-awareness'
import { answerFromWorld, resolveNavIntent } from '@/lib/jyson-layer/route-intents'
import { readLayerOpen, writeLayerOpen } from '@/lib/jyson-layer/storage'
import { resolvePrimaryNavId, resolveSettingsContext } from '@/lib/navigation/resolve-nav'
import { resolveCompanionContext } from '@/lib/navigation/resolve-nav'
import { useRegistryData } from '@/components/os/useRegistryData'
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

export function JysonLayerProvider({ children }: Props) {
  const router = useRouter()
  const pathname = usePathname() ?? '/'
  const params = useParams()
  const { user, isLoaded } = useUser()
  const { summary, loading: summaryLoading } = useRegistryData(user, isLoaded)

  const [open, setOpenState] = useState(false)
  const [messages, setMessages] = useState<JysonLayerMessage[]>([
    {
      id: nextMsgId(),
      role: 'jyson',
      text: 'Ask anything — I know which page you are on, what is in your workspace, and your local tools when connected.',
    },
  ])
  const [busy, setBusy] = useState(false)
  const [companionHash, setCompanionHash] = useState<string | null>(null)

  useEffect(() => {
    setOpenState(readLayerOpen())
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

  const setOpen = useCallback((next: boolean) => {
    setOpenState(next)
    writeLayerOpen(next)
  }, [])

  const toggle = useCallback(() => setOpen(!open), [open, setOpen])

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

  const runChat = useCallback(async (text: string, prior: JysonLayerMessage[]) => {
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
    if (!res.ok || !res.body) {
      return 'JYSON cloud chat is unavailable right now.'
    }
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
    return accumulated || '…'
  }, [])

  const submit = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || busy) return
      setOpen(true)
      pushRecentIntent(trimmed)
      setMessages((prev) => [...prev, { id: nextMsgId(), role: 'user', text: trimmed }])
      setBusy(true)

      try {
        const nav = resolveNavIntent(trimmed)
        if (nav) {
          setMessages((prev) => [...prev, { id: nextMsgId(), role: 'jyson', text: nav.ack }])
          router.push(nav.href)
          return
        }

        const world = answerFromWorld(trimmed, summary)
        if (world) {
          setMessages((prev) => [...prev, { id: nextMsgId(), role: 'jyson', text: world }])
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

        const prior = [...messages, { id: nextMsgId(), role: 'user' as const, text: trimmed }]
        const reply = await runChat(trimmed, prior)
        const structured = sectionsFromMessage(reply)
        const summaryText = [
          structured.situation,
          structured.recommendation,
          structured.nextAction,
        ]
          .filter(Boolean)
          .join('\n\n')
        setMessages((prev) => [
          ...prev,
          { id: nextMsgId(), role: 'jyson', text: summaryText || reply },
        ])
      } catch {
        setMessages((prev) => [
          ...prev,
          { id: nextMsgId(), role: 'jyson', text: 'Something went wrong. Try again.' },
        ])
      } finally {
        setBusy(false)
      }
    },
    [busy, messages, router, runChat, setOpen, summary]
  )

  const value: JysonLayerContextValue = useMemo(
    () => ({
      open,
      setOpen,
      toggle,
      messages,
      busy,
      submit,
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
      setOpen,
      toggle,
      messages,
      busy,
      submit,
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
