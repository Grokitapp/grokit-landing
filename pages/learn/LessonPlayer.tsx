import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Link, useNavigate, useParams } from 'react-router';

import AppShell from './AppShell';
import { GrokitMascot } from '../../components/Grokitmascot';
import {
  generateLessonContent,
  getCourse,
  getLesson,
  getPhase,
  listProgressForCourse,
  markLessonComplete,
} from '../../lib/courseGeneration';

type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

type KeyTerm = {
  term: string;
  definition: string;
};

type LessonStatus =
  | 'PENDING'
  | 'GENERATING'
  | 'READY'
  | 'FAILED'
  | string;

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

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return error instanceof Error
    ? error.message
    : fallback;
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

function LoadingState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-7 w-7 animate-spin text-orange" />
        <p className="text-sm font-semibold text-[#91A4AC]">
          Opening your lesson…
        </p>
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
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
}: {
  lesson: LessonData;
  onStart: () => void;
  loading: boolean;
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
              Start lesson
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
            <span className="font-bold text-white">
              {lesson.title}
            </span>
            .
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
          Back to path
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

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
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [checkedAnswers, setCheckedAnswers] = useState<Record<number, boolean>>({});
  const [completed, setCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);

  const loadLesson = useCallback(async () => {
    if (!courseId || !lessonId) {
      setError('This lesson could not be found.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const [lessonData, courseData] = await Promise.all([
        getLesson(lessonId),
        getCourse(courseId),
      ]);

      if (!lessonData) throw new Error('Lesson not found.');

      if (lessonData.courseId !== courseId) {
        throw new Error(
          'This lesson does not belong to the selected course.',
        );
      }

      if (!courseData) throw new Error('Course not found.');

      setLesson(lessonData as LessonData);
      setCourseTitle(courseData.title ?? '');

      if (lessonData.phaseId) {
        const phaseData = await getPhase(lessonData.phaseId);

        if (phaseData && phaseData.courseId !== courseId) {
          throw new Error(
            'This lesson belongs to an invalid phase.',
          );
        }

        setPhaseTitle(phaseData?.title ?? '');
      }

      const progress = await listProgressForCourse(courseId);
      const alreadyComplete = progress.some(
        (item) => item.lessonId === lessonId,
      );

      setCompleted(alreadyComplete);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          'Unable to load this lesson.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [courseId, lessonId]);

  useEffect(() => {
    void loadLesson();
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
    () =>
      lesson?.coreContent
        ? formatLessonContent(lesson.coreContent)
        : [],
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

  const lessonProgress = useMemo(() => {
    if (!lesson) return 0;

    if (!quiz.length || completed) {
      return content.length > 0 || completed ? 100 : 0;
    }

    return Math.min(
      100,
      Math.round(
        (content.length > 0 ? 60 : 0) +
          (answeredCount / quiz.length) * 40,
      ),
    );
  }, [lesson, quiz.length, content.length, answeredCount, completed]);

  const startGeneration = async () => {
    if (!lesson) return;

    try {
      setGenerating(true);
      setError('');

      const generated = await generateLessonContent(lesson.id);

      if (generated) {
        setLesson(generated as LessonData);
      } else {
        const refreshed = await getLesson(lesson.id);

        if (!refreshed) {
          throw new Error(
            'The lesson was generated, but could not be loaded.',
          );
        }

        setLesson(refreshed as LessonData);
      }
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          'Unable to generate this lesson.',
        ),
      );

      /**
       * Refresh the persisted lesson state.
       *
       * The backend now changes a failed generation
       * from GENERATING to FAILED and stores generationError.
       */
      try {
        const refreshed = await getLesson(lesson.id);

        if (refreshed) {
          setLesson(refreshed as LessonData);
        }
      } catch {
        // Keep the original generation error visible.
      }
    } finally {
      setGenerating(false);
    }
  };

  const selectAnswer = (
    questionIndex: number,
    optionIndex: number,
  ) => {
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
    if (!courseId || !lessonId || completing || completed) return;

    if (
      quiz.length > 0 &&
      Object.keys(checkedAnswers).length < quiz.length
    ) {
      return;
    }

    try {
      setCompleting(true);
      setError('');

      await markLessonComplete(courseId, lessonId, 10);

      setCompleted(true);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          'Unable to save your progress.',
        ),
      );
    } finally {
      setCompleting(false);
    }
  };

  const checkedCount = Object.keys(checkedAnswers).length;
  const allQuizChecked =
    quiz.length === 0 || checkedCount === quiz.length;

  if (loading) {
    return (
      <AppShell>
        <LoadingState />
      </AppShell>
    );
  }

  if (error && !lesson) {
    return (
      <AppShell>
        <ErrorState
          message={error}
          onRetry={() => void loadLesson()}
        />
      </AppShell>
    );
  }

  if (!lesson) {
    return (
      <AppShell>
        <ErrorState
          message="This lesson could not be loaded."
          onRetry={() => void loadLesson()}
        />
      </AppShell>
    );
  }

  if (completed) {
    return (
      <AppShell>
        <LessonComplete
          lesson={lesson}
          onBack={() =>
            navigate(
              `/learn/course/${courseId}/phase/${lesson.phaseId}`,
            )
          }
        />
      </AppShell>
    );
  }

  if (lesson.status === 'PENDING' || lesson.status === 'FAILED') {
    const generationError =
      error || lesson.generationError || '';

    return (
      <AppShell>
        {generationError && (
          <div className="mx-auto max-w-2xl px-5 pt-6">
            <div className="rounded-2xl border border-[#513337] bg-[#2B2226] px-4 py-3 text-sm text-[#FF9A9E]">
              {generationError}
            </div>
          </div>
        )}

        <StartLesson
          lesson={lesson}
          onStart={() => void startGeneration()}
          loading={generating}
        />
      </AppShell>
    );
  }

  if (lesson.status === 'GENERATING' || generating) {
    return (
      <AppShell>
        <GenerationState lesson={lesson} />
      </AppShell>
    );
  }

  /**
   * Only READY lessons should reach the lesson player.
   *
   * This prevents malformed/unknown backend states from
   * being rendered as if they contained valid content.
   */
  if (lesson.status !== 'READY') {
    return (
      <AppShell>
        <ErrorState
          message={
            lesson.generationError ||
            'This lesson is not ready yet.'
          }
          onRetry={() => void loadLesson()}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-[100dvh]">
        {/* Top bar */}

        <header className="sticky top-0 z-20 border-b border-[#263640]/90 bg-[#131F24]/95 backdrop-blur-md">
          <div className="mx-auto flex h-[72px] max-w-[1100px] items-center gap-4 px-4 sm:px-6 lg:px-8">
            <Link
              to={`/learn/course/${courseId}/phase/${lesson.phaseId}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#91A4AC] transition hover:bg-[#1D2A33] hover:text-white"
              aria-label="Back to phase"
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
              <div className="h-1.5 overflow-hidden rounded-full bg-[#263640]">
                <div
                  className="h-full rounded-full bg-orange transition-all duration-300"
                  style={{ width: `${lessonProgress}%` }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Error banner */}

        {error && (
          <div className="mx-auto max-w-3xl px-5 pt-5 sm:px-6">
            <div className="flex items-start gap-3 rounded-2xl border border-[#513337] bg-[#2B2226] px-4 py-3 text-sm text-[#FF9A9E]">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />

              <span>{error}</span>

              <button
                type="button"
                onClick={() => setError('')}
                className="ml-auto shrink-0 text-[#9C676B] hover:text-white"
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Lesson content */}

        <main className="mx-auto max-w-3xl px-5 pb-32 pt-10 sm:px-6 sm:pt-14">
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

          {/* Core lesson */}

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
                    <h3 className="font-extrabold text-white">
                      {item.term}
                    </h3>

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
                  const checked = checkedAnswers[questionIndex];
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
                          const isCorrect =
                            optionIndex === question.correctIndex;

                          const classes = getOptionClasses(
                            checked,
                            isSelected,
                            isCorrect,
                          );

                          return (
                            <button
                              key={`${questionIndex}-${optionIndex}-${option}`}
                              type="button"
                              onClick={() =>
                                selectAnswer(questionIndex, optionIndex)
                              }
                              disabled={checked}
                              className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm font-semibold transition ${classes}`}
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

          {/* Complete */}

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
                (!content.length && !quiz.length)
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
          </div>
        </main>
      </div>
    </AppShell>
  );
}

function getOptionClasses(
  checked: boolean | undefined,
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