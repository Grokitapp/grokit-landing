import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Circle,
  Lock,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { useNavigate } from 'react-router';

import { GrokitMascot } from '../components/Grokitmascot';
import AppShell from './learn/AppShell';

import { getProfile } from '../lib/profile';
import {
  listLessonsForPhase,
  listPhasesForCourse,
  listProgressForCourse,
} from '../lib/courseGeneration';
import { listCourses } from '../lib/course';

type Course = Awaited<ReturnType<typeof listCourses>>[number];
type Phase = Awaited<ReturnType<typeof listPhasesForCourse>>[number];
type Lesson = Awaited<ReturnType<typeof listLessonsForPhase>>[number];
type Progress = Awaited<ReturnType<typeof listProgressForCourse>>[number];

/*
 * Amplify's generated Phase type contains a `lessons`
 * relationship accessor. Learn loads lessons separately,
 * so the UI needs a concrete Lesson[] instead.
 */
type PhaseWithLessons = Omit<Phase, 'lessons'> & {
  lessons: Lesson[];
};

type LessonState = 'completed' | 'current' | 'locked';
type CourseStatus = 'DRAFT' | 'GENERATING' | 'READY' | 'FAILED' | null | undefined;

const pageClasses = 'min-h-[100dvh] w-full px-4 pb-10 pt-5 sm:px-6 sm:pb-12 sm:pt-7 lg:px-8 lg:pt-8 xl:px-10';
const contentClasses = 'mx-auto w-full max-w-[1120px]';

const primaryButtonClasses = [
  'group inline-flex min-h-[46px] items-center justify-center gap-2',
  'rounded-2xl bg-orange px-5 py-3',
  'font-sans text-sm font-extrabold text-white',
  'shadow-[0_4px_0_#C94713]',
  'transition-all duration-150',
  'hover:brightness-105',
  'active:translate-y-[2px] active:shadow-none',
  'disabled:pointer-events-none disabled:opacity-40',
].join(' ');

const secondaryButtonClasses = [
  'inline-flex min-h-[44px] items-center justify-center gap-2',
  'rounded-2xl border border-[#334951]',
  'bg-[#192A31] px-4',
  'font-sans text-sm font-extrabold text-[#D7E0E3]',
  'transition-all duration-150',
  'hover:border-[#526A73] hover:bg-[#1D3037]',
].join(' ');

function getCourseStatusLabel(status: CourseStatus) {
  switch (status) {
    case 'GENERATING': return 'Building your journey';
    case 'FAILED': return 'Journey needs attention';
    case 'DRAFT': return 'Draft journey';
    default: return 'Learning journey';
  }
}

function getPhaseLabel(index: number) {
  const labels = ['Shallows', 'Reef', 'Deep', 'Abyss'];
  return labels[index] ?? `Depth ${index + 1}`;
}

/**
 * Lesson progression is intentionally strict.
 *
 * Completed: The learner can revisit it.
 * Current: The first incomplete lesson in the first unlocked phase that still has unfinished lessons.
 * Locked: Everything after the current lesson, plus every lesson inside a locked phase.
 */
