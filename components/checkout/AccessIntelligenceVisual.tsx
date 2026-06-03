export default function AccessIntelligenceVisual() {
  return (
    <div className="access-intelligence-visual" aria-hidden>
      <div className="access-intelligence-visual__sculpture">
        <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="access-pearl" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
            <linearGradient id="access-navy" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1a1f36" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>
          <ellipse cx="80" cy="132" rx="48" ry="10" fill="#0ea5b9" opacity="0.08" />
          <path
            d="M40 120 C40 72 56 44 80 36 C104 44 120 72 120 120 C120 132 104 138 80 138 C56 138 40 132 40 120 Z"
            fill="url(#access-pearl)"
            stroke="#1a1f36"
            strokeWidth="1"
            strokeOpacity="0.12"
          />
          <path
            d="M58 72 C64 54 96 54 102 72 C106 88 92 98 80 100 C68 98 54 88 58 72 Z"
            fill="url(#access-navy)"
            opacity="0.88"
          />
          <circle cx="80" cy="78" r="8" fill="#b8956a" opacity="0.35" />
          <circle cx="80" cy="78" r="5" fill="#f8fafc" />
        </svg>
      </div>
    </div>
  )
}
