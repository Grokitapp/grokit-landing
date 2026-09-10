import { Link, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { GrokitLogo } from '../components/Grokitlogo';

// ---------------------------------------------------------------------------
// NOTE: This is a starter Privacy Policy written for Grokit. It is a
// reasonable general-purpose template, but it has not been reviewed by a
// lawyer. Please have counsel review before relying on it in production,
// especially if you serve users in the EU/UK (GDPR) or California (CCPA).
// Update the placeholder contact details and effective date below.
// ---------------------------------------------------------------------------

const LAST_REVISED = 'September 8th, 2026';
const CONTACT_EMAIL = 'privacy@grokit.app';

function Section({ title, children }: {title: string;children: React.ReactNode;}) {
  return (
    <section className="mb-8">
      <h2 className="font-display text-xl text-ink font-extrabold mb-2">{title}</h2>
      <div className="text-body font-sans leading-relaxed space-y-3">{children}</div>
    </section>);

}

export default function PrivacyPolicy() {
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
            Privacy Policy
          </h1>
          <p className="text-muted font-sans text-sm mb-10">Last revised on {LAST_REVISED}</p>

          <Section title="1. Overview">
            <p>
              This policy explains what personal information Grokit collects when
              you use our website and apps (the "Service"), how we use it, and
              the choices you have. By using the Service, you agree to this
              policy.
            </p>
          </Section>

          <Section title="2. Information we collect">
            <p>
              <span className="font-bold text-ink">Account information:</span>{' '}
              your email address and password (or, if you sign in with Google,
              basic profile info from that provider).
            </p>
            <p>
              <span className="font-bold text-ink">Learning activity:</span> your
              stated role, interests, goals, and the topics or prompts you use
              to build courses, so we can personalize your learning path.
            </p>
            <p>
              <span className="font-bold text-ink">Usage data:</span> device and
              browser information, log data, and how you interact with the
              Service, which helps us fix bugs and improve the product.
            </p>
          </Section>

          <Section title="3. How we use your information">
            <p>
              We use your information to provide and personalize the Service
              (for example, generating courses relevant to your goals),
              communicate with you about your account, keep the Service secure,
              and improve our product over time.
            </p>
          </Section>

          <Section title="4. Sharing your information">
            <p>
              We don't sell your personal information. We share it only with
              service providers who help us run Grokit — for example, cloud
              hosting and authentication providers — and only to the extent
              needed to provide the Service, or when required by law.
            </p>
          </Section>

          <Section title="5. Your choices and rights">
            <p>
              You can review and update your account information at any time in
              Settings. You may request a copy of your data, ask us to correct
              it, or request deletion of your account by contacting us below.
            </p>
          </Section>

          <Section title="6. Data retention">
            <p>
              We keep your information for as long as your account is active, or
              as needed to provide the Service, comply with legal obligations,
              and resolve disputes.
            </p>
          </Section>

          <Section title="7. Children's privacy">
            <p>
              Grokit is not directed at children, and we do not knowingly
              collect personal information from children under 13 (or the
              relevant age of digital consent in your country).
            </p>
          </Section>

          <Section title="8. Changes to this policy">
            <p>
              If we make material changes to this policy, we'll notify you
              through the Service or by email and update the "last revised"
              date above.
            </p>
          </Section>

          <Section title="9. Contact us">
            <p>
              Questions about your data? Reach us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-orange font-bold hover:underline">
                {CONTACT_EMAIL}
              </a>.
            </p>
          </Section>

          <p className="text-sm text-muted font-sans mt-12">
            See also our{' '}
            <Link to="/terms" className="text-orange font-bold hover:underline">Terms of Service</Link>.
          </p>
        </div>
      </div>
    </div>
    );
}