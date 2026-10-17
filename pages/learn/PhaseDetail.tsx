import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Lock,
  RefreshCw,
} from 'lucide-react';

import LessonNode, {
  type LessonNodeData,
  type LessonNodeStatus,
} from './components/LessonNode';
import LessonGenerateModal, {
  type LessonMeta,
} from './components/LessonGenerateModal';

import grokitMascot from '../../assets/grokit-hero-mascot.png';

import {
  generateLessonContent,
  getCourse,
  getLessonPreview,
  getPhase,
  listLessonsForPhase,
  listProgressForCourse,
  type LessonPreview,
} from '../../lib/courseGeneration';

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const containerClasses =
  'min-h-[100dvh] w-full max-w-[860px] mx-auto px-5 sm:px-8 py-8 sm:py-10';

const backClasses =
  'inline-flex items-center gap-2 text-[#91A4AC] hover:text-white text-sm font-semibold transition-colors mb-8';

const headerClasses = 'mb-10';

const eyebrowClasses =
  'text-orange text-xs sm:text-sm font-bold uppercase tracking-[0.16em]';

const titleClasses =
  'mt-2 font-display font-bold text-white text-2xl sm:text-3xl';

const subtitleClasses =
  'mt-2 text-[#91A4AC] text-sm sm:text-base leading-6';

const progressRowClasses =
  'mt-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5';

const progressTrackClasses =
  'h-2 flex-1 rounded-full bg-[#202F35] overflow-hidden';

const progressMetaClasses =
  'shrink-0 text-sm font-semibold text-[#91A4AC]';

const sectionClasses =
  'rounded-[28px] border border-[#37464F] bg-[#1A292F] p-5 sm:p-7';

const sectionHeaderClasses =
  'flex items-center justify-between gap-4 mb-7';

const sectionTitleClasses =
  'font-display font-bold text-white text-lg sm:text-xl';

const pathClasses = 'relative';

const pathLineClasses =
  'absolute left-[31px] sm:left-[35px] top-8 bottom-8 w-px bg-[#37464F]';

const lessonsClasses = 'relative flex flex-col gap-2';

const completionClasses =
  'mt-8 flex items-center gap-3 rounded-2xl border border-orange/20 bg-orange/5 px-4 py-4';

const completionIconClasses =
  'w-9 h-9 rounded-full bg-orange flex items-center justify-center shrink-0';

const stateClasses =
  'text-[#91A4AC] text-sm text-center py-20';

