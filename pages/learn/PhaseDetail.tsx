import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { BookOpen, Headphones, Zap, Bookmark, Share2, Settings } from 'lucide-react';
import AppShell from './AppShell';
import LessonNode, { type LessonNodeData, type LessonNodeStatus } from './components/LessonNode';
import LessonGenerateModal, { type LessonMeta } from './components/LessonGenerateModal';
import grokitMascot from '../../assets/grokit-hero-mascot.png';
import {
  getCourse,
  listLessonsForPhase,
  listProgressForCourse,
  generateLessonContent,
} from '../../lib/courseGeneration';

// ─── Shared styles (unchanged) ─────────────────────────────────────────────

const containerClasses = 'min-h-[100dvh] w-full max-w-[900px] mx-auto px-5 sm:px-6 py-8 sm:py-10';
const topBarClasses = 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6 rounded-3xl border border-[#37464F] bg-[#202F35] mb-6';
const titleClasses = 'font-display font-bold text-white text-lg sm:text-xl';
const actionsRowClasses = 'flex items-center gap-1 mt-1 flex-wrap';
const actionButtonClasses = 'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[#91A4AC] hover:text-white hover:bg-[#131F24] font-sans text-sm font-semibold transition-colors';
const utilRowClasses = 'flex items-center gap-4 shrink-0';
const utilButtonClasses = 'flex items-center gap-1.5 text-[#91A4AC] hover:text-white font-sans text-sm font-semibold transition-colors';
const phaseHeaderClasses = 'flex items-center justify-between px-5 sm:px-6 py-5 rounded-2xl border border-[#37464F] bg-[#202F35] mb-8';
const phaseTitleClasses = 'font-display font-bold text-white text-[17px] sm:text-lg';
const phaseSubClasses = 'text-[#91A4AC] font-sans text-sm mt-0.5';
const pathWrapClasses = 'flex flex-col items-start pl-4';
const stateClasses = 'text-[#91A4AC] font-sans text-sm text-center py-16';

// ─── Component ────────────────────────────────────────────────────────────────

export default function PhaseDetail() {
  const navigate = useNavigate();
  const { courseId, phaseId } = useParams<{ courseId: string; phaseId: string }>();

  const [courseTitle, setCourseTitle] = useState('');
  const [lessons, setLessons] = useState<LessonNodeData[]>([]);
  const [lessonHooks, setLessonHooks] = useState<Record<string, string>>({});
  const [lessonHasContent, setLessonHasContent] = useState<Record<string, boolean>>({});
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!courseId || !phaseId) return;
    let cancelled = false;

    (async () => {
      try {
        const [course, lessonRecords, progress] = await Promise.all([
          getCourse(courseId),
          listLessonsForPhase(phaseId),
          listProgressForCourse(courseId),
        ]);

        if (cancelled) return;

        const completedIds = new Set(progress.map((p) => p.lessonId));

        // First lesson not yet completed is "unlocked"; everything before it is "completed";
        // everything after it is "locked".
        let unlockedAssigned = false;
        const mapped: LessonNodeData[] = lessonRecords.map((lesson) => {
          let status: LessonNodeStatus;
          if (completedIds.has(lesson.id)) {
            status = 'completed';
          } else if (!unlockedAssigned) {
            status = 'unlocked';
            unlockedAssigned = true;
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
        lessonRecords.forEach((lesson) => {
          hooks[lesson.id] = lesson.hook ?? '';
          hasContent[lesson.id] = lesson.status === 'READY';
        });

        setCourseTitle(course?.title ?? '');
        setLessons(mapped);
        setLessonHooks(hooks);
        setLessonHasContent(hasContent);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load phase');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [courseId, phaseId]);

  const activeLesson = lessons.find((l) => l.id === activeLessonId);
  const activeLessonMeta: LessonMeta | null = activeLesson
    ? {
        id: activeLesson.id,
        title: activeLesson.title,
        hook: lessonHooks[activeLesson.id] ?? '',
        hasContent: lessonHasContent[activeLesson.id] ?? false,
      }
    : null;

  const handleGenerate = async (lessonId: string) => {
    await generateLessonContent(lessonId);
    setLessonHasContent((prev) => ({ ...prev, [lessonId]: true }));
  };

  const handleStart = (lessonId: string) => {
    navigate(`/learn/course/${courseId}/lesson/${lessonId}`);
  };

  return (
    <AppShell>
      <div className={containerClasses}>
        {loading ? (
          <p className={stateClasses}>Loading lessons...</p>
        ) : error ? (
          <p className={stateClasses}>{error}</p>
        ) : (
          <>
            <div className={topBarClasses}>
              <div>
                <p className={titleClasses}>{courseTitle}</p>
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

              <div className={utilRowClasses}>
                <button type="button" className={utilButtonClasses}>
                  <Share2 className="w-4 h-4" /> Share
                </button>
                <button type="button" className={utilButtonClasses}>
                  <Settings className="w-4 h-4" /> Settings
                </button>
              </div>
            </div>

            <div className={phaseHeaderClasses}>
              <div>
                <p className={phaseTitleClasses}>Phase</p>
                <p className={phaseSubClasses}>
                  {lessons.filter((l) => l.status === 'completed').length}/{lessons.length} lessons
                </p>
              </div>
            </div>

            <div className={pathWrapClasses}>
              {lessons.map((lesson) => (
                <LessonNode key={lesson.id} lesson={lesson} onSelect={setActiveLessonId} />
              ))}
            </div>
          </>
        )}
      </div>

      {activeLessonMeta && (
        <LessonGenerateModal
          lesson={activeLessonMeta}
          onClose={() => setActiveLessonId(null)}
          onStart={handleStart}
          onGenerate={handleGenerate}
          onPodcast={(id) => console.log('podcast', id)}
          onLiveChallenge={(id) => console.log('live challenge', id)}
        />
      )}
    </AppShell>
  );
}