function getLessonState(
  lesson: Lesson,
  phaseLocked: boolean,
  completedIds: Set<string>,
  currentLessonId: string | null,
): LessonState {
  if (completedIds.has(lesson.id)) return 'completed';
  if (phaseLocked) return 'locked';
  if (currentLessonId === lesson.id) return 'current';
  return 'locked';
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getCompletionPercent(completed: number, total: number) {
  if (!total) return 0;
  return Math.round(clamp((completed / total) * 100, 0, 100));
}

export default function Learn() {
  const navigate = useNavigate();

  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseError, setCourseError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [phases, setPhases] = useState<PhaseWithLessons[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loadingPath, setLoadingPath] = useState(false);
  const [pathError, setPathError] = useState<string | null>(null);
  const [courseMenuOpen, setCourseMenuOpen] = useState(false);

  /*
   * Verify onboarding without introducing another
   * full-screen loading wall.
   */
  useEffect(() => {
    let mounted = true;

    const verifyAccess = async () => {
      try {
        setProfileLoading(true);
        const profile = await getProfile();
        if (!mounted) return;
        if (!profile?.onboardingCompleted) {
          navigate('/onboarding', { replace: true });
          return;
        }
      } catch {
        if (!mounted) return;
        navigate('/onboarding', { replace: true });
      } finally {
        if (mounted) setProfileLoading(false);
      }
    };

    void verifyAccess();
    return () => { mounted = false; };
  }, [navigate]);

  /*
   * Load the user's actual courses.
   */
  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      setCourseError(null);

      const existingCourses = await listCourses();
      setCourses(existingCourses);

      setSelectedCourseId((current) => {
        if (current && existingCourses.some((course) => course.id === current)) {
          return current;
        }
        const firstReady = existingCourses.find((course) => course.status === 'READY');
        return firstReady?.id ?? existingCourses[0]?.id ?? null;
      });
    } catch (error) {
      setCourseError(
        error instanceof Error ? error.message : 'Failed to load your learning journeys.'
      );
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => { void loadCourses(); }, []);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? null,
    [courses, selectedCourseId],
  );

  /*
   * Load phases, lessons and progress for the
   * currently selected course.
   */
  const loadPath = async () => {
    if (!selectedCourseId) {
      setPhases([]);
      setProgress([]);
      return;
    }

    try {
      setLoadingPath(true);
      setPathError(null);

      const [coursePhases, courseProgress] = await Promise.all([
        listPhasesForCourse(selectedCourseId),
        listProgressForCourse(selectedCourseId),
      ]);

      const phasesWithLessons = await Promise.all(
        coursePhases.map(async (phase) => {
          const lessons = await listLessonsForPhase(phase.id);
          return { ...phase, lessons };
        }),
      );

      /*
       * Keep phase ordering deterministic even if
       * the backend returns records in another order.
       *
       * Lesson ordering is already normalized by
       * listLessonsForPhase().
       */
      phasesWithLessons.sort((a, b) => a.order - b.order);

      setPhases(phasesWithLessons);
      setProgress(courseProgress);
    } catch (error) {
      setPathError(
        error instanceof Error ? error.message : 'Failed to load your learning path.'
      );
      setPhases([]);
      setProgress([]);
    } finally {
      setLoadingPath(false);
    }
  };

  useEffect(() => { void loadPath(); }, [selectedCourseId]);

  const completedLessonIds = useMemo(
    () =>
      new Set(
        progress
          .filter((item) => Boolean(item.completedAt))
          .map((item) => item.lessonId),
      ),
    [progress],
  );

  const allLessons = useMemo(
    () => phases.flatMap((phase) => phase.lessons),
    [phases],
  );

  const completedCount = completedLessonIds.size;
  const totalLessonCount = allLessons.length;

  const overallProgress = useMemo(
    () => getCompletionPercent(completedCount, totalLessonCount),
    [completedCount, totalLessonCount],
  );

  /*
   * Current lesson:
   *
   * Find the first unlocked phase with an incomplete
   * lesson, then take the first incomplete lesson
   * inside that phase.
   *
   * This creates the strict sequence:
   *
   * Lesson 1 -> Lesson 2 -> Lesson 3
   *
   * and never allows Lesson 3 to become available
   * before Lesson 2 is complete.
   */
  const currentLessonId = useMemo(() => {
    for (const phase of phases) {
      if (phase.locked) continue;
      const nextLesson = phase.lessons.find(
        (lesson) => !completedLessonIds.has(lesson.id),
      );
      if (nextLesson) return nextLesson.id;
    }
    return null;
  }, [phases, completedLessonIds]);

  const currentLesson = useMemo(
    () => allLessons.find((lesson) => lesson.id === currentLessonId) ?? null,
    [allLessons, currentLessonId],
  );

  const currentPhase = useMemo(
    () => phases.find((phase) => phase.lessons.some((lesson) => lesson.id === currentLessonId)) ?? null,
    [phases, currentLessonId],
  );

  const hasCompletedEverything = totalLessonCount > 0 && completedCount >= totalLessonCount;

  const selectedCourseStatus = selectedCourse?.status as CourseStatus;
  const isCourseBuilding = selectedCourseStatus === 'GENERATING' || selectedCourseStatus === 'DRAFT';
  const isCourseFailed = selectedCourseStatus === 'FAILED';

  const handleCreateJourney = () => {
    navigate('/learn/personalize');
  };

  const handleLessonClick = (lesson: Lesson, state: LessonState) => {
    /*
     * Only completed and current lessons are
     * navigable.
     *
     * Future lessons remain inaccessible even if
     * someone somehow triggers the click handler.
     */
    if (state !== 'completed' && state !== 'current') return;
    if (!selectedCourseId) return;
    navigate(`/learn/course/${selectedCourseId}/lesson/${lesson.id}`);
  };

  return (
    <AppShell
      courses={courses.map((course) => ({ id: course.id, title: course.title }))}
      coursesLoading={loadingCourses}
    >
      <div className={pageClasses}>
        <div className={contentClasses}>
          {/* ============================================================
              LOADING PROFILE / COURSES
          ============================================================ */}

          {(profileLoading || loadingCourses) && (
            <section className="flex min-h-[620px] items-center justify-center">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="absolute -inset-10 rounded-full bg-orange/[0.055] blur-3xl" />
                  <GrokitMascot size={118} pose="idle" className="relative opacity-90" />
                </div>
                <p className="mt-5 font-display text-lg font-extrabold text-white">
                  Getting your path ready
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#60757E]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading your journeys
                </div>
              </div>
            </section>
          )}

          {/* ============================================================
              EMPTY LEARN
          ============================================================ */}

          {!profileLoading && !loadingCourses && courses.length === 0 && (
            <EmptyLearnState onCreate={handleCreateJourney} />
          )}

          {/* ============================================================
              COURSE SELECTION FALLBACK
          ============================================================ */}

          {!profileLoading && !loadingCourses && courses.length > 0 && !selectedCourse && (
            <section className="rounded-[28px] border border-[#2D4149] bg-[#17262C] p-8 text-center">
              <p className="font-display text-xl font-extrabold text-white">
                Choose a journey to begin.
              </p>
              <button
                type="button"
                onClick={() => setSelectedCourseId(courses[0]?.id ?? null)}
                className={`${primaryButtonClasses} mt-5`}
              >
                Open journey
                <ArrowRight className="h-4 w-4" />
              </button>
            </section>
          )}

          {/* ============================================================
              MAIN LEARN
          ============================================================ */}

          {!profileLoading && !loadingCourses && selectedCourse && (
            <main>
              {/* ======================================================
                  HEADER
              ====================================================== */}

              <section className="mb-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="font-sans text-[11px] font-extrabold uppercase tracking-[0.16em] text-orange">
                        Your dive path
                      </span>
                      {currentPhase && (
                        <>
                          <span className="text-[#40545C]">/</span>
                          <span className="truncate font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-[#71868F]">
                            {currentPhase.title}
                          </span>
                        </>
                      )}
                    </div>

                    <h1 className="max-w-[720px] font-display text-[34px] font-extrabold leading-[1.05] tracking-[-0.03em] text-white sm:text-[46px]">
                      {hasCompletedEverything ? 'You made it all the way down.' : 'Keep going deeper.'}
                    </h1>

                    <p className="mt-3 max-w-[680px] font-sans text-sm font-medium leading-6 text-[#7F939B] sm:text-base">
                      {hasCompletedEverything
                        ? 'Your journey is complete. You can revisit any lesson whenever you want.'
                        : currentLesson
                          ? `Next up: ${currentLesson.title}`
                          : 'Choose a lesson and continue your journey.'}
                    </p>
                  </div>

                  {/* Journey selector */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setCourseMenuOpen((open) => !open)}
                      className="flex min-h-[48px] max-w-full items-center gap-3 rounded-2xl border border-[#334951] bg-[#18282F] px-3.5 text-left transition-colors hover:border-[#4C626B]"
                      aria-expanded={courseMenuOpen}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange/10">
                        {selectedCourse.heroImageUrl ? (
                          <img
                            src={selectedCourse.heroImageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Sparkles className="h-4 w-4 text-orange" />
                        )}
                      </div>

                      <span className="min-w-0 max-w-[190px]">
                        <span className="block truncate font-sans text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#60757E]">
                          Current journey
                        </span>
                        <span className="mt-0.5 block truncate font-display text-sm font-extrabold text-white">
                          {selectedCourse.title}
                        </span>
                      </span>

                      <ChevronDown
                        className={[
                          'h-4 w-4 shrink-0 text-[#71868F] transition-transform',
                          courseMenuOpen ? 'rotate-180' : '',
                        ].join(' ')}
                      />
                    </button>

                    {courseMenuOpen && (
                      <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-[280px] overflow-hidden rounded-2xl border border-[#344A53] bg-[#18282F] p-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                        {courses.map((course) => {
                          const active = course.id === selectedCourseId;
                          return (
                            <button
                              key={course.id}
                              type="button"
                              onClick={() => {
                                setSelectedCourseId(course.id);
                                setCourseMenuOpen(false);
                              }}
                              className={[
                                'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors',
                                active ? 'bg-orange/10' : 'hover:bg-[#203239]',
                              ].join(' ')}
                            >
                              <div
                                className={[
                                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                                  active ? 'bg-orange/15 text-orange' : 'bg-[#21343B] text-[#71868F]',
                                ].join(' ')}
                              >
                                {active ? <Check className="h-4 w-4" /> : <Circle className="h-3.5 w-3.5" />}
                              </div>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-sans text-sm font-bold text-white">
                                  {course.title}
                                </span>
                                <span className="mt-0.5 block font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-[#60757E]">
                                  {getCourseStatusLabel(course.status as CourseStatus)}
                                </span>
                              </span>
                            </button>
                          );
                        })}

                        <div className="my-1.5 h-px bg-[#2B4048]" />

                        <button
                          type="button"
                          onClick={handleCreateJourney}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-[#203239]"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange/10 text-orange">
                            <Plus className="h-4 w-4" />
                          </div>
                          <span className="font-sans text-sm font-extrabold text-[#D7E0E3]">
                            Create another journey
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* ======================================================
                  COURSE BUILDING
              ====================================================== */}

              {isCourseBuilding && <CourseBuildingState course={selectedCourse} />}

              {/* ======================================================
                  COURSE FAILED
              ====================================================== */}

              {isCourseFailed && (
                <CourseFailedState
                  course={selectedCourse}
                  onRetry={() => void loadCourses()}
                  onCreate={handleCreateJourney}
                />
              )}

              {/* ======================================================
                  ACTUAL DIVE PATH
              ====================================================== */}

              {!isCourseBuilding && !isCourseFailed && (
                <>
                  <section className="mb-6 overflow-hidden rounded-[30px] border border-[#2D4149] bg-[#14232A]">
                    <div className="relative px-5 py-5 sm:px-7 sm:py-6">
                      <div className="pointer-events-none absolute -right-32 -top-40 h-[420px] w-[420px] rounded-full bg-orange/[0.045] blur-[100px]" />
                      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange/10 text-orange">
                              <Trophy className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-sans text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#60757E]">
                                Journey progress
                              </p>
                              <p className="mt-0.5 font-display text-base font-extrabold text-white">
                                {completedCount} of {totalLessonCount} lessons complete
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex min-w-[220px] items-center gap-3 sm:min-w-[280px]">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#293D44]">
                            <div
                              className="h-full rounded-full bg-orange transition-[width] duration-500"
                              style={{ width: `${overallProgress}%` }}
                            />
                          </div>
                          <span className="w-10 text-right font-sans text-xs font-extrabold text-[#A9BAC0]">
                            {overallProgress}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>

                  {loadingPath && (
                    <div className="flex min-h-[420px] items-center justify-center">
                      <div className="flex flex-col items-center text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-orange" />
                        <p className="mt-4 font-sans text-sm font-bold text-[#71868F]">
                          Mapping your journey
                        </p>
                      </div>
                    </div>
                  )}

                  {!loadingPath && pathError && (
                    <PathErrorState message={pathError} onRetry={() => void loadPath()} />
                  )}

                  {!loadingPath && !pathError && phases.length === 0 && (
                    <EmptyPathState onCreate={handleCreateJourney} />
                  )}

                  {!loadingPath && !pathError && phases.length > 0 && (
                    <DivePath
                      phases={phases}
                      completedLessonIds={completedLessonIds}
                      currentLessonId={currentLessonId}
                      onLessonClick={handleLessonClick}
                    />
                  )}
                </>
              )}
            </main>
          )}
        </div>
      </div>
    </AppShell>
  );
}

