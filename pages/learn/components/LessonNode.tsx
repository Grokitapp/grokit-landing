import {
  Check,
  Lock,
} from 'lucide-react';

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const rowClasses =
  'relative flex items-center gap-4 sm:gap-5 min-h-[96px]';

const nodeButtonClasses =
  'relative z-10 w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full flex items-center justify-center shrink-0 transition-all duration-200';

const nodeCurrentClasses =
  'bg-[#131F24] border-2 border-orange shadow-[0_0_0_6px_rgba(230,86,26,0.12)] hover:shadow-[0_0_0_8px_rgba(230,86,26,0.14)]';

const nodeCompletedClasses =
  'bg-orange border-2 border-orange hover:brightness-110';

const nodeLockedClasses =
  'bg-[#202F35] border border-[#37464F] cursor-not-allowed';

const mascotImgClasses =
  'w-10 h-10 sm:w-11 sm:h-11 object-contain';

const labelColClasses =
  'min-w-0 flex-1';

const titleCurrentClasses =
  'font-display font-bold text-white text-[16px] sm:text-lg';

const titleCompletedClasses =
  'font-display font-semibold text-[#D6E0E4] text-[16px] sm:text-lg';

const titleLockedClasses =
  'font-display font-semibold text-[#60757E] text-[16px] sm:text-lg';

const subClasses =
  'text-[#60757E] font-sans text-sm mt-1';

const currentBadgeClasses =
  'inline-flex items-center rounded-full bg-orange/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-orange';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type LessonNodeStatus =
  | 'completed'
  | 'unlocked'
  | 'locked';

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

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export default function LessonNode({
  lesson,
  onSelect,
}: LessonNodeProps) {
  const isLocked = lesson.status === 'locked';
  const isCurrent = lesson.status === 'unlocked';
  const isCompleted = lesson.status === 'completed';

  const nodeStyle = isLocked
    ? nodeLockedClasses
    : isCompleted
      ? nodeCompletedClasses
      : nodeCurrentClasses;

  const titleStyle = isLocked
    ? titleLockedClasses
    : isCompleted
      ? titleCompletedClasses
      : titleCurrentClasses;

  return (
    <div className={rowClasses}>
      <button
        type="button"
        onClick={() =>
          !isLocked && onSelect(lesson.id)
        }
        disabled={isLocked}
        aria-label={lesson.title}
        className={`${nodeButtonClasses} ${nodeStyle}`}
      >
        {isLocked ? (
          <Lock className="w-5 h-5 text-[#60757E]" />
        ) : isCompleted ? (
          <Check
            className="w-5 h-5 text-white"
            strokeWidth={2.5}
          />
        ) : lesson.mascotUrl ? (
          <img
            src={lesson.mascotUrl}
            alt=""
            className={mascotImgClasses}
          />
        ) : null}
      </button>

      <div className={labelColClasses}>
        <div className="flex flex-wrap items-center gap-2">
          <p className={titleStyle}>{lesson.title}</p>

          {isCurrent && (
            <span className={currentBadgeClasses}>
              Current
            </span>
          )}
        </div>

        {lesson.subtitle && (
          <p className={subClasses}>{lesson.subtitle}</p>
        )}

        {isCompleted && !lesson.subtitle && (
          <p className={subClasses}>Completed</p>
        )}
      </div>
    </div>
  );
}