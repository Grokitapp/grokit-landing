import { Link } from 'react-router';
import { BookOpen, Check, Lock, Trophy } from 'lucide-react';

import type { Phase } from './PhaseCard';
import grokitMascot from '../../../assets/grokit-hero-mascot.png';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type PathLessonStatus = 'completed' | 'unlocked' | 'locked';

export interface PathLesson {
  id: string;
  title: string;
  status: PathLessonStatus;
}

export interface PathZone extends Phase {
  lessons: PathLesson[];
}

interface JourneyPathProps {
  courseId: string;
  zones: PathZone[];
  /** The zone the learner should work on next (gets the highlighted node). */
  currentZoneId: string | null;
  /** True once any lesson is done, so the current bubble says "Continue". */
  hasStarted: boolean;
  onSelectLesson: (zoneId: string, lessonId: string) => void;
}

type ZoneState = 'complete' | 'current' | 'available' | 'locked';

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

// Horizontal offsets (px) that make the nodes sway like Duolingo's path.
const WAVE = [0, 26, 50, 26];

const PATH_WIDTH = 'mx-auto w-full max-w-[440px]';

const nodeBaseClasses =
  'relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-[#131F24]';

const nodeCompletedClasses =
  'bg-orange text-white shadow-[0_4px_0_#C94713] hover:brightness-110 active:translate-y-[3px] active:shadow-[0_1px_0_#C94713]';

const nodeUnlockedClasses =
  'border-2 border-orange bg-[#131F24] shadow-[0_4px_0_#8F3410] hover:bg-[#1A292F] active:translate-y-[3px] active:shadow-[0_1px_0_#8F3410]';

const nodeLockedClasses =
  'cursor-not-allowed border border-[#37464F] bg-[#202F35] text-[#60757E] shadow-[0_4px_0_#0D161A]';

const bannerClasses: Record<ZoneState, string> = {
  complete: 'bg-emerald-600 text-white shadow-[0_3px_0_#065F46]',
  current: 'bg-orange text-white shadow-[0_3px_0_#C94713]',
  available: 'bg-orange text-white shadow-[0_3px_0_#C94713]',
  locked:
    'border border-[#37464F] bg-[#202F35] text-[#78909A] shadow-[0_3px_0_#0D161A]',
};

// -----------------------------------------------------------------------------
// Zone banner (sticks to the top while its zone scrolls past)
// -----------------------------------------------------------------------------

