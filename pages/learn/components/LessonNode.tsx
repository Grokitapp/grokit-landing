import { Lock } from 'lucide-react';

// ─── Shared styles ────────────────────────────────────────────────────────────

const rowClasses = 'flex items-center gap-4 py-2';
const nodeButtonClasses = 'w-16 h-16 rounded-full flex items-center justify-center shrink-0 transition-all';
const nodeUnlockedClasses = 'bg-[#131F24] border-2 border-orange shadow-[0_0_0_6px_rgba(230,86,26,0.12)]';
const nodeCompletedClasses = 'bg-orange border-2 border-orange';
const nodeLockedClasses = 'bg-[#202F35] border border-[#37464F] cursor-not-allowed';
const mascotImgClasses = 'w-9 h-9 object-contain';

const labelColClasses = 'min-w-0';
const titleUnlockedClasses = 'font-display font-bold text-white text-[16px] sm:text-lg';
const titleLockedClasses = 'font-display font-bold text-[#60757E] text-[16px] sm:text-lg';
const subClasses = 'text-[#60757E] font-sans text-sm mt-0.5';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LessonNodeStatus = 'completed' | 'unlocked' | 'locked';

export interface LessonNodeData {
  id: string;
  title: string;
  subtitle?: string;
  status: LessonNodeStatus;
  mascotUrl?: string;
}

interface LessonNodeProps {
  lesson: LessonNodeData;
  onSelect: (lessonId: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LessonNode({ lesson, onSelect }: LessonNodeProps) {
  const isLocked = lesson.status === 'locked';

  const nodeStyle =
    lesson.status === 'completed'
      ? nodeCompletedClasses
      : lesson.status === 'unlocked'
        ? nodeUnlockedClasses
        : nodeLockedClasses;

  return (
    <div className={rowClasses}>
      <button
        type="button"
        onClick={() => !isLocked && onSelect(lesson.id)}
        disabled={isLocked}
        aria-label={lesson.title}
        className={`${nodeButtonClasses} ${nodeStyle}`}
      >
        {isLocked ? (
          <Lock className="w-5 h-5 text-[#60757E]" />
        ) : lesson.mascotUrl ? (
          <img src={lesson.mascotUrl} alt="" className={mascotImgClasses} />
        ) : null}
      </button>

      <div className={labelColClasses}>
        <p className={isLocked ? titleLockedClasses : titleUnlockedClasses}>{lesson.title}</p>
        {lesson.subtitle && <p className={subClasses}>{lesson.subtitle}</p>}
      </div>
    </div>
  );
}