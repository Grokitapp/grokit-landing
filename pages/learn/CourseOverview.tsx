import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Compass,
  Plus,
  RefreshCw,
  Sparkles,
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
  listCourses,
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

interface JourneyListItem {
  id: string;
  title: string;
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
// Journey switcher (lives in the sticky title bar)
// -----------------------------------------------------------------------------

function JourneySwitcher({
  currentId,
  currentTitle,
  journeys,
  onSelect,
}: {
  currentId: string | undefined;
  currentTitle: string;
  journeys: JourneyListItem[];
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex max-w-full items-center gap-2 rounded-lg py-1.5 pr-1 text-left transition-colors hover:text-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
      >
        <span className="truncate font-display text-lg font-extrabold text-white sm:text-xl">
          {currentTitle}
        </span>

        <ChevronsUpDown
          className="h-4 w-4 shrink-0 text-[#91A4AC]"
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Switch journey"
          className="absolute left-0 top-full z-40 mt-1 max-h-[320px] w-[min(320px,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-[#39464C] bg-[#202F35] p-1.5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
        >
          {journeys.map((journey) => {
            const active = journey.id === currentId;

            return (
              <button
                key={journey.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  setOpen(false);
                  if (!active) onSelect(journey.id);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange ${
                  active
                    ? 'bg-orange/10 text-white'
                    : 'text-[#C5CFD3] hover:bg-white/[0.07]'
                }`}
              >
                <span className="min-w-0 flex-1 truncate">{journey.title}</span>
                {active && (
                  <Check
                    className="h-4 w-4 shrink-0 text-orange"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}

          <div className="my-1.5 h-px bg-[#2B4048]" />

          <Link
            to="/create"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-extrabold text-[#D7E0E3] transition-colors hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
          >
            <Plus className="h-4 w-4 text-orange" aria-hidden="true" />
            Create another journey
          </Link>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Journey card ("Your learning journey")
// -----------------------------------------------------------------------------

function JourneyCard({
  courseId,
  title,
  stats,
  zoneCount,
  onContinue,
}: {
  courseId: string;
  title: string;
  stats: JourneyStats;
  zoneCount: number;
  onContinue: () => void;
}) {
  const actionLabel = stats.isComplete
    ? 'Review journey'
    : stats.completed > 0
      ? 'Continue'
      : 'Start learning';

  return (
    <section
      aria-label="Your learning journey"
      className="relative mb-4 rounded-[28px] border border-[#2D4149] bg-[#1A2A31] px-6 pb-6 pt-5 sm:px-7"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-extrabold text-orange">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Your learning journey
          </p>

          <h2 className="mt-3 break-words font-display text-2xl font-extrabold leading-tight text-white sm:text-[32px]">
            {title}
          </h2>
        </div>

        <JourneyMenu journey={{ id: courseId, title }} />
      </div>

      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:max-w-[480px]">
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="font-bold text-white">
              {stats.completed} of {stats.total} lessons
            </span>
            <span className="font-semibold text-[#91A4AC]">
              {stats.completedZones} of {zoneCount} zones
            </span>
          </div>

          <div
            role="progressbar"
            aria-label="Journey progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={stats.percentage}
            className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#0F1A1F]"
          >
            <div
              className="h-full rounded-full bg-orange transition-[width] duration-500"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onContinue}
          disabled={zoneCount === 0}
          className={`${primaryButtonClasses} shrink-0 rounded-2xl px-6 disabled:pointer-events-none disabled:opacity-50`}
        >
          {actionLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
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
  const [journeyList, setJourneyList] = useState<JourneyListItem[]>([]);

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

      if (!change) return;

      // Keep the switcher list in sync with the sidebar.
      setJourneyList((current) =>
        change.action === 'rename'
          ? current.map((item) =>
              item.id === change.id ? { ...item, title: change.title } : item,
            )
          : current.filter((item) => item.id !== change.id),
      );

      if (change.id !== courseId || change.action !== 'rename') return;

      setJourney((current) => ({ ...current, title: change.title }));
    };

    window.addEventListener(JOURNEY_CHANGED_EVENT, handleChange);

    return () =>
      window.removeEventListener(JOURNEY_CHANGED_EVENT, handleChange);
  }, [courseId]);

  // Journeys for the title-bar switcher.
  useEffect(() => {
    let cancelled = false;

    const loadJourneyList = async () => {
      try {
        const records = await listCourses();

        if (cancelled) return;

        setJourneyList(
          records
            .filter(
              (record) => !(record as { archived?: boolean | null }).archived,
            )
            .filter(
              (record): record is typeof record & {
                id: string;
                title: string;
              } => Boolean(record.id && record.title),
            )
            .map((record) => ({ id: record.id, title: record.title })),
        );
      } catch (error) {
        // The switcher is a convenience; the page still works without it.
        console.error('[CourseOverview] Failed to load journey list:', error);
      }
    };

    void loadJourneyList();

    return () => {
      cancelled = true;
    };
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

  // "Start learning" / "Continue": jump to the next lesson, or the first open
  // zone when there is nothing left to do.
  const continueJourney = useCallback(() => {
    if (!courseId) return;

    if (stats.currentZone && stats.currentLessonId) {
      openLesson(stats.currentZone.id, stats.currentLessonId);
      return;
    }

    const fallbackZone =
      journey.zones.find((zone) => !zone.locked) ?? journey.zones[0];

    if (fallbackZone) {
      navigate(`/learn/course/${courseId}/phase/${fallbackZone.id}`);
    }
  }, [courseId, journey.zones, navigate, openLesson, stats]);

  const switchJourney = useCallback(
    (id: string) => navigate(`/learn/course/${id}`),
    [navigate],
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
            {/* Sticky title bar with the journey switcher. It stays put while
                the path scrolls beneath it; the current zone banner (in
                JourneyPath) pins directly under it. Keep h-14 in sync with
                the banner's `top` offsets in JourneyPath. */}
            <div className="sticky top-16 z-30 flex h-14 items-center gap-2 bg-[#131F24] lg:top-0">
              <div className="min-w-0 flex-1">
                <JourneySwitcher
                  currentId={courseId}
                  currentTitle={journey.title}
                  journeys={journeyList}
                  onSelect={switchJourney}
                />
              </div>

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
            </div>

            {/* Journey card */}
            {courseId && (
              <div className="pt-1">
                <JourneyCard
                  courseId={courseId}
                  title={journey.title}
                  stats={stats}
                  zoneCount={journey.zones.length}
                  onContinue={continueJourney}
                />
              </div>
            )}

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