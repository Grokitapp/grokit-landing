import { Link } from 'react-router';
import {
  ArrowRight,
  Check,
  Lock,
} from 'lucide-react';

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const cardBaseClasses = `
  relative flex items-center gap-4 sm:gap-5
  min-h-[88px] px-4 sm:px-5 py-4
  rounded-2xl border
  transition-all duration-200
`;

const currentClasses =
  'border-orange/60 bg-[#26383F] shadow-[0_0_0_1px_rgba(230,86,26,0.12)]';

const availableClasses =
  'border-[#37464F] bg-[#202F35] hover:border-[#52656E] hover:bg-[#26383F]';

const completedClasses =
  'border-[#37464F] bg-[#1C2A30]';

const lockedClasses =
  'border-[#2D3A40] bg-[#1B282D] opacity-55';

const markerClasses =
  'relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-full shrink-0 flex items-center justify-center';

const currentMarkerClasses =
  'bg-[#131F24] border-2 border-orange shadow-[0_0_0_6px_rgba(230,86,26,0.10)]';

const availableMarkerClasses =
  'bg-[#131F24] border border-[#52656E]';

const completedMarkerClasses =
  'bg-orange border-2 border-orange';

const lockedMarkerClasses =
  'bg-[#202F35] border border-[#37464F]';

const titleClasses =
  'font-display font-bold text-white text-[16px] sm:text-[17px]';

const lockedTitleClasses =
  'font-display font-bold text-[#60757E] text-[16px] sm:text-[17px]';

const metaClasses =
  'text-[#91A4AC] font-sans text-sm mt-1';

const currentBadgeClasses =
  'inline-flex items-center rounded-full bg-orange/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-orange';

const progressTrackClasses =
  'mt-2 h-1.5 w-full max-w-[260px] rounded-full bg-[#131F24] overflow-hidden';

const arrowClasses =
  'ml-auto shrink-0 text-[#60757E] transition-transform group-hover:translate-x-0.5 group-hover:text-white';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

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
  current?: boolean;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export default function PhaseCard({
  courseId,
  phase,
  current = false,
}: PhaseCardProps) {
  const locked = phase.locked === true;

  const complete =
    phase.totalLessons > 0 &&
    phase.completedLessons >= phase.totalLessons;

  const progress =
    phase.totalLessons > 0
      ? Math.round(
          (phase.completedLessons / phase.totalLessons) * 100,
        )
      : 0;

  const cardState = locked
    ? lockedClasses
    : current
      ? currentClasses
      : complete
        ? completedClasses
        : availableClasses;

  const markerState = locked
    ? lockedMarkerClasses
    : complete
      ? completedMarkerClasses
      : current
        ? currentMarkerClasses
        : availableMarkerClasses;

  const content = (
    <div
      className={`${cardBaseClasses} ${cardState} ${
        !locked ? 'group cursor-pointer' : ''
      }`}
    >
      <div className={`${markerClasses} ${markerState}`}>
        {locked ? (
          <Lock className="w-5 h-5 text-[#60757E]" />
        ) : complete ? (
          <Check className="w-5 h-5 text-white" strokeWidth={2.5} />
        ) : (
          <span className="font-display font-bold text-white">
            {phase.order}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={
              locked ? lockedTitleClasses : titleClasses
            }
          >
            {phase.title}
          </p>

          {current && !complete && !locked && (
            <span className={currentBadgeClasses}>
              Current
            </span>
          )}
        </div>

        <p className={metaClasses}>
          {phase.completedLessons}/{phase.totalLessons}{' '}
          {phase.totalLessons === 1 ? 'lesson' : 'lessons'}
        </p>

        {!locked && phase.totalLessons > 0 && (
          <div className={progressTrackClasses}>
            <div
              className="h-full rounded-full bg-orange transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {!locked && (
        <ArrowRight className={arrowClasses} />
      )}
    </div>
  );

  if (locked) {
    return content;
  }

  return (
    <Link
      to={`/learn/course/${courseId}/phase/${phase.id}`}
      className="block"
    >
      {content}
    </Link>
  );
}