'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AccessAppLayout from '@/components/navigation/AccessAppLayout'
import { PageHeader, SectionPanel, PlatformEmptyState } from '@/lib/design-system/components/platform'
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
    <div className="access-project-card">
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
        <span className="access-platform-meta">{fmtDate(project.created_at)}</span>
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
    </div>
  )
}

export default function ProjectsPageClient() {
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
      <div className="access-platform access-platform-page">
        <PageHeader
          eyebrow="ACCESS"
          title="Projects"
          description="Active ventures, builds, and initiatives — linked to your systems and Founder blueprint."
          actions={
            <Link href="/terminal" className="access-platform-action-btn">
              + New project via Terminal
            </Link>
          }
        />

        {loading ? (
          <div className="access-platform-loading">Loading projects…</div>
        ) : projects.length === 0 ? (
          <PlatformEmptyState
            title="No projects yet"
            description="Start a project from the terminal with /start, or use JYSON in the companion to generate one from your blueprint."
            actionHref="/terminal"
            actionLabel="Open Terminal"
          />
        ) : (
          <div className="access-projects-sections">
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
