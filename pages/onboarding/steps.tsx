import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { ArrowRight, Check, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import {
  COMPREHENSION_MAX_SELECTIONS,
  COMPREHENSION_OPTIONS,
  INTEREST_MAX_SELECTIONS,
  INTEREST_OPTIONS,
  MOTIVATION_MAX_SELECTIONS,
  MOTIVATION_OPTIONS,
  OUTCOME_MAX_SELECTIONS,
  OUTCOME_OPTIONS,
  STARTING_PREFERENCE_OPTIONS,
  TIME_OPTIONS,
} from './constants';

import completeMascot from '../../assets/grokit-complete.png';
import { OptionRow } from './shared';

/* -------------------------------------------------------------------------- */
/* Shared styles                                                              */
/* -------------------------------------------------------------------------- */

const pageClasses = `
  flex min-h-0 flex-1 flex-col bg-[#131F24] text-white
`;

const contentClasses = `
  mx-auto flex min-h-0 w-full max-w-[760px] flex-1 flex-col px-5 sm:px-7 md:px-8
`;

const highlightHeadingClasses = `text-orange`;

const optionsViewportClasses = `
  min-h-0 flex-1 overflow-y-auto overscroll-contain py-4 pr-1 sm:py-5
  [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
`;

const optionsListClasses = `
  mx-auto flex w-full max-w-[620px] flex-col gap-2.5 pb-4 sm:gap-3 sm:pb-5
`;

const continueButtonClasses = `
  group flex min-h-[58px] w-full items-center justify-center gap-2 rounded-full
  bg-orange px-6 py-4 font-sans text-[15px] font-extrabold text-white
  shadow-[0_4px_0_#C94713] transition-all duration-150 hover:brightness-105
  active:translate-y-[2px] active:shadow-none disabled:cursor-wait disabled:opacity-70
  disabled:shadow-none sm:min-h-[60px] sm:text-[16px]
`;

const optionAnimation: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.035, duration: 0.22, ease: 'easeOut' },
  }),
};

