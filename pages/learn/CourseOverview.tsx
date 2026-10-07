import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, ArrowRight, Check, Lock } from 'lucide-react';

import AppShell from './AppShell';
import PhaseCard, { type Phase } from './components/PhaseCard';

import {
  getCourse,
  listLessonsForCourse,
  listPhasesForCourse,
  listProgressForCourse,
} from '../../lib/courseGeneration';

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const containerClasses =
  'min-h-[100dvh] w-full max-w-[980px] mx-auto px-5 sm:px-8 py-8 sm:py-10';

const backClasses =
  'inline-flex items-center gap-2 text-[#91A4AC] hover:text-white text-sm font-semibold transition-colors mb-8';

const heroClasses =
  'relative overflow-hidden rounded-[28px] border border-[#37464F] bg-[#202F35] px-6 py-7 sm:px-8 sm:py-8 mb-10';

const heroGlowClasses =
  'pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-orange/10 blur-3xl';

const eyebrowClasses =
  'text-orange text-xs sm:text-sm font-bold uppercase tracking-[0.16em]';

const titleClasses =
  'mt-2 max-w-3xl font-display font-bold text-white text-2xl sm:text-3xl lg:text-4xl leading-tight';

const subtitleClasses =
  'mt-3 max-w-2xl text-[#91A4AC] font-sans text-sm sm:text-base leading-6';

const heroBottomClasses =
  'mt-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5';

const progressInfoClasses =
  'min-w-0 flex-1 max-w-md';

const progressLabelClasses =
  'flex items-center justify-between text-sm font-semibold';

const progressTrackClasses =
  'mt-2 h-2 rounded-full bg-[#131F24] overflow-hidden';

const continueClasses =
  'inline-flex items-center justify-center gap-2 shrink-0 rounded-xl bg-orange px-5 py-3 text-sm font-bold text-white hover:brightness-110 active:scale-[0.98] transition';

const sectionHeaderClasses =
  'flex items-end justify-between gap-4 mb-5';

const sectionTitleClasses =
  'font-display font-bold text-white text-xl sm:text-2xl';

const sectionSubClasses =
  'text-[#60757E] text-sm mt-1';

const stateClasses =
  'text-[#91A4AC] font-sans text-sm text-center py-20';

const pathClasses =
  'relative';

const pathLineClasses =
  'absolute left-[27px] sm:left-[31px] top-8 bottom-8 w-px bg-[#37464F]';

const phasesClasses =
  'relative flex flex-col gap-3';

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export default function CourseOverview() {
  const { courseId } = useParams<{ courseId: string }>();

  const [title, setTitle] = useState('');
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!courseId) return;

    let cancelled = false;

    (async () => {
      try {
        const [course, phaseRecords, lessons, progress] =
          await Promise.all([
            getCourse(courseId),
            listPhasesForCourse(courseId),
            listLessonsForCourse(courseId),
            listProgressForCourse(courseId),
          ]);

        if (cancelled) return;

        if (!course) {
          throw new Error('Course not found');
        }

        const completedLessonIds = new Set(
          progress.map((item) => item.lessonId),
        );

        const mapped: Phase[] = phaseRecords.map((phase) => {
          const phaseLessons = lessons.filter(
            (lesson) => lesson.phaseId === phase.id,
          );

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
        });

        setTitle(course.title);
        setPhases(mapped);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load course',
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
  }, [courseId]);

  const stats = useMemo(() => {
    const completed = phases.reduce(
      (sum, phase) => sum + phase.completedLessons,
      0,
    );

    const total = phases.reduce(
      (sum, phase) => sum + phase.totalLessons,
      0,
    );

    const percentage =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    const currentPhase =
      phases.find(
        (phase) =>
          !phase.locked &&
          phase.completedLessons < phase.totalLessons,
      ) ??
      phases.find((phase) => !phase.locked) ??
      null;

    const isComplete = total > 0 && completed >= total;

    return {
      completed,
      total,
      percentage,
      currentPhase,
      isComplete,
    };
  }, [phases]);

  return (
    <AppShell>
      <div className={containerClasses}>
        <Link to="/learn" className={backClasses}>
          <ArrowLeft className="w-4 h-4" />
          Back to Learn
        </Link>

        {loading ? (
          <p className={stateClasses}>Loading your dive...</p>
        ) : error ? (
          <p className={stateClasses}>{error}</p>
        ) : (
          <>
            <section className={heroClasses}>
              <div className={heroGlowClasses} />

              <div className="relative">
                <p className={eyebrowClasses}>Your Dive Path</p>

                <h1 className={titleClasses}>{title}</h1>

                <p className={subtitleClasses}>
                  Move through each zone at your own pace.
                  Your progress stays with you as you learn.
                </p>

                <div className={heroBottomClasses}>
                  <div className={progressInfoClasses}>
                    <div className={progressLabelClasses}>
                      <span className="text-white">
                        {stats.isComplete
                          ? 'Dive complete'
                          : 'Your progress'}
                      </span>

                      <span className="text-[#91A4AC]">
                        {stats.completed}/{stats.total}
                      </span>
                    </div>

                    <div className={progressTrackClasses}>
                      <div
                        className="h-full rounded-full bg-orange transition-all duration-500"
                        style={{
                          width: `${stats.percentage}%`,
                        }}
                      />
                    </div>
                  </div>

                  {stats.currentPhase && courseId && (
                    <Link
                      to={`/learn/course/${courseId}/phase/${stats.currentPhase.id}`}
                      className={continueClasses}
                    >
                      {stats.completed === 0
                        ? 'Start dive'
                        : 'Continue dive'}

                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            </section>

            <section>
              <div className={sectionHeaderClasses}>
                <div>
                  <h2 className={sectionTitleClasses}>
                    Dive Path
                  </h2>

                  <p className={sectionSubClasses}>
                    {phases.length}{' '}
                    {phases.length === 1 ? 'zone' : 'zones'} to
                    explore
                  </p>
                </div>

                {stats.isComplete && (
                  <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange">
                    <Check className="w-4 h-4" />
                    Complete
                  </div>
                )}
              </div>

              {phases.length === 0 ? (
                <div className="rounded-2xl border border-[#37464F] bg-[#202F35] px-6 py-12 text-center">
                  <p className="text-white font-semibold">
                    Your path is being prepared.
                  </p>
                  <p className="mt-1 text-[#91A4AC] text-sm">
                    No learning zones are available yet.
                  </p>
                </div>
              ) : (
                <div className={pathClasses}>
                  <div className={pathLineClasses} />

                  <div className={phasesClasses}>
                    {phases.map((phase) => (
                      <PhaseCard
                        key={phase.id}
                        courseId={courseId ?? ''}
                        phase={phase}
                        current={
                          stats.currentPhase?.id === phase.id
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}