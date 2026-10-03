import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';

import { WaitlistModal } from '../components/Waitlistmodal';
import { GrokitMascot } from '../components/Grokitmascot';

import { EXAMPLE_COURSES } from './onboarding/constants';
import AppShell from './learn/AppShell';

import { getProfile } from '../lib/profile';
import { listCourses } from '../lib/course';

// ─── Shared styles ────────────────────────────────────────────────────────────

const containerClasses =
  'min-h-[100dvh] w-full max-w-[900px] mx-auto px-5 sm:px-6 py-10 sm:py-14 md:py-16';

const badgeClasses =
  'inline-flex items-center px-4 py-2 rounded-full border border-[#37464F] bg-[#202F35] text-[#91A4AC] font-sans font-bold text-xs sm:text-sm mb-5';

const headingClasses =
  'font-display text-[30px] sm:text-4xl md:text-[42px] leading-[1.08] font-extrabold tracking-[-0.02em] text-white mb-3';

const subtitleClasses =
  'text-[#91A4AC] font-sans font-medium text-[15px] sm:text-base md:text-[17px] leading-relaxed max-w-[680px] mx-auto';

const cardClasses =
  'bg-[#202F35] border border-[#37464F] rounded-3xl p-4 sm:p-5 mb-8';

const textareaClasses =
  'w-full min-h-[150px] sm:min-h-[170px] bg-transparent outline-none resize-none text-white font-sans text-[15px] sm:text-base placeholder:text-[#60757E]';

const createButtonClasses = `
  group w-full sm:w-auto min-h-[52px] px-7 py-3 rounded-full bg-orange text-white font-sans
  font-extrabold text-[15px] flex items-center justify-center gap-2 shadow-[0_4px_0_#C94713]
  hover:brightness-105 active:translate-y-[2px] active:shadow-none transition-all
  disabled:opacity-40 disabled:pointer-events-none
`;

const exampleButtonClasses = `
  w-full flex items-center gap-4 p-3 sm:p-4 rounded-2xl border border-[#37464F] bg-[#202F35]
  hover:border-orange/40 hover:bg-[#26383F] text-left transition-colors
`;

const tagClasses =
  'shrink-0 w-16 h-16 rounded-xl bg-orange/10 border border-orange/10 flex items-center justify-center text-xs font-bold text-orange text-center px-1';

const titleClasses = 'block font-display font-bold text-white';

const authorClasses =
  'block text-xs text-[#60757E] font-sans font-semibold mb-1';

const blurbClasses =
  'block text-sm text-[#91A4AC] font-sans';

const sectionLabelClasses =
  'text-[#91A4AC] font-sans font-semibold text-sm mb-4';

// ──────────────────────────────────────────────────────────────────────────────

