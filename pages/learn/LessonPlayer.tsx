import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleAlert,
  Loader2,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';

import { GrokitMascot } from '../../components/Grokitmascot';
import {
  generateLessonContent,
  getCourse,
  getLesson,
  getPhase,
  listProgressForCourse,
  markLessonComplete,
} from '../../lib/courseGeneration';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

type KeyTerm = {
  term: string;
  definition: string;
};

type LessonStatus = 'PENDING' | 'GENERATING' | 'READY' | 'FAILED' | string;

type LessonData = {
  id: string;
  courseId: string;
  phaseId: string;
  order: number;
  title: string;
  hook?: string | null;
  coreContent?: string | null;
  keyTerms?: unknown;
  quiz?: unknown;
  status?: LessonStatus | null;
  generationError?: string | null;
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getFriendlyError(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  // Keep provider, GraphQL, and backend error details out of the UI.
  console.error('Lesson player operation failed:', error);
  return fallback;
}

function parseKeyTerms(value: unknown): KeyTerm[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is KeyTerm =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as KeyTerm).term === 'string' &&
      typeof (item as KeyTerm).definition === 'string',
  );
}

function parseQuiz(value: unknown): QuizQuestion[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is QuizQuestion =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as QuizQuestion).question === 'string' &&
      Array.isArray((item as QuizQuestion).options) &&
      (item as QuizQuestion).options.length === 4 &&
      (item as QuizQuestion).options.every(
        (option) => typeof option === 'string',
      ) &&
      typeof (item as QuizQuestion).correctIndex === 'number' &&
      Number.isInteger((item as QuizQuestion).correctIndex) &&
      (item as QuizQuestion).correctIndex >= 0 &&
      (item as QuizQuestion).correctIndex < 4,
  );
}

