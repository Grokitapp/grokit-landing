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
const WAVE = [0, 36, 68, 36];

const PATH_WIDTH = 'mx-auto w-full max-w-[520px]';

const nodeBaseClasses =
  'relative z-10 flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-4 focus-visible:ring-offset-[#131F24]';

const nodeCompletedClasses =
  'bg-orange text-white shadow-[0_6px_0_#C94713] hover:brightness-110 active:translate-y-1 active:shadow-[0_2px_0_#C94713]';

const nodeUnlockedClasses =
  'border-2 border-orange bg-[#131F24] shadow-[0_6px_0_#8F3410] hover:bg-[#1A292F] active:translate-y-1 active:shadow-[0_2px_0_#8F3410]';

const nodeLockedClasses =
  'cursor-not-allowed border border-[#37464F] bg-[#202F35] text-[#60757E] shadow-[0_6px_0_#0D161A]';

const bannerClasses: Record<ZoneState, string> = {
  complete: 'bg-emerald-600 text-white shadow-[0_4px_0_#065F46]',
  current: 'bg-orange text-white shadow-[0_4px_0_#C94713]',
  available: 'bg-orange text-white shadow-[0_4px_0_#C94713]',
  locked:
    'border border-[#37464F] bg-[#202F35] text-[#78909A] shadow-[0_4px_0_#0D161A]',
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
    'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-white/25 bg-white/15';

  return (
    // The wrapper paints the page colour so nodes never show through the gap.
    <div className="sticky top-16 z-20 bg-[#131F24] pb-4 pt-2 lg:top-0">
      <div
        className={`${PATH_WIDTH} flex items-center justify-between gap-4 rounded-2xl px-5 py-4 ${bannerClasses[state]}`}
      >
        <div className="min-w-0">
          <p className="text-sm font-bold opacity-80">Zone {zone.order}</p>
          <h2 className="break-words font-display text-lg font-extrabold leading-snug sm:text-xl">
            {zone.title}
          </h2>
          <p className="mt-0.5 text-xs font-semibold opacity-80">
            {locked ? 'Complete the previous zone to unlock' : progressText}
          </p>
        </div>

        {locked ? (
          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#37464F] bg-[#19262B]"
          >
            <Lock className="h-5 w-5" />
          </span>
        ) : (
          <Link
            to={`/learn/course/${courseId}/phase/${zone.id}`}
            aria-label={`Open ${zone.title}`}
            title="Open zone"
            className={`${actionClasses} transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white`}
          >
            <BookOpen className="h-5 w-5" aria-hidden="true" />
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
    ? 'font-display text-base font-semibold text-[#60757E] sm:text-lg'
    : completed
      ? 'font-display text-base font-semibold text-[#D6E0E4] sm:text-lg'
      : 'font-display text-base font-bold text-white sm:text-lg';

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
      className={`flex items-center gap-4 pb-3 ${isCurrent ? 'pt-11' : 'pt-3'}`}
    >
      <div className="relative h-[72px] w-[72px] shrink-0">
        {isCurrent && (
          <>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full border-2 border-orange/50 animate-ping [animation-iteration-count:3] motion-reduce:animate-none"
            />

            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl border-2 border-[#37464F] bg-[#131F24] px-3 py-1 font-display text-sm font-extrabold text-orange"
            >
              {hasStarted ? 'Continue' : 'Start'}
              <span className="absolute -bottom-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-[#37464F] bg-[#131F24]" />
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
            <Lock className="h-6 w-6" aria-hidden="true" />
          ) : completed ? (
            <Check className="h-8 w-8" strokeWidth={3} aria-hidden="true" />
          ) : (
            <img
              src={grokitMascot}
              alt=""
              className="h-11 w-11 object-contain"
            />
          )}
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <p className={`line-clamp-2 break-words ${titleClasses}`}>
          {lesson.title}
        </p>

        {completed && (
          <p className="mt-0.5 text-sm text-[#60757E]">Completed</p>
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
      className="flex items-center gap-4 pb-3 pt-3"
    >
      <div
        aria-hidden="true"
        className={`flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full ${
          done
            ? 'bg-amber text-[#12142B] shadow-[0_6px_0_#DC8B0A]'
            : 'border border-[#37464F] bg-[#202F35] text-[#60757E] shadow-[0_6px_0_#0D161A]'
        }`}
      >
        <Trophy className="h-7 w-7" />
      </div>

      <p
        className={`font-display text-base font-semibold sm:text-lg ${
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
            className="pb-6"
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