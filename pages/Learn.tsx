import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, BookOpen, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router';

import { WaitlistModal } from '../components/Waitlistmodal';
import { EXAMPLE_COURSES } from './onboarding/constants';
import AppShell from './learn/AppShell';

import { getProfile } from '../lib/profile';
import { listCourses } from '../lib/course';

const pageClasses =
  'min-h-[100dvh] w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 lg:py-10';

const contentClasses =
  'w-full max-w-[1180px] mx-auto';

const heroClasses =
  'relative overflow-hidden rounded-[28px] border border-[#2D3C43] bg-[#18272D] px-5 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10 mb-6';

const badgeClasses =
  'inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#34474F] bg-[#202F35] text-[#A9BAC0] font-sans font-bold text-xs sm:text-sm';

const headingClasses =
  'mt-4 font-display text-[30px] sm:text-[38px] lg:text-[46px] leading-[1.04] font-extrabold tracking-[-0.025em] text-white';

const subtitleClasses =
  'mt-3 max-w-[700px] text-[#91A4AC] font-sans text-[15px] sm:text-base lg:text-[17px] leading-relaxed';

const createCardClasses =
  'relative overflow-hidden rounded-[28px] border border-[#37464F] bg-[#202F35] p-4 sm:p-5 lg:p-6';

const textareaClasses =
  'w-full min-h-[145px] sm:min-h-[160px] lg:min-h-[175px] bg-transparent outline-none resize-none text-white font-sans text-[15px] sm:text-base leading-relaxed placeholder:text-[#60757E]';

const createButtonClasses =
  'group w-full sm:w-auto min-h-[50px] px-6 py-3 rounded-2xl bg-orange text-white font-sans font-extrabold text-[14px] sm:text-[15px] flex items-center justify-center gap-2 shadow-[0_4px_0_#C94713] hover:brightness-105 active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-40 disabled:pointer-events-none';

const sectionHeaderClasses =
  'flex items-center justify-between mb-3';

const sectionLabelClasses =
  'text-white font-sans font-extrabold text-[15px] sm:text-base';

const sectionSubLabelClasses =
  'text-[#60757E] font-sans font-semibold text-xs';

const courseCardClasses =
  'group relative w-full overflow-hidden rounded-[24px] border border-[#33464E] bg-[#1C2B31] p-4 sm:p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#52666E] hover:bg-[#203239] hover:shadow-[0_12px_30px_rgba(0,0,0,0.18)]';

const exampleCardClasses =
  'group w-full flex items-center gap-3 sm:gap-4 rounded-2xl border border-[#2D3C43] bg-[#18272D] p-3 sm:p-4 text-left transition-all duration-200 hover:border-orange/30 hover:bg-[#1D2D33]';

const tagClasses =
  'flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-orange/10 border border-orange/10 text-[11px] font-extrabold text-orange text-center px-1';

const titleClasses =
  'block font-display font-extrabold text-white text-sm sm:text-[15px]';

const authorClasses =
  'block mt-0.5 text-xs text-[#60757E] font-sans font-semibold';

const blurbClasses =
  'block mt-1 text-xs sm:text-sm text-[#91A4AC] font-sans leading-relaxed';

type Course = Awaited<ReturnType<typeof listCourses>>[number];