/* ========================================================================
 * EMPTY LEARN STATE
 * ====================================================================== */

function EmptyLearnState({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-[#2D4149] bg-[#17262C]">
      <div className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-orange/[0.08] blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 left-[30%] h-[300px] w-[300px] rounded-full bg-[#3FD0C9]/[0.025] blur-[90px]" />

      <div className="relative grid min-h-[650px] lg:grid-cols-[1fr_330px]">
        <div className="flex flex-col justify-center px-5 py-12 sm:px-9 lg:px-12">
          <div className="max-w-[680px]">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#344A53] bg-[#1D3037] px-3.5 py-2">
              <Sparkles className="h-4 w-4 text-orange" />
              <span className="font-sans text-xs font-bold text-[#A9BAC0] sm:text-sm">
                Your first journey
              </span>
            </div>

            <h1 className="font-display text-[40px] font-extrabold leading-[1.03] tracking-[-0.035em] text-white sm:text-[52px] lg:text-[58px]">
              Start with something you want to understand.
            </h1>

            <p className="mt-5 max-w-[610px] font-sans text-[15px] font-medium leading-7 text-[#91A4AC] sm:text-[17px]">
              Tell Grokit what you're curious about. We'll turn it into a structured learning journey built around you.
            </p>

            <button type="button" onClick={onCreate} className={`${primaryButtonClasses} mt-8`}>
              Create my first journey
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>

        <div className="relative hidden items-center justify-center border-l border-[#2D4149] bg-[#142229] lg:flex">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,107,0,0.12),transparent_58%)]" />
          <div className="relative flex flex-col items-center px-8 text-center">
            <div className="absolute -inset-12 rounded-full bg-orange/[0.055] blur-3xl" />
            <GrokitMascot size={205} pose="idle" className="relative" />
            <div className="relative mt-5 max-w-[240px]">
              <p className="font-display text-lg font-extrabold text-white">One idea is enough.</p>
              <p className="mt-2 font-sans text-sm font-medium leading-6 text-[#71868F]">
                We'll take you deeper from there.
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center border-t border-[#2D4149] bg-[#142229] py-8 lg:hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,107,0,0.1),transparent_60%)]" />
          <GrokitMascot size={125} pose="idle" className="relative" />
        </div>
      </div>
    </section>
  );
}