function formatLessonContent(content: string): string[] {
  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function getOptionClasses(
  checked: boolean,
  isSelected: boolean,
  isCorrect: boolean,
): string {
  if (checked && isCorrect) {
    return 'border-[#3DDC84] bg-[#1C3027]';
  }

  if (checked && isSelected) {
    return 'border-[#FF5A5F] bg-[#322225]';
  }

  if (isSelected) {
    return 'border-orange bg-[#32251F]';
  }

  return 'border-[#2C3E4A] bg-[#18252C] hover:border-[#40535E]';
}

// -----------------------------------------------------------------------------
// Shared states
// -----------------------------------------------------------------------------

function LoadingState({ label = 'Opening your lesson…' }: { label?: string }) {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-7 w-7 animate-spin text-orange" />
        <p className="text-sm font-semibold text-[#91A4AC]">{label}</p>
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
  backHref,
}: {
  message: string;
  onRetry: () => void;
  backHref?: string;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-5">
      <div className="w-full rounded-3xl border border-[#3A4146] bg-[#1D2A33] p-7 text-center sm:p-9">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#342629]">
          <CircleAlert className="h-6 w-6 text-[#FF5A5F]" />
        </div>

        <h2 className="mt-5 text-xl font-extrabold text-white">
          Something went wrong
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#91A4AC]">
          {message}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-orange px-6 font-extrabold text-white transition hover:brightness-105"
        >
          <RotateCcw className="h-4 w-4" />
          Try again
        </button>

        {backHref && (
          <div>
            <Link
              to={backHref}
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#91A4AC] transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to your path
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function GenerationState({ lesson }: { lesson: LessonData }) {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-xl items-center justify-center px-5">
      <div className="w-full text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-[#3A4A53] bg-[#1D2A33]">
          <Sparkles className="h-7 w-7 animate-pulse text-orange" />
        </div>

        <h1 className="mt-7 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Building your lesson
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#91A4AC]">
          Grokit is putting the ideas together into a focused lesson for you.
        </p>

        <div className="mx-auto mt-8 h-2 max-w-sm overflow-hidden rounded-full bg-[#263640]">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-orange" />
        </div>

        <p className="mt-4 text-xs font-semibold text-[#687D87]">
          {lesson.title}
        </p>
      </div>
    </div>
  );
}

function StartLesson({
  lesson,
  onStart,
  loading,
  error,
}: {
  lesson: LessonData;
  onStart: () => void;
  loading: boolean;
  error?: string;
}) {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-2xl items-center justify-center px-5 py-12">
      <div className="w-full text-center">
        <div className="mx-auto mb-7">
          <GrokitMascot pose="thinking" size={110} />
        </div>

        <p className="text-sm font-bold text-orange">
          Lesson {lesson.order}
        </p>

        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {lesson.title}
        </h1>

        {lesson.hook && (
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#9FB0BB]">
            {lesson.hook}
          </p>
        )}

        {error && (
          <p
            className="mx-auto mt-5 max-w-lg rounded-xl border border-[#513337] bg-[#2B2226] px-4 py-3 text-sm leading-6 text-[#FF9A9E]"
            role="alert"
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={onStart}
          disabled={loading}
          className="mt-8 inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-orange px-8 font-extrabold text-white shadow-[0_5px_0_#C94D16] transition hover:brightness-105 active:translate-y-[2px] active:shadow-[0_3px_0_#C94D16] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Building lesson…
            </>
          ) : (
            <>
              {lesson.status === 'FAILED' ? 'Try again' : 'Start lesson'}
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function LessonComplete({
  lesson,
  onBack,
}: {
  lesson: LessonData;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-5 py-12">
      <div className="w-full text-center">
        <GrokitMascot pose="celebrate" size={120} />

        <div className="mt-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#20352C]">
            <CheckCircle2 className="h-6 w-6 text-[#3DDC84]" />
          </div>

          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white">
            Lesson complete
          </h1>

          <p className="mt-2 text-[#91A4AC]">
            Nice work. You just finished{' '}
            <span className="font-bold text-white">{lesson.title}</span>.
          </p>

          <div className="mx-auto mt-7 inline-flex items-center gap-2 rounded-full border border-[#51432B] bg-[#2D2920] px-5 py-2.5 text-sm font-extrabold text-[#FFB020]">
            +10 XP
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="mt-9 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-orange px-7 font-extrabold text-white transition hover:brightness-105"
        >
          Back to zone
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Lesson player
// -----------------------------------------------------------------------------

export default function LessonPlayer() {
  const { courseId, lessonId } = useParams<{
    courseId: string;
    lessonId: string;
  }>();

  const navigate = useNavigate();

  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [phaseTitle, setPhaseTitle] = useState('');

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number>
  >({});
  const [checkedAnswers, setCheckedAnswers] = useState<
    Record<number, boolean>
  >({});

  const [completed, setCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Ignore results from older requests after a retry or route change.
  const requestIdRef = useRef(0);
  const generationInFlightRef = useRef(false);
  const completionInFlightRef = useRef(false);

  const phaseHref =
    courseId && lesson?.phaseId
      ? `/learn/course/${courseId}/phase/${lesson.phaseId}`
      : courseId
        ? `/learn/course/${courseId}`
        : '/learn';

  const loadLesson = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!courseId || !lessonId) {
      setLesson(null);
      setError('This lesson could not be found. Return to your learning path.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    setLesson(null);
    setCourseTitle('');
    setPhaseTitle('');
    setCompleted(false);
    setSelectedAnswers({});
    setCheckedAnswers({});

    try {
      const [lessonData, courseData] = await Promise.all([
        getLesson(lessonId),
        getCourse(courseId),
      ]);

      if (requestId !== requestIdRef.current) return;

      if (!lessonData || !courseData || lessonData.courseId !== courseId) {
        throw new Error('LESSON_NOT_FOUND');
      }

      if (!lessonData.phaseId) {
        throw new Error('LESSON_PHASE_MISSING');
      }

      const phaseData = await getPhase(lessonData.phaseId);

      if (requestId !== requestIdRef.current) return;

      if (!phaseData || phaseData.courseId !== courseId) {
        throw new Error('INVALID_LESSON_PHASE');
      }

      if (phaseData.locked) {
        setLesson(null);
        setError(
          'This zone is still locked. Complete the earlier zones to continue.',
        );
        return;
      }

      const progress = await listProgressForCourse(courseId);

      if (requestId !== requestIdRef.current) return;

      setLesson(lessonData as LessonData);
      setCourseTitle(courseData.title ?? '');
      setPhaseTitle(phaseData.title ?? '');
      setCompleted(progress.some((item) => item.lessonId === lessonId));
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      console.error('Failed to load lesson', err);
      setLesson(null);
      setError(
        'We couldn’t open this lesson. Check your connection and try again.',
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [courseId, lessonId]);

  useEffect(() => {
    void loadLesson();

    return () => {
      // Invalidates any outstanding load request on route change/unmount.
      requestIdRef.current += 1;
    };
  }, [loadLesson]);

  const keyTerms = useMemo(
    () => parseKeyTerms(lesson?.keyTerms),
    [lesson?.keyTerms],
  );

  const quiz = useMemo(
    () => parseQuiz(lesson?.quiz),
    [lesson?.quiz],
  );

  const content = useMemo(
    () => (lesson?.coreContent ? formatLessonContent(lesson.coreContent) : []),
    [lesson?.coreContent],
  );

  const answeredCount = Object.keys(selectedAnswers).length;

  const quizScore = useMemo(() => {
    if (!quiz.length) return 0;

    return quiz.reduce(
      (score, question, index) =>
        score +
        (selectedAnswers[index] === question.correctIndex ? 1 : 0),
      0,
    );
  }, [quiz, selectedAnswers]);

  const checkedCount = Object.keys(checkedAnswers).length;
  const allQuizChecked = quiz.length === 0 || checkedCount === quiz.length;

  const hasLessonMaterial = content.length > 0 || keyTerms.length > 0 || quiz.length > 0;

  const lessonProgress = useMemo(() => {
    if (completed) return 100;
    if (!hasLessonMaterial) return 0;
    if (!quiz.length) return content.length > 0 ? 100 : 0;

    const contentWeight = content.length > 0 ? 60 : 0;
    const quizWeight = (checkedCount / quiz.length) * 40;

    return Math.min(100, Math.round(contentWeight + quizWeight));
  }, [completed, hasLessonMaterial, quiz.length, content.length, checkedCount]);

  const startGeneration = async () => {
    if (!lesson || generationInFlightRef.current) return;

    const currentLessonId = lesson.id;
    const requestId = requestIdRef.current;

    generationInFlightRef.current = true;
    setGenerating(true);
    setError('');

    try {
      const generated = await generateLessonContent(currentLessonId);

      if (requestId !== requestIdRef.current) return;

      // Some mutation responses return the generated lesson; others may not.
      const refreshed = generated ?? (await getLesson(currentLessonId));

      if (requestId !== requestIdRef.current) return;

      if (!refreshed) {
        throw new Error('LESSON_REFRESH_FAILED');
      }

      setLesson(refreshed as LessonData);

      if ((refreshed as LessonData).status !== 'READY') {
        setError(
          'The lesson is not ready yet. Please wait a moment and try again.',
        );
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      console.error('Failed to generate lesson', err);

      // Re-read persisted state because generation may have succeeded server-side.
      try {
        const refreshed = await getLesson(currentLessonId);

        if (requestId !== requestIdRef.current) return;

        if (refreshed) setLesson(refreshed as LessonData);
      } catch (refreshError) {
        console.error('Failed to refresh lesson after generation error', refreshError);
      }

      if (requestId === requestIdRef.current) {
        setError(
          'We couldn’t prepare this lesson. Please try again in a moment.',
        );
      }
    } finally {
      generationInFlightRef.current = false;

      if (requestId === requestIdRef.current) {
        setGenerating(false);
      }
    }
  };

  const selectAnswer = (questionIndex: number, optionIndex: number) => {
    if (checkedAnswers[questionIndex]) return;

    setSelectedAnswers((current) => ({
      ...current,
      [questionIndex]: optionIndex,
    }));
  };

  const checkAnswer = (questionIndex: number) => {
    if (
      selectedAnswers[questionIndex] === undefined ||
      checkedAnswers[questionIndex]
    ) {
      return;
    }

    setCheckedAnswers((current) => ({
      ...current,
      [questionIndex]: true,
    }));
  };

  const completeLesson = async () => {
    if (
      !courseId ||
      !lessonId ||
      completing ||
      completed ||
      completionInFlightRef.current ||
      !hasLessonMaterial ||
      !allQuizChecked
    ) {
      return;
    }

    completionInFlightRef.current = true;
    setCompleting(true);
    setError('');

    try {
      await markLessonComplete(courseId, lessonId, 10);
      setCompleted(true);
    } catch (err) {
      console.error('Failed to save lesson progress', err);
      setError('We couldn’t save your progress. Please try again.');
    } finally {
      completionInFlightRef.current = false;
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <LoadingState />
    );
  }

  if (error && !lesson) {
    return (
      <ErrorState
        message={error}
        onRetry={() => void loadLesson()}
        backHref={courseId ? `/learn/course/${courseId}` : undefined}
      />
    );
  }

  if (!lesson) {
    return (
      <ErrorState
        message="This lesson could not be loaded. Return to your learning path and try again."
        onRetry={() => void loadLesson()}
        backHref={courseId ? `/learn/course/${courseId}` : undefined}
      />
    );
  }

  if (completed) {
    return (
      <LessonComplete
        lesson={lesson}
        onBack={() => navigate(phaseHref)}
      />
    );
  }

  if (
    lesson.status === 'PENDING' ||
    lesson.status === 'FAILED' ||
    !lesson.status
  ) {
    return (
      <StartLesson
        lesson={lesson}
        onStart={() => void startGeneration()}
        loading={generating}
        error={
          error ||
          (lesson.status === 'FAILED'
            ? 'The lesson couldn’t be generated. You can try again.'
            : '')
        }
      />
    );
  }

  if (lesson.status === 'GENERATING' || generating) {
    return (
      <GenerationState lesson={lesson} />
    );
  }

  if (lesson.status !== 'READY') {
    return (
      <ErrorState
        message="This lesson is not ready yet. Return to the zone and try again."
        onRetry={() => void loadLesson()}
        backHref={phaseHref}
      />
    );
  }

  return (
    <div className="min-h-[100dvh]">
      {/* Sticky lesson header */}
      <header className="sticky top-0 z-20 border-b border-[#263640]/90 bg-[#131F24]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-[1100px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to={phaseHref}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#91A4AC] transition hover:bg-[#1D2A33] hover:text-white"
            aria-label="Back to zone"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-[#687D87]">
              {courseTitle}
              {phaseTitle ? ` · ${phaseTitle}` : ''}
            </p>
            <p className="truncate text-sm font-extrabold text-white">
              {lesson.title}
            </p>
          </div>

          <div className="hidden w-28 shrink-0 sm:block">
            <div
              className="h-1.5 overflow-hidden rounded-full bg-[#263640]"
              role="progressbar"
              aria-label="Lesson progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={lessonProgress}
            >
              <div
                className="h-full rounded-full bg-orange transition-all duration-300"
                style={{ width: `${lessonProgress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Friendly recoverable errors */}
      {error && (
        <div className="mx-auto max-w-3xl px-5 pt-5 sm:px-6">
          <div
            className="flex items-start gap-3 rounded-2xl border border-[#513337] bg-[#2B2226] px-4 py-3 text-sm text-[#FF9A9E]"
            role="alert"
          >
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setError('')}
              className="shrink-0 text-[#9C676B] hover:text-white"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-5 pb-32 pt-10 sm:px-6 sm:pt-14">
        <div className="mb-10">
          <p className="text-sm font-bold text-orange">
            Lesson {lesson.order}
          </p>

          <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
            {lesson.title}
          </h1>

          {lesson.hook && (
            <p className="mt-4 text-base leading-7 text-[#91A4AC] sm:text-lg">
              {lesson.hook}
            </p>
          )}
        </div>

        {/* Core lesson content */}
        {content.length > 0 && (
          <section className="space-y-6">
            {content.map((paragraph, index) => (
              <p
                key={`${index}-${paragraph.slice(0, 20)}`}
                className="text-[17px] leading-8 text-[#C8D3DA]"
              >
                {paragraph}
              </p>
            ))}
          </section>
        )}

        {/* Key terms */}
        {keyTerms.length > 0 && (
          <section className="mt-14">
            <div className="mb-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-orange">
                Key ideas
              </p>
              <h2 className="mt-1 text-2xl font-extrabold text-white">
                Remember these
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {keyTerms.map((item) => (
                <div
                  key={item.term}
                  className="rounded-2xl border border-[#2C3E4A] bg-[#1D2A33] p-5"
                >
                  <h3 className="font-extrabold text-white">{item.term}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#91A4AC]">
                    {item.definition}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quiz */}
        {quiz.length > 0 && (
          <section className="mt-16">
            <div className="mb-7">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-orange">
                Quick check
              </p>
              <h2 className="mt-1 text-2xl font-extrabold text-white">
                See what stuck
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#91A4AC]">
                Choose an answer for each question.
              </p>
            </div>

            <div className="space-y-8">
              {quiz.map((question, questionIndex) => {
                const selected = selectedAnswers[questionIndex];
                const checked = Boolean(checkedAnswers[questionIndex]);
                const correct = selected === question.correctIndex;

                return (
                  <div
                    key={`${questionIndex}-${question.question}`}
                    className="rounded-3xl border border-[#2C3E4A] bg-[#1D2A33] p-5 sm:p-6"
                  >
                    <div className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#263640] text-xs font-extrabold text-orange">
                        {questionIndex + 1}
                      </span>
                      <h3 className="pt-0.5 text-base font-extrabold leading-6 text-white">
                        {question.question}
                      </h3>
                    </div>

                    <div className="mt-5 space-y-2.5">
                      {question.options.map((option, optionIndex) => {
                        const isSelected = selected === optionIndex;
                        const isCorrect = optionIndex === question.correctIndex;

                        return (
                          <button
                            key={`${questionIndex}-${optionIndex}-${option}`}
                            type="button"
                            onClick={() =>
                              selectAnswer(questionIndex, optionIndex)
                            }
                            disabled={checked}
                            className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm font-semibold transition disabled:cursor-default ${getOptionClasses(
                              checked,
                              isSelected,
                              isCorrect,
                            )}`}
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#40515B] text-xs text-[#91A4AC]">
                              {String.fromCharCode(65 + optionIndex)}
                            </span>

                            <span className="flex-1 text-[#D8E0E4]">
                              {option}
                            </span>

                            {checked && isCorrect && (
                              <Check className="h-4 w-4 shrink-0 text-[#3DDC84]" />
                            )}

                            {checked && isSelected && !correct && (
                              <X className="h-4 w-4 shrink-0 text-[#FF5A5F]" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {!checked ? (
                      <button
                        type="button"
                        onClick={() => checkAnswer(questionIndex)}
                        disabled={selected === undefined}
                        className="mt-4 min-h-11 rounded-xl bg-[#263640] px-5 text-sm font-extrabold text-white transition hover:bg-[#30434E] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Check answer
                      </button>
                    ) : (
                      <div
                        className={`mt-4 rounded-xl px-4 py-3 text-sm font-bold ${
                          correct
                            ? 'bg-[#1C3027] text-[#3DDC84]'
                            : 'bg-[#322225] text-[#FF9A9E]'
                        }`}
                        role="status"
                      >
                        {correct
                          ? 'Correct. Nice work.'
                          : `Not quite. The correct answer is “${question.options[question.correctIndex]}”.`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Completion */}
        <div className="mt-14 flex flex-col items-center text-center">
          {quiz.length > 0 && allQuizChecked && (
            <p className="mb-4 text-sm font-bold text-[#91A4AC]">
              You got {quizScore} of {quiz.length} correct.
            </p>
          )}

          <button
            type="button"
            onClick={() => void completeLesson()}
            disabled={
              completing ||
              !allQuizChecked ||
              !hasLessonMaterial
            }
            className="inline-flex min-h-14 min-w-[210px] items-center justify-center gap-2 rounded-2xl bg-orange px-7 font-extrabold text-white shadow-[0_5px_0_#C94D16] transition hover:brightness-105 active:translate-y-[2px] active:shadow-[0_3px_0_#C94D16] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {completing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                Finish lesson
                <CheckCircle2 className="h-5 w-5" />
              </>
            )}
          </button>

          {answeredCount > 0 && quiz.length > 0 && !allQuizChecked && (
            <p className="mt-3 text-xs text-[#687D87]">
              Check all {quiz.length} answers to finish the lesson.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}