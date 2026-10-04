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
// Grokit Privacy Policy
//
// Last revised: September 8, 2026
//
// IMPORTANT:
// The following company/legal details must be completed before production:
//
// - Legal company name
// - Registered address
// - AWS region(s)
// - Analytics provider, if any
// - Email/waitlist provider, if any
// - Verified Anthropic data-handling language
// - Actual account-deletion timeline
// - Data Protection / Grievance Officer details, if required
// - EU/UK representative details, if required
//
// Please have the final Privacy Policy reviewed by qualified legal counsel.
// ---------------------------------------------------------------------------

const LAST_REVISED = 'September 8, 2026';
const CONTACT_EMAIL = 'usegrokit@gmail.com';

const sections = [
  {
    id: 'overview',
    number: 1,
    title: 'Overview',
  },
  {
    id: 'information-we-collect',
    number: 2,
    title: 'Information We Collect',
  },
  {
    id: 'how-we-use',
    number: 3,
    title: 'How We Use Your Information',
  },
  {
    id: 'ai-involved',
    number: 4,
    title: 'How AI is Involved',
  },
  {
    id: 'sharing',
    number: 5,
    title: 'Sharing of Information',
  },
  {
    id: 'where-data-stored',
    number: 6,
    title: 'Where Your Data is Stored',
  },
  {
    id: 'rights',
    number: 7,
    title: 'Your Choices and Rights',
  },
  {
    id: 'retention',
    number: 8,
    title: 'Data Retention',
  },
  {
    id: 'security',
    number: 9,
    title: 'Security',
  },
  {
    id: 'children',
    number: 10,
    title: "Children's Privacy",
  },
  {
    id: 'third-party',
    number: 11,
    title: 'Third-party Links and Sign-in',
  },
  {
    id: 'do-not-track',
    number: 12,
    title: 'Do Not Track',
  },
  {
    id: 'changes',
    number: 13,
    title: 'Changes to this Policy',
  },
  {
    id: 'contact',
    number: 14,
    title: 'Contact Us',
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
      className="
        scroll-mt-8
        mb-0
        border-b
        border-[#203442]
        py-7
        first:pt-0
        last:border-b-0
        sm:py-8
      "
    >
      <div
        className="
          grid
          grid-cols-[40px_minmax(0,1fr)]
          gap-4
          sm:grid-cols-[44px_minmax(0,1fr)]
          sm:gap-5
        "
      >
        {/* Section number */}
        <div
          aria-hidden="true"
          className="
            pt-1
            text-[20px]
            font-bold
            leading-none
            text-[#7890A8]
            sm:text-[22px]
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
              font-extrabold
              leading-[1.25]
              tracking-[-0.02em]
              text-white
              sm:text-[23px]
            "
          >
            {title}
          </h2>

          <div
            className="
              mt-2
              space-y-3
              font-sans
              text-[15px]
              leading-[1.65]
              text-[#B8C7D5]
              sm:text-[16px]
              sm:leading-[1.7]
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
        list-disc
        space-y-1.5
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

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] =
    useState('information-we-collect');

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
  // Smooth-scroll to a section.
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
            lg:grid-cols-[minmax(0,700px)_240px]
            lg:gap-14
          "
        >
          {/* ================================================================= */}
          {/* PRIVACY POLICY CONTENT                                             */}
          {/* ================================================================= */}

          <article className="min-w-0">
            {/* ----------------------------------------------------------------- */}
            {/* TITLE                                                             */}
            {/* ----------------------------------------------------------------- */}

            <div className="mb-7">
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
                Privacy Policy
              </h1>

              <p
                className="
                  mt-3
                  font-sans
                  text-[15px]
                  text-[#8FA4B7]
                  sm:text-[16px]
                "
              >
                Last revised: {LAST_REVISED}
              </p>

              <p
                className="
                  mt-5
                  max-w-[700px]
                  font-sans
                  text-[15px]
                  leading-[1.65]
                  text-[#C0CDD8]
                  sm:text-[16px]
                  sm:leading-[1.7]
                "
              >
                At Grokit, we value your privacy. This Privacy
                Policy explains how we collect, use, and protect
                your information when you use our website,
                applications, and services. By using Grokit, you
                agree to the practices described in this policy.
              </p>
            </div>

            {/* ================================================================= */}
            {/* 1. OVERVIEW                                                       */}
            {/* ================================================================= */}

            <Section
              id="overview"
              number={1}
              title="Overview"
            >
              <p>
                This policy explains what personal information
                [Legal company name] ("Grokit," "we," "us," or
                "our") collects when you use our website and
                apps (the "Service"), how we use it, who we
                share it with, and the choices you have.
              </p>

              <p>
                By using the Service, you acknowledge this
                policy. If you don't agree with it, please don't
                use the Service. Our{' '}
                <InlineLink to="/terms">
                  Terms of Service
                </InlineLink>{' '}
                also apply.
              </p>
            </Section>

            {/* ================================================================= */}
            {/* 2. INFORMATION WE COLLECT                                         */}
            {/* ================================================================= */}

            <Section
              id="information-we-collect"
              number={2}
              title="Information We Collect"
            >
              <p>
                <strong className="font-bold text-white">
                  Account information.
                </strong>{' '}
                Your email address and password when you sign up
                with email. Passwords are handled by our
                authentication provider and are not visible to
                us in readable form. If you sign in with Google,
                we receive basic profile information from Google,
                such as your name, email address, and profile
                picture.
              </p>

              <p>
                <strong className="font-bold text-white">
                  Onboarding and profile information.
                </strong>{' '}
                The answers you give when setting up Grokit, such
                as your type of work, interests, goals,
                experience level, and how much time you want to
                learn each day. This is optional unless it is
                needed to personalize your experience.
              </p>

              <p>
                <strong className="font-bold text-white">
                  Content you submit.
                </strong>{' '}
                The topics and prompts you type to create
                journeys, plus any notes, highlights, saved
                items, answers to questions, and (when available)
                files you upload or messages you send to
                Grokit's tutor.
              </p>

              <p>
                <strong className="font-bold text-white">
                  Learning activity.
                </strong>{' '}
                Your journeys, lessons, progress, scores,
                mastery estimates, time spent, XP, streaks, and
                review history.
              </p>

              <p>
                <strong className="font-bold text-white">
                  Generated Content.
                </strong>{' '}
                The journeys, lessons, and responses our AI
                creates for you, which are stored in your account
                so they can be shown again.
              </p>

              <p>
                <strong className="font-bold text-white">
                  Waitlist and contact information.
                </strong>{' '}
                Your email address if you join our waitlist or
                contact us, plus the content of your message.
              </p>

              <p>
                <strong className="font-bold text-white">
                  Usage and device data.
                </strong>{' '}
                Device and browser type, operating system,
                language, approximate location derived from your
                IP address, pages and features used, crash and
                error logs, and timestamps.
              </p>

              <p>
                <strong className="font-bold text-white">
                  Cookies and similar technologies.
                </strong>{' '}
                We use cookies and local storage that are
                necessary to keep you signed in and remember
                your preferences. [If you use analytics, add:
                We also use [analytics provider] to understand
                how the Service is used. / If you don't, add: We
                do not use advertising cookies.]
              </p>

              <p>
                We do not intentionally collect sensitive
                information (such as health records, government
                IDs, or financial account details). Please don't
                include it in prompts or notes.
              </p>
            </Section>

            {/* ================================================================= */}
            {/* 3. HOW WE USE YOUR INFORMATION                                    */}
            {/* ================================================================= */}

            <Section
              id="how-we-use"
              number={3}
              title="How We Use Your Information"
            >
              <p>
                We use your information to:
              </p>

              <BulletList>
                <Bullet>
                  create and secure your account and sign you
                  in;
                </Bullet>

                <Bullet>
                  generate and personalize your journeys,
                  lessons, and tutor responses;
                </Bullet>

                <Bullet>
                  save your progress, show your path, and power
                  features like streaks, review, and mastery;
                </Bullet>

                <Bullet>
                  send service messages, such as verification
                  codes, password resets, security alerts, and
                  changes to our terms or policies;
                </Bullet>

                <Bullet>
                  send reminders and product updates, if you've
                  opted in (you can opt out any time);
                </Bullet>

                <Bullet>
                  keep the Service secure, prevent abuse,
                  enforce usage limits, and fix bugs;
                </Bullet>

                <Bullet>
                  understand how the Service is used and improve
                  it;
                </Bullet>

                <Bullet>
                  comply with legal obligations.
                </Bullet>
              </BulletList>

              <p>
                We do not use your prompts, notes, or learning
                data for advertising, and we do not sell your
                personal information.
              </p>
            </Section>

            {/* ================================================================= */}
            {/* 4. HOW AI IS INVOLVED                                             */}
            {/* ================================================================= */}

            <Section
              id="ai-involved"
              number={4}
              title="How AI is Involved"
            >
              <p>
                To create your journeys and lessons, we send
                relevant information to AI model providers. This
                can include the topic or prompt you enter, your
                onboarding answers (for example role, level, and
                goals), the content of the lesson you're
                studying, and your questions to the tutor. We
                send only what is needed to produce the response.
              </p>

              <p>
                We use Anthropic's Claude models through their
                API. [Check Anthropic's current commercial terms
                and state accurately here how they handle API
                data, for example whether it is retained and for
                how long, and whether it is used to train models.
                Example wording if it matches the terms at the
                time of publishing: "Under our agreement with
                this provider, content sent through the API is not
                used to train their models by default."]
              </p>

              <p>
                AI-generated content can be inaccurate. Please
                see our{' '}
                <InlineLink to="/terms">
                  Terms of Service
                </InlineLink>{' '}
                for details. We don't use fully automated
                decisions that have legal or similarly
                significant effects on you.
              </p>
            </Section>

            {/* ================================================================= */}
            {/* 5. SHARING OF INFORMATION                                         */}
            {/* ================================================================= */}

            <Section
              id="sharing"
              number={5}
              title="Sharing of Information"
            >
              <p>
                We don't sell your personal information. We share
                it only in these situations:
              </p>

              <BulletList>
                <Bullet>
                  <strong className="font-bold text-white">
                    Service providers
                  </strong>{' '}
                  who help us run Grokit and are bound to protect
                  your data, including: Amazon Web Services
                  (hosting, database, serverless computing,
                  authentication through Amazon Cognito, and
                  email delivery), Google (if you choose Google
                  sign-in), Anthropic (AI generation), [analytics
                  provider, if any], and [email or waitlist
                  provider, if any].
                </Bullet>

                <Bullet>
                  <strong className="font-bold text-white">
                    Features you choose to use.
                  </strong>{' '}
                  If you share a journey using a sharing link,
                  the content of that journey becomes visible to
                  anyone with the link. Your email address is not
                  shown.
                </Bullet>

                <Bullet>
                  <strong className="font-bold text-white">
                    Legal and safety reasons
                  </strong>
                  , when required by law, to respond to valid
                  legal requests, or to protect the rights,
                  safety, and security of users, the public, or
                  Grokit.
                </Bullet>

                <Bullet>
                  <strong className="font-bold text-white">
                    Business changes
                  </strong>
                  , such as a merger, acquisition, or sale of
                  assets. We would tell you and the new owner
                  would have to honor this policy.
                </Bullet>

                <Bullet>
                  <strong className="font-bold text-white">
                    With your consent
                  </strong>
                  , for anything else.
                </Bullet>
              </BulletList>

              <p>
                We may share aggregated or de-identified
                information that can't reasonably identify you.
              </p>
            </Section>

            {/* ================================================================= */}
            {/* 6. WHERE YOUR DATA IS STORED                                      */}
            {/* ================================================================= */}

            <Section
              id="where-data-stored"
              number={6}
              title="Where Your Data is Stored"
            >
              <p>
                Your information is processed and stored on
                servers in [AWS region(s), e.g. US East /
                Mumbai], and may be processed in other countries
                where our providers operate. If you are located
                outside those countries, your data will be
                transferred internationally. Where required, we
                use safeguards such as standard contractual
                clauses or equivalent protections.
              </p>
            </Section>

            {/* ================================================================= */}
            {/* 7. YOUR CHOICES AND RIGHTS                                        */}
            {/* ================================================================= */}

            <Section
              id="rights"
              number={7}
              title="Your Choices and Rights"
            >
              <p>
                You can review and update your profile and
                learning preferences in Settings at any time.
                Depending on where you live, you may also have
                the right to:
              </p>

              <BulletList>
                <Bullet>
                  access the personal information we hold about
                  you and receive a copy;
                </Bullet>

                <Bullet>
                  correct inaccurate information;
                </Bullet>

                <Bullet>
                  delete your account and personal information;
                </Bullet>

                <Bullet>
                  object to or restrict certain uses, and
                  withdraw consent where we rely on it;
                </Bullet>

                <Bullet>
                  receive your data in a portable format;
                </Bullet>

                <Bullet>
                  opt out of marketing messages (use the
                  unsubscribe link or Settings);
                </Bullet>

                <Bullet>
                  complain to your local data protection
                  authority.
                </Bullet>
              </BulletList>

              <p>
                To exercise these rights, use the options in
                Settings or contact us at the address in section
                14. We may need to verify your identity first,
                and we'll respond within the time required by
                applicable law. You won't be treated unfairly for
                exercising your rights.
              </p>

              <p>
                <strong className="font-bold text-white">
                  For users in the European Economic Area, UK, or
                  Switzerland:
                </strong>{' '}
                we process your data on these legal bases: to
                provide the Service you asked for (contract), for
                our legitimate interests in running, securing,
                and improving it (balanced against your rights),
                to comply with the law, and with your consent
                where required, such as optional reminders.
              </p>

              <p>
                <strong className="font-bold text-white">
                  For users in California:
                </strong>{' '}
                we do not sell or share your personal information
                as defined under California law, and we don't
                knowingly sell the information of minors. You may
                request access, correction, or deletion as
                described above.
              </p>

              <p>
                <strong className="font-bold text-white">
                  For users in India:
                </strong>{' '}
                you may exercise your rights under the Digital
                Personal Data Protection Act, 2023, including the
                right to access, correct, and erase your data and
                to nominate someone to act for you. You can reach
                our grievance contact in section 14.
              </p>
            </Section>

            {/* ================================================================= */}
            {/* 8. DATA RETENTION                                                 */}
            {/* ================================================================= */}

            <Section
              id="retention"
              number={8}
              title="Data Retention"
            >
              <p>
                We keep your information for as long as your
                account is active, or as needed to provide the
                Service, comply with legal obligations, resolve
                disputes, and enforce our agreements. When you
                delete your account, we delete or anonymize your
                personal information within [30 days], except
                where we must keep certain records by law or for
                security. Backups are removed on their normal
                rotation, within [90 days]. Waitlist emails are
                kept until you unsubscribe or the waitlist ends.
              </p>
            </Section>

            {/* ================================================================= */}
            {/* 9. SECURITY                                                        */}
            {/* ================================================================= */}

            <Section
              id="security"
              number={9}
              title="Security"
            >
              <p>
                We use reasonable technical and organizational
                measures to protect your information, including
                encrypted connections (HTTPS), managed
                authentication, and access controls so that each
                account's data is only accessible to that
                account. No system is perfectly secure, so we
                can't guarantee absolute security. If we become
                aware of a breach that affects your information,
                we'll notify you and the relevant authorities as
                the law requires.
              </p>
            </Section>

            {/* ================================================================= */}
            {/* 10. CHILDREN'S PRIVACY                                             */}
            {/* ================================================================= */}

            <Section
              id="children"
              number={10}
              title="Children's Privacy"
            >
              <p>
                Grokit is not directed at children, and we don't
                knowingly collect personal information from
                children under 13 (or the higher minimum age of
                digital consent in your country). If you believe
                a child has given us personal information, contact
                us and we'll delete it. Users under 18 should use
                the Service with a parent or guardian's
                permission.
              </p>
            </Section>

            {/* ================================================================= */}
            {/* 11. THIRD-PARTY LINKS AND SIGN-IN                                 */}
            {/* ================================================================= */}

            <Section
              id="third-party"
              number={11}
              title="Third-party Links and Sign-in"
            >
              <p>
                The Service may link to other sites, such as our
                community or social pages. We aren't responsible
                for their privacy practices. If you sign in with
                Google, Google's own privacy policy governs what
                it collects.
              </p>
            </Section>

            {/* ================================================================= */}
            {/* 12. DO NOT TRACK                                                  */}
            {/* ================================================================= */}

            <Section
              id="do-not-track"
              number={12}
              title="Do Not Track"
            >
              <p>
                Because there is no common standard for it, the
                Service does not currently respond to browser Do
                Not Track signals.
              </p>
            </Section>

            {/* ================================================================= */}
            {/* 13. CHANGES TO THIS POLICY                                        */}
            {/* ================================================================= */}

            <Section
              id="changes"
              number={13}
              title="Changes to this Policy"
            >
              <p>
                If we make material changes to this policy, we'll
                notify you through the Service or by email and
                update the "last revised" date above. Continued
                use after a change means you accept the updated
                policy.
              </p>
            </Section>

            {/* ================================================================= */}
            {/* 14. CONTACT US                                                    */}
            {/* ================================================================= */}

            <Section
              id="contact"
              number={14}
              title="Contact Us"
            >
              <p>
                Questions about your data or this policy? Reach
                us at <ContactLink />.
              </p>

              <div className="space-y-1.5">
                <p>[Legal company name]</p>
                <p>[Registered address]</p>
                <p>
                  [If required: Data Protection / Grievance
                  Officer: name, email]
                </p>
                <p>
                  [If you serve EEA/UK users and are required
                  to: EU/UK representative details]
                </p>
              </div>
            </Section>

            {/* ================================================================= */}
            {/* SEE ALSO                                                           */}
            {/* ================================================================= */}

            <div className="pt-8">
              <p
                className="
                  font-sans
                  text-[15px]
                  leading-7
                  text-[#AEBECB]
                  sm:text-[16px]
                "
              >
                See also our{' '}
                <InlineLink to="/terms">
                  Terms of Service
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

              <nav aria-label="Privacy Policy sections">
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