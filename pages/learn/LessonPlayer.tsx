import { Suspense, lazy, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Loader2, RotateCcw } from 'lucide-react';

import { readLessonContent } from '../../amplify/functions/shared/lesson-content';
import { GrokitMascot } from '../../components/Grokitmascot';
import {
  generateLessonContent,
  getLesson,
  getPhase,
  listProgressForCourse,
} from '../../lib/courseGeneration';

import { LimitReachedError } from '../../lib/usageLimits';
import CardLessonFlow, { type LessonRecord } from './lesson/CardLessonFlow';

// Older article-style lessons still open in their original player.
const LegacyLessonPlayer = lazy(() => import('./LegacyLessonPlayer'));

/**
 * Opens a lesson and picks the right player:
 *   - card lessons (the new format)  -> CardLessonFlow
 *   - older article lessons          -> LegacyLessonPlayer
 *   - not written yet                -> writes it first, then opens it
 */

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'preparing'; lesson: LessonRecord & { coreContent?: string | null } }
  | { kind: 'cards'; lesson: LessonRecord; completed: boolean }
  | { kind: 'legacy' };

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[65vh] w-full max-w-md flex-col items-center justify-center px-5 text-center">
      {children}
    </div>
  );
}

const retryButton =
  'mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-orange px-6 font-extrabold text-white shadow-[0_4px_0_#C94D16] transition hover:brightness-105 active:translate-y-[3px] active:shadow-[0_1px_0_#C94D16]';

export default function LessonPlayer() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();

  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);

  // Ignore answers that arrive after the route changed or a retry started.
  const requestRef = useRef(0);

  const zoneHref = useCallback(
    (phaseId?: string | null) =>
      courseId
        ? phaseId
          ? `/learn/course/${courseId}/phase/${phaseId}`
          : `/learn/course/${courseId}`
        : '/learn',
    [courseId],
  );

  useEffect(() => {
    const request = ++requestRef.current;
    const current = () => request === requestRef.current;

    async function load() {
      if (!courseId || !lessonId) {
        setState({ kind: 'error', message: 'This lesson could not be found. Return to your learning path.' });
        return;
      }

      setState({ kind: 'loading' });

      try {
        const [lesson, progress] = await Promise.all([getLesson(lessonId), listProgressForCourse(courseId)]);

        if (!current()) return;

        if (!lesson || lesson.courseId !== courseId || !lesson.phaseId) {
          throw new Error('LESSON_NOT_FOUND');
        }

        const phase = await getPhase(lesson.phaseId);

        if (!current()) return;

        if (!phase || phase.courseId !== courseId) throw new Error('INVALID_LESSON_PHASE');

        if (phase.locked) {
          setState({
            kind: 'error',
            message: 'This zone is still locked. Complete the earlier zones to continue.',
          });
          return;
        }

        const record = lesson as unknown as LessonRecord & { coreContent?: string | null };
        const completed = progress.some((item) => item.lessonId === lessonId);

        if (lesson.status === 'READY' && readLessonContent(record.content)) {
          setState({ kind: 'cards', lesson: record, completed });
        } else if (lesson.status === 'READY' && record.coreContent) {
          setState({ kind: 'legacy' });
        } else {
          setState({ kind: 'preparing', lesson: record });
        }
      } catch (error) {
        if (!current()) return;

        console.error('Failed to open lesson', error);
        setState({
          kind: 'error',
          message: 'We couldn’t open this lesson. Check your connection and try again.',
        });
      }
    }

    void load();

    return () => {
      requestRef.current += 1;
    };
  }, [courseId, lessonId, attempt]);

  const retry = () => setAttempt((value) => value + 1);

  if (state.kind === 'loading') {
    return (
      <Centered>
        <div role="status" aria-live="polite" className="flex flex-col items-center gap-4">
          <Loader2 className="h-7 w-7 animate-spin text-orange" />
          <p className="text-sm font-semibold text-[#91A4AC]">Opening your lesson…</p>
        </div>
      </Centered>
    );
  }

  if (state.kind === 'error') {
    return (
      <Centered>
        <GrokitMascot pose="thinking" size={96} />
        <h1 className="mt-5 text-xl font-extrabold text-white">Something went wrong</h1>
        <p className="mt-2 text-sm leading-6 text-[#91A4AC]">{state.message}</p>
        <button type="button" onClick={retry} className={retryButton}>
          <RotateCcw className="h-4 w-4" />
          Try again
        </button>
        <Link to={zoneHref()} className="mt-5 text-sm font-semibold text-[#91A4AC] transition hover:text-white">
          Back to your path
        </Link>
      </Centered>
    );
  }

  if (state.kind === 'preparing') {
    return (
      <PreparingLesson
        key={`${state.lesson.id}-${attempt}`}
        lesson={state.lesson}
        backHref={zoneHref(state.lesson.phaseId)}
        onReady={retry}
      />
    );
  }

  if (state.kind === 'legacy') {
    return (
      <Suspense
        fallback={
          <Centered>
            <Loader2 className="h-7 w-7 animate-spin text-orange" />
          </Centered>
        }
      >
        <LegacyLessonPlayer />
      </Suspense>
    );
  }

  return (
    <CardLessonFlow
      key={state.lesson.id}
      lesson={state.lesson}
      completedBefore={state.completed}
      onLeave={() => navigate(zoneHref(state.lesson.phaseId))}
    />
  );
}

// ─── A lesson that has not been written yet ──────────────────────────────────

function PreparingLesson({
  lesson,
  backHref,
  onReady,
}: {
  lesson: LessonRecord;
  backHref: string;
  onReady: () => void;
}) {
  const [failed, setFailed] = useState(false);
  // Set when today's lesson allowance is used up (trying again would not help).
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setFailed(false);
    setLimitMessage(null);

    generateLessonContent(lesson.id)
      .then(() => {
        // Open it again from the top, now that it exists.
        if (!cancelled) onReady();
      })
      .catch((error) => {
        if (error instanceof LimitReachedError) {
          if (!cancelled) {
            setLimitMessage(error.message);
            setFailed(true);
          }
          return;
        }

        console.error('Failed to prepare lesson', error);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
    // onReady is stable enough for this one-shot request per attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id, tries]);

  if (failed) {
    return (
      <Centered>
        <GrokitMascot pose="thinking" size={96} />
        <h1 className="mt-5 text-xl font-extrabold text-white">
          {limitMessage ? 'No more new lessons today' : 'We couldn’t build this lesson'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#91A4AC]">
          {limitMessage ?? 'Your journey is safe. Give it another go.'}
        </p>
        {!limitMessage && (
          <button type="button" onClick={() => setTries((value) => value + 1)} className={retryButton}>
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
        )}
        <Link to={backHref} className="mt-5 text-sm font-semibold text-[#91A4AC] transition hover:text-white">
          Back to your path
        </Link>
      </Centered>
    );
  }

  return (
    <Centered>
      <div role="status" aria-live="polite" className="flex flex-col items-center">
        <GrokitMascot pose="thinking" size={110} />
        <h1 className="mt-6 text-2xl font-extrabold text-white">Building your lesson…</h1>
        <p className="mt-2 text-sm leading-6 text-[#91A4AC]">
          Usually under a minute. {lesson.title}
        </p>
        <div className="mt-6 h-2 w-56 overflow-hidden rounded-full bg-[#263640]">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-orange" />
        </div>
      </div>
    </Centered>
  );
}