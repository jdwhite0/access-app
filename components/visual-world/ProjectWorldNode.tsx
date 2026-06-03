import { cn } from '@/lib/design-system/components/cn'

type ProjectWorldNodeProps = {
  status?: string
  className?: string
}

/** Small world node — projects as worlds, not posters */
export function ProjectWorldNode({ status = 'active', className }: ProjectWorldNodeProps) {
  return (
    <span
      className={cn(
        'access-project-world-node',
        status === 'completed' && 'access-project-world-node--done',
        status === 'archived' && 'access-project-world-node--archived',
        className
      )}
      aria-hidden
    >
      <span className="access-project-world-node__orbit" />
      <span className="access-project-world-node__core" />
    </span>
  )
}
