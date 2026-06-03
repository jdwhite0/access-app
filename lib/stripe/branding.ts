import type Stripe from 'stripe'

/** Public path (served from `public/brand/`) — source: jdproductions.io footer ecosystem logo */
export const CHECKOUT_LOGO_PATH = '/brand/jd-ai-systems-logo.png'

export const CHECKOUT_BRAND_DISPLAY_NAME = 'JD AI Systems'

/**
 * Canonical app origin for Stripe return URLs and checkout branding asset URLs.
 * Prefer NEXT_PUBLIC_APP_URL (set in Vercel). Fall back to VERCEL_URL, then localhost.
 */
export function resolveAppOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (explicit) {
    return explicit.replace(/\/$/, '')
  }
  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) {
    const withProto = vercel.startsWith('http') ? vercel : `https://${vercel}`
    return withProto.replace(/\/$/, '')
  }
  return 'http://localhost:3000'
}

/** Stripe must fetch the logo over HTTPS from a host reachable on the public internet. */
export function isPublicAppOrigin(origin: string): boolean {
  try {
    const { hostname, protocol } = new URL(origin)
    if (protocol !== 'https:' && protocol !== 'http:') return false
    const host = hostname.toLowerCase()
    return host !== 'localhost' && host !== '127.0.0.1' && !host.endsWith('.local')
  } catch {
    return false
  }
}

export function getCheckoutLogoUrl(origin: string = resolveAppOrigin()): string | null {
  if (!isPublicAppOrigin(origin)) return null
  return `${origin}${CHECKOUT_LOGO_PATH}`
}

/**
 * Per-session Checkout branding overrides account Dashboard defaults (e.g. legacy JD Productions logo).
 * Omitted when origin is localhost — Stripe cannot fetch assets from your machine.
 */
export function getCheckoutBrandingSettings(
  origin: string = resolveAppOrigin(),
  displayName: string = CHECKOUT_BRAND_DISPLAY_NAME
):
  | Pick<Stripe.Checkout.SessionCreateParams, 'branding_settings'>
  | undefined {
  const logoUrl = getCheckoutLogoUrl(origin)
  if (!logoUrl) return undefined

  return {
    branding_settings: {
      display_name: displayName,
      logo: {
        type: 'url',
        url: logoUrl,
      },
    },
  }
}
