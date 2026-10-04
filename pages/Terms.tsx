import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { GrokitLogo } from '../components/Grokitlogo';

// ---------------------------------------------------------------------------
// Grokit Terms of Service
//
// Last revised: September 8, 2026
//
// IMPORTANT:
// The following company-specific legal details were not provided in the
// current Grokit materials and must be completed before production use:
//
// - Legal company name
// - Company type
// - Governing-law country/state
// - Court city/country
// - Liability amount
//
// The Terms content below is based on the supplied Grokit Terms document.
// Please have the final document reviewed by qualified legal counsel.
// ---------------------------------------------------------------------------

const LAST_REVISED = 'September 8, 2026';
const CONTACT_EMAIL = 'usegrokit@gmail.com';

const sections = [
  {
    id: 'agreement',
    number: 1,
    title: 'Agreement to these terms',
  },
  {
    id: 'who-can-use',
    number: 2,
    title: 'Who can use Grokit',
  },
  {
    id: 'account',
    number: 3,
    title: 'Your account',
  },
  {
    id: 'what-grokit-does',
    number: 4,
    title: 'What Grokit does',
  },
  {
    id: 'ai-content',
    number: 5,
    title: 'AI-generated content: please read carefully',
  },
  {
    id: 'acceptable-use',
    number: 6,
    title: 'Acceptable use',
  },
  {
    id: 'your-content',
    number: 7,
    title: 'Content you submit',
  },
  {
    id: 'generated-content-rights',
    number: 8,
    title: 'Generated Content and your rights',
  },
  {
    id: 'third-party',
    number: 9,
    title: 'Third-party services',
  },
  {
    id: 'plans',
    number: 10,
    title: 'Plans, waitlist, and payments',
  },
  {
    id: 'feedback',
    number: 11,
    title: 'Feedback',
  },
  {
    id: 'copyright',
    number: 12,
    title: 'Copyright and takedown',
  },
  {
    id: 'disclaimers',
    number: 13,
    title: 'Disclaimers',
  },
  {
    id: 'liability',
    number: 14,
    title: 'Limitation of liability',
  },
  {
    id: 'termination',
    number: 15,
    title: 'Termination, governing law, and contact',
  },
];

