import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Eye,
  Globe,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Undo2,
  Users,
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
import {
  getPublicJourneyForCourse,
  publishJourney,
  unpublishJourney,
  type PublicJourney,
} from '../../lib/explore';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface JourneyData {
  title: string;
  description: string;
  topic: string;
  heroImageUrl: string;
  zones: PathZone[];
}

const EMPTY_JOURNEY: JourneyData = {
  title: '',
  description: '',
  topic: '',
  heroImageUrl: '',
  zones: [],
};

type JourneyView = 'path' | 'publish';

const PUBLIC_CATEGORIES = [
  'AI & Tech',
  'Business',
  'Science',
  'Mind & Life',
  'Creativity',
  'Health & Fitness',
  'History',
  'Languages',
  'Other',
];

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
// Journey card ("Your learning journey")
// -----------------------------------------------------------------------------

function JourneyCard({
  courseId,
  title,
  stats,
  zoneCount,
  onContinue,
  onPublish,
}: {
  courseId: string;
  title: string;
  stats: JourneyStats;
  zoneCount: number;
  onContinue: () => void;
  onPublish: () => void;
}) {
  const actionLabel = stats.isComplete
    ? 'Review journey'
    : stats.completed > 0
      ? 'Continue'
      : 'Start learning';

  return (
    <section
      aria-label="Your learning journey"
      className="relative rounded-2xl border border-[#2D4149] bg-[#1A2A31] px-5 pb-4 pt-4 sm:px-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-extrabold text-orange">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Your learning journey
          </p>

          <h1 className="mt-1.5 break-words font-display text-xl font-extrabold leading-tight text-white sm:text-[26px]">
            {title}
          </h1>
        </div>

        <JourneyMenu journey={{ id: courseId, title }} onPublish={onPublish} />
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:max-w-[480px]">
          <div className="flex items-baseline justify-between gap-4 text-xs">
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
            className="mt-2 h-2 overflow-hidden rounded-full bg-[#0F1A1F]"
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
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-orange px-4 text-sm font-extrabold text-white shadow-[0_3px_0_#C94713] transition hover:brightness-110 active:translate-y-0.5 active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A2A31] disabled:pointer-events-none disabled:opacity-50"
        >
          {actionLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Gamification rail: sticks once its bottom is in view, so a rail taller than
// the viewport scrolls with the page just far enough to reveal everything,
// then stays put instead of scrolling away.
// -----------------------------------------------------------------------------

function StickyRail({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(24);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const update = () => {
      setTop(Math.min(24, window.innerHeight - element.offsetHeight - 24));
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener('resize', update);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div ref={ref} style={{ top }} className="sticky space-y-4 pt-2">
      {children}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Publish to Explore (replaces the path while it is open)
// -----------------------------------------------------------------------------

function PublishPanel({
  courseId,
  title,
  description,
  topic,
  heroImageUrl,
  zoneCount,
  lessonCount,
  onBack,
}: {
  courseId: string;
  title: string;
  description: string;
  topic: string;
  heroImageUrl: string;
  zoneCount: number;
  lessonCount: number;
  onBack: () => void;
}) {
  const [existing, setExisting] = useState<PublicJourney | null>(null);
  const [checking, setChecking] = useState(true);
  const [checkFailed, setCheckFailed] = useState(false);
  const [checkKey, setCheckKey] = useState(0);
  const [category, setCategory] = useState<string | null>(null);
  const [busy, setBusy] = useState<'publish' | 'unpublish' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justPublished, setJustPublished] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setChecking(true);
    setCheckFailed(false);

    getPublicJourneyForCourse(courseId)
      .then((found) => {
        if (cancelled) return;

        setExisting(found);
        setCategory(found?.category ?? null);
      })
      .catch(() => {
        if (!cancelled) setCheckFailed(true);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId, checkKey]);

  const handlePublish = async () => {
    if (busy || checking || checkFailed || existing) return;

    setBusy('publish');
    setError(null);

    try {
      const created = await publishJourney({
        courseId,
        title,
        topic,
        category,
        heroImageUrl,
        zoneCount,
        lessonCount,
      });

      setExisting(created);
      setJustPublished(true);
    } catch {
      setError('We couldn’t make this journey public. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const handleUnpublish = async () => {
    if (busy || !existing) return;

    setBusy('unpublish');
    setError(null);

    try {
      await unpublishJourney(existing.id);

      setExisting(null);
      setJustPublished(false);
    } catch {
      setError('We couldn’t make this journey private. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const details = [
    {
      icon: Eye,
      title: 'Anyone signed in to Grokit can find it',
      text: 'Your journey appears in Explore with its title, cover image, category and size.',
    },
    {
      icon: ShieldCheck,
      title: 'Your learning stays private',
      text: 'Your lessons, progress, notes and account details are never shown to other people.',
    },
    {
      icon: Users,
      title: 'Others start their own journey',
      text: 'When someone opens it, they begin a new journey on the same topic. They can’t see or change yours.',
    },
    {
      icon: Undo2,
      title: 'You stay in control',
      text: 'You can make it private again whenever you like from this screen.',
    },
  ];

  const sizeText = [
    zoneCount > 0 ? `${zoneCount} ${zoneCount === 1 ? 'zone' : 'zones'}` : '',
    lessonCount > 0
      ? `${lessonCount} ${lessonCount === 1 ? 'lesson' : 'lessons'}`
      : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <section aria-label="Publish journey" className="max-w-[720px] pt-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-lg py-1 text-sm font-bold text-[#91A4AC] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to journey
      </button>

      <p className="mt-6 flex items-center gap-1.5 text-xs font-extrabold text-orange">
        <Globe className="h-3.5 w-3.5" aria-hidden="true" />
        Publish to Explore
      </p>

      <h1 className="mt-2 break-words font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">
        {title}
      </h1>

      <p className="mt-3 text-sm leading-6 text-[#A9BAC0] sm:text-base sm:leading-7">
        {description.trim() || `A journey about ${topic || title}.`}
      </p>

      <div className="mt-8 rounded-2xl border border-[#2D4149] bg-[#1A2A31] p-5 sm:p-6">
        <h2 className="font-display text-xl font-extrabold text-white">
          What does a public journey mean?
        </h2>

        <ul className="mt-4 space-y-4">
          {details.map(({ icon: Icon, title: detailTitle, text }) => (
            <li key={detailTitle} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange/10 text-orange">
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>

              <div className="min-w-0">
                <p className="text-sm font-extrabold text-white">
                  {detailTitle}
                </p>
                <p className="mt-0.5 text-sm leading-6 text-[#91A4AC]">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 rounded-2xl border border-[#2D4149] bg-[#1A2A31] p-5 sm:p-6">
        <h2 className="font-display text-xl font-extrabold text-white">
          {existing && !justPublished
            ? 'This journey is public'
            : justPublished
              ? 'Your journey is public'
              : 'Make this journey public?'}
        </h2>

        {existing ? (
          <>
            <p className="mt-2 text-sm leading-6 text-[#91A4AC]">
              {justPublished
                ? 'Thanks for sharing. It now shows up in Explore for other learners.'
                : 'Other learners can find it in Explore.'}
              {existing.category ? ` Category: ${existing.category}.` : ''}
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/explore"
                className={`${primaryButtonClasses} sm:w-auto`}
              >
                View in Explore
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <button
                type="button"
                onClick={handleUnpublish}
                disabled={busy !== null}
                className={`${secondaryButtonClasses} disabled:pointer-events-none disabled:opacity-50`}
              >
                {busy === 'unpublish' && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                Make private
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm leading-6 text-[#91A4AC]">
              Pick a category so people can find it (optional). It will appear
              in Explore as{' '}
              <span className="font-bold text-white">{title}</span>
              {sizeText ? ` · ${sizeText}` : ''}.
            </p>

            <div
              role="group"
              aria-label="Category"
              className="mt-4 flex flex-wrap gap-2"
            >
              {PUBLIC_CATEGORIES.map((item) => {
                const selected = category === item;

                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setCategory(selected ? null : item)}
                    className={`min-h-9 rounded-full border px-3.5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange ${
                      selected
                        ? 'border-orange bg-orange/10 text-orange'
                        : 'border-[#37464F] text-[#C8D3DA] hover:border-[#536871] hover:text-white'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            {checkFailed && (
              <div
                role="alert"
                className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-3 py-2.5 text-xs font-medium text-red-200"
              >
                We couldn’t check whether this journey is already public.
                <button
                  type="button"
                  onClick={() => setCheckKey((value) => value + 1)}
                  className="font-bold text-white underline"
                >
                  Try again
                </button>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handlePublish}
                disabled={busy !== null || checking || checkFailed}
                className={`${primaryButtonClasses} disabled:pointer-events-none disabled:opacity-50`}
              >
                {busy === 'publish' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Publishing...
                  </>
                ) : (
                  <>
                    Yes, make it public
                    <Globe className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onBack}
                disabled={busy !== null}
                className={`${secondaryButtonClasses} disabled:pointer-events-none disabled:opacity-50`}
              >
                Not now
              </button>
            </div>
          </>
        )}

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-3 py-2.5 text-xs font-medium text-red-200"
          >
            {error}
          </div>
        )}
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
      <div className="pb-3 pt-5">
        <div className="h-[128px] rounded-2xl bg-[#26373E]" />
      </div>

      <div>
        <div className="h-[64px] rounded-xl bg-[#26373E]" />

        <div className="mx-auto mt-6 max-w-[440px] space-y-6 px-1">
          {[0, 26, 50, 26].map((offset, index) => (
            <div
              key={index}
              style={{ marginLeft: offset }}
              className="flex items-center gap-3"
            >
              <div className="h-14 w-14 shrink-0 rounded-full bg-[#26373E]" />
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

  const location = useLocation();

  const [journey, setJourney] = useState<JourneyData>(EMPTY_JOURNEY);
  const [view, setView] = useState<JourneyView>('path');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Prevent stale requests from replacing the latest result.
  const requestVersion = useRef(0);

  const loadJourney = useCallback(async () => {
    const requestId = ++requestVersion.current;

    if (!courseId?.trim()) {
      setJourney(EMPTY_JOURNEY);
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

      setJourney({
        title: course.title,
        description: course.description ?? '',
        topic: course.topic ?? course.title,
        heroImageUrl: course.heroImageUrl ?? '',
        zones: mappedZones,
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

  // Keep the title in sync when the journey is renamed from the menu.
  useEffect(() => {
    const handleChange = (event: Event) => {
      const change = (event as CustomEvent<JourneyChange>).detail;

      if (!change) return;

      if (change.id !== courseId || change.action !== 'rename') return;

      setJourney((current) => ({ ...current, title: change.title }));
    };

    window.addEventListener(JOURNEY_CHANGED_EVENT, handleChange);

    return () =>
      window.removeEventListener(JOURNEY_CHANGED_EVENT, handleChange);
  }, [courseId]);

  // Switching journeys always starts on the path.
  useEffect(() => {
    setView('path');
  }, [courseId]);

  // The sidebar menu's "Publish to Explore" navigates here with this flag.
  useEffect(() => {
    const routeState = location.state as
      | { openPublish?: boolean; [key: string]: unknown }
      | null;

    if (!routeState?.openPublish) return;

    setView('publish');

    const nextState = { ...routeState };
    delete nextState.openPublish;

    navigate(
      { pathname: location.pathname, search: location.search },
      { replace: true, state: nextState },
    );
  }, [location.pathname, location.search, location.state, navigate]);

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

  // The journey card is pinned to the top and its height varies (long titles
  // wrap), so publish its measured height as a CSS variable. JourneyPath uses
  // it to pin each zone banner directly beneath the card.
  const columnRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const column = columnRef.current;
    const bar = barRef.current;

    if (!column || !bar) return;

    const update = () => {
      column.style.setProperty('--journey-card-h', `${bar.offsetHeight}px`);
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(bar);

    return () => observer.disconnect();
  }, [loading, loadError, courseId, view]);

  return (
    <div className={containerClasses}>
      {loading ? (
        <JourneySkeleton />
      ) : loadError ? (
        <JourneyError onRetry={retry} />
      ) : (
        <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-10">
          <div ref={columnRef} className="min-w-0">
            {view === 'publish' && courseId ? (
              <PublishPanel
                courseId={courseId}
                title={journey.title}
                description={journey.description}
                topic={journey.topic}
                heroImageUrl={journey.heroImageUrl}
                zoneCount={journey.zones.length}
                lessonCount={stats.total}
                onBack={() => setView('path')}
              />
            ) : (
              <>
            {/* Journey card: pinned to the top. The current zone banner
                (JourneyPath) pins directly beneath it. */}
            {courseId && (
              <div
                ref={barRef}
                className="sticky top-16 z-30 bg-[#131F24] pb-3 pt-5 lg:top-0"
              >
                <JourneyCard
                  courseId={courseId}
                  title={journey.title}
                  stats={stats}
                  zoneCount={journey.zones.length}
                  onContinue={continueJourney}
                  onPublish={() => setView('publish')}
                />
              </div>
            )}

            {/* Learning path */}
            <section aria-label="Your learning path" className="pt-1">
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
              <section className="mx-auto mt-4 max-w-[440px] rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-5 sm:p-6">
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
              </>
            )}
          </div>

          {/* Gamification rail (desktop) */}
          <aside className="hidden xl:block" aria-label="Your progress">
            <StickyRail>
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
            </StickyRail>
          </aside>
        </div>
      )}
    </div>
  );
}