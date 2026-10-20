import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ChevronDown, Loader2, X } from 'lucide-react';

import {
  readLessonContent,
  readPractice,
  type LessonCard,
  type LessonContent,
} from '../../../amplify/functions/shared/lesson-content';
import { GrokitMascot } from '../../../components/Grokitmascot';
import {
  generateLessonContent,
  getLesson,
  markLessonComplete,
  type LessonCompletionResult,
} from '../../../lib/courseGeneration';
import { refreshGamification, useGamification } from '../../../lib/gamification';
import { sourceFor, useReadAloud, type SpeechSource } from '../../../lib/readAloud';
import { useSettings } from '../../../lib/settings';

import { KIND_LABELS, primaryButton, secondaryButton } from './lessonTheme';
import PracticeView from './PracticeView';
import ReadAloudButton from './ReadAloudButton';
import RichText from './RichText';
import { CompleteScreen, StreakScreen } from './SummaryScreens';
import LessonVisual from './Visuals';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LessonRecord {
  id: string;
  courseId: string;
  phaseId: string;
  order?: number | null;
  title: string;
  hook?: string | null;
  status?: string | null;
  content?: unknown;
  practice?: unknown;
  practiceStatus?: string | null;
  updatedAt?: string | null;
}

interface CardLessonFlowProps {
  lesson: LessonRecord;
  /** The learner already finished this lesson: read-only review, no XP. */
  completedBefore: boolean;
  onLeave: () => void;
}

type Step = 'prediction' | 'cards' | 'review' | 'practice' | 'saving' | 'complete' | 'streak';

type PracticeState = 'ready' | 'pending' | 'failed';

/** The backend lets a stuck practice step restart after this long. */
const STALE_PRACTICE_MS = 345_000;
const PRACTICE_POLL_MS = 2500;

// ─── Component ────────────────────────────────────────────────────────────────

