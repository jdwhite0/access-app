import LegalDocumentLayout from '@/components/legal/LegalDocumentLayout'

export const metadata = {
  title: 'Acceptable Use Policy — ACCESS',
  description: 'Rules governing acceptable and prohibited use of the ACCESS platform.',
}

export default function AcceptableUsePage() {
  return (
    <LegalDocumentLayout title="Acceptable Use Policy">
      <p><strong>Effective date: June 6, 2026 · Last updated: June 6, 2026</strong></p>
      <p>
        This Acceptable Use Policy (&ldquo;AUP&rdquo;) governs your use of the ACCESS platform
        operated by <strong>JD AI Systems, LLC</strong>. By using ACCESS, you agree to this policy.
        This AUP is incorporated into and subject to our{' '}
        <a href="/terms">Terms of Service</a>.
      </p>

      <h2>1. Permitted Uses</h2>
      <p>You may use ACCESS to:</p>
      <ul>
        <li>Manage your legitimate business operations, projects, clients, and systems</li>
        <li>Store and organize your intellectual property, assets, and business data</li>
        <li>Automate lawful business workflows and processes</li>
        <li>Use JYSON to get AI-powered assistance with your business operations</li>
        <li>Collaborate with authorized team members (Enterprise plan)</li>
        <li>Build and manage client relationships through the CRM module</li>
        <li>Integrate with authorized third-party tools and APIs</li>
      </ul>

      <h2>2. Prohibited Uses</h2>
      <p>You may not use ACCESS to:</p>

      <h3>Illegal or harmful activity</h3>
      <ul>
        <li>Violate any applicable local, state, federal, or international law or regulation</li>
        <li>Engage in fraudulent activity, identity theft, or impersonation</li>
        <li>Facilitate money laundering, tax evasion, or financial crimes</li>
        <li>Store, transmit, or process child sexual abuse material (CSAM) — zero tolerance, immediate termination and law enforcement referral</li>
        <li>Conduct or facilitate harassment, stalking, or threats against individuals</li>
        <li>Violate intellectual property rights of others, including copyright and trademark</li>
      </ul>

      <h3>Platform abuse</h3>
      <ul>
        <li>Attempt to gain unauthorized access to other accounts, systems, or data</li>
        <li>Circumvent, disable, or interfere with security features or access controls</li>
        <li>Conduct penetration testing, vulnerability scanning, or load testing without prior written authorization from JD AI Systems, LLC</li>
        <li>Introduce malware, viruses, Trojans, or any malicious code</li>
        <li>Scrape, harvest, or systematically extract data from the platform beyond your own workspace</li>
        <li>Use automated bots, scripts, or tools to abuse the platform in ways that degrade service for others</li>
        <li>Reverse-engineer, decompile, or disassemble the platform or its underlying technology</li>
      </ul>

      <h3>Content violations</h3>
      <ul>
        <li>Store or transmit content that is obscene, defamatory, or violates third-party rights</li>
        <li>Use the platform to send unsolicited commercial messages (spam) in violation of CAN-SPAM, TCPA, or applicable state law</li>
        <li>Misuse the JYSON AI system to generate content intended to deceive, defraud, or harm individuals</li>
        <li>Store sensitive government identification data (SSNs, passport numbers, etc.) without appropriate security controls</li>
      </ul>

      <h3>Commercial misuse</h3>
      <ul>
        <li>Resell, sublicense, or white-label ACCESS without prior written authorization</li>
        <li>Use ACCESS to build a competing product that replicates its core functionality</li>
        <li>Share account access with unauthorized users (each seat is one person or entity)</li>
        <li>Circumvent usage limits or billing controls through technical means</li>
      </ul>

      <h2>3. JYSON AI — Specific Restrictions</h2>
      <p>When using the JYSON AI intelligence layer, you additionally may not:</p>
      <ul>
        <li>Attempt to extract training data, system prompts, or underlying model information</li>
        <li>Use JYSON outputs to generate misinformation, disinformation, or deceptive content at scale</li>
        <li>Prompt JYSON to assist with illegal activities or to produce content that violates this AUP</li>
        <li>Use JYSON in any way that could create legal liability for JD AI Systems, LLC</li>
      </ul>

      <h2>4. Sensitive Data</h2>
      <p>
        ACCESS is not designed or certified for storing regulated sensitive data categories including:
        Protected Health Information (PHI) under HIPAA, payment card data (PAN/CVV — use Stripe for this),
        or classified government information. Do not store these data categories in ACCESS without
        a separate written data processing agreement with JD AI Systems, LLC.
      </p>

      <h2>5. Enforcement</h2>
      <p>
        Violation of this AUP may result in immediate suspension or termination of your account,
        without refund. For severe violations (CSAM, criminal activity, platform attacks), we will
        cooperate with law enforcement and preserve relevant evidence.
      </p>
      <p>
        We reserve the right to investigate suspected violations and to remove content or suspend
        access when we have reasonable belief that this AUP has been violated, without prior notice.
      </p>
      <p>
        To report an AUP violation, email{' '}
        <a href="mailto:support@jdwhite.world">support@jdwhite.world</a> with the subject line
        &quot;AUP Report.&quot;
      </p>

      <h2>6. Changes</h2>
      <p>
        We may update this policy at any time. Material changes will be communicated via email
        at least 14 days before taking effect. Continued use of ACCESS after the effective date
        constitutes acceptance.
      </p>

      <p>
        <strong>JD AI Systems, LLC</strong> · Tampa, Florida ·{' '}
        <a href="mailto:support@jdwhite.world">support@jdwhite.world</a>
      </p>
    </LegalDocumentLayout>
  )
}