function AnimatedOption({ children, index }: { children: ReactNode; index: number }) {
  return (
    <motion.div custom={index} variants={optionAnimation} initial="hidden" animate="visible">
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared question components                                                 */
/* -------------------------------------------------------------------------- */

function QuestionHeader({ children, sub }: { children: ReactNode; sub: string }) {
  return (
    <div className="shrink-0 pt-2 text-center sm:pt-3">
      <h1
        className="
          font-display text-[28px] font-extrabold leading-[1.08] tracking-[-0.02em]
          text-white sm:text-[38px]
        "
      >
        {children}
      </h1>
      <p
        className="
          mx-auto mt-3 max-w-[620px] font-sans text-[14px] font-medium
          leading-relaxed text-[#91A4AC] sm:text-[16px]
        "
      >
        {sub}
      </p>
    </div>
  );
}

function ContinueFooter({
  canContinue,
  onContinue,
}: {
  canContinue: boolean;
  onContinue: () => void;
}) {
  return (
    <div className="shrink-0 w-full pb-5 pt-3 sm:pb-7 sm:pt-4">
      <button type="button" onClick={onContinue} disabled={!canContinue} className={continueButtonClasses}>
        <span>Continue</span>
        <ArrowRight className="h-[18px] w-[18px] transition-transform duration-150 group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}

function SelectionLimitToast({ visible, message }: { visible: boolean; message: string }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="
            fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border
            border-[#3A4B53] bg-[#202F35] px-5 py-3 text-center
            shadow-[0_12px_40px_rgba(0,0,0,0.3)]
          "
        >
          <p className="whitespace-nowrap font-sans text-[12px] font-bold text-[#D8E2E6]">
            {message}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function useSelectionLimitToast(maxSelections: number) {
  const [toastVisible, setToastVisible] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!toastVisible) return;

    const timeout = window.setTimeout(() => setToastVisible(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [toastVisible]);

  const showLimitToast = () => {
    setMessage(`You can choose up to ${maxSelections}.`);
    setToastVisible(true);
  };

  return { toastVisible, showLimitToast, message };
}

/* -------------------------------------------------------------------------- */
/* Custom option input                                                        */
/* -------------------------------------------------------------------------- */

interface CustomOptionInputProps {
  existingOptions: string[];
  selected: string[];
  maxSelections: number;
  onAdd: (value: string, selectImmediately: boolean) => void;
  label?: string;
  placeholder?: string;
}

function CustomOptionInput({
  existingOptions,
  selected,
  maxSelections,
  onAdd,
  label = 'Something else',
  placeholder = 'Tell us what you have in mind',
}: CustomOptionInputProps) {
  const [value, setValue] = useState('');

  const normalizedValue = value.trim();

  const alreadyExists = existingOptions.some(
    (option) => option.toLowerCase() === normalizedValue.toLowerCase(),
  );

  const canAdd = normalizedValue.length > 0 && !alreadyExists;

  const handleAdd = () => {
    if (!canAdd) return;

    onAdd(normalizedValue, selected.length < maxSelections);
    setValue('');
  };

  return (
    <div className="rounded-2xl border border-[#34464E] bg-[#1B2A30] p-4 sm:p-5">
      <div className="flex flex-col gap-3">
        <div>
          <p className="font-sans text-[14px] font-extrabold text-white">{label}</p>
          <p className="mt-1 font-sans text-[12px] font-medium text-[#91A4AC]">
            Add your own answer if none of the options quite fit.
          </p>
        </div>

        <div className="flex items-stretch gap-2">
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleAdd();
              }
            }}
            placeholder={placeholder}
            className="
              min-w-0 flex-1 rounded-xl border border-[#34464E] bg-[#131F24] px-4 py-3
              font-sans text-[13px] font-medium text-white outline-none
              placeholder:text-[#60757E] focus:border-[#60757E]
            "
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            className="
              shrink-0 rounded-xl bg-orange px-4 py-3 font-sans text-[13px] font-extrabold
              text-white transition-all duration-150 hover:brightness-105
              disabled:cursor-not-allowed disabled:opacity-40
            "
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomOptionRow({
  label,
  selected,
  onClick,
  onRemove,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={`
        flex w-full items-center gap-2 rounded-2xl border px-4 py-4
        transition-all duration-150
        ${selected ? 'border-orange bg-orange/10' : 'border-[#34464E] bg-[#202F35]'}
      `}
    >
      <button type="button" onClick={onClick} className="min-w-0 flex-1 text-left">
        <span
          className={`
            font-sans text-[14px] font-extrabold
            ${selected ? 'text-orange' : 'text-white'}
          `}
        >
          {label}
        </span>
      </button>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="
          flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#91A4AC]
          transition-colors hover:bg-white/5 hover:text-white
        "
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared types                                                               */
/* -------------------------------------------------------------------------- */

interface MultiSelectStepProps {
  selected: string[];
  onToggle: (option: string) => void;
  canContinue: boolean;
  onContinue: () => void;
}

interface SingleSelectStepProps {
  selected: string | null;
  onSelect: (value: string) => void;
  canContinue: boolean;
  onContinue: () => void;
}

/* -------------------------------------------------------------------------- */
/* Shared multi-select step                                                   */
/* -------------------------------------------------------------------------- */

interface MultiSelectStepConfig {
  options: readonly string[];
  maxSelections: number;
  sub: string;
  heading: ReactNode;
}

function MultiSelectStep({
  config,
  selected,
  onToggle,
  canContinue,
  onContinue,
}: MultiSelectStepProps & { config: MultiSelectStepConfig }) {
  const { toastVisible, showLimitToast, message } = useSelectionLimitToast(config.maxSelections);

  const builtInOptions = config.options.filter((option) => option !== 'Something else');

  const customOptions = selected.filter(
    (option) => !config.options.includes(option as (typeof config.options)[number]),
  );

  const visibleOptions = [...builtInOptions, ...customOptions];

  const handleToggle = (option: string) => {
    if (!selected.includes(option) && selected.length >= config.maxSelections) {
      showLimitToast();
      return;
    }

    onToggle(option);
  };

  const handleCustomAdd = (value: string, selectImmediately: boolean) => {
    if (selectImmediately || selected.length < config.maxSelections) {
      onToggle(value);
    }
  };

  const handleCustomRemove = (option: string) => {
    if (selected.includes(option)) onToggle(option);
  };

  return (
    <div className={pageClasses}>
      <div className={contentClasses}>
        <QuestionHeader sub={config.sub}>{config.heading}</QuestionHeader>

        <div className={optionsViewportClasses}>
          <div className={optionsListClasses}>
            {visibleOptions.map((option, index) => {
              const isCustom = !config.options.includes(
                option as (typeof config.options)[number],
              );

              return (
                <AnimatedOption key={option} index={index}>
                  {isCustom ? (
                    <CustomOptionRow
                      label={option}
                      selected={selected.includes(option)}
                      onClick={() => handleToggle(option)}
                      onRemove={() => handleCustomRemove(option)}
                    />
                  ) : (
                    <OptionRow
                      label={option}
                      selected={selected.includes(option)}
                      onClick={() => handleToggle(option)}
                    />
                  )}
                </AnimatedOption>
              );
            })}

            <AnimatedOption index={visibleOptions.length}>
              <CustomOptionInput
                existingOptions={visibleOptions}
                selected={selected}
                maxSelections={config.maxSelections}
                onAdd={handleCustomAdd}
              />
            </AnimatedOption>
          </div>
        </div>

        <ContinueFooter canContinue={canContinue} onContinue={onContinue} />
      </div>

      <SelectionLimitToast visible={toastVisible} message={message} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Q1 — Motivation                                                            */
/* -------------------------------------------------------------------------- */

export function MotivationStep(props: MultiSelectStepProps) {
  return (
    <MultiSelectStep
      config={{
        options: MOTIVATION_OPTIONS,
        maxSelections: MOTIVATION_MAX_SELECTIONS,
        sub: 'What would you like Grokit to help you with?',
        heading: (
          <>
            What brings you{' '}
            <span className={highlightHeadingClasses}>here?</span>
          </>
        ),
      }}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Q2 — Interests                                                             */
/* -------------------------------------------------------------------------- */

export function InterestsStep(props: MultiSelectStepProps) {
  return (
    <MultiSelectStep
      config={{
        options: INTEREST_OPTIONS,
        maxSelections: INTEREST_MAX_SELECTIONS,
        sub: 'Pick the topics you naturally enjoy.',
        heading: (
          <>
            What are you{' '}
            <span className={highlightHeadingClasses}>interested in?</span>
          </>
        ),
      }}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Q3 — Starting preference                                                   */
/* -------------------------------------------------------------------------- */

export function StartingPreferenceStep({
  selected,
  onSelect,
  canContinue,
  onContinue,
}: SingleSelectStepProps) {
  return (
    <div className={pageClasses}>
      <div className={contentClasses}>
        <QuestionHeader sub="When learning something new, what works best for you?">
          How do you like to{' '}
          <span className={highlightHeadingClasses}>start?</span>
        </QuestionHeader>

        <div className={optionsViewportClasses}>
          <div className={optionsListClasses}>
            {STARTING_PREFERENCE_OPTIONS.map((option, index) => {
              const isSelected = selected === option.id;

              return (
                <AnimatedOption key={option.id} index={index}>
                  <button
                    type="button"
                    onClick={() => onSelect(option.id)}
                    aria-pressed={isSelected}
                    className={`
                      flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left
                      transition-all duration-150 sm:px-6 sm:py-5
                      ${
                        isSelected
                          ? 'border-orange bg-orange/10'
                          : 'border-[#34464E] bg-[#202F35] hover:bg-[#26383F]'
                      }
                    `}
                  >
                    <span className="min-w-0 flex-1">
                      <span
                        className={`
                          block font-sans text-[15px] font-extrabold sm:text-[16px]
                          ${isSelected ? 'text-orange' : 'text-white'}
                        `}
                      >
                        {option.label}
                      </span>
                      <span
                        className="
                          mt-1 block font-sans text-[12px] font-medium leading-5
                          text-[#91A4AC] sm:text-[13px]
                        "
                      >
                        {option.description}
                      </span>
                    </span>

                    <span
                      className={`
                        flex h-7 w-7 shrink-0 items-center justify-center rounded-full
                        transition-all duration-150
                        ${isSelected ? 'bg-orange' : 'border-2 border-[#60757E]'}
                      `}
                    >
                      {isSelected && <Check className="h-4 w-4 stroke-[3] text-white" />}
                    </span>
                  </button>
                </AnimatedOption>
              );
            })}
          </div>
        </div>

        <ContinueFooter canContinue={canContinue} onContinue={onContinue} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Q4 — Comprehension                                                         */
/* -------------------------------------------------------------------------- */

export function ComprehensionStep(props: MultiSelectStepProps) {
  return (
    <MultiSelectStep
      config={{
        options: COMPREHENSION_OPTIONS,
        maxSelections: COMPREHENSION_MAX_SELECTIONS,
        sub: 'Pick the things that usually help a difficult idea click for you.',
        heading: (
          <>
            What helps you{' '}
            <span className={highlightHeadingClasses}>learn?</span>
          </>
        ),
      }}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Q5 — Outcomes                                                              */
/* -------------------------------------------------------------------------- */

export function OutcomesStep(props: MultiSelectStepProps) {
  return (
    <MultiSelectStep
      config={{
        options: OUTCOME_OPTIONS,
        maxSelections: OUTCOME_MAX_SELECTIONS,
        sub: 'Choose what you’d like your learning to help you do.',
        heading: (
          <>
            What makes learning{' '}
            <span className={highlightHeadingClasses}>worth it?</span>
          </>
        ),
      }}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Q6 — Time                                                                  */
/* -------------------------------------------------------------------------- */

export function TimeStep({
  selected,
  onSelect,
  canContinue,
  onContinue,
}: SingleSelectStepProps) {
  return (
    <div className={pageClasses}>
      <div className={contentClasses}>
        <QuestionHeader sub="Choose the pace that feels realistic for you right now.">
          How much time do you{' '}
          <span className={highlightHeadingClasses}>have?</span>
        </QuestionHeader>

        <div className={optionsViewportClasses}>
          <div
            className="
              mx-auto flex w-full max-w-[620px] flex-col gap-2.5 py-4 sm:gap-3 sm:py-6
            "
          >
            {TIME_OPTIONS.map((option, index) => {
              const isSelected = selected === option.id;

              return (
                <AnimatedOption key={option.id} index={index}>
                  <button
                    type="button"
                    onClick={() => onSelect(option.id)}
                    aria-pressed={isSelected}
                    className={`
                      group flex w-full items-center rounded-2xl px-5 py-4 text-left
                      transition-all duration-200 sm:px-6 sm:py-[18px]
                      ${isSelected ? 'bg-orange' : 'bg-[#202F35] hover:bg-[#26383F]'}
                    `}
                  >
                    {/* Time */}
                    <span
                      className={`
                        w-[82px] shrink-0 font-display text-[14px] font-extrabold
                        sm:w-[96px] sm:text-[15px]
                        ${isSelected ? 'text-white' : 'text-[#91A4AC]'}
                      `}
                    >
                      {option.description}
                    </span>

                    {/* Label */}
                    <span
                      className={`
                        min-w-0 flex-1 font-sans text-[15px] font-extrabold sm:text-[16px]
                        ${isSelected ? 'text-white' : 'text-[#E8EEF0]'}
                      `}
                    >
                      {option.label}
                    </span>

                    {/* Selection indicator */}
                    <span
                      className={`
                        ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full
                        transition-all duration-200
                        ${isSelected ? 'bg-white text-orange' : 'border-2 border-[#60757E]'}
                      `}
                    >
                      {isSelected && <Check className="h-4 w-4 stroke-[3]" />}
                    </span>
                  </button>
                </AnimatedOption>
              );
            })}
          </div>
        </div>

        <ContinueFooter canContinue={canContinue} onContinue={onContinue} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Profile save error popup                                                   */
/* -------------------------------------------------------------------------- */

export function ProfileSaveErrorPopup({
  visible,
  message,
  onRetry,
}: {
  visible: boolean;
  message: string;
  onRetry: () => void;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="
            fixed inset-0 z-[200] flex items-center justify-center bg-[#0B1519]/70
            px-5 backdrop-blur-sm
          "
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="profile-save-error-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="
              w-full max-w-[420px] rounded-3xl border border-[#34464E] bg-[#1B2A30]
              px-6 py-7 text-center shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:px-8 sm:py-8
            "
          >
            <div
              className="
                mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full
                bg-[#3A2924] text-orange
              "
            >
              <X className="h-5 w-5 stroke-[2.5]" />
            </div>

            <h2
              id="profile-save-error-title"
              className="font-display text-[21px] font-extrabold leading-tight text-white"
            >
              We couldn’t save your profile
            </h2>

            <p className="mt-3 font-sans text-[14px] font-medium leading-6 text-[#91A4AC]">
              {message}
            </p>

            <button
              type="button"
              onClick={onRetry}
              className="
                mt-6 flex min-h-[52px] w-full items-center justify-center rounded-full
                bg-orange px-6 py-3.5 font-sans text-[15px] font-extrabold text-white
                shadow-[0_4px_0_#C94713] transition-all duration-150 hover:brightness-105
                active:translate-y-[2px] active:shadow-none
              "
            >
              Try again
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------- */
/* Final screen                                                               */
/* -------------------------------------------------------------------------- */

export function CompleteStep({
  isSaving,
  error,
  onContinue,
}: {
  isSaving: boolean;
  error: string | null;
  onContinue: () => void;
}) {
  return (
    <div className={pageClasses}>
      <div
        className="
          mx-auto flex min-h-0 w-full max-w-[760px] flex-1 flex-col items-center
          px-5 sm:px-7 md:px-8
        "
      >
        <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center text-center">
          <motion.img
            src={completeMascot}
            alt="Grokit celebrating"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }}
            transition={{
              opacity: { duration: 0.3 },
              scale: { duration: 0.3 },
              y: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="
              mb-6 h-[140px] w-[140px] object-contain sm:mb-7 sm:h-[150px] sm:w-[150px]
            "
          />

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.25 }}
            className="
              font-display text-[29px] font-extrabold leading-[1.08] tracking-[-0.02em]
              text-white sm:text-[38px]
            "
          >
            You&apos;re all set!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.11, duration: 0.25 }}
            className="
              mt-3 max-w-[520px] font-sans text-[14px] font-medium leading-[1.55]
              text-[#91A4AC] sm:text-[16px]
            "
          >
            We&apos;ve got a better sense of how you like to learn. Let&apos;s get started.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.25 }}
            className="mt-9 w-full max-w-[600px] sm:mt-11"
          >
            <button
              type="button"
              onClick={onContinue}
              disabled={isSaving}
              className={`${continueButtonClasses} ${isSaving ? 'animate-pulse' : ''}`}
            >
              <span>{isSaving ? 'Saving your profile...' : 'Start learning'}</span>
              {!isSaving && (
                <ArrowRight className="h-[18px] w-[18px] transition-transform duration-150 group-hover:translate-x-0.5" />
              )}
            </button>
          </motion.div>
        </div>
      </div>

      <ProfileSaveErrorPopup
        visible={Boolean(error)}
        message={error ?? ''}
        onRetry={onContinue}
      />
    </div>
  );
}