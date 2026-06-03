import { cn } from '../cn'

type ConnectionStatusProps = {
  label: string
  online: boolean
  className?: string
}

export function ConnectionStatus({ label, online, className }: ConnectionStatusProps) {
  return (
    <span
      className={cn(
        'access-connection-status',
        online ? 'access-connection-status--on' : 'access-connection-status--off',
        className
      )}
    >
      <span className="access-connection-status__dot" aria-hidden />
      {label}
    </span>
  )
}
