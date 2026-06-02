'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useParams, useRouter } from 'next/navigation'
import {
  getBuilderProject,
  updateProjectTasks,
  updateProjectMilestones,
  archiveBuilderProject,
} from '@/lib/actions/projects'
import type { BuilderProject, Task, Milestone } from '@/types/db'
import AppSystemNav from '@/components/access/AppSystemNav'

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{
        fontSize: '9px', letterSpacing: '0.22em', color: 'var(--text-muted)',
        textTransform: 'uppercase', marginBottom: '12px', fontFamily: 'var(--mono)',
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function DataRow({ k, v, accent = false }: { k: string; v: string; accent?: boolean }) {
  return (
    <div style={{
      display: 'flex', gap: '24px', padding: '7px 0',
      borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center',
    }}>
      <span style={{
        fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase',
        color: 'var(--text-muted)', width: '120px', flexShrink: 0, fontFamily: 'var(--mono)',
      }}>
        {k}
      </span>
      <span style={{ fontSize: '12px', color: accent ? 'var(--accent)' : 'var(--text-dim)', fontFamily: 'var(--mono)' }}>
        {v}
      </span>
    </div>
  )
}

function ActionBtn({
  onClick, label, href, muted = false,
}: { onClick?: () => void; label: string; href?: string; muted?: boolean }) {
  const base: React.CSSProperties = {
    background: 'transparent', cursor: 'pointer',
    border: `1px solid ${muted ? 'rgba(255,255,255,0.08)' : 'rgba(64,192,208,0.2)'}`,
    borderRadius: '2px', padding: '7px 16px',
    fontSize: '10px', letterSpacing: '0.1em', fontFamily: 'var(--mono)',
    color: muted ? 'var(--text-muted)' : 'var(--accent)',
    textTransform: 'uppercase' as const, transition: 'all 0.15s',
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    textDecoration: 'none',
  }
  const onEnter = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.borderColor = muted ? 'rgba(255,255,255,0.2)' : 'rgba(64,192,208,0.5)'
    e.currentTarget.style.color = muted ? 'var(--text-dim)' : 'var(--accent)'
    if (!muted) e.currentTarget.style.background = 'rgba(64,192,208,0.06)'
  }
  const onLeave = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.borderColor = muted ? 'rgba(255,255,255,0.08)' : 'rgba(64,192,208,0.2)'
    e.currentTarget.style.color = muted ? 'var(--text-muted)' : 'var(--accent)'
    e.currentTarget.style.background = 'transparent'
  }
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={base}
        onMouseEnter={onEnter} onMouseLeave={onLeave}>
        {label}
      </a>
    )
  }
  return (
    <button onClick={onClick} style={base} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      {label}
    </button>
  )
}

