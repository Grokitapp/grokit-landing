import { Link, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { GrokitLogo } from '../components/Grokitlogo';

// ---------------------------------------------------------------------------
// NOTE: This is a starter Terms of Service written for Grokit. It is a
// reasonable general-purpose template, but it has not been reviewed by a
// lawyer. Please have counsel review before relying on it in production.
// Update the placeholder contact details and effective date below.
// ---------------------------------------------------------------------------

const LAST_REVISED = 'September 8th, 2026';
const CONTACT_EMAIL = 'usegrokit@gmail.com';

function Section({ title, children }: {title: string;children: React.ReactNode;}) {
  return (
    <section className="mb-8">
      <h2 className="font-display text-xl text-ink font-extrabold mb-2">{title}</h2>
      <div className="text-body font-sans leading-relaxed space-y-3">{children}</div>
    </section>);

}

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-surface flex flex-col">
      <div className="w-full px-6 pt-6 pb-2 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-body hover:text-ink transition-colors shrink-0"
          aria-label="Back">

          <ArrowLeft className="w-5 h-5" />
        </button>
        <GrokitLogo size={28} className="text-ink" />
      </div>

      <div className="flex-1 px-6 py-8">
        <div className="w-full max-w-2xl mx-auto">
          <h1 className="font-display text-3xl sm:text-4xl text-ink font-extrabold mb-1">
            Terms of Service
          </h1>
          <p className="text-muted font-sans text-sm mb-10">Last revised on {LAST_REVISED}</p>

          <Section title="1. Agreement to these terms">
            <p>
              Grokit is operated by Grokit ("we," "us," or "our"). By creating an
              account or otherwise accessing or using the Grokit website, apps, and
              related services (together, the "Service"), you agree to be bound by
              these Terms of Service. If you do not agree, please do not use the
              Service. We may update these terms from time to time; continued use
              of the Service after an update means you accept the revised terms.
            </p>
          </Section>

          <Section title="2. Your account">
            <p>
              You're responsible for keeping your login credentials secure and for
              all activity that happens under your account. Please provide accurate
              information when you register, and let us know right away if you
              suspect unauthorized use of your account.
            </p>
          </Section>

          <Section title="3. Acceptable use">
            <p>
              Use Grokit for its intended purpose: learning. Don't use the Service
              to harass others, violate applicable law, infringe anyone's
              intellectual property, or attempt to disrupt, scrape, or reverse
              engineer the Service.
            </p>
          </Section>

          <Section title="4. Content you submit">
            <p>
              If you submit prompts, notes, or other content to Grokit, you keep
              ownership of it. You grant us a license to store, process, and use
              that content solely to operate, maintain, and improve the Service
              for you (for example, to generate a personalized course).
            </p>
          </Section>

          <Section title="5. Subscriptions and payments">
            <p>
              Paid plans, where offered, renew automatically until cancelled. You
              can cancel anytime from your account settings; you'll keep access
              through the end of the period you already paid for. Fees are
              generally non-refundable except where required by law.
            </p>
          </Section>

          <Section title="6. Disclaimers">
            <p>
              The Service is provided "as is." We work hard to keep it accurate
              and available, but we don't guarantee it will be uninterrupted,
              error-free, or fit for every purpose.
            </p>
          </Section>

          <Section title="7. Limitation of liability">
            <p>
              To the maximum extent permitted by law, Grokit is not liable for
              indirect, incidental, or consequential damages arising from your
              use of the Service.
            </p>
          </Section>

          <Section title="8. Termination">
            <p>
              You may stop using the Service and delete your account at any time.
              We may suspend or terminate accounts that violate these terms.
            </p>
          </Section>

          <Section title="9. Governing law">
            <p>
              These terms are governed by the laws applicable in our place of
              incorporation, without regard to conflict-of-law principles.
            </p>
          </Section>

          <Section title="10. Contact us">
            <p>
              Questions about these terms? Reach us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-orange font-bold hover:underline">
                {CONTACT_EMAIL}
              </a>.
            </p>
          </Section>

          <p className="text-sm text-muted font-sans mt-12">
            See also our{' '}
            <Link to="/privacy" className="text-orange font-bold hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
    );
}