'use client'

export type JysonOrbState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'executing'
  | 'success'
  | 'error'

const STATE_LABEL: Record<JysonOrbState, string> = {
  idle: 'JYSON is ready',
  listening: 'Listening',
  thinking: 'Thinking',
  executing: 'Executing',
  success: 'Done',
  error: 'Something went wrong',
}

type JysonOrbProps = {
  state: JysonOrbState
  statusLine?: string
}

export default function JysonOrb({ state, statusLine }: JysonOrbProps) {
  return (
    <div className="jyson-orb-wrap" aria-live="polite">
      <div className={`jyson-orb jyson-orb--${state}`} role="img" aria-label={STATE_LABEL[state]}>
        <span className="jyson-orb-ring jyson-orb-ring--outer" />
        <span className="jyson-orb-ring jyson-orb-ring--inner" />
        <span className="jyson-orb-core" />
        <span className="jyson-orb-glow" />
      </div>
      <p className="jyson-orb-label">{statusLine ?? STATE_LABEL[state]}</p>
    </div>
  )
}
