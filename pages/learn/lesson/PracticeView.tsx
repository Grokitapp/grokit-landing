import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, X } from 'lucide-react';

import type { PracticeQuestion } from '../../../amplify/functions/shared/lesson-content';
import { playSound } from '../../../lib/sounds';
import { COLORS } from './lessonTheme';

interface PracticeViewProps {
  questions: PracticeQuestion[];
  /** Titles of the lesson's cards, used for "covered in" hints. */
  cardTitles: string[];
  /** Called once with the option picked for each question, in order. */
  onFinish: (answers: number[]) => void;
  onExit: () => void;
}

const RIGHT_TITLES = ['That’s right!', 'Nicely done!', 'Spot on!', 'Exactly!', 'You got it!'];
const WRONG_TITLES = ['Not quite.', 'Close, but not quite.', 'Not this time.'];

const TYPE_LABELS: Record<PracticeQuestion['type'], string> = {
  fill: 'Fill in the blank',
  mcq: 'Quick question',
  scenario: 'Real-world scenario',
};

export default function PracticeView({ questions, cardTitles, onFinish, onExit }: PracticeViewProps) {
  const reduceMotion = useReducedMotion();

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);

  const question = questions[index];
  const isLast = index === questions.length - 1;
  const isCorrect = checked && selected === question.correctIndex;

  const check = () => {
    if (selected === null || checked) return;

    setAnswers((current) => [...current, selected]);
    setChecked(true);
    playSound(selected === question.correctIndex ? 'correct' : 'wrong');
  };

  const next = () => {
    if (!checked) return;

    if (isLast) {
      // `answers` already holds this question's pick (added in check()).
      onFinish(answers);
      return;
    }

    setIndex((value) => value + 1);
    setSelected(null);
    setChecked(false);
  };

  // Keyboard: 1-4 pick an option, Enter checks or continues.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;

      if (event.key === 'Enter') {
        event.preventDefault();
        if (checked) next();
        else check();
        return;
      }

      const number = Number(event.key);

      if (!checked && number >= 1 && number <= question.options.length) {
        setSelected(number - 1);
      }
    };

    window.addEventListener('keydown', onKey);

    return () => window.removeEventListener('keydown', onKey);
    // check/next close over the state above, so re-bind when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, selected, index, answers, question]);

  const progress = (index + (checked ? 1 : 0)) / questions.length;

  const [before, after] = useMemo(() => {
    if (question.type !== 'fill') return [question.prompt, ''];

    const at = question.prompt.indexOf('____');

    return at === -1
      ? [question.prompt, '']
      : [question.prompt.slice(0, at), question.prompt.slice(at + 4)];
  }, [question]);

  const coveredIn =
    !isCorrect && checked && question.cardIndex !== null ? cardTitles[question.cardIndex] : undefined;

  return (
    <div className="flex h-full flex-col">
      <header className="mx-auto flex w-full max-w-[720px] items-center gap-4 px-5 pb-2 pt-5">
        <button
          type="button"
          onClick={onExit}
          aria-label="Leave lesson"
          className="rounded-full p-1.5 text-[#91A4AC] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4611F]/60"
        >
          <X className="h-6 w-6" />
        </button>

        <div
          className="h-3 flex-1 overflow-hidden rounded-full bg-[#263640]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-valuenow={index + (checked ? 1 : 0)}
          aria-label="Practice progress"
        >
          <motion.div
            className="h-full rounded-full bg-[#F4611F]"
            initial={false}
            animate={{ width: `${Math.max(progress, 0.03) * 100}%` }}
            transition={{ duration: reduceMotion ? 0 : 0.35 }}
          />
        </div>

        <span className="w-10 text-right text-sm font-bold text-[#91A4AC]">
          {index + 1}/{questions.length}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            className="mx-auto w-full max-w-[640px] px-5 pb-8 pt-6 sm:pt-10"
            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#F4611F]">
              {TYPE_LABELS[question.type]}
            </p>

            <h2 className="mt-3 font-display text-2xl font-bold leading-snug text-white sm:text-[28px]">
              {question.type === 'fill' ? (
                <>
                  {before}
                  <span
                    className="mx-1 inline-block min-w-[84px] rounded-lg border-2 border-dashed px-2.5 py-0.5 text-center align-baseline"
                    style={{
                      borderColor: checked ? (isCorrect ? COLORS.success : COLORS.error) : COLORS.borderStrong,
                      color: selected === null ? 'transparent' : '#FFFFFF',
                      backgroundColor: selected === null ? 'transparent' : COLORS.card,
                    }}
                  >
                    {selected === null ? '____' : question.options[selected]}
                  </span>
                  {after}
                </>
              ) : (
                question.prompt
              )}
            </h2>

            <div className="mt-7 space-y-3" role="radiogroup" aria-label="Answer options">
              {question.options.map((option, optionIndex) => {
                const picked = selected === optionIndex;
                const right = checked && optionIndex === question.correctIndex;
                const wrong = checked && picked && !right;

                let style = 'border-[#2C3E4A] bg-[#18252C] hover:border-[#40535E]';
                if (right) style = 'border-[#3DDC84] bg-[#1C3027]';
                else if (wrong) style = 'border-[#FF5A5F] bg-[#322225]';
                else if (picked) style = 'border-[#F4611F] bg-[#32251F]';
                else if (checked) style = 'border-[#2C3E4A] bg-[#18252C] opacity-50';

                return (
                  <button
                    key={optionIndex}
                    type="button"
                    role="radio"
                    aria-checked={picked}
                    disabled={checked}
                    onClick={() => setSelected(optionIndex)}
                    className={`flex w-full items-center gap-3.5 rounded-2xl border-2 px-4 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F4611F]/25 ${style}`}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-[13px] font-extrabold"
                      style={{
                        borderColor: right ? COLORS.success : wrong ? COLORS.error : picked ? COLORS.orange : COLORS.borderStrong,
                        color: right ? COLORS.success : wrong ? COLORS.error : picked ? COLORS.orange : COLORS.muted,
                      }}
                      aria-hidden="true"
                    >
                      {optionIndex + 1}
                    </span>
                    <span className="flex-1 text-base font-semibold leading-6 text-white">{option}</span>
                    {right && <Check className="h-5 w-5 shrink-0 text-[#3DDC84]" aria-hidden="true" />}
                    {wrong && <X className="h-5 w-5 shrink-0 text-[#FF5A5F]" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <footer
        className="border-t-2 transition-colors"
        style={{
          backgroundColor: checked ? (isCorrect ? COLORS.successBg : COLORS.errorBg) : COLORS.page,
          borderColor: checked ? (isCorrect ? COLORS.successLine : COLORS.errorLine) : COLORS.border,
        }}
      >
        <div className="mx-auto w-full max-w-[640px] px-5 py-4">
          <AnimatePresence initial={false}>
            {checked && (
              <motion.div
                key="feedback"
                role="status"
                aria-live="polite"
                className="mb-4 flex gap-3"
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: isCorrect ? COLORS.success : COLORS.error }}
                >
                  {isCorrect ? (
                    <Check className="h-5 w-5 text-[#0E2418]" aria-hidden="true" />
                  ) : (
                    <X className="h-5 w-5 text-[#2A0F11]" aria-hidden="true" />
                  )}
                </span>

                <div className="min-w-0">
                  <p
                    className="font-display text-xl font-extrabold"
                    style={{ color: isCorrect ? COLORS.success : COLORS.error }}
                  >
                    {isCorrect
                      ? RIGHT_TITLES[index % RIGHT_TITLES.length]
                      : WRONG_TITLES[index % WRONG_TITLES.length]}
                  </p>

                  {!isCorrect && (
                    <p className="mt-0.5 text-sm font-bold text-white">
                      Correct answer: {question.options[question.correctIndex]}
                    </p>
                  )}

                  {question.explanation && (
                    <p className="mt-1 text-sm leading-6 text-[#D5DEE3]">{question.explanation}</p>
                  )}

                  {coveredIn && (
                    <p className="mt-1.5 text-[13px] font-semibold text-[#91A4AC]">
                      Covered in “{coveredIn}”
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {checked ? (
            <button
              type="button"
              onClick={next}
              className="flex min-h-[52px] w-full items-center justify-center rounded-2xl font-display text-[17px] font-bold tracking-wide transition-all active:translate-y-[3px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
              style={{
                backgroundColor: isCorrect ? COLORS.success : COLORS.error,
                color: isCorrect ? '#0E2418' : '#2A0F11',
                boxShadow: `0 4px 0 ${isCorrect ? '#2A9C5D' : '#B83B40'}`,
              }}
            >
              {isLast ? 'Finish' : 'Continue'}
            </button>
          ) : (
            <button
              type="button"
              onClick={check}
              disabled={selected === null}
              className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[#F4611F] font-display text-[17px] font-bold tracking-wide text-white shadow-[0_4px_0_#C94D16] transition-all hover:brightness-105 active:translate-y-[3px] active:shadow-[0_1px_0_#C94D16] disabled:cursor-not-allowed disabled:bg-[#263640] disabled:text-[#687D87] disabled:shadow-[0_4px_0_#1B2A31] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F4611F]/30"
            >
              Check
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}