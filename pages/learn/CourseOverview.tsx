import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { BookOpen, Headphones, Zap, Bookmark, Share2, Settings } from 'lucide-react';
import AppShell from './AppShell';
import PhaseCard, { type Phase } from './components/PhaseCard';
import { getCourse, listPhasesForCourse, listLessonsForCourse, listProgressForCourse } from '../../lib/courseGeneration';

// ─── Shared styles (unchanged) ─────────────────────────────────────────────

const containerClasses = 'min-h-[100dvh] w-full max-w-[900px] mx-auto px-5 sm:px-6 py-8 sm:py-10';
const topBarClasses = 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6 rounded-3xl border border-[#37464F] bg-[#202F35] mb-6';
const titleRowClasses = 'flex items-center gap-4';
const thumbClasses = 'w-12 h-12 rounded-xl object-cover shrink-0';
const titleColClasses = 'min-w-0';
const titleClasses = 'font-display font-bold text-white text-lg sm:text-xl';
const actionsRowClasses = 'flex items-center gap-1 mt-1 flex-wrap';
const actionButtonClasses = 'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[#91A4AC] hover:text-white hover:bg-[#131F24] font-sans text-sm font-semibold transition-colors';
const utilRowClasses = 'flex items-center gap-4 shrink-0';
const utilButtonClasses = 'flex items-center gap-1.5 text-[#91A4AC] hover:text-white font-sans text-sm font-semibold transition-colors';
const phaseListClasses = 'flex flex-col gap-3';
const stateClasses = 'text-[#91A4AC] font-sans text-sm text-center py-16';

// ─── Component ────────────────────────────────────────────────────────────────

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
        const [course, phaseRecords, lessons, progress] = await Promise.all([
          getCourse(courseId),
          listPhasesForCourse(courseId),
          listLessonsForCourse(courseId),
          listProgressForCourse(courseId),
        ]);

        if (cancelled) return;
        if (!course) throw new Error('Course not found');

        const completedLessonIds = new Set(progress.map((p) => p.lessonId));

        const mapped: Phase[] = phaseRecords.map((phase) => {
          const phaseLessons = lessons.filter((l) => l.phaseId === phase.id);
          const completed = phaseLessons.filter((l) => completedLessonIds.has(l.id)).length;
          return {
            id: phase.id,
            order: phase.order,
            title: phase.title,
            completedLessons: completed,
            totalLessons: phaseLessons.length,
            locked: phase.locked ?? false,
          };
        });

        setTitle(course.title);
        setPhases(mapped);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load course');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  return (
    <AppShell>
      <div className={containerClasses}>
        {loading ? (
          <p className={stateClasses}>Loading course...</p>
        ) : error ? (
          <p className={stateClasses}>{error}</p>
        ) : (
          <>
            <div className={topBarClasses}>
              <div className={titleRowClasses}>
                <div className={`${thumbClasses} bg-gradient-to-br from-teal-700 to-emerald-800`} />
                <div className={titleColClasses}>
                  <p className={titleClasses}>{title}</p>
                  <div className={actionsRowClasses}>
                    <button type="button" className={actionButtonClasses}>
                      <BookOpen className="w-4 h-4" /> Learning Map
                    </button>
                    <button type="button" className={actionButtonClasses}>
                      <Headphones className="w-4 h-4" /> Podcast
                    </button>
                    <button type="button" className={actionButtonClasses}>
                      <Zap className="w-4 h-4" /> Quick Exercise
                    </button>
                    <button type="button" className={actionButtonClasses}>
                      <Bookmark className="w-4 h-4" /> View Saved
                    </button>
                  </div>
                </div>
              </div>

              <div className={utilRowClasses}>
                <button type="button" className={utilButtonClasses}>
                  <Share2 className="w-4 h-4" /> Share
                </button>
                <button type="button" className={utilButtonClasses}>
                  <Settings className="w-4 h-4" /> Settings
                </button>
              </div>
            </div>

            <div className={phaseListClasses}>
              {phases.map((phase) => (
                <PhaseCard key={phase.id} courseId={courseId ?? ''} phase={phase} />
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}