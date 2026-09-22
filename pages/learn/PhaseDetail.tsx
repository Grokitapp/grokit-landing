import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { BookOpen, Headphones, Zap, Bookmark, Share2, Settings } from 'lucide-react';
import AppShell from './AppShell';
import LessonNode, { type LessonNodeData } from './components/LessonNode';
import LessonGenerateModal, { type LessonMeta } from './components/LessonGenerateModal';
import grokitMascot from '../../assets/grokit-hero-mascot.png';

// ─── Shared styles ────────────────────────────────────────────────────────────

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

// ─── Mock data — replace with Amplify Data query by phaseId ──────────────────

const MOCK_COURSE_TITLE = 'Understanding Our Vast Universe';
const MOCK_PHASE = { order: 1, title: 'Cosmic Beginnings', completedLessons: 0, totalLessons: 4 };

const MOCK_LESSONS: (LessonNodeData & { hook: string; hasContent: boolean })[] = [
  {
    id: 'lesson-1',
    title: 'Big Bang',
    status: 'unlocked',
    mascotUrl: grokitMascot,
    hook: 'How did everything in existence emerge from an infinitely tiny point?',
    hasContent: false,
  },
  { id: 'lesson-2', title: 'Cosmic Expansion', status: 'locked', hook: '', hasContent: false },
  { id: 'lesson-3', title: 'Cosmic Background', status: 'locked', hook: '', hasContent: false },
  {
    id: 'lesson-4',
    title: 'Cosmic Beginnings',
    subtitle: 'Advanced Lesson',
    status: 'locked',
    hook: '',
    hasContent: false,
  },
  {
    id: 'lesson-5',
    title: 'Section Review',
    subtitle: '0/3 sessions',
    status: 'locked',
    hook: '',
    hasContent: false,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function PhaseDetail() {
  const navigate = useNavigate();
  const { courseId, phaseId } = useParams<{ courseId: string; phaseId: string }>();
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  // Later: fetch course/phase/lessons from Amplify Data using courseId + phaseId
  const lessons = MOCK_LESSONS;
  const activeLesson = lessons.find((l) => l.id === activeLessonId);

  const activeLessonMeta: LessonMeta | null = activeLesson
    ? { id: activeLesson.id, title: activeLesson.title, hook: activeLesson.hook, hasContent: activeLesson.hasContent }
    : null;

  const handleStart = (lessonId: string) => {
    navigate(`/learn/course/${courseId}/lesson/${lessonId}`);
  };

  return (
    <AppShell>
      <div className={containerClasses}>
        <div className={topBarClasses}>
          <div>
            <p className={titleClasses}>{MOCK_COURSE_TITLE}</p>
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
            <p className={phaseTitleClasses}>
              {MOCK_PHASE.order}. {MOCK_PHASE.title}
            </p>
            <p className={phaseSubClasses}>
              {MOCK_PHASE.completedLessons}/{MOCK_PHASE.totalLessons} lessons
            </p>
          </div>
        </div>

        <div className={pathWrapClasses}>
          {lessons.map((lesson) => (
            <LessonNode key={lesson.id} lesson={lesson} onSelect={setActiveLessonId} />
          ))}
        </div>
      </div>

      {activeLessonMeta && (
        <LessonGenerateModal
          lesson={activeLessonMeta}
          onClose={() => setActiveLessonId(null)}
          onStart={handleStart}
          onPodcast={(id) => console.log('podcast', id)}
          onLiveChallenge={(id) => console.log('live challenge', id)}
        />
      )}
    </AppShell>
  );
}