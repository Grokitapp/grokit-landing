import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Clock, Layers, ListChecks, X, Zap } from 'lucide-react';

import {
  BASE_LESSON_XP,
  MAX_ACCURACY_BONUS,
} from '../../../amplify/functions/shared/lesson-content';
import type { LessonPreview } from '../../../lib/courseGeneration';

import grokitMascot from '../../../assets/grokit-hero-mascot.png';
import grokitComplete from '../../../assets/grokit-complete.png';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LessonMeta {
  id: string;
  title: string;
  hook: string;
  hasContent: boolean;
  completed: boolean;
  zoneTitle: string;
  /** 1-based position of this lesson inside its zone. */
  lessonNumber: number;
  lessonCount: number;
}

interface LessonGenerateModalProps {
  lesson: LessonMeta;
  onClose: () => void;
  onStart: (lessonId: string) => void;
  /** Makes sure the lesson exists (writing it if needed) and describes it. */
  onGenerate: (lessonId: string) => Promise<LessonPreview | null>;
}

type Phase = 'working' | 'ready' | 'failed';

// ─── Copy ─────────────────────────────────────────────────────────────────────

/**
 * What the lesson writer really does, in order. The timing is an estimate, not
 * live progress, so these describe the work without claiming a percentage.
 */
const WORKING_STEPS = [
  'Reading your journey…',
  'Choosing the clearest examples…',
  'Writing your cards…',
  'Drawing the visuals…',
  'Adding the finishing touches…',
];

const SECONDS_PER_STEP = 7;
const SLOW_AFTER_SECONDS = 50;

// ─── Styles ───────────────────────────────────────────────────────────────────

const overlayClasses =
  'fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5 backdrop-blur-[2px]';

const dialogClasses =
  'relative w-full max-w-[520px] max-h-[calc(100dvh-2.5rem)] overflow-y-auto rounded-3xl bg-[#FDF9EC] p-7 text-[#131F24] shadow-2xl outline-none sm:p-8';

const closeButtonClasses =
  'absolute right-5 top-5 rounded-full p-1 text-[#60757E] transition-colors hover:text-[#131F24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4611F]/50';

const eyebrowClasses =
  'mb-2 pr-10 font-sans text-xs font-extrabold uppercase tracking-[0.14em] text-[#C1531E]';

const titleClasses =
  'mb-3 pr-8 font-display text-2xl font-extrabold leading-tight sm:text-[28px]';

const hookClasses =
  'mb-7 line-clamp-3 font-sans text-[15px] leading-relaxed text-[#5A4A3A] sm:text-base';

const chipClasses =
  'inline-flex items-center gap-1.5 rounded-full bg-[#F3EAD3] px-3 py-1.5 font-sans text-[13px] font-bold text-[#5A4A3A]';

const primaryButtonClasses =
  'flex min-h-[54px] w-full items-center justify-center rounded-full bg-[#F4611F] font-display text-[17px] font-bold tracking-wide text-white shadow-[0_4px_0_#C94D16] transition-all hover:brightness-105 active:translate-y-[3px] active:shadow-[0_1px_0_#C94D16] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F4611F]/30';

const textButtonClasses =
  'mt-3 flex min-h-[44px] w-full items-center justify-center rounded-full font-sans text-[15px] font-bold text-[#5A4A3A] transition-colors hover:text-[#131F24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4611F]/40';

const panelClasses = 'flex min-h-[230px] flex-col items-center justify-center';

// ─── Component ────────────────────────────────────────────────────────────────

