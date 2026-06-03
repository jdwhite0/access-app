'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import type { OpenJarvisRuntimeCard } from '@/lib/openjarvis-bridge/runtime-card'
import type { OpenJarvisRuntimeState } from '@/lib/openjarvis/resolve-runtime-state'
import JysonRuntimeCard from '@/components/jyson/JysonRuntimeCard'

type ToolParamSpec = {
  type: string
  description: string
  required: boolean
}

type CatalogTool = {
  id: string
  label: string
  category: string
  description?: string
  requiredAction: string
  requiresConfirmation: boolean
  mutates?: boolean
  params?: Record<string, ToolParamSpec>
}

type ToolsPayload = {
  tools: CatalogTool[]
  runtime: OpenJarvisRuntimeState
}

type ExecutePayload = {
  success: boolean
  error?: string
  requiresConfirmation?: boolean
  confirmationPrompt?: string
  runtimeCard?: OpenJarvisRuntimeCard
}

function defaultParamValue(toolId: string, paramName: string): string {
  if (paramName === 'path') {
    if (toolId === 'read_file' || toolId === 'write_file') return 'README.md'
    return ''
  }
  if (paramName === 'directory' && toolId === 'list_files') return '.'
  if (paramName === 'notePath') return 'vault-seeds/README.md'
  if (paramName === 'model' && toolId === 'run_local_model') return 'qwen2.5-coder:7b'
  if (paramName === 'days') return '7'
  if (paramName === 'limit') return '10'
  return ''
}

function buildInitialParams(tool: CatalogTool): Record<string, string> {
  const entries = Object.entries(tool.params ?? {})
  return Object.fromEntries(
    entries.map(([name, spec]) => [name, defaultParamValue(tool.id, name) || (spec.type === 'number' ? '0' : '')])
  )
}

type CompanionExecutePanelProps = {
  /** Optional hint for which ACCESS actions the user holds (server gate is authoritative). */
  allowedActions?: string[]
  /** When true, omit primary heading — parent drawer supplies "Advanced OpenJarvis Tools". */
  advancedOnly?: boolean
}