const actionErrorClasses =
  'mt-5 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm leading-6 text-red-200';

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export default function PhaseDetail() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { courseId, phaseId } = useParams<{
    courseId: string;
    phaseId: string;
  }>();

  const [courseTitle, setCourseTitle] = useState('');
  const [phaseTitle, setPhaseTitle] = useState('');

  const [lessons, setLessons] = useState<LessonNodeData[]>([]);
  const [lessonHooks, setLessonHooks] = useState<Record<string, string>>({});
  const [lessonHasContent, setLessonHasContent] =
    useState<Record<string, boolean>>({});

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [phaseLocked, setPhaseLocked] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  // Lessons being generated right now. Re-opening a lesson that is still being
  // written joins the same request instead of starting (and paying for) another.
  const generationsInFlight = useRef(
    new Map<string, Promise<LessonPreview | null>>(),
  );

  const loadPhase = useCallback(async () => {
    if (!courseId || !phaseId) {
      setError('This learning path could not be opened. Please return to your Journey.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError('');
    setActionError('');
    setActiveLessonId(null);

    try {
      const [course, phase, lessonRecords, progress] = await Promise.all([
        getCourse(courseId),
        getPhase(phaseId),
        listLessonsForPhase(phaseId),
        listProgressForCourse(courseId),
      ]);

      if (cancelled) return;

      if (!course || !phase || phase.courseId !== courseId) {
        setError('This zone could not be found in your learning path.');
        setLessons([]);
        return;
      }

      const isLocked = Boolean(phase.locked);
      setPhaseLocked(isLocked);
      setCourseTitle(course.title ?? 'Your learning journey');
      setPhaseTitle(phase.title ?? 'Your next zone');

      if (isLocked) {
        setLessons([]);
        setLessonHooks({});
        setLessonHasContent({});
        return;
      }

      // Sort defensively so unlocking follows the intended lesson order.
      const orderedLessons = [...lessonRecords].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
      );

      const completedIds = new Set(
        progress.map((item) => item.lessonId),
      );

      let nextLessonAssigned = false;

      const mappedLessons: LessonNodeData[] = orderedLessons.map((lesson) => {
        let status: LessonNodeStatus;

        if (completedIds.has(lesson.id)) {
          status = 'completed';
        } else if (!nextLessonAssigned) {
          status = 'unlocked';
          nextLessonAssigned = true;
        } else {
          status = 'locked';
        }

        return {
          id: lesson.id,
          title: lesson.title,
          status,
          mascotUrl: status === 'unlocked' ? grokitMascot : undefined,
        };
      });

      const hooks: Record<string, string> = {};
      const hasContent: Record<string, boolean> = {};

      orderedLessons.forEach((lesson) => {
        hooks[lesson.id] = lesson.hook ?? '';
        hasContent[lesson.id] = lesson.status === 'READY';
      });

      setLessons(mappedLessons);
      setLessonHooks(hooks);
      setLessonHasContent(hasContent);
    } catch (err) {
      console.error('Failed to load learning zone', err);

      if (!cancelled) {
        setError(
          'We couldn’t load this zone. Check your connection and try again.',
        );
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [courseId, phaseId]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!courseId || !phaseId) {
        setError(
          'This learning path could not be opened. Please return to your Journey.',
        );
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      setActionError('');
      setActiveLessonId(null);

      try {
        const [course, phase, lessonRecords, progress] = await Promise.all([
          getCourse(courseId),
          getPhase(phaseId),
          listLessonsForPhase(phaseId),
          listProgressForCourse(courseId),
        ]);

        if (cancelled) return;

        if (!course || !phase || phase.courseId !== courseId) {
          setError('This zone could not be found in your learning path.');
          setLessons([]);
          return;
        }

        const isLocked = Boolean(phase.locked);

        setPhaseLocked(isLocked);
        setCourseTitle(course.title ?? 'Your learning journey');
        setPhaseTitle(phase.title ?? 'Your next zone');

        if (isLocked) {
          setLessons([]);
          setLessonHooks({});
          setLessonHasContent({});
          return;
        }

        const orderedLessons = [...lessonRecords].sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0),
        );

        const completedIds = new Set(
          progress.map((item) => item.lessonId),
        );

        let nextLessonAssigned = false;

        const mappedLessons: LessonNodeData[] = orderedLessons.map((lesson) => {
          let status: LessonNodeStatus;

          if (completedIds.has(lesson.id)) {
            status = 'completed';
          } else if (!nextLessonAssigned) {
            status = 'unlocked';
            nextLessonAssigned = true;
          } else {
            status = 'locked';
          }

          return {
            id: lesson.id,
            title: lesson.title,
            status,
            mascotUrl: status === 'unlocked' ? grokitMascot : undefined,
          };
        });

        const hooks: Record<string, string> = {};
        const hasContent: Record<string, boolean> = {};

        orderedLessons.forEach((lesson) => {
          hooks[lesson.id] = lesson.hook ?? '';
          hasContent[lesson.id] = lesson.status === 'READY';
        });

        setLessons(mappedLessons);
        setLessonHooks(hooks);
        setLessonHasContent(hasContent);
      } catch (err) {
        console.error('Failed to load learning zone', err);

        if (!cancelled) {
          setError(
            'We couldn’t load this zone. Check your connection and try again.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [courseId, phaseId]);

  const stats = useMemo(() => {
    const completed = lessons.filter(
      (lesson) => lesson.status === 'completed',
    ).length;

    const total = lessons.length;

    return {
      completed,
      total,
      complete: total > 0 && completed === total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [lessons]);

  // Opened from a node on the journey (?lesson=<id>): show that lesson's
  // start sheet once the zone has loaded, then clean the URL.
  const requestedLessonId = searchParams.get('lesson');

  useEffect(() => {
    if (loading || !requestedLessonId) return;

    const requested = lessons.find(
      (lesson) => lesson.id === requestedLessonId,
    );

    if (requested && requested.status !== 'locked') {
      setActiveLessonId(requested.id);
    }

    setSearchParams({}, { replace: true });
  }, [loading, lessons, requestedLessonId, setSearchParams]);

  const activeLesson = lessons.find(
    (lesson) => lesson.id === activeLessonId,
  );

  const activeLessonIndex = lessons.findIndex(
    (lesson) => lesson.id === activeLessonId,
  );

  const activeLessonMeta: LessonMeta | null = activeLesson
    ? {
        id: activeLesson.id,
        title: activeLesson.title,
        hook: lessonHooks[activeLesson.id] ?? '',
        hasContent: lessonHasContent[activeLesson.id] ?? false,
        completed: activeLesson.status === 'completed',
        zoneTitle: phaseTitle,
        lessonNumber: activeLessonIndex + 1,
        lessonCount: lessons.length,
      }
    : null;

  /**
   * Makes sure the lesson exists (generating it if needed) and resolves with
   * a summary for the popup. The popup shows its own error and retry, so this
   * only rethrows. Resolves as soon as the cards are ready; the practice
   * questions are written in the background while the learner reads.
   */
  const handleGenerate = (lessonId: string): Promise<LessonPreview | null> => {
    const running = generationsInFlight.current.get(lessonId);

    if (running) return running;

    const request = generateLessonContent(lessonId)
      .then((lesson) => {
        setLessonHasContent((previous) => ({
          ...previous,
          [lessonId]: true,
        }));

        return getLessonPreview(lesson);
      })
      .catch((err) => {
        console.error('Failed to generate lesson content', err);
        throw err;
      })
      .finally(() => {
        generationsInFlight.current.delete(lessonId);
      });

    generationsInFlight.current.set(lessonId, request);

    return request;
  };

  const handleStart = (lessonId: string) => {
    if (!courseId || !lessonId) return;

    navigate(`/learn/course/${courseId}/lesson/${lessonId}`);
  };

  return (
    <>
      <div className={containerClasses}>
        {loading ? (
          <p className={stateClasses} role="status">
            Loading your zone…
          </p>
        ) : error ? (
          <div className="mx-auto max-w-lg py-16 text-center">
            <p className="text-base font-semibold text-white">{error}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#37464F] px-4 text-sm font-semibold text-white transition hover:bg-[#202F35]"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>

            {courseId && (
              <div>
                <Link
                  to={`/learn/course/${courseId}`}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-orange hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Journey
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link
              to={`/learn/course/${courseId}`}
              className={backClasses}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Journey
            </Link>

            <header className={headerClasses}>
              <p className={eyebrowClasses}>{courseTitle}</p>

              <h1 className={titleClasses}>{phaseTitle}</h1>

              <p className={subtitleClasses}>
                Work through the lessons in order. Complete one to unlock the
                next.
              </p>

              {!phaseLocked && (
                <div className={progressRowClasses}>
                  <div
                    className={progressTrackClasses}
                    role="progressbar"
                    aria-label="Zone completion"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={stats.percentage}
                  >
                    <div
                      className="h-full rounded-full bg-orange transition-all duration-500"
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>

                  <p className={progressMetaClasses}>
                    {stats.completed}/{stats.total} completed
                  </p>
                </div>
              )}
            </header>

            {phaseLocked ? (
              <section className={sectionClasses}>
                <div className="mx-auto max-w-md py-10 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#37464F] bg-[#202F35]">
                    <Lock className="h-6 w-6 text-[#91A4AC]" />
                  </div>

                  <h2 className="mt-5 text-xl font-bold text-white">
                    This zone is still locked
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#91A4AC]">
                    Finish the earlier zones in your Journey to unlock this
                    one.
                  </p>

                  <Link
                    to={`/learn/course/${courseId}`}
                    className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange px-5 font-bold text-white transition hover:brightness-105"
                  >
                    Return to Journey
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </section>
            ) : (
              <section className={sectionClasses}>
                <div className={sectionHeaderClasses}>
                  <div>
                    <h2 className={sectionTitleClasses}>Lessons</h2>
                    <p className="mt-1 text-sm text-[#60757E]">
                      Keep moving forward.
                    </p>
                  </div>

                  {stats.complete && (
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange">
                      <Check className="h-4 w-4" />
                      Zone complete
                    </span>
                  )}
                </div>

                {actionError && (
                  <p className={actionErrorClasses} role="alert">
                    {actionError}
                  </p>
                )}

                {lessons.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-sm text-[#91A4AC]">
                      No lessons are available in this zone yet.
                    </p>
                  </div>
                ) : (
                  <div className={pathClasses}>
                    <div className={pathLineClasses} />

                    <div className={lessonsClasses}>
                      {lessons.map((lesson) => (
                        <LessonNode
                          key={lesson.id}
                          lesson={lesson}
                          onSelect={setActiveLessonId}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {stats.complete && (
                  <div className={completionClasses}>
                    <div className={completionIconClasses}>
                      <Check
                        className="h-4 w-4 text-white"
                        strokeWidth={2.5}
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">
                        You completed this zone.
                      </p>

                      <p className="mt-0.5 text-sm text-[#91A4AC]">
                        Continue back on your Journey.
                      </p>
                    </div>

                    <Link
                      to={`/learn/course/${courseId}`}
                      className="ml-auto shrink-0 text-orange transition-colors hover:text-white"
                      aria-label="Back to Journey"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>

      {activeLessonMeta && (
        <LessonGenerateModal
          lesson={activeLessonMeta}
          onClose={() => setActiveLessonId(null)}
          onStart={handleStart}
          onGenerate={handleGenerate}
        />
      )}
    </>
  );
}