const Divider = () => (
  <div style={{ borderTop: '1px solid var(--border)', margin: '24px 0' }} />
)

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const params = useParams()
  const router = useRouter()

  const [project, setProject] = useState<BuilderProject | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [archiving, setArchiving] = useState(false)
  const [showArchitecture, setShowArchitecture] = useState(false)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) { router.push('/'); return }
    const id = params.id as string
    if (!id) { router.push('/'); return }

    getBuilderProject(id)
      .then(p => {
        if (!p) { router.push('/'); return }
        setProject(p)
        setTasks(p.tasks)
        setMilestones(p.milestones)
        setLoading(false)
      })
      .catch(() => { setLoading(false); router.push('/') })
  }, [isLoaded, isSignedIn, params.id, router])

  const handleTaskToggle = useCallback(async (index: number) => {
    const updated = tasks.map((t, i) => i === index ? { ...t, completed: !t.completed } : t)
    setTasks(updated)
    if (project) updateProjectTasks(project.id, updated).catch(() => null)
  }, [tasks, project])

  const handleMilestoneToggle = useCallback(async (index: number) => {
    const updated = milestones.map((m, i) => i === index ? { ...m, completed: !m.completed } : m)
    setMilestones(updated)
    if (project) updateProjectMilestones(project.id, updated).catch(() => null)
  }, [milestones, project])

  const handleExport = useCallback(() => {
    if (!project?.architecture) return
    const blob = new Blob([project.architecture], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.md'
    a.click()
    URL.revokeObjectURL(url)
  }, [project])

  const handleArchive = useCallback(async () => {
    if (!project || archiving) return
    setArchiving(true)
    await archiveBuilderProject(project.id).catch(() => null)
    router.push('/')
  }, [project, archiving, router])

  // Loading state
  if (!isLoaded || loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--mono)', color: 'var(--text-muted)', fontSize: '11px', letterSpacing: '0.14em',
      }}>
        LOADING<span className="cursor" />
      </div>
    )
  }

  if (!project) return null

  const completedTasks = tasks.filter(t => t.completed).length
  const completedMilestones = milestones.filter(m => m.completed).length
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', fontFamily: 'var(--mono)' }}>

      <AppSystemNav active="project" accessId={project.owner_handle} />

      <div style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center',
        padding: '8px 24px 10px', gap: '16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}>
        <span style={{
          fontSize: '10px', letterSpacing: '0.18em', color: 'var(--text-muted)',
          textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          flex: 1,
        }}>
          Builder · {project.name}
        </span>
      </div>

      {/* ── Scrollable content ── */}
      <div
        id="terminal-scroll"
        style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          padding: '32px 24px 80px',
        }}
      >
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>

          {/* Title block */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '9px', letterSpacing: '0.22em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Builder Project
            </div>
            <h1 style={{
              fontSize: 'clamp(18px, 2.5vw, 26px)', fontWeight: 300,
              letterSpacing: '0.02em', color: 'var(--text)', marginBottom: '10px',
              lineHeight: 1.2,
            }}>
              {project.name}
            </h1>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '18px', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
              <span>owned by <span style={{ color: 'var(--accent)' }}>{project.owner_handle}</span></span>
              {project.system_id && <span>· system linked</span>}
              <span>· {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>

            {/* Progress */}
            {tasks.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {completedTasks} of {tasks.length} tasks complete
                  </span>
                  <span style={{ fontSize: '10px', color: progress === 100 ? 'var(--success)' : 'var(--text-muted)' }}>
                    {progress}%
                  </span>
                </div>
                <div style={{ height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '1px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${progress}%`,
                    background: progress === 100 ? 'var(--success)' : 'var(--accent)',
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>
            )}
          </div>

          <Divider />

          {/* Objective */}
          {project.objective && (
            <Section title="Objective">
              <p style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: '1.7', fontFamily: 'var(--mono)' }}>
                {project.objective}
              </p>
            </Section>
          )}

          {/* Tasks */}
          {tasks.length > 0 && (
            <Section title={`Tasks — ${completedTasks}/${tasks.length}`}>
              {tasks.map((task, i) => (
                <div
                  key={i}
                  onClick={() => handleTaskToggle(i)}
                  style={{
                    display: 'flex', gap: '12px', padding: '9px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    cursor: 'pointer', alignItems: 'flex-start',
                    opacity: task.completed ? 0.45 : 1, transition: 'opacity 0.15s',
                  }}
                >
                  <span style={{
                    color: task.completed ? 'var(--success)' : 'rgba(255,255,255,0.2)',
                    fontSize: '12px', marginTop: '1px', flexShrink: 0, lineHeight: 1,
                    transition: 'color 0.15s', userSelect: 'none',
                  }}>
                    {task.completed ? '✓' : '○'}
                  </span>
                  <span style={{
                    fontSize: '12px', color: task.completed ? 'var(--text-muted)' : 'var(--text-dim)',
                    lineHeight: '1.6', fontFamily: 'var(--mono)',
                    textDecoration: task.completed ? 'line-through' : 'none',
                  }}>
                    {task.text}
                  </span>
                </div>
              ))}
            </Section>
          )}

          {/* Milestones */}
          {milestones.length > 0 && (
            <Section title={`Milestones — ${completedMilestones}/${milestones.length}`}>
              {milestones.map((m, i) => (
                <div
                  key={i}
                  onClick={() => handleMilestoneToggle(i)}
                  style={{
                    display: 'flex', gap: '12px', padding: '9px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    cursor: 'pointer', alignItems: 'flex-start',
                    opacity: m.completed ? 0.45 : 1, transition: 'opacity 0.15s',
                  }}
                >
                  <span style={{
                    color: m.completed ? 'var(--success)' : 'rgba(255,255,255,0.2)',
                    fontSize: '12px', marginTop: '1px', flexShrink: 0,
                    transition: 'color 0.15s', userSelect: 'none',
                  }}>
                    {m.completed ? '✓' : '○'}
                  </span>
                  <span style={{
                    fontSize: '12px', color: m.completed ? 'var(--text-muted)' : 'var(--text-dim)',
                    lineHeight: '1.6', fontFamily: 'var(--mono)',
                  }}>
                    {m.text}
                  </span>
                </div>
              ))}
            </Section>
          )}

          {/* Stack */}
          {project.stack.length > 0 && (
            <Section title="Stack">
              {project.stack.map((tool, i) => (
                <div key={i} style={{
                  padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>
                    {tool}
                  </span>
                </div>
              ))}
            </Section>
          )}

          {/* Architecture */}
          {project.architecture && (
            <Section title="Architecture">
              <button
                onClick={() => setShowArchitecture(v => !v)}
                style={{
                  background: 'none', border: '1px solid var(--border)',
                  color: 'var(--text-muted)', cursor: 'pointer',
                  fontSize: '9px', letterSpacing: '0.12em', fontFamily: 'var(--mono)',
                  padding: '5px 12px', borderRadius: '2px', marginBottom: '12px',
                  transition: 'all 0.15s', textTransform: 'uppercase',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'rgba(64,192,208,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
              >
                {showArchitecture ? '▲ Hide' : '▼ Show Full Architecture'}
              </button>
              {showArchitecture && (
                <pre
                  id="terminal-scroll"
                  style={{
                    fontSize: '10.5px', color: 'var(--text-dim)', lineHeight: '1.85',
                    fontFamily: 'var(--mono)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                    padding: '16px', borderRadius: '2px',
                    maxHeight: '420px', overflowY: 'auto',
                    scrollbarWidth: 'thin', scrollbarColor: 'rgba(64,192,208,0.15) transparent',
                  }}
                >
                  {project.architecture}
                </pre>
              )}
            </Section>
          )}

          {/* Ownership */}
          <Section title="Ownership">
            <DataRow k="Owner" v={project.owner_handle} accent />
            <DataRow k="Registry Status" v={project.status === 'active' ? 'Active' : project.status} />
            {project.system_id && <DataRow k="Linked System" v={`Registered`} />}
            <DataRow k="Tasks" v={`${completedTasks} of ${tasks.length} complete`} />
            <DataRow k="Milestones" v={`${completedMilestones} of ${milestones.length} complete`} />
            <DataRow k="Created" v={new Date(project.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
            <DataRow k="Updated" v={new Date(project.updated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
          </Section>

          {/* Actions */}
          <div style={{
            paddingTop: '20px', borderTop: '1px solid var(--border)',
            display: 'flex', gap: '10px', flexWrap: 'wrap',
          }}>
            {project.architecture && (
              <ActionBtn onClick={handleExport} label="Export Architecture" />
            )}
            <ActionBtn
              onClick={handleArchive}
              label={archiving ? 'Archiving…' : 'Archive Project'}
              muted
            />
          </div>

        </div>
      </div>
    </div>
  )
}
