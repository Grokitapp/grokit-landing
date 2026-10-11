import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  RefreshCw,
} from 'lucide-react';

import {
  DailyGoalCard,
  NextBadgeCard,
  StatChip,
  StreakCard,
} from './components/GamificationCards';
import JourneyMenu from './components/JourneyMenu';
import JourneyPath, {
  type PathLesson,
  type PathLessonStatus,
  type PathZone,
} from './components/JourneyPath';
import {
  getCourse,
  listLessonsForCourse,
  listPhasesForCourse,
  listProgressForCourse,
} from '../../lib/courseGeneration';
import {
  JOURNEY_CHANGED_EVENT,
  type JourneyChange,
} from '../../lib/courseActions';
import { useGamification } from '../../lib/gamification';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface JourneyData {
  title: string;
  zones: PathZone[];
}

interface JourneyStats {
  completed: number;
  total: number;
  percentage: number;
  completedZones: number;
  currentZone: PathZone | null;
  currentLessonId: string | null;
  isComplete: boolean;
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const containerClasses =
  'mx-auto min-h-[100dvh] w-full max-w-[1180px] px-4 pb-10 sm:px-7 xl:px-9';

const primaryButtonClasses =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange px-5 py-3 text-sm font-extrabold text-white shadow-[0_3px_0_#C94713] transition hover:brightness-110 active:translate-y-0.5 active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-[#19282E]';

const secondaryButtonClasses =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#37464F] px-4 py-2.5 text-sm font-bold text-[#C8D3DA] transition hover:border-[#536871] hover:bg-[#26373E] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange';

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function calculateStats(zones: PathZone[]): JourneyStats {
  const completed = zones.reduce(
    (sum, zone) => sum + Math.min(zone.completedLessons, zone.totalLessons),
    0,
  );

  const total = zones.reduce((sum, zone) => sum + zone.totalLessons, 0);

  const completedZones = zones.filter(
    (zone) =>
      zone.totalLessons > 0 && zone.completedLessons >= zone.totalLessons,
  ).length;

  const isComplete = total > 0 && completed >= total;

  const currentZone =
    zones.find(
      (zone) =>
        !zone.locked &&
        zone.totalLessons > 0 &&
        zone.completedLessons < zone.totalLessons,
    ) ?? null;

  const currentLessonId =
    currentZone?.lessons.find((lesson) => lesson.status === 'unlocked')?.id ??
    null;

  return {
    completed,
    total,
    percentage:
      total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0,
    completedZones,
    currentZone: isComplete ? null : currentZone,
    currentLessonId: isComplete ? null : currentLessonId,
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
      <div className="flex h-14 items-center">
        <div className="h-7 w-64 max-w-full rounded-lg bg-[#26373E]" />
      </div>

      <div className="mx-auto max-w-[520px]">
        <div className="h-[88px] rounded-2xl bg-[#26373E]" />

        <div className="mt-8 space-y-9 px-1">
          {[0, 36, 68, 36].map((offset, index) => (
            <div
              key={index}
              style={{ marginLeft: offset }}
              className="flex items-center gap-4"
            >
              <div className="h-[72px] w-[72px] shrink-0 rounded-full bg-[#26373E]" />
              <div className="h-4 w-40 rounded bg-[#26373E]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Error state
// -----------------------------------------------------------------------------

function JourneyError({ onRetry }: { onRetry: () => void }) {
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
        We couldn’t load your learning path right now. Your progress hasn’t
        been changed. Please try again.
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
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Empty state
// -----------------------------------------------------------------------------

function EmptyJourney({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="rounded-[24px] border border-dashed border-[#465861] bg-[#19282E]/70 px-5 py-12 text-center sm:px-8 sm:py-16">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#37464F] bg-[#202F35] text-orange">
        <BookOpen className="h-6 w-6" aria-hidden="true" />
      </div>

      <h3 className="mt-5 font-display text-lg font-extrabold text-white sm:text-xl">
        Your learning path is getting ready
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#91A4AC]">
        This journey is available, but its learning zones haven’t appeared
        yet. Try refreshing in a moment.
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
  const navigate = useNavigate();

  const [journey, setJourney] = useState<JourneyData>({
    title: '',
    zones: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Prevent stale requests from replacing the latest result.
  const requestVersion = useRef(0);

  const loadJourney = useCallback(async () => {
    const requestId = ++requestVersion.current;

    if (!courseId?.trim()) {
      setJourney({ title: '', zones: [] });
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

      const mappedZones: PathZone[] = phaseRecords
        .map((phase) => {
          const locked = phase.locked ?? false;

          const phaseLessons = [...(lessonsByPhase.get(phase.id) ?? [])].sort(
            (a, b) => (a.order ?? 0) - (b.order ?? 0),
          );

          // Same rule as PhaseDetail: the first unfinished lesson is open,
          // everything after it is locked. A locked zone locks everything.
          let nextLessonAssigned = false;

          const pathLessons: PathLesson[] = phaseLessons.map((lesson) => {
            let status: PathLessonStatus;

            if (completedLessonIds.has(lesson.id)) {
              status = 'completed';
            } else if (!locked && !nextLessonAssigned) {
              status = 'unlocked';
              nextLessonAssigned = true;
            } else {
              status = 'locked';
            }

            return { id: lesson.id, title: lesson.title, status };
          });

          return {
            id: phase.id,
            order: phase.order,
            title: phase.title,
            completedLessons: pathLessons.filter(
              (lesson) => lesson.status === 'completed',
            ).length,
            totalLessons: pathLessons.length,
            locked,
            lessons: pathLessons,
          };
        })
        .sort((a, b) => a.order - b.order);

      setJourney({ title: course.title, zones: mappedZones });
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

  // Keep the title in sync when the journey is renamed from the menu.
  useEffect(() => {
    const handleChange = (event: Event) => {
      const change = (event as CustomEvent<JourneyChange>).detail;

      if (!change || change.id !== courseId || change.action !== 'rename') {
        return;
      }

      setJourney((current) => ({ ...current, title: change.title }));
    };

    window.addEventListener(JOURNEY_CHANGED_EVENT, handleChange);

    return () =>
      window.removeEventListener(JOURNEY_CHANGED_EVENT, handleChange);
  }, [courseId]);

  const stats = useMemo(() => calculateStats(journey.zones), [journey.zones]);

  const { stats: game } = useGamification(courseId);

  const retry = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  // Tapping a node opens that lesson's start sheet on the zone page.
  const openLesson = useCallback(
    (zoneId: string, lessonId: string) => {
      if (!courseId) return;

      navigate(`/learn/course/${courseId}/phase/${zoneId}?lesson=${lessonId}`);
    },
    [courseId, navigate],
  );

  return (
    <div className={containerClasses}>
      {loading ? (
        <JourneySkeleton />
      ) : loadError ? (
        <JourneyError onRetry={retry} />
      ) : (
        <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-10">
          <div className="min-w-0">
            {/* Sticky title bar: stays put while the path scrolls beneath it,
                with the current zone banner stacking right under it. */}
            <div className="sticky top-16 z-30 flex h-14 items-center gap-2 bg-[#131F24] lg:top-0">
              <h1 className="min-w-0 flex-1 truncate font-display text-lg font-extrabold text-white sm:text-xl">
                {journey.title}
              </h1>

              {game && (
                <div className="flex shrink-0 items-center gap-2 xl:hidden">
                  <StatChip
                    kind="streak"
                    value={game.currentStreak}
                    active={game.currentStreak > 0}
                  />
                  <StatChip kind="xp" value={game.totalXp} />
                </div>
              )}

              {courseId && (
                <JourneyMenu journey={{ id: courseId, title: journey.title }} />
              )}
            </div>

            {/* Learning path */}
            <section aria-label="Your learning path" className="pt-2">
              {journey.zones.length === 0 ? (
                <EmptyJourney onRetry={retry} />
              ) : (
                <JourneyPath
                  courseId={courseId ?? ''}
                  zones={journey.zones}
                  currentZoneId={stats.currentZone?.id ?? null}
                  hasStarted={stats.completed > 0}
                  onSelectLesson={openLesson}
                />
              )}
            </section>

            {/* Completion footer */}
            {stats.isComplete && (
              <section className="mx-auto mt-4 max-w-[520px] rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                    <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-extrabold text-white">
                      Journey complete!
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-[#91A4AC]">
                      You’ve worked through every lesson in this path. Take a
                      moment to appreciate how far you’ve come.
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
          </div>

          {/* Gamification rail (desktop) */}
          <aside className="hidden xl:block" aria-label="Your progress">
            <div className="sticky top-6 space-y-4 pt-2">
              {game ? (
                <>
                  <StreakCard stats={game} />
                  <DailyGoalCard stats={game} />
                  <NextBadgeCard badges={game.badges} />
                </>
              ) : (
                <div aria-hidden="true" className="space-y-4 animate-pulse">
                  <div className="h-40 rounded-2xl bg-[#19282E]" />
                  <div className="h-52 rounded-2xl bg-[#19282E]" />
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}