export default function LessonGenerateModal({
  lesson,
  onClose,
  onStart,
  onGenerate,
}: LessonGenerateModalProps) {
  const reduceMotion = useReducedMotion();

  const [phase, setPhase] = useState<Phase>(lesson.hasContent ? 'ready' : 'working');
  const [preview, setPreview] = useState<LessonPreview | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const dialogRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);

  // Ask for the lesson. For one that already exists this answers straight
  // away, which also lets the server finish any missing practice questions.
  useEffect(() => {
    const hadContent = lesson.hasContent;
    let cancelled = false;

    if (!hadContent) {
      setPhase('working');
      setElapsed(0);
    }

    onGenerate(lesson.id)
      .then((result) => {
        if (cancelled) return;
        setPreview(result);
        setPhase('ready');
      })
      .catch(() => {
        // A lesson that was already readable stays startable even if this
        // background check failed; only a lesson we were writing can fail here.
        if (!cancelled && !hadContent) setPhase('failed');
      });

    return () => {
      cancelled = true;
    };
    // hasContent is read once per attempt on purpose: it flips to true when
    // generation finishes, and that must not restart the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id, attempt]);

  // Count seconds while the lesson is being written.
  useEffect(() => {
    if (phase !== 'working') return;

    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);

    return () => window.clearInterval(timer);
  }, [phase]);

  // Dialog basics: lock page scroll, take focus, give it back on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  // When the lesson becomes ready, put focus on the main action.
  useEffect(() => {
    if (phase === 'ready') startRef.current?.focus();
  }, [phase]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    );

    if (!focusable || focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const eyebrow = [
    lesson.zoneTitle,
    lesson.lessonNumber > 0 && lesson.lessonCount > 0
      ? `Lesson ${lesson.lessonNumber} of ${lesson.lessonCount}`
      : '',
  ]
    .filter(Boolean)
    .join(' · ');

  const stepIndex = Math.min(Math.floor(elapsed / SECONDS_PER_STEP), WORKING_STEPS.length - 1);

  return (
    <div
      className={overlayClasses}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lesson-popup-title"
        aria-describedby="lesson-popup-hook"
        tabIndex={-1}
        className={dialogClasses}
        onKeyDown={handleKeyDown}
        initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        <button type="button" onClick={onClose} aria-label="Close" className={closeButtonClasses}>
          <X className="h-5 w-5" />
        </button>

        {eyebrow && <p className={eyebrowClasses}>{eyebrow}</p>}
        <h2 id="lesson-popup-title" className={titleClasses}>
          {lesson.title}
        </h2>
        {lesson.hook && (
          <p id="lesson-popup-hook" className={hookClasses}>
            {lesson.hook}
          </p>
        )}

        {/*
          No `initial={false}` here: it makes everything inside start at the END of
          its animation, which would freeze the mascot and the progress bar.
        */}
        <AnimatePresence mode="wait">
          {phase === 'working' && (
            <WorkingPanel
              key="working"
              reduceMotion={Boolean(reduceMotion)}
              step={WORKING_STEPS[stepIndex]}
              slow={elapsed >= SLOW_AFTER_SECONDS}
            />
          )}

          {phase === 'ready' && (
            <ReadyPanel
              key="ready"
              reduceMotion={Boolean(reduceMotion)}
              completed={lesson.completed}
              preview={preview}
              startRef={startRef}
              onStart={() => onStart(lesson.id)}
            />
          )}

          {phase === 'failed' && (
            <FailedPanel
              key="failed"
              reduceMotion={Boolean(reduceMotion)}
              onRetry={() => setAttempt((value) => value + 1)}
              onClose={onClose}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ─── Panels ───────────────────────────────────────────────────────────────────

function panelMotion(reduceMotion: boolean) {
  return {
    initial: reduceMotion ? false : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 },
    transition: { duration: 0.18 },
  } as const;
}

function WorkingPanel({
  reduceMotion,
  step,
  slow,
}: {
  reduceMotion: boolean;
  step: string;
  slow: boolean;
}) {
  return (
    <motion.div className={panelClasses} {...panelMotion(reduceMotion)}>
      <motion.img
        src={grokitMascot}
        alt=""
        className="h-20 w-20 object-contain"
        animate={reduceMotion ? undefined : { y: [0, -8, 0], rotate: [0, -3, 3, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="mt-1 h-1.5 w-12 rounded-full bg-[#131F24]/10"
        animate={reduceMotion ? undefined : { scaleX: [1, 0.7, 1], opacity: [0.9, 0.5, 0.9] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="mt-5 flex min-h-[24px] items-center" role="status" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={step}
            className="text-center font-sans text-[15px] font-bold"
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {step}
          </motion.p>
        </AnimatePresence>
      </div>

      <div
        className="relative mt-4 h-2 w-full overflow-hidden rounded-full bg-[#E5DCC8]"
        aria-hidden="true"
      >
        <motion.div
          className="absolute inset-y-0 left-0 w-2/5 rounded-full bg-[#F4611F]"
          animate={reduceMotion ? undefined : { x: ['-100%', '250%'] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <p className="mt-4 text-center font-sans text-sm leading-relaxed text-[#8A7A6A]">
        {slow
          ? 'Still working. Some lessons take a little longer.'
          : 'Usually under a minute. You can close this and we’ll keep going.'}
      </p>
    </motion.div>
  );
}

function Chip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className={chipClasses}>
      {icon}
      {children}
    </span>
  );
}

function ReadyPanel({
  reduceMotion,
  completed,
  preview,
  startRef,
  onStart,
}: {
  reduceMotion: boolean;
  completed: boolean;
  preview: LessonPreview | null;
  startRef: RefObject<HTMLButtonElement | null>;
  onStart: () => void;
}) {
  const iconClasses = 'h-3.5 w-3.5';

  return (
    <motion.div className={panelClasses} {...panelMotion(reduceMotion)}>
      <motion.img
        src={grokitComplete}
        alt=""
        className="h-20 w-20 object-contain"
        initial={reduceMotion ? false : { scale: 0.6, rotate: -8 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 15 }}
      />

      <p className="mt-3 text-center font-display text-xl font-extrabold">
        {completed ? 'You’ve completed this lesson' : 'Your lesson is ready'}
      </p>

      <div className="mb-6 mt-4 flex min-h-[36px] flex-wrap items-center justify-center gap-2">
        {preview && (
          <>
            {preview.format === 'cards' && preview.cards > 0 && (
              <Chip icon={<Layers className={iconClasses} aria-hidden="true" />}>
                {preview.cards} cards
              </Chip>
            )}
            {preview.questions > 0 && (
              <Chip icon={<ListChecks className={iconClasses} aria-hidden="true" />}>
                {preview.questions} {preview.questions === 1 ? 'question' : 'questions'}
              </Chip>
            )}
            <Chip icon={<Clock className={iconClasses} aria-hidden="true" />}>
              {preview.format === 'article' ? `About ${preview.minutes} min read` : `About ${preview.minutes} min`}
            </Chip>
            {!completed && (
              <Chip icon={<Zap className={iconClasses} aria-hidden="true" />}>
                +{BASE_LESSON_XP}–{BASE_LESSON_XP + MAX_ACCURACY_BONUS} XP
              </Chip>
            )}
          </>
        )}
      </div>

      <button ref={startRef} type="button" onClick={onStart} className={primaryButtonClasses}>
        {completed ? 'Review lesson' : 'Start lesson'}
      </button>
    </motion.div>
  );
}

function FailedPanel({
  reduceMotion,
  onRetry,
  onClose,
}: {
  reduceMotion: boolean;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div className={panelClasses} {...panelMotion(reduceMotion)} role="alert">
      <img src={grokitMascot} alt="" className="h-16 w-16 object-contain opacity-60 grayscale" />

      <p className="mt-4 text-center font-display text-xl font-extrabold">
        We couldn’t build this lesson
      </p>
      <p className="mb-6 mt-2 text-center font-sans text-[15px] leading-relaxed text-[#5A4A3A]">
        Your journey is safe. Give it another go.
      </p>

      <button type="button" onClick={onRetry} className={primaryButtonClasses}>
        Try again
      </button>
      <button type="button" onClick={onClose} className={textButtonClasses}>
        Close
      </button>
    </motion.div>
  );
}