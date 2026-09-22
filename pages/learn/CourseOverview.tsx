import { useParams } from 'react-router';
import { BookOpen, Headphones, Zap, Bookmark, Share2, Settings } from 'lucide-react';
import AppShell from './AppShell';
import PhaseCard, { type Phase } from './components/PhaseCard';

// ─── Shared styles ────────────────────────────────────────────────────────────

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

// ─── Mock data — replace with Amplify Data query by courseId ─────────────────

const MOCK_COURSE = {
  id: 'mock-course-id',
  title: 'Understanding Our Vast Universe',
  thumbnailUrl: '',
};

const MOCK_PHASES: Phase[] = [
  { id: 'phase-1', order: 1, title: 'Cosmic Beginnings', completedLessons: 0, totalLessons: 4, locked: false },
  { id: 'phase-2', order: 2, title: 'Stars and Galaxies', completedLessons: 0, totalLessons: 4, locked: true },
  { id: 'phase-3', order: 3, title: 'Black Holes and Time', completedLessons: 0, totalLessons: 4, locked: true },
  { id: 'phase-4', order: 4, title: 'The Universe\u2019s Fate', completedLessons: 0, totalLessons: 3, locked: true },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function CourseOverview() {
  const { courseId } = useParams<{ courseId: string }>();

  // Later: fetch course + phases from Amplify Data using courseId
  const course = MOCK_COURSE;
  const phases = MOCK_PHASES;

  return (
    <AppShell>
      <div className={containerClasses}>
        <div className={topBarClasses}>
          <div className={titleRowClasses}>
            {course.thumbnailUrl ? (
              <img src={course.thumbnailUrl} alt="" className={thumbClasses} />
            ) : (
              <div className={`${thumbClasses} bg-gradient-to-br from-teal-700 to-emerald-800`} />
            )}

            <div className={titleColClasses}>
              <p className={titleClasses}>{course.title}</p>
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
            <PhaseCard key={phase.id} courseId={courseId ?? course.id} phase={phase} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}