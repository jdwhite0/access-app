import { ACCESS_BRAND, FONT } from '../theme'

type ProductChromeProps = {
  label: string
  children: React.ReactNode
}

export function ProductChrome({ label, children }: ProductChromeProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: '12% 10% 18% 10%',
        borderRadius: 20,
        background: ACCESS_BRAND.pearl,
        boxShadow:
          '0 24px 80px rgba(26, 31, 54, 0.12), 0 0 0 1px rgba(26, 31, 54, 0.06)',
        overflow: 'hidden',
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '14px 18px',
          borderBottom: `1px solid ${ACCESS_BRAND.navySoft}`,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'rgba(26, 31, 54, 0.15)',
          }}
        />
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: ACCESS_BRAND.cyan,
            opacity: 0.85,
          }}
        />
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'rgba(26, 31, 54, 0.15)',
          }}
        />
        <span
          style={{
            marginLeft: 12,
            fontSize: 13,
            fontWeight: 500,
            color: 'rgba(26, 31, 54, 0.55)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ padding: '22px 24px 28px' }}>{children}</div>
    </div>
  )
}
