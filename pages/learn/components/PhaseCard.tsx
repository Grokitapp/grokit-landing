import { Link } from 'react-router';
import { BookOpen, Lock } from 'lucide-react';

// ─── Shared styles ────────────────────────────────────────────────────────────

const cardClasses = `
  flex items-center justify-between gap-4 px-5 sm:px-6 py-5 rounded-2xl
  border border-[#37464F] bg-[#202F35] hover:border-orange/40 hover:bg-[#26383F]
  transition-colors
`;
const cardLockedClasses = 'opacity-50 pointer-events-none';
const titleClasses = 'font-display font-bold text-white text-[17px] sm:text-lg';
const subClasses = 'text-[#91A4AC] font-sans text-sm mt-0.5';
const iconWrapClasses = 'w-10 h-10 rounded-xl bg-[#131F24] border border-[#37464F] flex items-center justify-center shrink-0';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Phase {
  id: string;
  order: number;
  title: string;
  completedLessons: number;
  totalLessons: number;
  locked?: boolean;
}

interface PhaseCardProps {
  courseId: string;
  phase: Phase;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PhaseCard({ courseId, phase }: PhaseCardProps) {
  const content = (
    <div className={`${cardClasses} ${phase.locked ? cardLockedClasses : ''}`}>
      <div>
        <p className={titleClasses}>
          {phase.order}. {phase.title}
        </p>
        <p className={subClasses}>
          {phase.completedLessons}/{phase.totalLessons} lessons
        </p>
      </div>

      <div className={iconWrapClasses}>
        {phase.locked ? (
          <Lock className="w-4 h-4 text-[#60757E]" />
        ) : (
          <BookOpen className="w-4 h-4 text-[#91A4AC]" />
        )}
      </div>
    </div>
  );

  if (phase.locked) return content;

  return (
    <Link to={`/learn/course/${courseId}/phase/${phase.id}`} className="block">
      {content}
    </Link>
  );
}