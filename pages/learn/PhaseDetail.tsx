import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  Check,
} from 'lucide-react';

import AppShell from './AppShell';
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
  listLessonsForPhase,
  listProgressForCourse,
} from '../../lib/courseGeneration';

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const containerClasses =
  'min-h-[100dvh] w-full max-w-[860px] mx-auto px-5 sm:px-8 py-8 sm:py-10';

const backClasses =
  'inline-flex items-center gap-2 text-[#91A4AC] hover:text-white text-sm font-semibold transition-colors mb-8';

const headerClasses =
  'mb-10';

const eyebrowClasses =
  'text-orange text-xs sm:text-sm font-bold uppercase tracking-[0.16em]';

const titleClasses =
  'mt-2 font-display font-bold text-white text-2xl sm:text-3xl';

const subtitleClasses =
  'mt-2 text-[#91A4AC] text-sm sm:text-base';

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

const pathClasses =
  'relative';

const pathLineClasses =
  'absolute left-[31px] sm:left-[35px] top-8 bottom-8 w-px bg-[#37464F]';

const lessonsClasses =
  'relative flex flex-col gap-2';

const completionClasses =
  'mt-8 flex items-center gap-3 rounded-2xl border border-orange/20 bg-orange/5 px-4 py-4';

const completionIconClasses =
  'w-9 h-9 rounded-full bg-orange flex items-center justify-center shrink-0';

const stateClasses =
  'text-[#91A4AC] text-sm text-center py-20';

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export default function PhaseDetail() {
  const navigate = useNavigate();

  const {
    courseId,
    phaseId,
  } = useParams<{
    courseId: string;
    phaseId: string;
  }>();

  const [courseTitle, setCourseTitle] = useState('');
  const [lessons, setLessons] = useState<LessonNodeData[]>([]);
  const [lessonHooks, setLessonHooks] =
    useState<Record<string, string>>({});
  const [lessonHasContent, setLessonHasContent] =
    useState<Record<string, boolean>>({});
  const [activeLessonId, setActiveLessonId] =
    useState<string | null>(null);

  const [phaseTitle, setPhaseTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!courseId || !phaseId) return;

    let cancelled = false;

    (async () => {
      try {
        const [
          course,
          lessonRecords,
          progress,
        ] = await Promise.all([
          getCourse(courseId),
          listLessonsForPhase(phaseId),
          listProgressForCourse(courseId),
        ]);

        if (cancelled) return;

        const completedIds = new Set(
          progress.map((item) => item.lessonId),
        );

        let currentAssigned = false;

        const mapped: LessonNodeData[] =
          lessonRecords.map((lesson) => {
            let status: LessonNodeStatus;

            if (completedIds.has(lesson.id)) {
              status = 'completed';
            } else if (!currentAssigned) {
              status = 'unlocked';
              currentAssigned = true;
            } else {
              status = 'locked';
            }

            return {
              id: lesson.id,
              title: lesson.title,
              status,
              mascotUrl:
                status === 'unlocked'
                  ? grokitMascot
                  : undefined,
            };
          });

        const hooks: Record<string, string> = {};
        const hasContent: Record<string, boolean> = {};

        lessonRecords.forEach((lesson) => {
          hooks[lesson.id] = lesson.hook ?? '';
          hasContent[lesson.id] =
            lesson.status === 'READY';
        });

        setCourseTitle(course?.title ?? '');
        setPhaseTitle(
          phaseRecordsTitle(lessonRecords, phaseId),
        );
        setLessons(mapped);
        setLessonHooks(hooks);
        setLessonHasContent(hasContent);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load phase',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

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
      percentage:
        total > 0
          ? Math.round((completed / total) * 100)
          : 0,
    };
  }, [lessons]);

  const activeLesson = lessons.find(
    (lesson) => lesson.id === activeLessonId,
  );

  const activeLessonMeta: LessonMeta | null =
    activeLesson
      ? {
          id: activeLesson.id,
          title: activeLesson.title,
          hook:
            lessonHooks[activeLesson.id] ?? '',
          hasContent:
            lessonHasContent[activeLesson.id] ?? false,
        }
      : null;

  const handleGenerate = async (
    lessonId: string,
  ) => {
    await generateLessonContent(lessonId);

    setLessonHasContent((previous) => ({
      ...previous,
      [lessonId]: true,
    }));
  };

  const handleStart = (lessonId: string) => {
    navigate(
      `/learn/course/${courseId}/lesson/${lessonId}`,
    );
  };

  return (
    <AppShell>
      <div className={containerClasses}>
        {loading ? (
          <p className={stateClasses}>
            Loading your zone...
          </p>
        ) : error ? (
          <p className={stateClasses}>{error}</p>
        ) : (
          <>
            <Link
              to={`/learn/course/${courseId}`}
              className={backClasses}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dive Path
            </Link>

            <header className={headerClasses}>
              <p className={eyebrowClasses}>
                {courseTitle}
              </p>

              <h1 className={titleClasses}>
                {phaseTitle || 'Your next zone'}
              </h1>

              <p className={subtitleClasses}>
                Work through the lessons in order.
                Complete one to unlock the next.
              </p>

              <div className={progressRowClasses}>
                <div className={progressTrackClasses}>
                  <div
                    className="h-full rounded-full bg-orange transition-all duration-500"
                    style={{
                      width: `${stats.percentage}%`,
                    }}
                  />
                </div>

                <p className={progressMetaClasses}>
                  {stats.completed}/{stats.total}
                  {' '}
                  completed
                </p>
              </div>
            </header>

            <section className={sectionClasses}>
              <div className={sectionHeaderClasses}>
                <div>
                  <h2 className={sectionTitleClasses}>
                    Lessons
                  </h2>

                  <p className="text-[#60757E] text-sm mt-1">
                    Keep moving forward.
                  </p>
                </div>

                {stats.complete && (
                  <span className="inline-flex items-center gap-1.5 text-orange text-sm font-semibold">
                    <Check className="w-4 h-4" />
                    Zone complete
                  </span>
                )}
              </div>

              {lessons.length === 0 ? (
                <p className="text-[#91A4AC] text-sm text-center py-12">
                  No lessons are available in this zone yet.
                </p>
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
                      className="w-4 h-4 text-white"
                      strokeWidth={2.5}
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm">
                      You completed this zone.
                    </p>

                    <p className="text-[#91A4AC] text-sm mt-0.5">
                      Continue back on your Dive Path.
                    </p>
                  </div>

                  <Link
                    to={`/learn/course/${courseId}`}
                    className="ml-auto shrink-0 text-orange hover:text-white transition-colors"
                    aria-label="Back to Dive Path"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {activeLessonMeta && (
        <LessonGenerateModal
          lesson={activeLessonMeta}
          onClose={() => setActiveLessonId(null)}
          onStart={handleStart}
          onGenerate={handleGenerate}
          onPodcast={(id) =>
            console.log('podcast', id)
          }
          onLiveChallenge={(id) =>
            console.log('live challenge', id)
          }
        />
      )}
    </AppShell>
  );
}

/**
 * The current PhaseDetail API only receives lessons from the
 * phase-specific query. We intentionally keep phase naming
 * isolated here until the phase record itself is loaded by this
 * page.
 *
 * The current backend helper does not expose a phase getter,
 * so use a neutral title rather than inventing one.
 */
function phaseRecordsTitle(
  _lessons: unknown[],
  _phaseId: string,
) {
  return '';
}