/* ========================================================================
 * COURSE BUILDING
 * ====================================================================== */

function CourseBuildingState({ course }: { course: Course }) {
  return (
    <section className="relative overflow-hidden rounded-[30px] border border-[#2D4149] bg-[#17262C]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,107,0,0.08),transparent_48%)]" />
      <div className="relative flex min-h-[580px] flex-col items-center justify-center px-6 py-12 text-center">
        <div className="relative">
          <div className="absolute -inset-14 rounded-full bg-orange/[0.055] blur-3xl" />
          <GrokitMascot size={145} pose="thinking" className="relative" />
        </div>

        <p className="mt-7 font-sans text-[10px] font-extrabold uppercase tracking-[0.16em] text-orange">
          Building your journey
        </p>
        <h2 className="mt-2 max-w-[600px] font-display text-[30px] font-extrabold tracking-[-0.025em] text-white sm:text-[38px]">
          {course.title}
        </h2>
        <p className="mt-3 max-w-[540px] font-sans text-sm leading-6 text-[#71868F]">
          Your learning path is being prepared. Come back here once the journey is ready.
        </p>

        <div className="mt-7 flex items-center gap-2 rounded-full border border-[#344A53] bg-[#1B2C32] px-4 py-2.5 text-xs font-bold text-[#91A4AC]">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-orange" />
          Preparing your first lessons
        </div>
      </div>
    </section>
  );
}

