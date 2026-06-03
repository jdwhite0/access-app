const TRUST_STATEMENTS = [
  {
    title: 'One place for your ideas',
    body: 'Notes, plans, and offers — together, not scattered.',
  },
  {
    title: 'JYSON guides your next step',
    body: 'Clear suggestions based on where you are.',
  },
  {
    title: 'Picks up where you left off',
    body: 'Your story stays with you — no starting over.',
  },
] as const

export default function TrustStrip() {
  return (
    <div className="access-mkt-trust" role="list" aria-label="What ACCESS gives you">
      {TRUST_STATEMENTS.map((item) => (
        <div key={item.title} className="access-mkt-trust__item" role="listitem">
          <p className="access-mkt-trust__title">{item.title}</p>
          <p className="access-mkt-trust__body">{item.body}</p>
        </div>
      ))}
    </div>
  )
}