export default function CardLessonFlow({ lesson: initialLesson, completedBefore, onLeave }: CardLessonFlowProps) {
  const reduceMotion = useReducedMotion();
  const {
    supported: speechSupported,
    status: speechStatus,
    notice: speechNotice,
    speak,
    pause,
    resume,
    stop,
  } = useReadAloud();
  const { autoReadAloud } = useSettings();

  const [lesson, setLesson] = useState<LessonRecord>(initialLesson);
  const [reviewOnly, setReviewOnly] = useState(completedBefore);

  const content = useMemo(() => readLessonContent(lesson.content) as LessonContent, [lesson.content]);
  const practice = useMemo(
    () => (lesson.practiceStatus === 'READY' ? readPractice(lesson.practice) : null),
    [lesson.practiceStatus, lesson.practice],
  );

  const [step, setStep] = useState<Step>(
    !completedBefore && content.prediction ? 'prediction' : 'cards',
  );
  const [cardIndex, setCardIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [prediction, setPrediction] = useState<number | null>(null);

  const [result, setResult] = useState<LessonCompletionResult | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [retryingPractice, setRetryingPractice] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);

  const answersRef = useRef<number[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const savingRef = useRef(false);

  // Was today's streak already safe before this lesson? Decides whether the
  // streak screen is worth showing at the end.
  const { stats } = useGamification();
  const streakSafeAtStart = useRef<boolean | null>(null);

  useEffect(() => {
    if (stats && streakSafeAtStart.current === null) {
      streakSafeAtStart.current = stats.streakActiveToday;
    }
  }, [stats]);

  // Full-screen: keep the page underneath from scrolling.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Each new card starts at the top.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [cardIndex, step]);

  // ── Practice readiness ──────────────────────────────────────────────────────

  const practiceState: PracticeState = (() => {
    if (practice && practice.length > 0) return 'ready';
    if (lesson.practiceStatus === 'FAILED') return 'failed';

    if (lesson.practiceStatus === 'GENERATING' && lesson.updatedAt) {
      const updated = Date.parse(lesson.updatedAt);

      if (Number.isFinite(updated) && Date.now() - updated > STALE_PRACTICE_MS) return 'failed';
    }

    return 'pending';
  })();

  // The practice questions are written while the learner reads. Keep checking
  // until they are ready (or have failed), starting from the first card.
  const needsPolling = !reviewOnly && practiceState === 'pending';

  useEffect(() => {
    if (!needsPolling) return;

    let cancelled = false;

    const timer = window.setInterval(async () => {
      try {
        const latest = await getLesson(lesson.id);

        if (cancelled || !latest) return;

        if (latest.practiceStatus === 'READY' || latest.practiceStatus === 'FAILED') {
          setLesson(latest as LessonRecord);
        }
      } catch (error) {
        console.error('Practice status check failed', error);
      }
    }, PRACTICE_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [needsPolling, lesson.id]);

  const retryPractice = useCallback(async () => {
    if (retryingPractice) return;

    setRetryingPractice(true);
    setLesson((current) => ({
      ...current,
      practiceStatus: 'GENERATING',
      updatedAt: new Date().toISOString(),
    }));

    try {
      // The server restarts only the practice step; the cards are untouched.
      await generateLessonContent(lesson.id);
    } catch (error) {
      console.error('Practice retry failed', error);
      setLesson((current) => ({ ...current, practiceStatus: 'FAILED' }));
    } finally {
      setRetryingPractice(false);
    }
  }, [lesson.id, retryingPractice]);

  // ── Navigation ──────────────────────────────────────────────────────────────

  const lastCard = content.cards.length - 1;

  const goNext = useCallback(() => {
    setDirection(1);

    if (cardIndex < lastCard) {
      setCardIndex((value) => value + 1);
    } else {
      setStep('review');
    }
  }, [cardIndex, lastCard]);

  const goBack = useCallback(() => {
    setDirection(-1);

    if (step === 'review') {
      setStep('cards');
      return;
    }

    if (cardIndex > 0) setCardIndex((value) => value - 1);
  }, [cardIndex, step]);

  useEffect(() => {
    if (step !== 'cards' || exitOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === 'ArrowRight') goNext();
      else if (event.key === 'ArrowLeft' && cardIndex > 0) goBack();
    };

    window.addEventListener('keydown', onKey);

    return () => window.removeEventListener('keydown', onKey);
  }, [step, exitOpen, goNext, goBack, cardIndex]);

  const requestExit = () => {
    stop();

    if (reviewOnly || step === 'complete' || step === 'streak') {
      onLeave();
      return;
    }

    setExitOpen(true);
  };

  // ── Finishing ───────────────────────────────────────────────────────────────

  const save = useCallback(
    async (answers: number[]) => {
      if (savingRef.current) return;

      savingRef.current = true;
      answersRef.current = answers;
      setSaveError(false);
      setStep('saving');

      try {
        const saved = await markLessonComplete(lesson.courseId, lesson.id, answers);

        setResult(saved);
        setReviewOnly(true);
        void refreshGamification(true);
        setStep('complete');
      } catch (error) {
        console.error('Failed to save lesson progress', error);
        setSaveError(true);
      } finally {
        savingRef.current = false;
      }
    },
    [lesson.courseId, lesson.id],
  );

  const afterComplete = () => {
    if (!result || result.alreadyCompleted || streakSafeAtStart.current === true) {
      onLeave();
      return;
    }

    setStep('streak');
  };

  const reviewAgain = () => {
    setCardIndex(0);
    setDirection(1);
    setStep('cards');
  };

  // ── Read aloud ──────────────────────────────────────────────────────────────

  const card = content.cards[cardIndex];

  // What is on screen now, and what comes next (fetched quietly so it starts without a wait).
  const { speechSource, upcomingSource } = useMemo(() => {
    const none = { speechSource: null, upcomingSource: null } as {
      speechSource: SpeechSource | null;
      upcomingSource: SpeechSource | null;
    };

    if (step === 'prediction' && content.prediction) {
      return {
        speechSource: sourceFor(content, lesson.id, 'prediction'),
        upcomingSource: sourceFor(content, lesson.id, 'card', 0),
      };
    }

    if (step === 'cards' && card) {
      const isLast = cardIndex + 1 >= content.cards.length;

      return {
        speechSource: sourceFor(content, lesson.id, 'card', cardIndex),
        upcomingSource: isLast
          ? sourceFor(content, lesson.id, 'review')
          : sourceFor(content, lesson.id, 'card', cardIndex + 1),
      };
    }

    if (step === 'review') return { speechSource: sourceFor(content, lesson.id, 'review'), upcomingSource: null };

    return none;
  }, [step, card, cardIndex, content, lesson.id]);

  // New screen: always stop the old voice; start the new one only if auto-read is on.
  useEffect(() => {
    stop();

    // Only get the next screen ready in advance when auto-read is on; otherwise it may never be heard.
    if (autoReadAloud && speechSource) speak(speechSource, upcomingSource);
    // upcomingSource only changes together with speechSource.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechSource, autoReadAloud, speak, stop]);

  // ── Render ──────────────────────────────────────────────────────────────────
  const showHeader = step === 'prediction' || step === 'cards' || step === 'review';

  return (
    <div className="fixed inset-0 z-[55] flex flex-col bg-[#131F24] text-white">
      {showHeader && (
        <header className="mx-auto flex w-full max-w-[720px] items-center gap-4 px-5 pb-2 pt-5">
          <button
            type="button"
            onClick={requestExit}
            aria-label="Leave lesson"
            className="rounded-full p-1.5 text-[#91A4AC] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4611F]/60"
          >
            <X className="h-6 w-6" />
          </button>

          <div
            className="flex flex-1 gap-1.5"
            role="progressbar"
            aria-label="Lesson progress"
            aria-valuemin={0}
            aria-valuemax={content.cards.length}
            aria-valuenow={step === 'cards' ? cardIndex + 1 : step === 'review' ? content.cards.length : 0}
          >
            {content.cards.map((_, index) => {
              const done = step === 'review' || (step === 'cards' && index <= cardIndex);

              return (
                <span
                  key={index}
                  className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
                    done ? 'bg-[#F4611F]' : 'bg-[#263640]'
                  }`}
                />
              );
            })}
          </div>

          {speechSupported && speechSource ? (
            <ReadAloudButton
              status={speechStatus}
              onToggle={() => {
                if (speechStatus === 'idle') speak(speechSource, autoReadAloud ? upcomingSource : null);
                else if (speechStatus === 'speaking') pause();
                else if (speechStatus === 'paused') resume();
                else stop();
              }}
            />
          ) : (
            <span className="w-9" aria-hidden="true" />
          )}
        </header>
      )}

      {showHeader && speechNotice && (
        <p
          role="status"
          className="mx-auto w-full max-w-[720px] px-5 pb-1 text-center text-[13px] font-semibold leading-5 text-[#FFB020]"
        >
          {speechNotice}
        </p>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          {step === 'prediction' && content.prediction && (
            <Screen key="prediction" reduceMotion={reduceMotion} direction={1}>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#F4611F]">
                Quick guess before you start
              </p>
              <h1 className="mt-3 font-display text-3xl font-bold leading-snug text-white sm:text-4xl">
                {content.prediction.question}
              </h1>

              <div className="mt-8 space-y-3" role="radiogroup" aria-label="Your guess">
                {content.prediction.options.map((option, index) => {
                  const picked = prediction === index;

                  return (
                    <button
                      key={index}
                      type="button"
                      role="radio"
                      aria-checked={picked}
                      disabled={prediction !== null}
                      onClick={() => setPrediction(index)}
                      className={`flex w-full items-center rounded-2xl border-2 px-4 py-4 text-left text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F4611F]/25 ${
                        picked
                          ? 'border-[#F4611F] bg-[#32251F]'
                          : 'border-[#2C3E4A] bg-[#18252C] hover:border-[#40535E] disabled:opacity-50'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {prediction !== null && (
                <motion.p
                  className="mt-5 rounded-2xl bg-[#1D2A33] px-4 py-3 text-sm font-semibold text-[#D5DEE3]"
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  Locked in. Watch for the answer as you go.
                </motion.p>
              )}
            </Screen>
          )}

          {step === 'cards' && card && (
            <Screen key={`card-${cardIndex}`} reduceMotion={reduceMotion} direction={direction}>
              <CardView card={card} glossary={content.knowledgeCards} />
            </Screen>
          )}

          {step === 'review' && (
            <Screen key="review" reduceMotion={reduceMotion} direction={1}>
              <ReviewView content={content} prediction={prediction} />
            </Screen>
          )}

          {step === 'practice' && (
            <motion.div
              key="practice"
              className="h-full"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {practiceState === 'ready' && practice ? null : (
                <PracticeWaiting
                  state={practiceState}
                  retrying={retryingPractice}
                  canSkip={lesson.practiceStatus === 'FAILED' && !reviewOnly}
                  onRetry={retryPractice}
                  onSkip={() => void save([])}
                  onBack={() => {
                    setDirection(-1);
                    setStep('review');
                  }}
                />
              )}
            </motion.div>
          )}

          {step === 'saving' && (
            <motion.div
              key="saving"
              className="flex h-full min-h-[60vh] flex-col items-center justify-center px-5 text-center"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {saveError ? (
                <>
                  <GrokitMascot pose="thinking" size={96} />
                  <h2 className="mt-5 font-display text-2xl font-extrabold">We couldn’t save your progress</h2>
                  <p className="mt-2 max-w-sm text-[#91A4AC]">Your answers are safe. Check your connection and try again.</p>
                  <button
                    type="button"
                    onClick={() => void save(answersRef.current)}
                    className={`${primaryButton} mt-6`}
                  >
                    Try again
                  </button>
                </>
              ) : (
                <div role="status" aria-live="polite" className="flex flex-col items-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-[#F4611F]" />
                  <p className="font-display text-lg font-bold">Saving your progress…</p>
                </div>
              )}
            </motion.div>
          )}

          {step === 'complete' && result && (
            <motion.div
              key="complete"
              className="min-h-full"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <CompleteScreen
                lessonTitle={lesson.title}
                xp={result.xp}
                correct={result.correct}
                total={result.total}
                alreadyCompleted={result.alreadyCompleted}
                onContinue={afterComplete}
                onReview={reviewAgain}
              />
            </motion.div>
          )}

          {step === 'streak' && (
            <motion.div
              key="streak"
              className="min-h-full"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <StreakScreen onContinue={onLeave} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {step === 'practice' && practiceState === 'ready' && practice && (
        <div className="absolute inset-0 z-10 bg-[#131F24]">
          <PracticeView
            questions={practice}
            cardTitles={content.cards.map((item) => item.title)}
            onFinish={(answers) => void save(answers)}
            onExit={requestExit}
          />
        </div>
      )}

      {showHeader && (
        <footer className="border-t-2 border-[#263640] bg-[#131F24]">
          <div className="mx-auto flex w-full max-w-[720px] gap-3 px-5 py-4">
            {step === 'prediction' ? (
              <button
                type="button"
                disabled={prediction === null}
                onClick={() => {
                  setDirection(1);
                  setStep('cards');
                }}
                className={`${primaryButton} w-full`}
              >
                Continue
              </button>
            ) : step === 'cards' ? (
              <>
                <button
                  type="button"
                  onClick={goBack}
                  disabled={cardIndex === 0}
                  className={`${secondaryButton} w-[34%]`}
                >
                  <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                  Back
                </button>
                <button type="button" onClick={goNext} className={`${primaryButton} flex-1`}>
                  {cardIndex === lastCard ? 'Continue' : 'Next'}
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={goBack} className={`${secondaryButton} w-[34%]`}>
                  <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (reviewOnly) {
                      onLeave();
                      return;
                    }

                    setDirection(1);
                    setStep('practice');
                  }}
                  className={`${primaryButton} flex-1`}
                >
                  {reviewOnly ? 'Back to zone' : 'Start practice'}
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </footer>
      )}

      {exitOpen && (
        <ExitDialog
          onStay={() => setExitOpen(false)}
          onLeave={() => {
            setExitOpen(false);
            onLeave();
          }}
        />
      )}
    </div>
  );
}

// ─── Pieces ───────────────────────────────────────────────────────────────────

function Screen({
  children,
  reduceMotion,
  direction,
}: {
  children: ReactNode;
  reduceMotion: boolean | null;
  direction: number;
}) {
  return (
    <motion.div
      className="mx-auto w-full max-w-[680px] px-5 pb-10 pt-6 sm:pt-10"
      initial={reduceMotion ? false : { opacity: 0, x: 28 * direction }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -28 * direction }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

function CardView({ card, glossary }: { card: LessonCard; glossary: LessonContent['knowledgeCards'] }) {
  const reflection = card.kind === 'reflection';

  // The picture sits after the opening paragraphs, so the idea is introduced
  // before it is shown. Cards without a picture just read straight through.
  const splitAt = card.visual ? Math.min(2, card.body.length) : card.body.length;

  const renderParagraphs = (paragraphs: string[], offset: number) =>
    paragraphs.map((text, index) => (
      <p key={offset + index} className="mt-4 text-[17px] leading-8 text-[#D5DEE3]">
        <RichText text={text} glossary={glossary} />
      </p>
    ));

  return (
    <article>
      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#F4611F]">
        {KIND_LABELS[card.kind] ?? 'Lesson'}
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">{card.title}</h1>

      {reflection ? (
        <div className="mt-6 rounded-3xl border-2 border-[#2C3E4A] bg-[#1D2A33] p-5 sm:p-6">
          {card.body.map((text, index) => (
            <p
              key={index}
              className={`${index === 0 ? '' : 'mt-3'} text-[17px] leading-8 ${
                index === card.body.length - 1 ? 'font-bold text-white' : 'text-[#D5DEE3]'
              }`}
            >
              <RichText text={text} glossary={glossary} />
            </p>
          ))}
        </div>
      ) : (
        <>
          {renderParagraphs(card.body.slice(0, splitAt), 0)}
          {card.visual && <LessonVisual visual={card.visual} />}
          {renderParagraphs(card.body.slice(splitAt), splitAt)}
        </>
      )}

      {reflection && card.visual && <LessonVisual visual={card.visual} />}
    </article>
  );
}

function ReviewView({ content, prediction }: { content: LessonContent; prediction: number | null }) {
  const guess = content.prediction;
  const [openTerm, setOpenTerm] = useState<number | null>(content.knowledgeCards.length > 0 ? 0 : null);

  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#F4611F]">Recap</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">
        Key ideas from this lesson
      </h1>

      {guess && prediction !== null && (
        <div
          className="mt-6 rounded-3xl border-2 p-5"
          style={{
            borderColor: prediction === guess.correctIndex ? '#2F6B4A' : '#51432B',
            backgroundColor: prediction === guess.correctIndex ? '#1C3027' : '#2D2920',
          }}
        >
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#91A4AC]">Your guess</p>
          <p className="mt-1 font-display text-lg font-bold text-white">
            {prediction === guess.correctIndex
              ? 'You called it!'
              : `You guessed “${guess.options[prediction]}”.`}
          </p>
          <p className="mt-1 text-sm leading-6 text-[#D5DEE3]">
            Answer: <span className="font-bold text-white">{guess.options[guess.correctIndex]}</span>.
            {guess.reveal ? ` ${guess.reveal}` : ''}
          </p>
        </div>
      )}

      {content.knowledgeCards.length > 0 && (
        <ul className="mt-6 space-y-3">
          {content.knowledgeCards.map((item, index) => {
            const open = openTerm === index;

            return (
              <li key={`${item.term}-${index}`} className="overflow-hidden rounded-2xl border-2 border-[#2C3E4A] bg-[#18252C]">
                <button
                  type="button"
                  onClick={() => setOpenTerm(open ? null : index)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F4611F]/25"
                >
                  <span className="font-display text-lg font-bold text-white">{item.term}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-[#91A4AC] transition-transform ${open ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>

                {open && (
                  <div className="border-t border-[#2C3E4A] px-4 pb-4 pt-3">
                    <p className="text-[15px] leading-7 text-[#D5DEE3]">{item.definition}</p>
                    {item.example && (
                      <p className="mt-3 rounded-xl bg-[#131F24] px-3.5 py-2.5 text-sm leading-6 text-[#91A4AC]">
                        <span className="font-extrabold uppercase tracking-wide text-[#F4611F]">Example </span>
                        {item.example}
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function PracticeWaiting({
  state,
  retrying,
  canSkip,
  onRetry,
  onSkip,
  onBack,
}: {
  state: PracticeState;
  retrying: boolean;
  canSkip: boolean;
  onRetry: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  if (state === 'failed') {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-[460px] flex-col items-center justify-center px-5 text-center">
        <GrokitMascot pose="thinking" size={96} />
        <h2 className="mt-5 font-display text-2xl font-extrabold">We couldn’t write your practice</h2>
        <p className="mt-2 text-[#91A4AC]">The lesson itself is fine. Give the practice another go.</p>

        <button type="button" onClick={onRetry} disabled={retrying} className={`${primaryButton} mt-7 w-full`}>
          {retrying ? 'Trying again…' : 'Try again'}
        </button>

        {canSkip && (
          <button type="button" onClick={onSkip} className={`${secondaryButton} mt-3 w-full`}>
            Finish without practice
          </button>
        )}

        <button
          type="button"
          onClick={onBack}
          className="mt-4 min-h-[44px] text-[15px] font-bold text-[#91A4AC] transition-colors hover:text-white"
        >
          Back to recap
        </button>
      </div>
    );
  }

  return (
    <div
      className="mx-auto flex min-h-[70vh] max-w-[460px] flex-col items-center justify-center px-5 text-center"
      role="status"
      aria-live="polite"
    >
      <GrokitMascot pose="thinking" size={96} />
      <h2 className="mt-5 font-display text-2xl font-extrabold">Getting your questions ready…</h2>
      <p className="mt-2 text-[#91A4AC]">Just a moment. They’re being written from what you just read.</p>
      <Loader2 className="mt-6 h-6 w-6 animate-spin text-[#F4611F]" aria-hidden="true" />
    </div>
  );
}

function ExitDialog({ onStay, onLeave }: { onStay: () => void; onLeave: () => void }) {
  const stayRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    stayRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onStay();
    };

    window.addEventListener('keydown', onKey);

    return () => window.removeEventListener('keydown', onKey);
  }, [onStay]);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/65 px-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-title"
        className="w-full max-w-[400px] rounded-3xl border-2 border-[#2C3E4A] bg-[#1D2A33] p-6 text-center"
      >
        <h2 id="exit-title" className="font-display text-2xl font-extrabold text-white">
          Leave this lesson?
        </h2>
        <p className="mt-2 text-[15px] leading-6 text-[#91A4AC]">
          Your progress in this lesson won’t be saved.
        </p>

        <button ref={stayRef} type="button" onClick={onStay} className={`${primaryButton} mt-6 w-full`}>
          Keep learning
        </button>
        <button
          type="button"
          onClick={onLeave}
          className="mt-3 min-h-[44px] w-full text-[15px] font-bold text-[#FF5A5F] transition-colors hover:text-[#FF8084]"
        >
          Leave lesson
        </button>
      </div>
    </div>
  );
}