/* ========================================================================
 * COURSE FAILED
 * ====================================================================== */

function CourseFailedState({
  course,
  onRetry,
  onCreate,
}: {
  course: Course;
  onRetry: () => void;
  onCreate: () => void;
}) {
  const generationError = course.generationError?.trim();

  return (
    <section className="rounded-[30px] border border-[#4A3A32] bg-[#211D1A] px-6 py-10 sm:px-10">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange/10 text-orange">
          <RefreshCw className="h-5 w-5" />
        </div>

        <h2 className="mt-5 font-display text-2xl font-extrabold text-white">
          This journey needs another try.
        </h2>
        <p className="mt-2 max-w-[560px] font-sans text-sm leading-6 text-[#91A4AC]">
          We couldn't finish building this journey. You can refresh the journey list or start a new one.
        </p>

        {generationError && (
          <p className="mt-4 max-w-[680px] break-words rounded-xl border border-[#493B34] bg-[#181615] px-4 py-3 text-left font-mono text-[11px] leading-5 text-[#8E7F77]">
            {generationError}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={onRetry} className={`${secondaryButtonClasses} shrink-0`}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button type="button" onClick={onCreate} className={primaryButtonClasses}>
            Create a new journey
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ========================================================================
 * PATH ERROR
 * ====================================================================== */

function PathErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <section className="rounded-[28px] border border-[#493A33] bg-[#211D1A] px-5 py-7 sm:px-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-display text-base font-extrabold text-white">
            We couldn't map this journey.
          </p>
          <p className="mt-1 break-words font-sans text-xs leading-5 text-[#8E7F77]">{message}</p>
        </div>
        <button type="button" onClick={onRetry} className={`${secondaryButtonClasses} shrink-0`}>
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    </section>
  );
}

/* ========================================================================
 * EMPTY PATH
 * ====================================================================== */

function EmptyPathState({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="rounded-[30px] border border-[#2D4149] bg-[#17262C] px-6 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange/10 text-orange">
        <Sparkles className="h-5 w-5" />
      </div>

      <h2 className="mt-5 font-display text-2xl font-extrabold text-white">
        Your path is still taking shape.
      </h2>
      <p className="mx-auto mt-2 max-w-[520px] font-sans text-sm leading-6 text-[#71868F]">
        This journey doesn't have any lessons available yet.
      </p>

      <button type="button" onClick={onCreate} className={`${primaryButtonClasses} mt-6`}>
        Create another journey
        <ArrowRight className="h-4 w-4" />
      </button>
    </section>
  );
}

/* ========================================================================
 * DIVE PATH
 * ====================================================================== */

function DivePath({
  phases,
  completedLessonIds,
  currentLessonId,
  onLessonClick,
}: {
  phases: PhaseWithLessons[];
  completedLessonIds: Set<string>;
  currentLessonId: string | null;
  onLessonClick: (lesson: Lesson, state: LessonState) => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-[#2D4149] bg-[#101F25]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,107,0,0.045),transparent_38%)]" />
      <div className="relative px-4 py-8 sm:px-8 sm:py-10 lg:px-12">
        <div className="mx-auto max-w-[760px]">
          {phases.map((phase, phaseIndex) => (
            <PathPhase
              key={phase.id}
              phase={phase}
              phaseIndex={phaseIndex}
              isLast={phaseIndex === phases.length - 1}
              completedLessonIds={completedLessonIds}
              currentLessonId={currentLessonId}
              onLessonClick={onLessonClick}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================================================================
 * PATH PHASE
 * ====================================================================== */

function PathPhase({
  phase,
  phaseIndex,
  isLast,
  completedLessonIds,
  currentLessonId,
  onLessonClick,
}: {
  phase: PhaseWithLessons;
  phaseIndex: number;
  isLast: boolean;
  completedLessonIds: Set<string>;
  currentLessonId: string | null;
  onLessonClick: (lesson: Lesson, state: LessonState) => void;
}) {
  const completedCount = phase.lessons.filter(
    (lesson) => completedLessonIds.has(lesson.id),
  ).length;

  const progress = getCompletionPercent(completedCount, phase.lessons.length);

  return (
    <div className={['relative', isLast ? '' : 'pb-14 sm:pb-20'].join(' ')}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-sans text-[10px] font-extrabold uppercase tracking-[0.16em] text-orange">
              {getPhaseLabel(phaseIndex)}
            </span>
            {phase.locked && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#1D2D33] px-2 py-1 font-sans text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#60757E]">
                <Lock className="h-2.5 w-2.5" />
                Locked
              </span>
            )}
          </div>
          <h2 className="mt-1 font-display text-xl font-extrabold tracking-[-0.02em] text-white sm:text-2xl">
            {phase.title}
          </h2>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-sans text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#60757E]">
            {completedCount}/{phase.lessons.length}
          </p>
          <div className="mt-2 h-1.5 w-20 overflow-hidden rounded-full bg-[#293D44] sm:w-28">
            <div
              className="h-full rounded-full bg-orange transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {phase.lessons.length > 0 ? (
        <div className="relative">
          <PathLine
            lessonCount={phase.lessons.length}
            completedCount={completedCount}
            phaseLocked={Boolean(phase.locked)}
          />
          <div className="relative space-y-4 sm:space-y-5">
            {phase.lessons.map((lesson, lessonIndex) => {
              const state = getLessonState(
                lesson,
                Boolean(phase.locked),
                completedLessonIds,
                currentLessonId,
              );
              return (
                <LessonNode
                  key={lesson.id}
                  lesson={lesson}
                  index={lessonIndex}
                  state={state}
                  onClick={() => onLessonClick(lesson, state)}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#334951] bg-[#15262C] px-5 py-7 text-center">
          <p className="font-sans text-sm font-bold text-[#71868F]">
            Lessons are being prepared for this depth.
          </p>
        </div>
      )}
    </div>
  );
}

/* ========================================================================
 * PATH LINE
 * ====================================================================== */

function PathLine({
  lessonCount,
  completedCount,
  phaseLocked,
}: {
  lessonCount: number;
  completedCount: number;
  phaseLocked: boolean;
}) {
  const height = Math.max(lessonCount - 1, 1) * 100 + 60;

  /*
   * The orange line represents only completed
   * progression. The current lesson itself is not
   * treated as completed.
   */
  const completedRatio =
    lessonCount > 1
      ? clamp(completedCount / Math.max(lessonCount - 1, 1), 0, 1)
      : completedCount > 0
        ? 1
        : 0;

  const pathD =
    lessonCount <= 1
      ? 'M 50 20 C 45 45, 55 75, 50 110'
      : `M 50 20
         C 20 75, 80 125, 50 170
         C 20 215, 80 265, 50 310
         C 20 355, 80 405, 50 ${height}`;

  return (
    <svg
      className="pointer-events-none absolute left-1/2 top-0 z-0 hidden -translate-x-1/2 sm:block"
      width="180"
      height={height}
      viewBox={`0 0 180 ${height}`}
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d={pathD}
        stroke={phaseLocked ? '#263940' : '#293D44'}
        strokeWidth="22"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {!phaseLocked && (
        <path
          d={pathD}
          stroke="#FF6B00"
          strokeWidth="22"
          strokeLinecap="round"
          strokeDasharray={`${height}`}
          strokeDashoffset={`${height * (1 - completedRatio)}`}
          opacity="0.9"
          vectorEffect="non-scaling-stroke"
        />
      )}
      <path
        d={pathD}
        stroke={phaseLocked ? '#33474F' : '#172A30'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="5 8"
        opacity="0.65"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ========================================================================
 * LESSON NODE
 * ====================================================================== */

function LessonNode({
  lesson,
  index,
  state,
  onClick,
}: {
  lesson: Lesson;
  index: number;
  state: LessonState;
  onClick: () => void;
}) {
  const isCurrent = state === 'current';
  const isCompleted = state === 'completed';
  const isLocked = state === 'locked';

  const offsetClasses = [
    'sm:ml-auto sm:mr-0',
    'sm:mr-auto sm:ml-0',
    'sm:mx-auto',
    'sm:ml-auto sm:mr-12',
    'sm:mr-auto sm:ml-12',
  ];

  const offset = offsetClasses[index % offsetClasses.length];

  return (
    <div className={['relative z-10 flex', 'sm:w-[min(100%,_620px)]', offset].join(' ')}>
      <button
        type="button"
        onClick={onClick}
        disabled={isLocked}
        aria-disabled={isLocked}
        aria-current={isCurrent ? 'step' : undefined}
        className={[
          'group flex w-full items-center gap-4 rounded-[24px] border p-3 text-left',
          'transition-all duration-200',
          isCurrent
            ? 'border-orange/60 bg-[#1D2D33] shadow-[0_12px_40px_rgba(255,107,0,0.1)]'
            : isCompleted
              ? 'border-[#40545C] bg-[#17272D] hover:border-orange/40'
              : 'cursor-not-allowed border-[#293B42] bg-[#142329] opacity-65',
        ].join(' ')}
      >
        <div className="relative shrink-0">
          {isCurrent && <div className="absolute -inset-2 rounded-full bg-orange/10 blur-md" />}
          <div
            className={[
              'relative flex h-[68px] w-[68px] items-center justify-center rounded-full border-4',
              'transition-all duration-200',
              isCurrent
                ? 'border-orange bg-orange/15'
                : isCompleted
                  ? 'border-orange/60 bg-orange/10'
                  : 'border-[#33474F] bg-[#1C2D33]',
            ].join(' ')}
          >
            {isCurrent ? (
              <GrokitMascot size={56} pose="idle" />
            ) : isCompleted ? (
              <Check className="h-6 w-6 text-orange" />
            ) : (
              <Lock className="h-5 w-5 text-[#60757E]" />
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1 py-1">
          <div className="flex items-center gap-2">
            <span
              className={[
                'font-sans text-[9px] font-extrabold uppercase tracking-[0.12em]',
                isCurrent ? 'text-orange' : isCompleted ? 'text-[#80939B]' : 'text-[#60757E]',
              ].join(' ')}
            >
              {isCurrent ? 'Continue' : isCompleted ? 'Completed' : 'Locked'}
            </span>
          </div>

          <h3
            className={[
              'mt-1 font-display text-base font-extrabold leading-5 sm:text-lg',
              isLocked ? 'text-[#64767D]' : 'text-white',
            ].join(' ')}
          >
            {lesson.title}
          </h3>

          {lesson.hook && (
            <p
              className={[
                'mt-1.5 line-clamp-2 font-sans text-xs leading-5',
                isLocked ? 'text-[#52656D]' : 'text-[#71868F]',
              ].join(' ')}
            >
              {lesson.hook}
            </p>
          )}
        </div>

        <div
          className={[
            'hidden h-9 w-9 shrink-0 items-center justify-center rounded-full sm:flex',
            isCurrent ? 'bg-orange text-white' : 'bg-[#21333A] text-[#71868F]',
            !isLocked ? 'group-hover:bg-orange group-hover:text-white' : '',
          ].join(' ')}
        >
          {isLocked ? (
            <Lock className="h-3.5 w-3.5" />
          ) : (
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          )}
        </div>
      </button>
    </div>
  );
}