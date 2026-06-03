import { StatusPill, type StatusPillTone } from './StatusPill'

export type SnapshotRow = {
  id: string
  label: string
  value: string
  tone?: StatusPillTone
}

type WorkspaceSnapshotProps = {
  rows: SnapshotRow[]
}

export function WorkspaceSnapshot({ rows }: WorkspaceSnapshotProps) {
  if (rows.length === 0) return null
  return (
    <div className="access-workspace-snapshot" role="list">
      {rows.map((row) => (
        <div key={row.id} className="access-workspace-snapshot__row" role="listitem">
          <span className="access-workspace-snapshot__label">{row.label}</span>
          {row.tone ? (
            <StatusPill label={row.value} tone={row.tone} />
          ) : (
            <span className="access-workspace-snapshot__value">{row.value}</span>
          )}
        </div>
      ))}
    </div>
  )
}