export default function Learn() {
  const navigate = useNavigate();

  const [checkingProfile, setCheckingProfile] =
    useState(true);

  const [loadingCourses, setLoadingCourses] =
    useState(true);

  const [courses, setCourses] = useState<
    Awaited<ReturnType<typeof listCourses>>
  >([]);

  const [courseError, setCourseError] =
    useState<string | null>(null);

  const [learnPrompt, setLearnPrompt] =
    useState('');

  const [isWaitlistOpen, setIsWaitlistOpen] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    const verifyAccess = async () => {
      try {
        const profile = await getProfile();

        if (!mounted) return;

        if (!profile?.onboardingCompleted) {
          navigate('/onboarding', {
            replace: true,
          });
          return;
        }
      } catch {
        if (mounted) {
          navigate('/onboarding', {
            replace: true,
          });
          return;
        }
      }

      if (mounted) {
        setCheckingProfile(false);
      }
    };

    void verifyAccess();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (checkingProfile) return;

    let cancelled = false;

    const loadCourses = async () => {
      try {
        setLoadingCourses(true);
        setCourseError(null);

        const existingCourses =
          await listCourses();

        if (!cancelled) {
          setCourses(existingCourses);
        }
      } catch (error) {
        if (!cancelled) {
          setCourseError(
            error instanceof Error
              ? error.message
              : 'Failed to load your courses.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingCourses(false);
        }
      }
    };

    void loadCourses();

    return () => {
      cancelled = true;
    };
  }, [checkingProfile]);

  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-[#131F24] flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <GrokitMascot
            pose="thinking"
            size={110}
          />

          <p className="text-[#91A4AC] font-semibold">
            Preparing your learning space...
          </p>
        </div>
      </div>
    );
  }

  const hasPrompt =
    learnPrompt.trim().length > 0;

  const handleCreate = () => {
    if (!hasPrompt) return;

    navigate('/learn/personalize', {
      state: {
        prompt: learnPrompt,
      },
    });
  };

  return (
    <AppShell>
      <div className={containerClasses}>
        <div className="text-center mb-8 sm:mb-10">
          <div className={badgeClasses}>
            Your learning starts here
          </div>

          <h1 className={headingClasses}>
            What do you want to learn?
          </h1>

          <p className={subtitleClasses}>
            Tell me what you're curious about, and
            I'll build a personalized course for
            you.
          </p>
        </div>

        {courses.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <p className={sectionLabelClasses}>
                Your courses
              </p>

              <span className="text-xs text-[#60757E] font-sans font-semibold">
                {courses.length}{' '}
                {courses.length === 1
                  ? 'course'
                  : 'courses'}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {courses.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() =>
                    navigate(
                      `/learn/course/${course.id}`,
                    )
                  }
                  className={`${exampleButtonClasses} group`}
                >
                  <span className={tagClasses}>
                    <BookOpen className="w-6 h-6" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={titleClasses}
                    >
                      {course.title}
                    </span>

                    <span
                      className={authorClasses}
                    >
                      {course.topic}
                    </span>

                    <span
                      className={blurbClasses}
                    >
                      {course.description ||
                        'Continue learning from where you left off.'}
                    </span>
                  </span>

                  <ArrowRight
                    className="shrink-0 w-5 h-5 text-[#60757E] transition-all group-hover:text-orange group-hover:translate-x-1"
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {loadingCourses && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <p className={sectionLabelClasses}>
                Your courses
              </p>
            </div>

            <div className="flex items-center justify-center py-8 rounded-3xl border border-[#37464F] bg-[#202F35]">
              <div className="flex items-center gap-3 text-[#91A4AC] text-sm font-semibold">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading your courses...
              </div>
            </div>
          </section>
        )}

        {courseError && !loadingCourses && (
          <section className="mb-10">
            <div className="rounded-2xl border border-[#37464F] bg-[#202F35] px-4 py-4">
              <p className="text-sm text-[#91A4AC]">
                We couldn't load your existing
                courses right now.
              </p>

              <p className="mt-1 text-xs text-[#60757E] break-words">
                {courseError}
              </p>
            </div>
          </section>
        )}

        <section className={cardClasses}>
          <textarea
            value={learnPrompt}
            onChange={(e) =>
              setLearnPrompt(e.target.value)
            }
            placeholder="I want to learn about..."
            aria-label="Learning prompt"
            className={textareaClasses}
          />

          <div className="flex justify-end pt-4 mt-3 border-t border-[#37464F]">
            <button
              type="button"
              onClick={handleCreate}
              disabled={!hasPrompt}
              className={createButtonClasses}
            >
              Create my learning path

              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </section>

        <section>
          <p className={sectionLabelClasses}>
            Or, see what people like you are
            learning
          </p>

          <div className="flex flex-col gap-3">
            {EXAMPLE_COURSES.map((course) => (
              <button
                key={course.title}
                type="button"
                onClick={() =>
                  setLearnPrompt(
                    `I want to learn about ${course.title}`,
                  )
                }
                className={exampleButtonClasses}
              >
                <span className={tagClasses}>
                  {course.tag}
                </span>

                <span className="min-w-0">
                  <span className={titleClasses}>
                    {course.title}
                  </span>

                  <span className={authorClasses}>
                    {course.author}
                  </span>

                  <span className={blurbClasses}>
                    {course.blurb}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <WaitlistModal
        isOpen={isWaitlistOpen}
        onClose={() =>
          setIsWaitlistOpen(false)
        }
      />
    </AppShell>
  );
}