function ZoneBanner({
  courseId,
  zone,
  state,
}: {
  courseId: string;
  zone: PathZone;
  state: ZoneState;
}) {
  const locked = state === 'locked';

  const progressText =
    zone.totalLessons === 0
      ? 'Lessons are being prepared'
      : `${zone.completedLessons} of ${zone.totalLessons} ${
          zone.totalLessons === 1 ? 'lesson' : 'lessons'
        } completed`;

  const actionClasses =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-white/25 bg-white/15';

  return (
    // Sits just under the pinned journey card (its measured height is published
    // as --journey-card-h by CourseOverview), which itself sits under the 56px
    // mobile top strip. The wrapper paints the page colour so nodes
    // never show through the gap.
    <div className="sticky top-[calc(3.5rem+var(--journey-card-h,56px))] z-20 bg-[#131F24] pb-3 pt-0 after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-4 after:bg-gradient-to-b after:from-[#131F24] after:to-transparent lg:top-[var(--journey-card-h,56px)]">
      <div
        className={`flex w-full items-center justify-between gap-3 rounded-xl px-5 py-3 sm:px-6 ${bannerClasses[state]}`}
      >
        <div className="min-w-0">
          <p className="text-xs font-bold opacity-80">Zone {zone.order}</p>
          <h2 className="break-words font-display text-base font-extrabold leading-snug sm:text-[17px]">
            {zone.title}
          </h2>
          <p className="mt-0.5 text-[11px] font-semibold opacity-80">
            {locked ? 'Complete the previous zone to unlock' : progressText}
          </p>
        </div>

        {locked ? (
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#37464F] bg-[#19262B]"
          >
            <Lock className="h-4 w-4" />
          </span>
        ) : (
          <Link
            to={`/learn/course/${courseId}/phase/${zone.id}`}
            aria-label={`Open ${zone.title}`}
            title="Open zone"
            className={`${actionClasses} transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white`}
          >
            <BookOpen className="h-[18px] w-[18px]" aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Lesson node
// -----------------------------------------------------------------------------

function LessonPathNode({
  lesson,
  offset,
  isCurrent,
  hasStarted,
  onSelect,
}: {
  lesson: PathLesson;
  offset: number;
  isCurrent: boolean;
  hasStarted: boolean;
  onSelect: () => void;
}) {
  const locked = lesson.status === 'locked';
  const completed = lesson.status === 'completed';

  const nodeState = locked
    ? nodeLockedClasses
    : completed
      ? nodeCompletedClasses
      : nodeUnlockedClasses;

  const titleClasses = locked
    ? 'font-display text-sm font-semibold text-[#60757E] sm:text-base'
    : completed
      ? 'font-display text-sm font-semibold text-[#D6E0E4] sm:text-base'
      : 'font-display text-sm font-bold text-white sm:text-base';

  const statusText = locked
    ? 'locked'
    : completed
      ? 'completed'
      : isCurrent
        ? 'up next'
        : 'available';

  return (
    <li
      style={{ marginLeft: offset }}
      className={`flex items-center gap-3 pb-2 ${isCurrent ? 'pt-9' : 'pt-2'}`}
    >
      <div className="relative h-14 w-14 shrink-0">
        {isCurrent && (
          <>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full border-2 border-orange/50 animate-ping [animation-iteration-count:3] motion-reduce:animate-none"
            />

            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border-2 border-[#37464F] bg-[#131F24] px-2.5 py-0.5 font-display text-xs font-extrabold text-orange"
            >
              {hasStarted ? 'Continue' : 'Start'}
              <span className="absolute -bottom-[6px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-[#37464F] bg-[#131F24]" />
            </span>
          </>
        )}

        <button
          type="button"
          onClick={onSelect}
          disabled={locked}
          aria-label={`${lesson.title}, ${statusText}`}
          className={`${nodeBaseClasses} ${nodeState}`}
        >
          {locked ? (
            <Lock className="h-5 w-5" aria-hidden="true" />
          ) : completed ? (
            <Check className="h-6 w-6" strokeWidth={3} aria-hidden="true" />
          ) : (
            <img
              src={grokitMascot}
              alt=""
              className="h-8 w-8 object-contain"
            />
          )}
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <p className={`line-clamp-2 break-words ${titleClasses}`}>
          {lesson.title}
        </p>

        {completed && (
          <p className="mt-0.5 text-xs text-[#60757E]">Completed</p>
        )}
      </div>
    </li>
  );
}

// -----------------------------------------------------------------------------
// Zone checkpoint (end of each zone)
// -----------------------------------------------------------------------------

function ZoneCheckpoint({
  offset,
  done,
}: {
  offset: number;
  done: boolean;
}) {
  return (
    <li
      style={{ marginLeft: offset }}
      className="flex items-center gap-3 pb-2 pt-2"
    >
      <div
        aria-hidden="true"
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${
          done
            ? 'bg-amber text-[#12142B] shadow-[0_4px_0_#DC8B0A]'
            : 'border border-[#37464F] bg-[#202F35] text-[#60757E] shadow-[0_4px_0_#0D161A]'
        }`}
      >
        <Trophy className="h-5 w-5" />
      </div>

      <p
        className={`font-display text-sm font-semibold sm:text-base ${
          done ? 'text-white' : 'text-[#60757E]'
        }`}
      >
        {done ? 'Zone complete' : 'Zone checkpoint'}
      </p>
    </li>
  );
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export default function JourneyPath({
  courseId,
  zones,
  currentZoneId,
  hasStarted,
  onSelectLesson,
}: JourneyPathProps) {
  return (
    <div>
      {zones.map((zone) => {
        const complete =
          zone.totalLessons > 0 &&
          zone.completedLessons >= zone.totalLessons;

        const state: ZoneState = zone.locked
          ? 'locked'
          : complete
            ? 'complete'
            : zone.id === currentZoneId
              ? 'current'
              : 'available';

        return (
          <section
            key={zone.id}
            aria-label={`Zone ${zone.order}: ${zone.title}`}
            className="pb-3"
          >
            <ZoneBanner courseId={courseId} zone={zone} state={state} />

            {zone.lessons.length === 0 ? (
              <p className={`${PATH_WIDTH} py-6 text-center text-sm text-[#91A4AC]`}>
                Lessons for this zone are being prepared.
              </p>
            ) : (
              <ol className={`${PATH_WIDTH} px-1`}>
                {zone.lessons.map((lesson, index) => (
                  <LessonPathNode
                    key={lesson.id}
                    lesson={lesson}
                    offset={WAVE[index % WAVE.length]}
                    isCurrent={
                      state === 'current' && lesson.status === 'unlocked'
                    }
                    hasStarted={hasStarted}
                    onSelect={() => onSelectLesson(zone.id, lesson.id)}
                  />
                ))}

                <ZoneCheckpoint
                  offset={WAVE[zone.lessons.length % WAVE.length]}
                  done={complete}
                />
              </ol>
            )}
          </section>
        );
      })}
    </div>
  );
}