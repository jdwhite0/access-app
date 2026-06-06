import LegalDocumentLayout from '@/components/legal/LegalDocumentLayout'

export const metadata = {
  title: 'Privacy Policy — ACCESS',
  description: 'How JD AI Systems, LLC handles your data on the ACCESS platform — in compliance with Florida and Georgia law.',
}

export default function PrivacyPage() {
  return (
    <LegalDocumentLayout title="Privacy Policy">
      <p><strong>Effective date: June 6, 2026 · Last updated: June 6, 2026</strong></p>
      <p>
        This Privacy Policy describes how <strong>JD AI Systems, LLC</strong> (&ldquo;Company,&rdquo; &ldquo;we,&rdquo;
        &ldquo;our,&rdquo; or &ldquo;us&rdquo;) collects, uses, protects, and discloses information when you use
        the ACCESS platform (&ldquo;Service&rdquo;). Our primary headquarters is in <strong>Tampa, Florida</strong>;
        our secondary headquarters is in <strong>Atlanta, Georgia</strong> (opening 2026). This policy is designed
        to comply with the laws of both states, including the
        <strong> Florida Digital Bill of Rights (FDBR)</strong> (§ 501.701–501.721, Fla. Stat.),
        the <strong>Florida Information Protection Act (FIPA)</strong> (§ 501.171, Fla. Stat.),
        the <strong>Florida Deceptive and Unfair Trade Practices Act (FDUTPA)</strong> (§ 501.201, Fla. Stat.),
        the <strong>Georgia Notification of Data System Breach Act</strong> (O.C.G.A. § 10-1-910 et seq.),
        the <strong>Georgia Fair Business Practices Act (GFBPA)</strong> (O.C.G.A. § 10-1-390 et seq.),
        and applicable federal law.
      </p>

      <h2>1. Who This Policy Applies To</h2>
      <p>
        This policy applies to all users of ACCESS. Florida residents have additional rights
        under the Florida Digital Bill of Rights, described in Section 6 below.
        Georgia residents are protected under the Georgia Notification of Data System Breach Act
        and the Georgia Fair Business Practices Act, as described in Sections 7 and 11 below.
      </p>

      <h2>2. Information We Collect</h2>
      <h3>Account Information</h3>
      <ul>
        <li>Name, email address, and username (via Clerk authentication)</li>
        <li>ACCESS handle (e.g., <em>username.access</em>)</li>
        <li>Profile details you choose to provide</li>
      </ul>
      <h3>Workspace Data</h3>
      <ul>
        <li>Projects, registry objects, assets, vault metadata, and systems you create</li>
        <li>CRM contacts you enter or import (you own this data)</li>
        <li>Knowledge base content and blueprints</li>
        <li>JYSON AI conversations and session history</li>
        <li>Workflow configurations and execution logs</li>
      </ul>
      <h3>Billing and Payment Information</h3>
      <ul>
        <li>
          Payments are processed by <strong>Stripe, Inc.</strong>, a PCI-DSS-compliant payment processor.
          We do not store full card numbers or full bank account numbers. We store only Stripe Customer IDs
          and subscription metadata.
        </li>
        <li>
          <strong>ACH Bank Transfer Authorization:</strong> If you choose ACH payment, your bank account
          information is provided directly to Stripe under their ACH authorization agreement.
          Stripe stores your bank account and routing details; we store only the Stripe payment method
          reference. ACH transactions are governed by NACHA rules. You may revoke ACH authorization at
          any time through the billing portal or by contacting us. Unauthorized ACH debits may be
          disputed with your bank within 60 days of the statement date in which the unauthorized
          transaction appeared.
        </li>
        <li>Billing address and invoice history (via Stripe Billing)</li>
      </ul>
      <h3>Usage and Technical Information</h3>
      <ul>
        <li>Platform activity: pages visited, features used, commands executed</li>
        <li>JYSON message counts per billing period</li>
        <li>IP address, browser type, device type, and operating system</li>
        <li>Error logs and performance diagnostics for platform reliability</li>
      </ul>
      <h3>Communications</h3>
      <ul>
        <li>Email preferences and consent records</li>
        <li>Support correspondence</li>
      </ul>

      <h2>3. How We Use Your Information</h2>
      <p>We process your information only for the following purposes:</p>
      <ul>
        <li><strong>Service delivery:</strong> Provide ACCESS features, JYSON intelligence, and workspace tools</li>
        <li><strong>Billing:</strong> Process subscriptions, invoices, ACH authorizations, and refunds through Stripe</li>
        <li><strong>Security:</strong> Detect fraud, unauthorized access, and platform abuse</li>
        <li><strong>Transactional communication:</strong> Send receipts, security alerts, and service notices required by law or contract</li>
        <li><strong>Marketing (opt-in only):</strong> Send product updates and promotional offers you have explicitly consented to receive. We do not send unsolicited marketing. Florida residents may opt out at any time.</li>
        <li><strong>Platform improvement:</strong> Analyze aggregated, de-identified usage patterns to improve features and reliability</li>
        <li><strong>Legal compliance:</strong> Meet applicable legal, tax, and regulatory obligations under Florida and federal law</li>
      </ul>
      <p>
        We do not use your personal data for targeted advertising, profiling for decisions producing legal
        effects, or the sale of personal data to third parties.
      </p>

      <h2>4. JYSON and AI Processing</h2>
      <p>
        JYSON processes your workspace data (projects, assets, CRM records, vault metadata, and conversation
        history) to generate personalized intelligence, summaries, and recommendations.
        This processing occurs within our platform infrastructure. We do not share your workspace data
        with third-party AI providers without your explicit consent, except as technically necessary
        to provide the Service under appropriate data protection agreements.
      </p>
      <p>
        JYSON is an AI system. Its outputs may contain errors. You are responsible for reviewing any
        AI-generated output before relying on it for business decisions.
      </p>

      <h2>5. Information Sharing and Disclosure</h2>
      <p>
        <strong>We do not sell your personal information.</strong> We do not share your data with
        advertisers or data brokers. We may share information with:
      </p>
      <ul>
        <li><strong>Stripe, Inc.</strong> — payment processing (PCI-DSS compliant, US-based)</li>
        <li><strong>Clerk, Inc.</strong> — authentication and identity management (SOC 2 certified)</li>
        <li><strong>Supabase, Inc.</strong> — database infrastructure (data stored in the United States)</li>
        <li><strong>Vercel, Inc.</strong> — platform hosting and edge computing</li>
        <li>
          <strong>Legal and government authorities:</strong> When required by Florida law, federal law,
          court order, or to protect the safety, rights, or property of users or the Company
        </li>
        <li>
          <strong>Business transfers:</strong> In the event of a merger, acquisition, or asset sale,
          personal data may be transferred. We will notify you via email before such transfer and your
          rights under this policy continue to apply.
        </li>
      </ul>
      <p>
        All third-party service providers are bound by contractual data processing agreements and
        are prohibited from using your data for their own purposes.
      </p>

      <h2>6. Florida Digital Bill of Rights — Your Rights</h2>
      <p>
        Under the <strong>Florida Digital Bill of Rights (§ 501.701–501.721, Fla. Stat.)</strong>,
        Florida residents have the following rights regarding their personal data:
      </p>
      <ul>
        <li><strong>Right to Access:</strong> You may request confirmation of whether we process your personal data and obtain a copy of it.</li>
        <li><strong>Right to Correction:</strong> You may request correction of inaccurate personal data we hold about you.</li>
        <li><strong>Right to Deletion:</strong> You may request deletion of your personal data, subject to legal retention requirements.</li>
        <li><strong>Right to Data Portability:</strong> You may request your data in a commonly used, machine-readable format.</li>
        <li><strong>Right to Opt Out of Sale:</strong> We do not sell personal data. This right is satisfied by our policy design.</li>
        <li><strong>Right to Opt Out of Targeted Advertising:</strong> We do not conduct targeted advertising using your data.</li>
        <li><strong>Right to Opt Out of Profiling:</strong> We do not engage in profiling that produces legal or similarly significant effects.</li>
        <li><strong>Right to Non-Discrimination:</strong> Exercising your privacy rights will not result in denial of service or different pricing.</li>
      </ul>
      <p>
        To exercise any of these rights, submit a request to{' '}
        <a href="mailto:support@jdwhite.world">support@jdwhite.world</a> or use
        Settings → Account within your ACCESS workspace. We will respond within 45 days as
        required by the FDBR, and may extend by an additional 45 days with notice when reasonably necessary.
      </p>
      <p>
        Authorized agents may submit rights requests on your behalf with written authorization.
        We will verify identity before processing any request.
      </p>

      <h2>7. Data Breach Notification</h2>
      <p>
        In the event of a security breach affecting your personal data, we will notify affected
        users in accordance with both Florida and Georgia law.
      </p>
      <h3>Florida — FIPA (§ 501.171, Fla. Stat.)</h3>
      <ul>
        <li>Investigate and assess the breach promptly upon discovery</li>
        <li>
          Notify affected Florida residents <strong>within 30 days</strong> of discovering the breach
          (or as soon as reasonably possible given the scope of investigation)
        </li>
        <li>
          Notify the Florida Department of Legal Affairs if the breach affects 500 or more Florida
          residents, within 30 days of discovery
        </li>
      </ul>
      <h3>Georgia — Notification of Data System Breach Act (O.C.G.A. § 10-1-912)</h3>
      <ul>
        <li>
          Notify affected Georgia residents <strong>in the most expedient time possible and without
          unreasonable delay</strong> following discovery of the breach
        </li>
        <li>
          Notify the Georgia Consumer Protection Division of the Office of the Attorney General
          if the breach affects 10,000 or more Georgia residents
        </li>
      </ul>
      <p>
        All breach notifications, regardless of state, will include: a description of the incident,
        the categories of personal information involved, the approximate date of the breach,
        steps we are taking to address the breach, and recommended steps you can take to protect yourself.
        Notice will be delivered by email to the address on your account.
      </p>

      <h2>8. Data Retention</h2>
      <ul>
        <li><strong>Active accounts:</strong> Data retained for the life of your account</li>
        <li><strong>Cancelled/deleted accounts:</strong> Workspace data preserved in read-only mode for 90 days, then permanently deleted</li>
        <li><strong>Billing records:</strong> Retained for 7 years as required by Florida and federal tax law</li>
        <li><strong>JYSON history:</strong> Deleted with account; exportable on request before deletion</li>
        <li><strong>Security logs:</strong> Retained for up to 12 months</li>
      </ul>

      <h2>9. Security</h2>
      <p>
        We implement commercially reasonable security measures including:
        encryption in transit (TLS 1.2+), encryption at rest, strict access controls,
        regular security assessments, and SOC 2-aligned practices across our service providers.
      </p>
      <p>
        No security measure is 100% effective. If you discover a potential vulnerability, please
        report it responsibly to <a href="mailto:support@jdwhite.world">support@jdwhite.world</a>.
      </p>

      <h2>10. Email Communications</h2>
      <ul>
        <li>
          <strong>Transactional emails</strong> (billing receipts, security alerts, service notices):
          Required for account operation. Cannot be disabled.
        </li>
        <li>
          <strong>Marketing and intelligence emails:</strong> Require your explicit consent (opt-in).
          Florida and Georgia residents may withdraw consent at any time through Settings → Notifications
          or the unsubscribe link in any marketing email. Opt-out requests are processed within 10 business days.
        </li>
      </ul>
      <p>
        We comply with the Florida Electronic Commerce Protection Act, the Georgia Computer Systems
        Protection Act (O.C.G.A. § 16-9-90 et seq.), and applicable federal CAN-SPAM and TCPA requirements.
        We do not send unsolicited commercial email.
      </p>

      <h2>11. Deceptive and Unfair Trade Practices</h2>
      <p>
        We operate in compliance with the{' '}
        <strong>Florida Deceptive and Unfair Trade Practices Act (FDUTPA)</strong> (§ 501.201, Fla. Stat.)
        and the{' '}
        <strong>Georgia Fair Business Practices Act (GFBPA)</strong> (O.C.G.A. § 10-1-390 et seq.).
        Our pricing, billing, and service representations are accurate and non-deceptive.
        We do not engage in unfair, deceptive, or unconscionable practices under either statute.
      </p>
      <p>
        If you believe we have engaged in any deceptive or unfair practice:
      </p>
      <ul>
        <li>
          <strong>Florida residents:</strong> Contact us at{' '}
          <a href="mailto:support@jdwhite.world">support@jdwhite.world</a> or file a complaint
          with the Florida Department of Agriculture and Consumer Services.
        </li>
        <li>
          <strong>Georgia residents:</strong> Contact us at{' '}
          <a href="mailto:support@jdwhite.world">support@jdwhite.world</a> or file a complaint
          with the Georgia Governor&rsquo;s Office of Consumer Protection.
        </li>
      </ul>

      <h2>12. Children&rsquo;s Privacy</h2>
      <p>
        ACCESS is not directed to children under 13. We do not knowingly collect personal information
        from children under 13 without verifiable parental consent as required by COPPA. If you believe
        a child has created an account, contact us immediately and we will delete the account and
        associated data.
      </p>

      <h2>13. Changes to This Policy</h2>
      <p>
        We may update this policy at any time. For material changes, we will notify you via email
        to the address on your account at least 14 days before the change takes effect.
        Your continued use of ACCESS after the effective date constitutes acceptance.
        You may always view the current policy at{' '}
        <a href="https://app-iota-inky-62.vercel.app/privacy">access.jdwhite.world/privacy</a>.
      </p>

      <h2>14. Contact and Privacy Requests</h2>
      <p>
        For privacy requests, questions, or data subject rights requests under Florida law:
      </p>
      <ul>
        <li>Email: <a href="mailto:support@jdwhite.world">support@jdwhite.world</a></li>
        <li>In-app: Settings → Account → Privacy Request</li>
      </ul>
      <p>
        <strong>JD AI Systems, LLC</strong><br />
        Primary headquarters: Tampa, Florida<br />
        Secondary headquarters: Atlanta, Georgia (opening 2026)<br />
        Governing law: State of Florida, Hillsborough County
      </p>
    </LegalDocumentLayout>
  )
}
