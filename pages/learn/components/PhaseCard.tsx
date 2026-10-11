import { Link } from 'react-router';
import {
  ArrowRight,
  Check,
  LockKeyhole,
} from 'lucide-react';

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
// Styles
// -----------------------------------------------------------------------------

const cardBaseClasses =
  'group relative flex min-h-[88px] items-center gap-3 rounded-2xl border px-4 py-4 transition-all duration-200 sm:gap-4 sm:px-5';

const currentClasses =
  'border-orange/45 bg-[#26383F] shadow-[0_0_0_1px_rgba(255,107,0,0.08)]';

const availableClasses =
  'border-[#37464F] bg-[#202F35] hover:border-[#52656E] hover:bg-[#26383F]';

const completedClasses =
  'border-emerald-400/20 bg-[#1C2D30] hover:border-emerald-400/35 hover:bg-[#203437]';

const lockedClasses =
  'cursor-not-allowed border-[#2D3A40] bg-[#19262B]';

const markerClasses =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border sm:h-12 sm:w-12';

const currentMarkerClasses =
  'border-orange/40 bg-orange/10 text-orange';

const availableMarkerClasses =
  'border-[#465861] bg-[#131F24] text-[#C8D3DA]';

const completedMarkerClasses =
  'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';

const lockedMarkerClasses =
  'border-[#37464F] bg-[#202F35] text-[#60757E]';

const titleClasses =
  'break-words font-display text-sm font-extrabold leading-5 text-white sm:text-base';

const lockedTitleClasses =
  'break-words font-display text-sm font-bold leading-5 text-[#71838A] sm:text-base';

const metaClasses = 'mt-1 text-xs leading-5 text-[#91A4AC] sm:text-sm';

const currentBadgeClasses =
  'inline-flex shrink-0 items-center gap-1 rounded-full border border-orange/20 bg-orange/10 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-orange';

const progressTrackClasses =
  'mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#131F24]';

const arrowClasses =
  'ml-auto h-4 w-4 shrink-0 text-[#60757E] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-white';

const focusClasses =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-[#131F24]';

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export default function PhaseCard({
  courseId,
  phase,
  current = false,
}: PhaseCardProps) {
  const locked = phase.locked === true;

  const totalLessons = Math.max(0, phase.totalLessons);
  const completedLessons = Math.min(
    totalLessons,
    Math.max(0, phase.completedLessons),
  );

  const complete =
    totalLessons > 0 && completedLessons >= totalLessons;

  const progress =
    totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

  const markerState = locked
    ? lockedMarkerClasses
    : complete
      ? completedMarkerClasses
      : current
        ? currentMarkerClasses
        : availableMarkerClasses;

  const cardState = locked
    ? lockedClasses
    : complete
      ? completedClasses
      : current
        ? currentClasses
        : availableClasses;

  const accessibleStatus = locked
    ? 'Locked'
    : complete
      ? 'Completed'
      : current
        ? 'Current learning zone'
        : 'Available';

  const content = (
    <div
      className={`${cardBaseClasses} ${cardState} ${
        !locked ? 'cursor-pointer' : ''
      }`}
    >
      <div
        aria-hidden="true"
        className={`${markerClasses} ${markerState}`}
      >
        {locked ? (
          <LockKeyhole className="h-5 w-5" />
        ) : complete ? (
          <Check className="h-5 w-5" strokeWidth={2.5} />
        ) : (
          <span className="font-display text-base font-extrabold">
            {phase.order}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={
              locked ? lockedTitleClasses : titleClasses
            }
          >
            {phase.title}
          </h3>

          {current && !complete && !locked && (
            <span className={currentBadgeClasses}>
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-orange"
              />
              Current
            </span>
          )}

          {complete && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
              <Check className="h-3 w-3" />
              Done
            </span>
          )}
        </div>

        <p className={metaClasses}>
          {locked
            ? 'Complete the previous zone to unlock this one.'
            : totalLessons === 0
              ? 'Lessons are being prepared.'
              : `${completedLessons} of ${totalLessons} ${
                  totalLessons === 1 ? 'lesson' : 'lessons'
                } completed`}
        </p>

        {!locked && totalLessons > 0 && (
          <div
            className={progressTrackClasses}
            role="progressbar"
            aria-label={`${phase.title} progress`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${
                complete ? 'bg-emerald-400' : 'bg-orange'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {!locked && (
        <ArrowRight
          aria-hidden="true"
          className={arrowClasses}
        />
      )}

      {locked && (
        <span className="sr-only">Locked</span>
      )}

      <span className="sr-only">{accessibleStatus}</span>
    </div>
  );

  if (locked) {
    return (
      <div
        aria-label={`${phase.title}: locked`}
        aria-disabled="true"
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      to={`/learn/course/${courseId}/phase/${phase.id}`}
      aria-label={`${phase.title}. ${accessibleStatus}. ${completedLessons} of ${totalLessons} lessons completed. Open learning zone.`}
      className={`block rounded-2xl ${focusClasses}`}
    >
      {content}
    </Link>
  );
}