export default function Learn() {
  const navigate = useNavigate();

  const [loadingCourses, setLoadingCourses] = useState(true);

  const [courses, setCourses] = useState<Course[]>([]);

  const [courseError, setCourseError] =
    useState<string | null>(null);

  const [learnPrompt, setLearnPrompt] = useState('');

  const [isWaitlistOpen, setIsWaitlistOpen] =
    useState(false);

  /*
   * Profile/onboarding verification intentionally does NOT
   * block rendering the dashboard.
   *
   * AuthGuard already protects /learn at the authentication
   * level. This check only verifies that onboarding has been
   * completed and redirects if necessary.
   */
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
        }
      } catch {
        if (mounted) {
          navigate('/onboarding', {
            replace: true,
          });
        }
      }
    };

    void verifyAccess();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  /*
   * Courses load independently from profile verification.
   *
   * This means:
   * - Home opens immediately.
   * - The dashboard does not disappear behind a full-screen loader.
   * - Course loading is shown only inside the course section.
   */
  useEffect(() => {
    let cancelled = false;

    const loadCourses = async () => {
      try {
        setLoadingCourses(true);
        setCourseError(null);

        const existingCourses = await listCourses();

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
  }, []);

  const hasPrompt =
    learnPrompt.trim().length > 0;

  const handleCreate = () => {
    const prompt = learnPrompt.trim();

    if (!prompt) return;

    navigate('/learn/personalize', {
      state: {
        prompt,
      },
    });
  };

  const handleExampleClick = (title: string) => {
    setLearnPrompt(
      `I want to learn about ${title}`,
    );

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AppShell
      courses={courses.map((course) => ({
        id: course.id,
        title: course.title,
      }))}
      coursesLoading={loadingCourses}
    >
      <div className={pageClasses}>
        <div className={contentClasses}>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* Hero                                                       */}
          {/* ─────────────────────────────────────────────────────────── */}

          <section className={heroClasses}>
            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-orange/10 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-[#4B8A98]/10 blur-3xl" />

            <div className="relative">
              <div className={badgeClasses}>
                <Sparkles className="h-3.5 w-3.5 text-orange" />
                Your learning space
              </div>

              <h1 className={headingClasses}>
                What do you want to learn?
              </h1>

              <p className={subtitleClasses}>
                Tell Grokit what you're curious about.
                We'll turn your idea into a structured,
                personalized learning path.
              </p>
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* Create learning path                                      */}
          {/* ─────────────────────────────────────────────────────────── */}

          <section className={createCardClasses}>
            <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-orange/5 blur-3xl" />

            <div className="relative">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange/10 text-orange">
                  <Sparkles className="h-4 w-4" />
                </div>

                <div>
                  <p className="font-sans text-sm font-extrabold text-white">
                    Create a new learning path
                  </p>

                  <p className="text-[11px] font-medium text-[#60757E]">
                    Be as specific or as broad as you want.
                  </p>
                </div>
              </div>

              <textarea
                value={learnPrompt}
                onChange={(event) =>
                  setLearnPrompt(event.target.value)
                }
                onKeyDown={(event) => {
                  if (
                    (event.metaKey || event.ctrlKey) &&
                    event.key === 'Enter'
                  ) {
                    event.preventDefault();
                    handleCreate();
                  }
                }}
                placeholder="I want to learn about..."
                aria-label="Learning prompt"
                className={textareaClasses}
              />

              <div className="mt-3 flex flex-col gap-3 border-t border-[#37464F] pt-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="hidden sm:block text-xs font-medium text-[#60757E]">
                  Press Ctrl + Enter to continue
                </p>

                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!hasPrompt}
                  className={createButtonClasses}
                >
                  Create my learning path

                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* Existing courses                                          */}
          {/* ─────────────────────────────────────────────────────────── */}

          {loadingCourses && (
            <section className="mt-8">
              <div className={sectionHeaderClasses}>
                <p className={sectionLabelClasses}>
                  Your learning
                </p>

                <Loader2 className="h-4 w-4 animate-spin text-[#60757E]" />
              </div>

              <div className="grid gap-3">
                <CourseSkeleton />
                <CourseSkeleton />
              </div>
            </section>
          )}

          {!loadingCourses &&
            courses.length > 0 && (
              <section className="mt-8">
                <div className={sectionHeaderClasses}>
                  <div>
                    <p className={sectionLabelClasses}>
                      Continue learning
                    </p>

                    <p className="mt-0.5 text-xs font-medium text-[#60757E]">
                      Pick up where you left off.
                    </p>
                  </div>

                  <span className={sectionSubLabelClasses}>
                    {courses.length}{' '}
                    {courses.length === 1
                      ? 'course'
                      : 'courses'}
                  </span>
                </div>

                <div className="grid gap-3">
                  {courses.map((course, index) => (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() =>
                        navigate(
                          `/learn/course/${course.id}`,
                        )
                      }
                      className={courseCardClasses}
                    >
                      <div className="flex items-center gap-4">

                        {/* Course visual */}
                        <div className="relative flex h-16 w-16 sm:h-[72px] sm:w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-orange/10">

                          {course.heroImageUrl ? (
                            <img
                              src={course.heroImageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <BookOpen className="h-7 w-7 text-orange" />
                          )}

                          <span className="absolute bottom-1.5 right-1.5 rounded-md bg-[#131F24]/80 px-1.5 py-0.5 text-[9px] font-extrabold text-[#D6E0E3] backdrop-blur-sm">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>

                        {/* Course information */}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-display text-[15px] sm:text-base font-extrabold text-white">
                            {course.title}
                          </span>

                          <span className="mt-0.5 block truncate text-xs font-semibold text-[#60757E]">
                            {course.topic}
                          </span>

                          <span className="mt-1.5 block line-clamp-2 text-xs sm:text-sm leading-relaxed text-[#91A4AC]">
                            {course.description ||
                              'Continue learning from where you left off.'}
                          </span>
                        </span>

                        {/* Arrow */}
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#202F35] text-[#60757E] transition-all group-hover:bg-orange group-hover:text-white">
                          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>

                      {/* Progress placeholder / course state */}
                      <div className="mt-4 flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#2B3C43]">
                          <div className="h-full w-0 rounded-full bg-orange transition-all" />
                        </div>

                        <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#60757E]">
                          Start
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* Course loading error                                      */}
          {/* ─────────────────────────────────────────────────────────── */}

          {courseError && !loadingCourses && (
            <section className="mt-8">
              <div className="rounded-2xl border border-[#4A3A32] bg-[#241F1C] px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange/10 text-orange">
                    <BookOpen className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-white">
                      We couldn't load your courses.
                    </p>

                    <p className="mt-1 break-words text-xs leading-relaxed text-[#91A4AC]">
                      {courseError}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* Discover                                                    */}
          {/* ─────────────────────────────────────────────────────────── */}

          <section className="mt-10 pb-8">
            <div className={sectionHeaderClasses}>
              <div>
                <p className={sectionLabelClasses}>
                  Explore something new
                </p>

                <p className="mt-0.5 text-xs font-medium text-[#60757E]">
                  Start with an idea and make it your own.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {EXAMPLE_COURSES.map((course) => (
                <button
                  key={course.title}
                  type="button"
                  onClick={() =>
                    handleExampleClick(course.title)
                  }
                  className={exampleCardClasses}
                >
                  <span className={tagClasses}>
                    {course.tag}
                  </span>

                  <span className="min-w-0 flex-1">
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

                  <ArrowRight className="h-4 w-4 shrink-0 text-[#60757E] transition-all group-hover:translate-x-1 group-hover:text-orange" />
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      <WaitlistModal
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
      />
    </AppShell>
  );
}

// ─── Course skeleton ──────────────────────────────────────────────────────────

function CourseSkeleton(): ReactNode {
  return (
    <div className="rounded-[24px] border border-[#2D3C43] bg-[#1C2B31] p-4 sm:p-5">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 sm:h-[72px] sm:w-[72px] shrink-0 animate-pulse rounded-2xl bg-[#26373D]" />

        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-[#26373D]" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-[#26373D]" />
          <div className="h-3 w-full animate-pulse rounded bg-[#26373D]" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-[#26373D]" />
        </div>

        <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-[#26373D]" />
      </div>

      <div className="mt-4 h-1.5 animate-pulse rounded-full bg-[#26373D]" />
    </div>
  );
}