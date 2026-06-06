import LegalDocumentLayout from '@/components/legal/LegalDocumentLayout'

export const metadata = {
  title: 'Terms of Service — ACCESS',
  description: 'Terms of Service governing use of the ACCESS platform by JD AI Systems, LLC — compliant with Florida and Georgia law.',
}

export default function TermsPage() {
  return (
    <LegalDocumentLayout title="Terms of Service">
      <p><strong>Effective date: June 6, 2026 · Last updated: June 6, 2026</strong></p>
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the ACCESS platform
        (&ldquo;ACCESS&rdquo; or the &ldquo;Service&rdquo;), operated by <strong>JD AI Systems, LLC</strong>
        (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;).
        By creating an account or using the Service, you agree to be bound by these Terms.
        These Terms are designed to comply with the laws of Florida and Georgia, including the
        Florida Deceptive and Unfair Trade Practices Act (FDUTPA) (§ 501.201, Fla. Stat.),
        the Georgia Fair Business Practices Act (GFBPA) (O.C.G.A. § 10-1-390 et seq.),
        and the Florida Electronic Transactions Act (§ 668.001, Fla. Stat.).
      </p>
      <p>
        <strong>Primary headquarters:</strong> Tampa, Florida ·{' '}
        <strong>Secondary headquarters:</strong> Atlanta, Georgia (opening 2026) ·{' '}
        Email: <a href="mailto:support@jdwhite.world">support@jdwhite.world</a>
      </p>

      <h2>1. The Service</h2>
      <p>
        ACCESS is an AI-powered operating system for founders, creators, consultants, agencies, nonprofits,
        churches, and operators. The platform includes Registry, Projects, CRM (Customers), Assets, Vaults,
        Workflows, Offers, Knowledge base, Memory, and JYSON — the ACCESS intelligence layer.
        Features may be added, modified, or removed at any time with reasonable notice to active subscribers.
      </p>

      <h2>2. Accounts and Access</h2>
      <p>
        You must create an account to use ACCESS. You are responsible for maintaining the security of your
        credentials and ACCESS ID. You may not share, transfer, or sell access to your account.
        Accounts are personal — one account per individual or legal entity.
      </p>
      <p>
        By creating an account, you represent that you are at least 18 years old and have the legal capacity
        to enter into a binding agreement under applicable law.
      </p>

      <h2>3. Plans and Billing — Florida/Georgia Auto-Renewal Disclosure</h2>
      <p>
        ACCESS offers three subscription tiers:
      </p>
      <ul>
        <li><strong>Personal:</strong> $29/month or $290/year</li>
        <li><strong>Builder:</strong> $99/month or $990/year</li>
        <li><strong>Enterprise:</strong> $299/month or $2,990/year (contact us for setup)</li>
      </ul>
      <p>
        Prices are in USD. We will provide 30 days&rsquo; advance notice to active subscribers before
        changing subscription prices.
      </p>
      <p>
        <strong>Auto-Renewal Disclosure (required by Florida FDUTPA and Georgia GFBPA):</strong>{' '}
        Subscriptions automatically renew at the end of each billing period at the then-current rate
        unless you cancel before the renewal date. By subscribing, you authorize us to charge your
        payment method on a recurring basis. We will send a reminder email before each renewal.
        You may cancel at any time through Settings → Billing or by contacting us at{' '}
        <a href="mailto:support@jdwhite.world">support@jdwhite.world</a>.
        Cancellation takes effect at the end of the current billing period; access continues until then.
      </p>
      <p>
        <strong>Downgrade policy:</strong> Downgrading your plan takes effect at the start of the next
        billing period. Your workspace data is preserved in read-only mode during the downgrade window.
      </p>

      <h2>4. Refund Policy</h2>
      <p>
        Annual subscribers may request a full refund within <strong>30 days</strong> of their original
        purchase date. Monthly subscribers may request a refund within <strong>7 days</strong> of their
        first charge. Contact <a href="mailto:support@jdwhite.world">support@jdwhite.world</a> to initiate
        a refund. We reserve the right to decline refunds for subsequent billing periods.
      </p>
      <p>
        Refund requests submitted in good faith by Florida or Georgia residents will be honored in
        compliance with FDUTPA and GFBPA requirements for fair and non-deceptive commercial practices.
      </p>

      <h2>5. Payment Processing and ACH Authorization</h2>
      <p>
        All payments are processed by <strong>Stripe, Inc.</strong>, a PCI-DSS-compliant payment processor.
        We accept credit cards, debit cards, and ACH bank transfers (US bank accounts only).
      </p>
      <p>
        <strong>ACH Authorization:</strong> By providing your bank account information and authorizing
        ACH payment, you authorize us (through Stripe) to initiate recurring electronic debits from
        your designated bank account for the subscription fees described herein. ACH transactions are
        governed by NACHA Operating Rules and applicable provisions of the Uniform Commercial Code
        as adopted in Florida (F.S. Chapter 674) and Georgia (O.C.G.A. Title 11, Article 4A).
        You may revoke this authorization at any time by contacting us or updating your payment method
        in the billing portal. Revocation does not affect charges already processed.
      </p>
      <p>
        <strong>ACH dispute rights:</strong> If an ACH debit was made in error or without authorization,
        you may dispute it with your bank within 60 days of the statement date. Contact us immediately
        at <a href="mailto:support@jdwhite.world">support@jdwhite.world</a> if you believe an unauthorized
        debit occurred.
      </p>
      <p>
        Enterprise subscribers may pay via ACH direct debit or wire transfer for annual contracts.
        Wire transfer instructions are available upon request.
      </p>

      <h2>6. Free Trial</h2>
      <p>
        We offer a 14-day free trial of the Builder plan. No credit card is required to start a trial.
        At the end of the trial period, you may subscribe to a paid plan or your account will be
        downgraded to Personal limits. Trial workspace data is fully preserved regardless of which path
        you choose.
      </p>

      <h2>7. Your Data and Content</h2>
      <p>
        You retain full ownership of all data, content, and intellectual property you submit to ACCESS.
        By using the Service, you grant us a limited, non-exclusive, royalty-free license to store,
        process, and display your content solely for the purpose of providing the Service to you.
        This license terminates when you delete your account or the content in question.
        We do not sell your data to third parties. See our Privacy Policy for full details.
      </p>

      <h2>8. JYSON — AI Intelligence Layer</h2>
      <p>
        JYSON is ACCESS&rsquo;s embedded AI intelligence layer. JYSON processes your workspace data
        (projects, assets, CRM, systems, vault metadata) to provide intelligent recommendations,
        summaries, and automated actions. JYSON responses are AI-generated and may contain errors.
        You are responsible for reviewing any JYSON-generated output before acting on it.
        We do not guarantee the accuracy, completeness, or fitness of JYSON outputs for any particular purpose.
        JYSON is not a substitute for professional legal, financial, medical, or other expert advice.
      </p>

      <h2>9. Prohibited Uses</h2>
      <p>You may not use ACCESS to:</p>
      <ul>
        <li>Violate any applicable law or regulation, including Florida and Georgia consumer protection laws</li>
        <li>Transmit malware, spam, or harmful content</li>
        <li>Circumvent, disable, or interfere with security features</li>
        <li>Attempt to access accounts, data, or systems that are not yours</li>
        <li>Engage in fraudulent or deceptive practices prohibited under FDUTPA or GFBPA</li>
        <li>Resell, sublicense, or white-label the Service without written authorization</li>
        <li>Use the platform in any way that disrupts or damages the Service for others</li>
      </ul>

      <h2>10. Intellectual Property</h2>
      <p>
        The ACCESS platform, JYSON, branding, design, and underlying technology are the exclusive
        property of JD AI Systems, LLC. Nothing in these Terms transfers any intellectual property
        rights to you except the limited license to use the Service as described herein.
      </p>

      <h2>11. Disclaimer of Warranties</h2>
      <p>
        THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES
        OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
        PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE
        UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.
      </p>
      <p>
        Notwithstanding the foregoing, nothing in this disclaimer limits rights available to Florida
        residents under FDUTPA or Georgia residents under GFBPA with respect to materially false or
        misleading representations.
      </p>

      <h2>12. Limitation of Liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, JD AI SYSTEMS, LLC AND ITS AFFILIATES
        SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
        OR ANY LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES ARISING FROM YOUR USE OF THE SERVICE,
        EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY TO YOU SHALL NOT EXCEED
        THE AMOUNT YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM.
      </p>
      <p>
        Nothing in this section limits liability for fraud, gross negligence, or willful misconduct,
        or any rights that cannot be waived under Florida or Georgia law.
      </p>

      <h2>13. Consumer Protection — Florida and Georgia Residents</h2>
      <p>
        We operate in compliance with the{' '}
        <strong>Florida Deceptive and Unfair Trade Practices Act (FDUTPA)</strong> (§ 501.201, Fla. Stat.)
        and the{' '}
        <strong>Georgia Fair Business Practices Act (GFBPA)</strong> (O.C.G.A. § 10-1-390 et seq.).
        These laws prohibit unfair methods of competition and unfair or deceptive acts or practices
        in the conduct of consumer transactions. Our Terms, pricing, and service practices are designed
        to be transparent, accurate, and non-deceptive.
      </p>
      <p>
        Florida residents may file complaints with the Florida Department of Agriculture and Consumer Services
        at{' '}
        <a href="https://www.fdacs.gov" target="_blank" rel="noopener noreferrer">fdacs.gov</a>.
        Georgia residents may file complaints with the Georgia Governor&rsquo;s Office of Consumer Protection
        at{' '}
        <a href="https://consumer.georgia.gov" target="_blank" rel="noopener noreferrer">consumer.georgia.gov</a>.
      </p>

      <h2>14. Electronic Agreements</h2>
      <p>
        By using ACCESS, you consent to transact electronically and agree that electronic records and
        signatures have the same legal effect as paper records and handwritten signatures under the
        Florida Electronic Transactions Act (§ 668.001, Fla. Stat.) and the
        Georgia Electronic Records and Signatures Act (O.C.G.A. § 10-12-1 et seq.).
      </p>

      <h2>15. Governing Law and Dispute Resolution</h2>
      <p>
        These Terms are governed by the laws of the <strong>State of Florida</strong>, without regard to
        conflict of law principles. Any disputes arising under or related to these Terms shall be resolved
        in the state or federal courts located in <strong>Hillsborough County, Florida</strong>,
        and you consent to personal jurisdiction in those courts.
      </p>
      <p>
        For users in Georgia, nothing in this section waives rights available to you under the
        Georgia Fair Business Practices Act or other non-waivable Georgia consumer protection statutes.
      </p>

      <h2>16. Changes to Terms</h2>
      <p>
        We may update these Terms at any time. Material changes will be communicated via email to the
        address associated with your account at least <strong>14 days</strong> before taking effect.
        Non-material changes (such as grammar corrections or clarifications that do not affect your
        rights) take effect upon posting. Continued use of the Service after the effective date of
        material changes constitutes your acceptance of the revised Terms.
      </p>
      <p>
        If you do not agree to the revised Terms, you must cancel your subscription before the effective
        date. We will honor a prorated refund for any remaining unused subscription period if you cancel
        solely due to a material change in these Terms.
      </p>

      <h2>17. Contact</h2>
      <p>
        Questions about these Terms? Contact us at{' '}
        <a href="mailto:support@jdwhite.world">support@jdwhite.world</a> or through your ACCESS workspace.
        We will respond within 5 business days.
      </p>
      <p>
        <strong>JD AI Systems, LLC</strong><br />
        Primary headquarters: Tampa, Florida<br />
        Secondary headquarters: Atlanta, Georgia (opening 2026)<br />
        Governing law: State of Florida, Hillsborough County courts
      </p>
    </LegalDocumentLayout>
  )
}
