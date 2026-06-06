import LegalDocumentLayout from '@/components/legal/LegalDocumentLayout'

export const metadata = {
  title: 'Cookie Policy — ACCESS',
  description: 'How ACCESS uses cookies and similar technologies.',
}

export default function CookiesPage() {
  return (
    <LegalDocumentLayout title="Cookie Policy">
      <p><strong>Effective date: June 6, 2026 · Last updated: June 6, 2026</strong></p>
      <p>
        This Cookie Policy explains how <strong>JD AI Systems, LLC</strong> uses cookies and similar
        technologies on the ACCESS platform. The short version: we use only what&rsquo;s necessary to
        make the platform work. We do not use tracking cookies, advertising cookies, or third-party
        analytics cookies.
      </p>

      <h2>1. What are cookies?</h2>
      <p>
        Cookies are small text files stored on your device by your browser when you visit a website.
        They allow websites to recognize your session, store preferences, and maintain login state.
        Some cookies expire when you close your browser (&ldquo;session cookies&rdquo;); others persist
        until a set expiration date (&ldquo;persistent cookies&rdquo;).
      </p>

      <h2>2. Cookies we use</h2>
      <p>
        ACCESS uses only <strong>strictly necessary cookies</strong> — cookies that are required for
        the platform to function. These cannot be disabled without breaking core platform functionality.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, marginBottom: 24 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #E6EBF1' }}>
            <th style={{ textAlign: 'left', padding: '8px 12px 8px 0', color: '#0A2540', fontWeight: 700 }}>Cookie</th>
            <th style={{ textAlign: 'left', padding: '8px 12px 8px 0', color: '#0A2540', fontWeight: 700 }}>Provider</th>
            <th style={{ textAlign: 'left', padding: '8px 12px 8px 0', color: '#0A2540', fontWeight: 700 }}>Purpose</th>
            <th style={{ textAlign: 'left', padding: '8px 12px 8px 0', color: '#0A2540', fontWeight: 700 }}>Duration</th>
          </tr>
        </thead>
        <tbody>
          {[
            { name: '__session', provider: 'Clerk', purpose: 'Maintains your authenticated session so you stay signed in', duration: 'Session' },
            { name: '__client_uat', provider: 'Clerk', purpose: 'Tracks client update token for session security', duration: 'Persistent (1 year)' },
            { name: '__clerk_*', provider: 'Clerk', purpose: 'Authentication state management (multiple Clerk security tokens)', duration: 'Session / Persistent' },
            { name: 'stripe.sid', provider: 'Stripe', purpose: 'Stripe checkout session state for payment flows', duration: 'Session' },
            { name: '__stripe_mid', provider: 'Stripe', purpose: 'Fraud prevention — detects unusual payment behavior', duration: '1 year' },
            { name: '__stripe_sid', provider: 'Stripe', purpose: 'Stripe session ID for checkout continuity', duration: '30 minutes' },
          ].map((row) => (
            <tr key={row.name} style={{ borderBottom: '1px solid #E6EBF1' }}>
              <td style={{ padding: '10px 12px 10px 0', fontFamily: 'monospace', fontSize: 12, color: '#0A2540' }}>{row.name}</td>
              <td style={{ padding: '10px 12px 10px 0', color: '#425466' }}>{row.provider}</td>
              <td style={{ padding: '10px 12px 10px 0', color: '#425466' }}>{row.purpose}</td>
              <td style={{ padding: '10px 12px 10px 0', color: '#697386', whiteSpace: 'nowrap' }}>{row.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>3. What we do NOT use</h2>
      <ul>
        <li><strong>Analytics cookies</strong> — We do not use Google Analytics, Mixpanel, Posthog, Segment, or any behavioral analytics that track you across sessions</li>
        <li><strong>Advertising cookies</strong> — We do not use Facebook Pixel, Google Ads, or any retargeting or advertising technology</li>
        <li><strong>Third-party tracking</strong> — We do not allow third parties to place tracking cookies on access.jdwhite.world</li>
        <li><strong>Fingerprinting</strong> — We do not use browser fingerprinting or device fingerprinting to identify users across sessions</li>
      </ul>
      <p>
        Because we use only strictly necessary cookies, we do not display a cookie consent banner.
        Under the Florida Digital Bill of Rights, GDPR, and ePrivacy Directive, strictly necessary
        cookies do not require prior consent.
      </p>

      <h2>4. Local storage and session storage</h2>
      <p>
        In addition to cookies, ACCESS uses browser localStorage and sessionStorage for:
      </p>
      <ul>
        <li>Storing your UI preferences (theme, density settings) — localStorage, no expiration</li>
        <li>Storing your marketing email consent choice during signup — sessionStorage, cleared when tab closes</li>
        <li>Storing your age confirmation during signup — sessionStorage, cleared when tab closes</li>
      </ul>
      <p>
        localStorage and sessionStorage data stays on your device only. It is not transmitted to
        our servers unless you explicitly save a preference through a platform action.
      </p>

      <h2>5. Managing cookies</h2>
      <p>
        You can control or delete cookies through your browser settings. Note that disabling
        authentication cookies (Clerk) will prevent you from signing into ACCESS.
      </p>
      <p>Browser cookie management guides:</p>
      <ul>
        <li>Chrome: Settings → Privacy and Security → Cookies and other site data</li>
        <li>Safari: Preferences → Privacy → Manage Website Data</li>
        <li>Firefox: Options → Privacy & Security → Cookies and Site Data</li>
        <li>Edge: Settings → Cookies and Site Permissions</li>
      </ul>

      <h2>6. Changes to this policy</h2>
      <p>
        If we introduce new cookies beyond strictly necessary functionality, we will update this
        policy and notify active subscribers via email at least 14 days before implementation.
      </p>

      <p>
        Questions? Contact us at{' '}
        <a href="mailto:support@jdwhite.world">support@jdwhite.world</a>.
      </p>
      <p>
        <strong>JD AI Systems, LLC</strong> · Tampa, Florida
      </p>
    </LegalDocumentLayout>
  )
}
