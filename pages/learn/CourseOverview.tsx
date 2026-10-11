import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  GraduationCap,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

import AppShell from './AppShell';
import PhaseCard, { type Phase } from './components/PhaseCard';
import {
  getCourse,
  listLessonsForCourse,
  listPhasesForCourse,
  listProgressForCourse,
} from '../../lib/courseGeneration';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface JourneyData {
  title: string;
  phases: Phase[];
}

interface JourneyStats {
  completed: number;
  total: number;
  percentage: number;
  completedPhases: number;
  currentPhase: Phase | null;
  isComplete: boolean;
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const containerClasses =
  'mx-auto min-h-[100dvh] w-full max-w-[1040px] px-4 py-6 sm:px-7 sm:py-9 xl:px-9';

const backClasses =
  'mb-7 inline-flex min-h-10 items-center gap-2 rounded-xl pr-3 text-sm font-semibold text-[#91A4AC] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange sm:mb-9';

const heroClasses =
  'relative isolate mb-9 overflow-hidden rounded-[28px] border border-[#37464F] bg-[#19282E] p-5 sm:p-8 lg:p-9';

const eyebrowClasses =
  'inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.17em] text-orange sm:text-xs';

const titleClasses =
  'mt-3 max-w-3xl break-words font-display text-2xl font-extrabold leading-tight text-white sm:text-3xl lg:text-4xl';

const subtitleClasses =
  'mt-3 max-w-2xl text-sm leading-6 text-[#91A4AC] sm:text-base sm:leading-7';

const sectionTitleClasses =
  'font-display text-xl font-extrabold text-white sm:text-2xl';

const primaryButtonClasses =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange px-5 py-3 text-sm font-extrabold text-white shadow-[0_3px_0_#C94713] transition hover:brightness-110 active:translate-y-0.5 active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-[#19282E]';

const secondaryButtonClasses =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#37464F] px-4 py-2.5 text-sm font-bold text-[#C8D3DA] transition hover:border-[#536871] hover:bg-[#26373E] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange';

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function calculateStats(phases: Phase[]): JourneyStats {
  const completed = phases.reduce(
    (sum, phase) =>
      sum + Math.min(phase.completedLessons, phase.totalLessons),
    0,
  );

  const total = phases.reduce(
    (sum, phase) => sum + phase.totalLessons,
    0,
  );

  const completedPhases = phases.filter(
    (phase) =>
      phase.totalLessons > 0 &&
      phase.completedLessons >= phase.totalLessons,
  ).length;

  const isComplete = total > 0 && completed >= total;

  const currentPhase =
    phases.find(
      (phase) =>
        !phase.locked &&
        phase.totalLessons > 0 &&
        phase.completedLessons < phase.totalLessons,
    ) ?? null;

  return {
    completed,
    total,
    percentage:
      total > 0
        ? Math.min(100, Math.round((completed / total) * 100))
        : 0,
    completedPhases,
    currentPhase: isComplete ? null : currentPhase,
    isComplete,
  };
}

// -----------------------------------------------------------------------------
// Loading state
// -----------------------------------------------------------------------------

function JourneySkeleton() {
  return (
    <div
      aria-label="Loading your journey"
      aria-busy="true"
      className="animate-pulse"
    >
      <div className="mb-9 rounded-[28px] border border-[#37464F] bg-[#19282E] p-6 sm:p-9">
        <div className="h-3 w-28 rounded bg-[#37464F]" />
        <div className="mt-5 h-9 max-w-lg rounded-lg bg-[#26373E]" />
        <div className="mt-4 h-4 max-w-md rounded bg-[#26373E]" />

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full max-w-sm">
            <div className="h-4 w-32 rounded bg-[#37464F]" />
            <div className="mt-3 h-2 rounded-full bg-[#26373E]" />
          </div>
          <div className="h-12 w-full rounded-xl bg-[#26373E] sm:w-40" />
        </div>
      </div>

      <div className="mb-5 h-6 w-40 rounded bg-[#26373E]" />

      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="flex items-center gap-4 rounded-2xl border border-[#37464F] bg-[#19282E] p-5"
          >
            <div className="h-12 w-12 shrink-0 rounded-2xl bg-[#26373E]" />
            <div className="min-w-0 flex-1">
              <div className="h-4 w-2/3 rounded bg-[#26373E]" />
              <div className="mt-3 h-3 w-1/3 rounded bg-[#26373E]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Error state
// -----------------------------------------------------------------------------

function JourneyError({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <section
      role="alert"
      className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center sm:py-24"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#37464F] bg-[#202F35] text-orange">
        <Compass className="h-7 w-7" aria-hidden="true" />
      </div>

      <h1 className="mt-6 font-display text-2xl font-extrabold text-white sm:text-3xl">
        Your journey is taking a short break
      </h1>

      <p className="mt-3 max-w-md text-sm leading-6 text-[#91A4AC] sm:text-base">
        We couldn’t load your learning path right now. Your progress
        hasn’t been changed. Please try again.
      </p>

      <div className="mt-7 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
        <button
          type="button"
          onClick={onRetry}
          className={primaryButtonClasses}
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>

        <Link to="/create" className={secondaryButtonClasses}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Create
        </Link>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Empty state
// -----------------------------------------------------------------------------

function EmptyJourney({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <section className="rounded-[24px] border border-dashed border-[#465861] bg-[#19282E]/70 px-5 py-12 text-center sm:px-8 sm:py-16">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#37464F] bg-[#202F35] text-orange">
        <BookOpen className="h-6 w-6" aria-hidden="true" />
      </div>

      <h3 className="mt-5 font-display text-lg font-extrabold text-white sm:text-xl">
        Your learning path is getting ready
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#91A4AC]">
        This journey is available, but its learning zones haven’t
        appeared yet. Try refreshing in a moment.
      </p>

      <button
        type="button"
        onClick={onRetry}
        className={`${secondaryButtonClasses} mt-6`}
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Refresh journey
      </button>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export default function CourseOverview() {
  const { courseId } = useParams<{ courseId: string }>();

  const [journey, setJourney] = useState<JourneyData>({
    title: '',
    phases: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Prevent stale requests from replacing the latest result.
  const requestVersion = useRef(0);

  const loadJourney = useCallback(async () => {
    const requestId = ++requestVersion.current;

    if (!courseId?.trim()) {
      setJourney({ title: '', phases: [] });
      setLoading(false);
      setLoadError(true);
      return;
    }

    setLoading(true);
    setLoadError(false);

    try {
      const [course, phaseRecords, lessons, progress] = await Promise.all([
        getCourse(courseId),
        listPhasesForCourse(courseId),
        listLessonsForCourse(courseId),
        listProgressForCourse(courseId),
      ]);

      if (requestId !== requestVersion.current) return;

      if (!course) {
        throw new Error('JOURNEY_NOT_FOUND');
      }

      const completedLessonIds = new Set(
        progress.map((item) => item.lessonId),
      );

      const lessonsByPhase = new Map<string, typeof lessons>();

      for (const lesson of lessons) {
        const phaseLessons = lessonsByPhase.get(lesson.phaseId) ?? [];
        phaseLessons.push(lesson);
        lessonsByPhase.set(lesson.phaseId, phaseLessons);
      }

      const mappedPhases: Phase[] = phaseRecords
        .map((phase) => {
          const phaseLessons = lessonsByPhase.get(phase.id) ?? [];

          const completedLessons = phaseLessons.filter((lesson) =>
            completedLessonIds.has(lesson.id),
          ).length;

          return {
            id: phase.id,
            order: phase.order,
            title: phase.title,
            completedLessons,
            totalLessons: phaseLessons.length,
            locked: phase.locked ?? false,
          };
        })
        .sort((a, b) => a.order - b.order);

      setJourney({
        title: course.title,
        phases: mappedPhases,
      });
    } catch (error) {
      if (requestId !== requestVersion.current) return;

      // Keep provider and backend details out of the interface.
      console.error('[CourseOverview] Failed to load journey:', error);
      setLoadError(true);
    } finally {
      if (requestId === requestVersion.current) {
        setLoading(false);
      }
    }
  }, [courseId]);

  useEffect(() => {
    void loadJourney();

    return () => {
      requestVersion.current += 1;
    };
  }, [loadJourney, reloadKey]);

  const stats = useMemo(
    () => calculateStats(journey.phases),
    [journey.phases],
  );

  const retry = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  return (
    <AppShell>
      <main className={containerClasses}>
        <Link to="/create" className={backClasses}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Create
        </Link>

        {loading ? (
          <JourneySkeleton />
        ) : loadError ? (
          <JourneyError onRetry={retry} />
        ) : (
          <>
            {/* Journey hero */}
            <section className={heroClasses}>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-24 -top-28 -z-10 h-80 w-80 rounded-full bg-orange/[0.10] blur-3xl"
              />

              <div className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={eyebrowClasses}>
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    Your learning journey
                  </span>

                  {stats.isComplete && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Completed
                    </span>
                  )}
                </div>

                <h1 className={titleClasses}>{journey.title}</h1>

                <p className={subtitleClasses}>
                  Explore each learning zone at your own pace. Every lesson
                  brings you one step closer to mastering your topic.
                </p>

                {/* Progress summary */}
                <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-9 sm:gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl border border-[#37464F]/80 bg-[#131F24]/50 p-4">
                    <div className="flex items-center gap-2 text-[#91A4AC]">
                      <BookOpen className="h-4 w-4 text-orange" aria-hidden="true" />
                      <span className="text-xs font-semibold sm:text-sm">
                        Lessons completed
                      </span>
                    </div>

                    <p className="mt-3 font-display text-2xl font-extrabold text-white sm:text-3xl">
                      {stats.completed}
                      <span className="ml-1 text-base font-semibold text-[#60757E] sm:text-lg">
                        / {stats.total}
                      </span>
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#37464F]/80 bg-[#131F24]/50 p-4">
                    <div className="flex items-center gap-2 text-[#91A4AC]">
                      <Compass className="h-4 w-4 text-orange" aria-hidden="true" />
                      <span className="text-xs font-semibold sm:text-sm">
                        Zones completed
                      </span>
                    </div>

                    <p className="mt-3 font-display text-2xl font-extrabold text-white sm:text-3xl">
                      {stats.completedPhases}
                      <span className="ml-1 text-base font-semibold text-[#60757E] sm:text-lg">
                        / {journey.phases.length}
                      </span>
                    </p>
                  </div>

                  <div className="col-span-2 rounded-2xl border border-[#37464F]/80 bg-[#131F24]/50 p-4 lg:col-span-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-[#91A4AC] sm:text-sm">
                        Overall progress
                      </span>
                      <span className="font-display text-lg font-extrabold text-white">
                        {stats.percentage}%
                      </span>
                    </div>

                    <div
                      role="progressbar"
                      aria-label="Journey completion"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={stats.percentage}
                      className="mt-4 h-2 overflow-hidden rounded-full bg-[#0D181C]"
                    >
                      <div
                        className="h-full rounded-full bg-orange transition-[width] duration-700 ease-out"
                        style={{ width: `${stats.percentage}%` }}
                      />
                    </div>

                    <p className="mt-2 text-xs text-[#60757E]">
                      {stats.isComplete
                        ? 'You’ve completed every lesson!'
                        : stats.total === 0
                          ? 'Progress will appear when lessons are ready.'
                          : 'Every lesson moves you forward'}
                    </p>
                  </div>
                </div>

                {/* Continue action */}
                <div className="mt-6 flex flex-col gap-4 border-t border-[#37464F] pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">
                      {stats.isComplete
                        ? 'Amazing work!'
                        : stats.currentPhase
                          ? 'Ready for your next step?'
                          : 'Your next step is taking shape'}
                    </p>

                    <p className="mt-1 text-sm text-[#91A4AC]">
                      {stats.isComplete
                        ? 'Your learning journey is complete.'
                        : stats.currentPhase
                          ? `Continue with ${stats.currentPhase.title}.`
                          : 'Your next learning zone will appear here when it is ready.'}
                    </p>
                  </div>

                  {stats.currentPhase && courseId && (
                    <Link
                      to={`/learn/course/${courseId}/phase/${stats.currentPhase.id}`}
                      className={`${primaryButtonClasses} w-full shrink-0 sm:w-auto`}
                    >
                      {stats.completed === 0
                        ? 'Start learning'
                        : 'Continue learning'}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </div>
            </section>

            {/* Learning path */}
            <section aria-labelledby="learning-path-heading">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange/10 text-orange">
                      <GraduationCap className="h-5 w-5" aria-hidden="true" />
                    </div>

                    <h2
                      id="learning-path-heading"
                      className={sectionTitleClasses}
                    >
                      Your learning path
                    </h2>
                  </div>

                  <p className="mt-2 text-sm text-[#91A4AC]">
                    Follow the zones in order and build your knowledge step
                    by step.
                  </p>
                </div>

                {journey.phases.length > 0 && (
                  <p className="text-sm font-semibold text-[#60757E]">
                    {journey.phases.length}{' '}
                    {journey.phases.length === 1 ? 'zone' : 'zones'}
                  </p>
                )}
              </div>

              {journey.phases.length === 0 ? (
                <EmptyJourney onRetry={retry} />
              ) : (
                <div className="flex flex-col gap-3 sm:gap-4">
                  {journey.phases.map((phase) => {
                    const isCurrent = stats.currentPhase?.id === phase.id;

                    return (
                      <div
                        key={phase.id}
                        className={
                          isCurrent
                            ? '[&>div]:border-orange/35'
                            : undefined
                        }
                      >
                        <PhaseCard
                          courseId={courseId ?? ''}
                          phase={phase}
                          current={isCurrent}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Completion footer */}
            {stats.isComplete && (
              <section className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                    <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-extrabold text-white">
                      Journey complete!
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-[#91A4AC]">
                      You’ve worked through every lesson in this path.
                      Take a moment to appreciate how far you’ve come.
                    </p>

                    <Link
                      to="/create"
                      className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-orange transition hover:text-white"
                    >
                      Create another journey
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </AppShell>
  );
}