export default function CompanionExecutePanel({
  allowedActions,
  advancedOnly = false,
}: CompanionExecutePanelProps) {
  const [catalog, setCatalog] = useState<ToolsPayload | null>(null)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [catalogLoading, setCatalogLoading] = useState(true)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [paramValues, setParamValues] = useState<Record<string, string>>({})
  const [userConfirmed, setUserConfirmed] = useState(false)

  const [executing, setExecuting] = useState(false)
  const [executeError, setExecuteError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<ExecutePayload | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true)
    setCatalogError(null)
    try {
      const res = await fetch('/api/jyson/openjarvis/tools', { cache: 'no-store' })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `Tools catalog failed (${res.status})`)
      }
      const data = (await res.json()) as ToolsPayload
      setCatalog(data)
      setSelectedId((prev) => {
        const id =
          prev && data.tools.some((t) => t.id === prev) ? prev : (data.tools[0]?.id ?? null)
        return id
      })
    } catch (err) {
      setCatalog(null)
      setCatalogError(err instanceof Error ? err.message : 'Failed to load tools')
    } finally {
      setCatalogLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCatalog()
  }, [loadCatalog])

  useEffect(() => {
    if (!catalog || !selectedId) return
    const tool = catalog.tools.find((t) => t.id === selectedId)
    if (!tool) return
    setParamValues((prev) => (Object.keys(prev).length > 0 ? prev : buildInitialParams(tool)))
  }, [catalog, selectedId])

  const selectedTool = useMemo(
    () => catalog?.tools.find((t) => t.id === selectedId) ?? null,
    [catalog, selectedId]
  )

  const allowedSet = useMemo(() => new Set(allowedActions ?? []), [allowedActions])

  function selectTool(tool: CatalogTool) {
    setSelectedId(tool.id)
    setParamValues(buildInitialParams(tool))
    setUserConfirmed(false)
    setExecuteError(null)
    setLastResult(null)
  }

  async function onExecute(e: FormEvent) {
    e.preventDefault()
    if (!selectedTool || !catalog?.runtime.localToolsAvailable) return
    if (selectedTool.requiresConfirmation && !userConfirmed) {
      setExecuteError('Confirm this action before executing.')
      return
    }

    setExecuting(true)
    setExecuteError(null)
    setLastResult(null)

    const params: Record<string, unknown> = {}
    for (const [name, spec] of Object.entries(selectedTool.params ?? {})) {
      const raw = paramValues[name] ?? ''
      if (spec.type === 'number') {
        const n = Number(raw)
        if (raw !== '' && !Number.isNaN(n)) params[name] = n
        else if (spec.required) params[name] = 0
      } else if (raw !== '' || spec.required) {
        params[name] = raw
      }
    }

    try {
      const res = await fetch('/api/jyson/openjarvis/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: selectedTool.id,
          params,
          userConfirmed: selectedTool.requiresConfirmation ? userConfirmed : undefined,
        }),
      })
      const body = (await res.json()) as ExecutePayload & { error?: string }
      if (!res.ok && !body.runtimeCard) {
        setExecuteError(body.error ?? `Execute failed (${res.status})`)
        return
      }
      setLastResult(body)
      if (body.error && !body.runtimeCard) {
        setExecuteError(body.error)
      }
    } catch (err) {
      setExecuteError(err instanceof Error ? err.message : 'Execute request failed')
    } finally {
      setExecuting(false)
    }
  }

  useEffect(() => {
    if (!lastResult && !executeError) return
    const root = document.querySelector<HTMLElement>(
      '.access-app-layout--companion .access-ds-shell__main'
    )
    const el = resultRef.current
    if (!el) return
    requestAnimationFrame(() => {
      if (root) {
        const rootRect = root.getBoundingClientRect()
        const elRect = el.getBoundingClientRect()
        const top = root.scrollTop + (elRect.top - rootRect.top) - 24
        root.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    })
  }, [lastResult, executeError])

  const runtime = catalog?.runtime
  const toolsDisabled = !runtime?.localToolsAvailable

  return (
    <section className={`jyson-execute-layer${advancedOnly ? ' jyson-execute-layer--advanced' : ''}`}>
      {!advancedOnly && (
        <>
          <h2 className="jyson-companion-label">Local tools (OpenJarvis)</h2>
          <p className="jyson-execute-lead">
            Browse ACCESS tool registry, set parameters, and execute against your local OpenJarvis stack.
          </p>
        </>
      )}
      {advancedOnly && (
        <p className="jyson-execute-lead">
          Manual tool registry for operators. Prefer the JYSON orb command box above.
        </p>
      )}

      {catalogLoading && (
        <p className="jyson-companion-muted">Loading tool catalog…</p>
      )}

      {catalogError && (
        <p className="jyson-companion-error">{catalogError}</p>
      )}

      {runtime && (
        <div className="jyson-execute-runtime">
          <span className={`jyson-hybrid-badge ${runtime.privateLayerEnabled ? 'ok' : 'pending'}`}>
            {runtime.privateLayerEnabled ? '◈ Private JYSON' : '○ Cloud only'}
          </span>
          <span className={`jyson-hybrid-badge ${runtime.connectorOnline ? 'ok' : 'pending'}`}>
            {runtime.connectorOnline ? '◉ Connector online' : '○ Connector offline'}
          </span>
          <span className={`jyson-hybrid-badge ${runtime.openJarvisOnline ? 'ok' : 'pending'}`}>
            {runtime.openJarvisOnline
              ? `◉ OpenJarvis${runtime.openJarvisVersion ? ` ${runtime.openJarvisVersion}` : ''}`
              : '○ OpenJarvis offline'}
          </span>
        </div>
      )}

      {runtime?.message && toolsDisabled && (
        <p className="jyson-companion-warn">{runtime.message}</p>
      )}

      {catalog && catalog.tools.length > 0 && (
        <div className="jyson-execute-layout">
          <div className="jyson-execute-tools">
            <span className="jyson-execute-subhead">Tools</span>
            <ul className="jyson-execute-tool-list">
              {catalog.tools.map((tool) => {
                const mayHaveAction =
                  !allowedActions?.length || allowedSet.has(tool.requiredAction)
                return (
                  <li key={tool.id}>
                    <button
                      type="button"
                      className={`jyson-execute-tool-btn${selectedId === tool.id ? ' active' : ''}${!mayHaveAction ? ' dim' : ''}`}
                      onClick={() => selectTool(tool)}
                      disabled={catalogLoading}
                    >
                      <span className="jyson-execute-tool-label">{tool.label}</span>
                      <span className="jyson-execute-tool-meta">
                        <code>{tool.id}</code>
                        <span>{tool.category}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <button
              type="button"
              className="jyson-execute-refresh"
              onClick={() => void loadCatalog()}
              disabled={catalogLoading}
            >
              Refresh catalog
            </button>
          </div>

          {selectedTool && (
            <form className="jyson-execute-form" onSubmit={onExecute}>
              <div className="jyson-execute-form-head">
                <p className="jyson-execute-selected-title">{selectedTool.label}</p>
                {selectedTool.description && (
                  <p className="jyson-companion-body muted">{selectedTool.description}</p>
                )}
                <p className="jyson-execute-required-action">
                  Requires ACCESS action: <code>{selectedTool.requiredAction}</code>
                  {allowedActions?.length ? (
                    allowedSet.has(selectedTool.requiredAction) ? (
                      <span className="jyson-execute-action-ok"> · likely allowed</span>
                    ) : (
                      <span className="jyson-execute-action-denied"> · may be denied</span>
                    )
                  ) : null}
                </p>
              </div>

              {Object.entries(selectedTool.params ?? {}).length === 0 ? (
                <p className="jyson-companion-body muted">No parameters for this tool.</p>
              ) : (
                <div className="jyson-execute-fields">
                  {Object.entries(selectedTool.params ?? {}).map(([name, spec]) => (
                    <label key={name} className="jyson-execute-field">
                      <span className="jyson-execute-field-label">
                        {name}
                        {spec.required ? ' *' : ''}
                        <span className="jyson-execute-field-type">{spec.type}</span>
                      </span>
                      {spec.type === 'number' ? (
                        <input
                          type="number"
                          className="jyson-command-input"
                          value={paramValues[name] ?? ''}
                          onChange={(e) =>
                            setParamValues((prev) => ({ ...prev, [name]: e.target.value }))
                          }
                          disabled={executing || toolsDisabled}
                        />
                      ) : spec.description.length > 80 || name === 'content' || name === 'body' ? (
                        <textarea
                          className="jyson-execute-textarea"
                          value={paramValues[name] ?? ''}
                          onChange={(e) =>
                            setParamValues((prev) => ({ ...prev, [name]: e.target.value }))
                          }
                          rows={name === 'content' || name === 'body' ? 5 : 3}
                          disabled={executing || toolsDisabled}
                        />
                      ) : (
                        <input
                          type="text"
                          className="jyson-command-input"
                          value={paramValues[name] ?? ''}
                          onChange={(e) =>
                            setParamValues((prev) => ({ ...prev, [name]: e.target.value }))
                          }
                          placeholder={spec.description}
                          disabled={executing || toolsDisabled}
                        />
                      )}
                      <span className="jyson-execute-field-hint">{spec.description}</span>
                    </label>
                  ))}
                </div>
              )}

              {selectedTool.requiresConfirmation && (
                <label className="jyson-execute-confirm">
                  <input
                    type="checkbox"
                    checked={userConfirmed}
                    onChange={(e) => setUserConfirmed(e.target.checked)}
                    disabled={executing || toolsDisabled}
                  />
                  <span>
                    I confirm this {selectedTool.mutates ? 'mutating ' : ''}action
                    {selectedTool.mutates ? ' (writes data)' : ''}
                  </span>
                </label>
              )}

              <button
                type="submit"
                className="jyson-command-submit"
                disabled={
                  executing ||
                  toolsDisabled ||
                  (selectedTool.requiresConfirmation && !userConfirmed)
                }
              >
                {executing ? 'Executing…' : 'Execute tool'}
              </button>
            </form>
          )}
        </div>
      )}

      <div ref={resultRef} id="jyson-execute-result" className="jyson-execute-result">
        {executeError && <p className="jyson-companion-error">{executeError}</p>}

        {lastResult?.runtimeCard && (
          <JysonRuntimeCard
            card={lastResult.runtimeCard}
            apiSuccess={lastResult.success}
            compact={advancedOnly}
          />
        )}

        {lastResult && !lastResult.runtimeCard && lastResult.error && (
          <p className="jyson-companion-error">{lastResult.error}</p>
        )}
      </div>

      {advancedOnly && (
        <p className="jyson-command-footnote">
          POST /api/jyson/openjarvis/execute · Permission gates enforced server-side
        </p>
      )}
    </section>
  )
}