function Section({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-8 mb-14 sm:mb-16"
    >
      <div className="grid grid-cols-[40px_minmax(0,1fr)] gap-4 sm:grid-cols-[44px_minmax(0,1fr)] sm:gap-5">
        {/* Section number */}
        <div
          aria-hidden="true"
          className="
            pt-0.5
            text-[20px]
            sm:text-[22px]
            font-bold
            leading-none
            text-[#7890A8]
          "
        >
          {number}.
        </div>

        {/* Section content */}
        <div className="min-w-0">
          <h2
            className="
              font-display
              text-[21px]
              sm:text-[24px]
              leading-[1.25]
              font-extrabold
              tracking-[-0.02em]
              text-white
            "
          >
            {title}
          </h2>

          <div
            className="
              mt-3
              space-y-4
              font-sans
              text-[15px]
              sm:text-[16px]
              leading-[1.75]
              text-[#B8C7D5]
            "
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

function InlineLink({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="
        text-[#FF6B00]
        underline
        decoration-[#FF6B00]/60
        underline-offset-2
        transition-colors
        hover:text-[#FF8A3D]
      "
    >
      {children}
    </Link>
  );
}

function ContactLink() {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      className="
        text-[#FF6B00]
        underline
        decoration-[#FF6B00]/60
        underline-offset-2
        transition-colors
        hover:text-[#FF8A3D]
      "
    >
      {CONTACT_EMAIL}
    </a>
  );
}

function BulletList({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ul
      className="
        space-y-1.5
        list-disc
        pl-5
        marker:text-[#FF6B00]
      "
    >
      {children}
    </ul>
  );
}

function Bullet({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <li className="pl-1">
      {children}
    </li>
  );
}

export default function Terms() {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] =
    useState('agreement');

  const sectionIds = useMemo(
    () => sections.map((section) => section.id),
    [],
  );

  // -------------------------------------------------------------------------
  // Track the section currently visible in the viewport.
  // -------------------------------------------------------------------------

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);

      if (!element) return;

      const observer = new IntersectionObserver(
        (entries) => {
          const visibleEntries = entries
            .filter((entry) => entry.isIntersecting)
            .sort(
              (a, b) =>
                a.boundingClientRect.top -
                b.boundingClientRect.top,
            );

          if (visibleEntries.length > 0) {
            setActiveSection(
              visibleEntries[0].target.id,
            );
          }
        },
        {
          rootMargin: '-12% 0px -70% 0px',
          threshold: 0,
        },
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) =>
        observer.disconnect(),
      );
    };
  }, [sectionIds]);

  // -------------------------------------------------------------------------
  // Smooth-scroll to a section when clicking the right-side navigation.
  // -------------------------------------------------------------------------

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);

    if (!element) return;

    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="min-h-[100dvh] bg-[#06131D] text-white">
      {/* =================================================================== */}
      {/* HEADER                                                              */}
      {/* =================================================================== */}

      <header
        className="
          mx-auto
          flex
          w-full
          max-w-[1440px]
          items-center
          px-5
          pt-5
          sm:px-8
          sm:pt-6
          lg:px-10
        "
      >
        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="
            group
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-full
            border
            border-[#203544]
            bg-[#0C1C27]
            text-[#D7E2EA]
            shadow-[0_8px_30px_rgba(0,0,0,0.18)]
            transition-all
            duration-200
            hover:border-[#355064]
            hover:bg-[#112631]
            hover:text-white
            focus:outline-none
            focus:ring-2
            focus:ring-[#FF6B00]/50
          "
        >
          <ArrowLeft
            className="
              h-5
              w-5
              transition-transform
              duration-200
              group-hover:-translate-x-0.5
            "
            strokeWidth={2}
          />
        </button>

        {/* Grokit logo */}
        <Link
          to="/"
          aria-label="Grokit home"
          className="ml-5 flex items-center"
        >
          <GrokitLogo
            size={42}
            className="text-[#FF6B00]"
          />
        </Link>
      </header>

      {/* =================================================================== */}
      {/* MAIN                                                                */}
      {/* =================================================================== */}

      <main
        className="
          mx-auto
          w-full
          max-w-[1180px]
          px-6
          pb-24
          pt-10
          sm:px-8
          sm:pt-12
          lg:px-10
          lg:pt-8
        "
      >
        <div
          className="
            grid
            grid-cols-1
            gap-14
            lg:grid-cols-[minmax(0,720px)_240px]
            lg:gap-20
          "
        >
          {/* ================================================================= */}
          {/* TERMS CONTENT                                                     */}
          {/* ================================================================= */}

          <article className="min-w-0">
            {/* ----------------------------------------------------------------- */}
            {/* TITLE                                                             */}
            {/* ----------------------------------------------------------------- */}

            <div className="mb-12">
              <h1
                className="
                  font-display
                  text-[42px]
                  font-extrabold
                  leading-[1.08]
                  tracking-[-0.035em]
                  text-white
                  sm:text-[52px]
                  lg:text-[54px]
                "
              >
                Terms of Service
              </h1>

              <p
                className="
                  mt-3
                  font-sans
                  text-[15px]
                  sm:text-[16px]
                  text-[#8FA4B7]
                "
              >
                Last revised on {LAST_REVISED}
              </p>

              <p
                className="
                  mt-5
                  max-w-[700px]
                  font-sans
                  text-[15px]
                  sm:text-[16px]
                  leading-[1.75]
                  text-[#C0CDD8]
                "
              >
                Please read these Terms of Service carefully
                before using Grokit. By creating an account,
                joining our waitlist, or otherwise using the
                Service, you agree to these Terms and to our{' '}
                <InlineLink to="/privacy">
                  Privacy Policy
                </InlineLink>
                .
              </p>
            </div>

            {/* ================================================================= */}
            {/* 1. AGREEMENT                                                      */}
            {/* ================================================================= */}

            <Section
              id="agreement"
              number={1}
              title="Agreement to these terms"
            >
              <p>
                Grokit is operated by [Legal company name],
                [company type] ("Grokit," "we," "us," or
                "our"). These Terms of Service ("Terms")
                govern your use of the Grokit website, apps,
                and related services (together, the
                "Service").
              </p>

              <p>
                By creating an account, joining our waitlist,
                or otherwise using the Service, you agree to
                these Terms and to our{' '}
                <InlineLink to="/privacy">
                  Privacy Policy
                </InlineLink>
                . If you don't agree, please don't use the
                Service.
              </p>

              <p>
                We may update these Terms from time to time.
                If we make material changes, we'll notify you
                through the Service or by email and update the
                date above. Continuing to use the Service
                after a change means you accept the updated
                Terms.
              </p>
            </Section>

            {/* ================================================================= */}
            {/* 2. WHO CAN USE                                                     */}
            {/* ================================================================= */}

            <Section
              id="who-can-use"
              number={2}
              title="Who can use Grokit"
            >
              <p>
                You must be at least 13 years old, or the
                minimum age of digital consent in your country
                if it is higher, to use the Service. If you
                are under 18, you confirm that a parent or
                guardian has reviewed and agreed to these
                Terms on your behalf.
              </p>

              <p>
                You may not use the Service if you have been
                previously removed from it for violating these
                Terms.
              </p>
            </Section>

            {/* ================================================================= */}
            {/* 3. ACCOUNT                                                         */}
            {/* ================================================================= */}

            <Section
              id="account"
              number={3}
              title="Your account"
            >
              <p>
                You are responsible for keeping your login
                credentials secure and for all activity under
                your account. Please provide accurate
                information when you register, keep it up to
                date, and tell us right away at{' '}
                <ContactLink /> if you suspect unauthorized
                use of your account.
              </p>

              <p>
                If you sign in with Google, your Grokit account
                may be linked to your Google identity so you
                can use either sign-in method. You can manage
                or delete your account at any time in Settings.
              </p>
            </Section>

            {/* ================================================================= */}
            {/* 4. WHAT GROKIT DOES                                               */}
            {/* ================================================================= */}

            <Section
              id="what-grokit-does"
              number={4}
              title="What Grokit does"
            >
              <p>
                Grokit lets you describe something you want to
                learn, and uses artificial intelligence to
                generate a personalized learning journey made
                up of zones, lessons, questions, and related
                features (together, "Generated Content").
              </p>

              <p>
                Features may change, be added, or be removed
                over time. Some features may be labeled
                "coming soon" or made available only to
                certain users, for example through our
                waitlist.
              </p>
            </Section>

            {/* ================================================================= */}
            {/* 5. AI CONTENT                                                      */}
            {/* ================================================================= */}

            <Section
              id="ai-content"
              number={5}
              title="AI-generated content: please read carefully"
            >
              <p>
                Generated Content is created by AI models
                operated by third-party providers. Because of
                this:
              </p>

              <BulletList>
                <Bullet>
                  <strong className="font-bold text-white">
                    It may be wrong.
                  </strong>{' '}
                  Generated Content can contain errors,
                  omissions, outdated information, or
                  statements that sound confident but are
                  incorrect. Grokit does not currently
                  guarantee that Generated Content is verified
                  against, or cited to, specific sources.
                </Bullet>

                <Bullet>
                  <strong className="font-bold text-white">
                    It is not professional advice.
                  </strong>{' '}
                  Generated Content is for general educational
                  purposes only. It is not medical, legal,
                  financial, engineering, safety, or other
                  professional advice. Don't rely on it for
                  decisions where an error could cause harm.
                  Consult a qualified professional instead.
                </Bullet>

                <Bullet>
                  <strong className="font-bold text-white">
                    It may not be unique.
                  </strong>{' '}
                  Similar or identical Generated Content may be
                  produced for different users.
                </Bullet>

                <Bullet>
                  <strong className="font-bold text-white">
                    You are responsible for how you use it.
                  </strong>{' '}
                  Please double-check anything important before
                  acting on it.
                </Bullet>
              </BulletList>

              <p>
                If you find an error, you can report it to{' '}
                <ContactLink /> and we'll work to improve the
                Service.
              </p>
            </Section>

            {/* ================================================================= */}
            {/* 6. ACCEPTABLE USE                                                 */}
            {/* ================================================================= */}

            <Section
              id="acceptable-use"
              number={6}
              title="Acceptable use"
            >
              <p>
                Use Grokit for its intended purpose: learning.
                You agree not to:
              </p>

              <BulletList>
                <Bullet>
                  break any applicable law or infringe
                  anyone's rights, including intellectual
                  property and privacy rights;
                </Bullet>

                <Bullet>
                  submit prompts or content that is illegal,
                  harassing, hateful, sexually explicit
                  involving minors, or that promotes violence
                  or self-harm;
                </Bullet>

                <Bullet>
                  try to generate content that facilitates
                  serious harm, such as weapons, malware, or
                  fraud;
                </Bullet>

                <Bullet>
                  attempt to disrupt, overload, probe, or
                  bypass the security or usage limits of the
                  Service;
                </Bullet>

                <Bullet>
                  scrape, copy, or collect content or data from
                  the Service by automated means without our
                  written permission;
                </Bullet>

                <Bullet>
                  reverse engineer or attempt to extract the
                  source code, models, prompts, or underlying
                  systems of the Service;
                </Bullet>

                <Bullet>
                  share your account, or create accounts to
                  avoid limits or bans;
                </Bullet>

                <Bullet>
                  resell or commercially redistribute the
                  Service or Generated Content as a competing
                  product;
                </Bullet>

                <Bullet>
                  impersonate another person or misrepresent
                  your affiliation.
                </Bullet>
              </BulletList>

              <p>
                We may refuse requests, filter content, or
                limit usage to keep the Service safe and
                available.
              </p>
            </Section>

            {/* ================================================================= */}
            {/* 7. YOUR CONTENT                                                   */}
            {/* ================================================================= */}

            <Section
              id="your-content"
              number={7}
              title="Content you submit"
            >
              <p>
                "Your Content" means the prompts, notes,
                answers, highlights, files, and other material
                you submit to Grokit.
              </p>

              <BulletList>
                <Bullet>
                  <strong className="font-bold text-white">
                    You keep ownership
                  </strong>{' '}
                  of Your Content.
                </Bullet>

                <Bullet>
                  <strong className="font-bold text-white">
                    You give us a license
                  </strong>{' '}
                  to store, process, and use Your Content,
                  including by sending it to our service
                  providers, solely to operate, maintain,
                  secure, and improve the Service for you, for
                  example to generate and personalize your
                  journeys.
                </Bullet>

                <Bullet>
                  <strong className="font-bold text-white">
                    You promise
                  </strong>{' '}
                  that you have the right to submit Your
                  Content and that it doesn't violate these
                  Terms or anyone else's rights.
                </Bullet>
              </BulletList>

              <p>
                Please don't submit sensitive personal
                information (such as government IDs, financial
                account numbers, or health records) in prompts
                or notes.
              </p>
            </Section>

            {/* ================================================================= */}
            {/* 8. GENERATED CONTENT RIGHTS                                        */}
            {/* ================================================================= */}

            <Section
              id="generated-content-rights"
              number={8}
              title="Generated Content and your rights"
            >
              <p>
                Subject to these Terms, you may use the
                Generated Content created for your account for
                your personal, non-commercial learning, and
                you may share your own journeys using the
                sharing features we provide.
              </p>

              <p>
                Grokit and its licensors own the Service
                itself, including its software, design, logos,
                mascot, branding, and the structure and look of
                the learning path. Nothing in these Terms
                transfers those rights to you. "Grokit" and the
                octopus mascot are our trademarks; don't use
                them without our permission.
              </p>
            </Section>

            {/* ================================================================= */}
            {/* 9. THIRD-PARTY SERVICES                                            */}
            {/* ================================================================= */}

            <Section
              id="third-party"
              number={9}
              title="Third-party services"
            >
              <p>
                The Service relies on third-party providers,
                such as cloud hosting, authentication, and AI
                model providers. When you use the Service,
                some of Your Content may be processed by these
                providers so we can deliver it. Your use of
                third-party sign-in options (like Google) is
                also subject to that provider's terms. We
                aren't responsible for third-party services
                outside our control. See our Privacy Policy
                for details.
              </p>
            </Section>

            {/* ================================================================= */}
            {/* 10. PLANS / WAITLIST / PAYMENTS                                    */}
            {/* ================================================================= */}

            <Section
              id="plans"
              number={10}
              title="Plans, waitlist, and payments"
            >
              <p>
                Grokit currently offers free access, subject to
                usage limits we may set and change. We may also
                offer a paid plan ("Pro") in the future.
                Joining a waitlist does not guarantee access, a
                launch date, or any particular feature or
                price.
              </p>

              <p>
                If we offer paid plans, these terms will apply,
                and we'll show the price, billing period, and
                renewal terms before you pay:
              </p>

              <BulletList>
                <Bullet>
                  Paid plans renew automatically until
                  cancelled.
                </Bullet>

                <Bullet>
                  You can cancel anytime from your account
                  settings, and you keep access through the end
                  of the period you've already paid for.
                </Bullet>

                <Bullet>
                  Fees are generally non-refundable, except
                  where required by law.
                </Bullet>

                <Bullet>
                  We may change prices with advance notice;
                  changes apply from your next billing period.
                </Bullet>
              </BulletList>
            </Section>

            {/* ================================================================= */}
            {/* 11. FEEDBACK                                                       */}
            {/* ================================================================= */}

            <Section
              id="feedback"
              number={11}
              title="Feedback"
            >
              <p>
                If you send us ideas or suggestions, we may use
                them without obligation or payment to you.
              </p>
            </Section>

            {/* ================================================================= */}
            {/* 12. COPYRIGHT                                                      */}
            {/* ================================================================= */}

            <Section
              id="copyright"
              number={12}
              title="Copyright and takedown"
            >
              <p>
                We respect intellectual property rights. If you
                believe content on the Service infringes your
                copyright, please contact{' '}
                <ContactLink /> with: your contact details, a
                description of the work, where it appears on
                the Service, a statement that you believe the
                use is not authorized, and a statement that the
                information is accurate and that you are the
                owner or authorized to act for the owner. We
                may remove content and terminate repeat
                infringers' accounts.
              </p>
            </Section>

            {/* ================================================================= */}
            {/* 13. DISCLAIMERS                                                    */}
            {/* ================================================================= */}

            <Section
              id="disclaimers"
              number={13}
              title="Disclaimers"
            >
              <p>
                The Service and all Generated Content are
                provided{' '}
                <strong className="font-bold text-white">
                  "as is" and "as available."
                </strong>{' '}
                We work to keep the Service accurate and
                available, but to the maximum extent permitted
                by law, we don't guarantee that it will be
                uninterrupted, secure, error-free, or fit for
                every purpose, and we make no promises about
                learning outcomes, grades, jobs, or results.
              </p>
            </Section>

            {/* ================================================================= */}
            {/* 14. LIMITATION OF LIABILITY                                        */}
            {/* ================================================================= */}

            <Section
              id="liability"
              number={14}
              title="Limitation of liability"
            >
              <p>
                To the maximum extent permitted by law, Grokit
                and its owners, employees, and suppliers are
                not liable for indirect, incidental, special,
                consequential, or punitive damages, or for lost
                profits, data, or opportunities, arising from
                your use of the Service or reliance on Generated
                Content. Our total liability for any claim
                relating to the Service is limited to the
                greater of (a) the amount you paid us in the 12
                months before the claim, or (b) [amount, e.g.
                USD 50].
              </p>

              <p>
                Some places don't allow these limits, so they
                may not fully apply to you. Nothing in these
                Terms limits liability that can't be limited by
                law.
              </p>
            </Section>

            {/* ================================================================= */}
            {/* 15. TERMINATION / GOVERNING LAW / CONTACT                        */}
            {/* ================================================================= */}

            <Section
              id="termination"
              number={15}
              title="Termination, governing law, and contact"
            >
              <p>
                <strong className="font-bold text-white">
                  Termination.
                </strong>{' '}
                You may stop using the Service and delete your
                account at any time. We may suspend or end your
                access if you violate these Terms, put the
                Service or others at risk, or if we stop
                providing the Service. Sections that by their
                nature should continue (such as ownership,
                disclaimers, and liability limits) survive
                termination.
              </p>

              <p>
                <strong className="font-bold text-white">
                  Governing law.
                </strong>{' '}
                These Terms are governed by the laws of
                [country/state], without regard to conflict-of-law
                rules. Any dispute will be handled in the courts
                of [city, country], unless the law where you live
                gives you the right to bring a claim elsewhere.
              </p>

              <p>
                <strong className="font-bold text-white">
                  General.
                </strong>{' '}
                If any part of these Terms is found
                unenforceable, the rest stays in effect. If we
                don't enforce a provision, that isn't a waiver.
                You may not transfer your rights under these
                Terms without our consent; we may transfer ours
                as part of a business change. These Terms and
                our Privacy Policy are the entire agreement
                between you and us about the Service.
              </p>

              <p>
                <strong className="font-bold text-white">
                  Contact.
                </strong>{' '}
                Questions about these Terms? Reach us at{' '}
                <ContactLink />.
              </p>
            </Section>

            {/* ================================================================= */}
            {/* SEE ALSO                                                           */}
            {/* ================================================================= */}

            <div
              className="
                border-t
                border-[#203442]
                pt-8
              "
            >
              <p
                className="
                  font-sans
                  text-[15px]
                  sm:text-[16px]
                  leading-7
                  text-[#AEBECB]
                "
              >
                See also our{' '}
                <InlineLink to="/privacy">
                  Privacy Policy
                </InlineLink>
                .
              </p>
            </div>
          </article>

          {/* ================================================================= */}
          {/* ON THIS PAGE                                                       */}
          {/* ================================================================= */}

          <aside className="hidden lg:block">
            <div
              className="
                sticky
                top-10
                border-l
                border-[#203442]
                pl-7
              "
            >
              <p
                className="
                  mb-5
                  font-sans
                  text-[12px]
                  font-semibold
                  uppercase
                  tracking-[0.04em]
                  text-[#8EA2B4]
                "
              >
                On this page
              </p>

              <nav aria-label="Terms of Service sections">
                <ol className="space-y-1">
                  {sections.map((section) => {
                    const isActive =
                      activeSection === section.id;

                    return (
                      <li key={section.id}>
                        <button
                          type="button"
                          onClick={() =>
                            scrollToSection(section.id)
                          }
                          className={`
                            group
                            flex
                            w-full
                            items-start
                            gap-4
                            border-l-2
                            py-1.5
                            pl-4
                            text-left
                            transition-all
                            duration-150
                            ${
                              isActive
                                ? 'border-[#FF6B00] text-[#FF6B00]'
                                : 'border-transparent text-[#B4C1CC] hover:border-[#40515E] hover:text-white'
                            }
                          `}
                        >
                          <span
                            className={`
                              w-5
                              shrink-0
                              text-[14px]
                              leading-6
                              ${
                                isActive
                                  ? 'font-semibold text-[#FF6B00]'
                                  : 'text-[#AAB9C5]'
                              }
                            `}
                          >
                            {section.number}.
                          </span>

                          <span
                            className={`
                              text-[14px]
                              leading-6
                              ${
                                isActive
                                  ? 'font-semibold'
                                  : 'font-normal'
                              }
                            `}
                          >
                            {section.title}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </nav>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}