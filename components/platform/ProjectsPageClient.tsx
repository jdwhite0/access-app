'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useJysonLayerOptional } from '@/components/jyson/JysonLayerProvider'
import AccessAppLayout from '@/components/navigation/AccessAppLayout'
import {
  PageHeader,
  SectionPanel,
  PlatformEmptyState,
  PrimaryButton,
  SecondaryButton,
} from '@/lib/design-system/components/platform'
import { listBuilderProjects } from '@/lib/actions/projects'
import type { BuilderProject } from '@/types/db'

function pct(done: number, total: number) {
  return total > 0 ? Math.round((done / total) * 100) : 0
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ProjectCard({ project }: { project: BuilderProject }) {
  const tasks = Array.isArray(project.tasks) ? project.tasks : []
  const milestones = Array.isArray(project.milestones) ? project.milestones : []
  const doneTasks = tasks.filter(t => t.completed).length
  const taskPct = pct(doneTasks, tasks.length)
  const doneMilestones = milestones.filter(m => m.completed).length

  return (
    <div className="access-shell-card access-shell-card--interactive access-project-card">
      <div className="access-project-card__body">
      <div className="access-project-card__header">
        <div>
          <p className="access-project-card__name">{project.name}</p>
          {project.objective && (
            <p className="access-project-card__objective">{project.objective}</p>
          )}
        </div>
        <span className={`access-ds-badge access-ds-badge--${project.status === 'active' ? 'operational' : project.status === 'completed' ? 'info' : 'neutral'}`}>
          {project.status}
        </span>
      </div>

      {/* Progress bar */}
      <div className="access-project-progress">
        <div className="access-project-progress__bar">
          <div
            className="access-project-progress__fill"
            style={{ width: `${taskPct}%` }}
          />
        </div>
        <span className="access-project-progress__label">{taskPct}%</span>
      </div>

      <div className="access-project-card__meta">
        <span className="access-platform-meta">{doneTasks}/{tasks.length} tasks</span>
        {milestones.length > 0 && (
          <span className="access-platform-meta">{doneMilestones}/{milestones.length} milestones</span>
        )}
        {project.stack && project.stack.length > 0 && (
          <span className="access-platform-meta">{project.stack.slice(0, 3).join(' · ')}</span>
        )}
        <span className="access-platform-meta">Updated {fmtDate(project.updated_at)}</span>
      </div>

      {/* Recent tasks */}
      {tasks.length > 0 && (
        <ul className="access-project-tasks">
          {tasks.slice(0, 3).map((task, i) => (
            <li key={i} className={`access-project-task${task.completed ? ' access-project-task--done' : ''}`}>
              <span className="access-project-task__check">{task.completed ? '✓' : '○'}</span>
              <span>{task.text}</span>
            </li>
          ))}
          {tasks.length > 3 && (
            <li className="access-project-task access-project-task--more">
              +{tasks.length - 3} more tasks
            </li>
          )}
        </ul>
      )}
      <div className="access-project-card__footer">
        <span className="access-platform-meta">
          {doneTasks < tasks.length && tasks.find((t) => !t.completed)
            ? `Next: ${tasks.find((t) => !t.completed)?.text?.slice(0, 48) ?? 'Complete tasks'}`
            : 'No open tasks'}
        </span>
        <SecondaryButton href={`/projects/${project.id}`}>
          Open project
        </SecondaryButton>
      </div>
      </div>
    </div>
  )
}

export default function ProjectsPageClient() {
  const layer = useJysonLayerOptional()
  const [projects, setProjects] = useState<BuilderProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listBuilderProjects()
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }, [])

  const active = projects.filter(p => p.status === 'active')
  const completed = projects.filter(p => p.status === 'completed')
  const archived = projects.filter(p => p.status === 'archived')

  return (
    <AccessAppLayout variant="default">
      <div className="access-platform access-platform-page access-shell-page">
        <PageHeader
          title="Projects"
          description="Track what you're building and let JYSON help move it forward."
          actions={
            <PrimaryButton href="/terminal">Create project</PrimaryButton>
          }
          secondary={
            layer ? (
              <button
                type="button"
                className="access-platform-btn-secondary"
                onClick={() => void layer.submit('Ask JYSON about my projects')}
              >
                Ask JYSON about my projects
              </button>
            ) : (
              <Link href="/companion" className="access-platform-btn-secondary">
                Ask JYSON about my projects
              </Link>
            )
          }
        />

        {loading ? (
          <div className="access-platform-loading">Loading projects…</div>
        ) : projects.length === 0 ? (
          <PlatformEmptyState
            title="No projects yet"
            description="No projects yet. Create your first project in Terminal, or ask JYSON to help you define one."
            actionHref="/terminal"
            actionLabel="Create project"
          />
        ) : (
          <div className="access-shell-sections">
            {active.length > 0 && (
              <SectionPanel title={`Active (${active.length})`}>
                <div className="access-projects-grid">
                  {active.map(p => <ProjectCard key={p.id} project={p} />)}
                </div>
              </SectionPanel>
            )}
            {completed.length > 0 && (
              <SectionPanel title={`Completed (${completed.length})`}>
                <div className="access-projects-grid">
                  {completed.map(p => <ProjectCard key={p.id} project={p} />)}
                </div>
              </SectionPanel>
            )}
            {archived.length > 0 && (
              <SectionPanel title={`Archived (${archived.length})`}>
                <div className="access-projects-grid">
                  {archived.map(p => <ProjectCard key={p.id} project={p} />)}
                </div>
              </SectionPanel>
            )}
          </div>
        )}
      </div>
    </AccessAppLayout>
  )
}
