import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import type { KeyboardEvent } from 'react';

import { GrokitMascot, type MascotPose } from '../../components/Grokitmascot';

/* -------------------------------------------------------------------------- */
/* PROGRESS                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Matches the Welcome screen exactly.
 *
 * Mobile:  top 28px, gap 16px
 * sm+:     top 32px, gap 20px
 * Active:  32 x 12px
 * Inactive: 12 x 12px
 */
export function ProgressBar({ value }: { value: number }) {
  const activeStep = Math.min(7, Math.max(1, Math.round(value)));

  return (
    <div
      className="absolute left-1/2 top-7 z-40 flex -translate-x-1/2 items-center gap-4 sm:top-8 sm:gap-5"
      aria-label={`Onboarding progress: step ${activeStep} of 7`}
    >
      {Array.from({ length: 7 }, (_, index) => {
        const isActive = index + 1 === activeStep;

        return (
          <span
            key={index}
            aria-hidden="true"
            className={
              isActive
                ? 'block h-[12px] w-[32px] shrink-0 rounded-full bg-orange'
                : 'block h-[12px] w-[12px] shrink-0 rounded-full bg-[#304553]'
            }
          />
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* CONTINUE                                                                   */
/* -------------------------------------------------------------------------- */

const continueButtonClasses = `
  group w-full min-h-[58px] px-8 py-4 rounded-full bg-orange text-white
  font-sans font-extrabold text-base sm:text-lg flex items-center justify-center gap-2
  shadow-[0_4px_0_#C94713] hover:brightness-105 active:translate-y-[2px] active:shadow-none
  transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none
`;

interface ContinueButtonProps {
  onContinue: () => void;
  disabled?: boolean;
  className?: string;
}

export function ContinueButton({
  onContinue,
  disabled = false,
  className = '',
}: ContinueButtonProps) {
  return (
    <button
      type="button"
      onClick={onContinue}
      disabled={disabled}
      className={`${continueButtonClasses} ${className}`}
    >
      <span>Continue</span>
      <ArrowRight className="h-5 w-5 transition-transform duration-150 group-hover:translate-x-0.5" />
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* OPTION ROW                                                                 */
/* -------------------------------------------------------------------------- */

interface SelectableProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  dark?: boolean;
}

/*
 * Selected:
 * - Orange border
 * - Warm, subtle dark-orange background
 * - Orange text
 *
 * The background is intentionally subtle so the orange text/check remain
 * the visual focus without making the whole card too bright.
 */
const selectedDarkClasses = 'border-orange bg-[#29241F] text-orange';
const selectedLightClasses = 'border-orange bg-orange/[0.08] text-orange';

const unselectedDarkClasses =
  'border-[#37464F] bg-[#202F35] text-white hover:border-orange/40 hover:bg-[#26383F]';
const unselectedLightClasses =
  'border-line bg-surface-alt text-ink hover:border-orange/30';

const selectableClasses = (selected: boolean, dark: boolean) =>
  selected
    ? dark
      ? selectedDarkClasses
      : selectedLightClasses
    : dark
      ? unselectedDarkClasses
      : unselectedLightClasses;

/**
 * Selectable option row.
 *
 * Selected state:
 * - Orange text
 * - Orange border
 * - Subtle warm background
 * - Rounded orange check container on the right
 */
export function OptionRow({
  label,
  selected,
  onClick,
  dark = true,
}: SelectableProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`
        w-full text-left rounded-2xl border-2 px-4 py-4 sm:px-5
        font-sans text-[15px] font-extrabold transition-all duration-150
        ${selectableClasses(selected, dark)}
      `}
    >
      <span className="flex items-center justify-between gap-4">
        <span className="min-w-0 flex-1">{label}</span>

        <span
          className={`
            flex h-7 w-7 shrink-0 items-center justify-center rounded-full
            transition-all duration-150
            ${selected ? 'bg-orange text-white' : 'bg-transparent'}
          `}
          aria-hidden="true"
        >
          {selected && <Check className="h-4 w-4 stroke-[3]" />}
        </span>
      </span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* PILL OPTION                                                                */
/* -------------------------------------------------------------------------- */

export function PillOption({
  label,
  selected,
  onClick,
  dark = true,
}: SelectableProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`
        inline-flex items-center rounded-full border-2 px-5 py-3
        font-sans text-sm font-bold transition-all duration-150 sm:text-base
        ${selectableClasses(selected, dark)}
      `}
    >
      {label}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* OTHER INPUT                                                                */
/* -------------------------------------------------------------------------- */

interface OtherInputProps {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
  placeholder?: string;
}

export function OtherInput({
  value,
  onChange,
  onAdd,
  placeholder = 'Something else',
}: OtherInputProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && value.trim()) {
      event.preventDefault();
      onAdd();
    }
  };

  return (
    <div
      className="
        flex min-h-[64px] items-center gap-3 rounded-2xl border-2
        border-[#37464F] bg-[#202F35] px-4 py-3 transition-all duration-150
        focus-within:border-orange/50 focus-within:bg-[#26302F] sm:px-5
      "
    >
      <span className="shrink-0 font-sans text-[15px] font-extrabold text-white">
        {placeholder}
      </span>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your own option..."
        className="
          min-w-0 flex-1 bg-transparent px-1 py-1.5 font-sans text-[14px]
          font-medium text-white outline-none placeholder:text-[#60757E] sm:text-[15px]
        "
        aria-label="Type your own option"
      />

      <button
        type="button"
        onClick={onAdd}
        disabled={!value.trim()}
        aria-label="Add option"
        className="
          flex h-8 shrink-0 items-center justify-center rounded-full bg-[#30424A]
          px-4 font-sans text-[12px] font-extrabold text-[#D8E2E6]
          transition-all duration-150 hover:bg-orange hover:text-white
          disabled:cursor-not-allowed disabled:opacity-40
        "
      >
        Add
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TRANSITION SCREEN                                                          */
/* -------------------------------------------------------------------------- */

interface TransitionScreenProps {
  pose?: MascotPose;
  heading: string;
  sub?: string;
  note?: string;
  onContinue: () => void;
  buttonLabel?: string;
}

export function TransitionScreen({
  pose = 'thinking',
  heading,
  sub,
  note,
  onContinue,
  buttonLabel = 'Continue',
}: TransitionScreenProps) {
  return (
    <motion.div
      className="
        flex min-h-0 flex-1 flex-col items-center justify-center bg-[#131F24]
        px-5 py-8 text-center text-white sm:px-8
      "
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <GrokitMascot pose={pose} size={150} />

      <h1
        className="
          mt-5 max-w-[680px] font-display text-[29px] font-extrabold
          leading-[1.12] tracking-tight sm:text-[37px]
        "
      >
        {heading}
      </h1>

      {sub && (
        <p
          className="
            mt-3 max-w-[560px] font-sans text-[15px] font-medium
            leading-relaxed text-[#91A4AC] sm:text-base
          "
        >
          {sub}
        </p>
      )}

      {note && (
        <p
          className="
            mt-3 max-w-[520px] font-sans text-xs font-medium
            text-[#60757E] sm:text-sm
          "
        >
          {note}
        </p>
      )}

      <button
        type="button"
        onClick={onContinue}
        className="
          mt-7 flex min-h-[58px] w-full max-w-[680px] items-center justify-center
          gap-2 rounded-full bg-orange px-8 py-4 font-sans text-base font-extrabold
          text-white shadow-[0_4px_0_#C94713] transition-all duration-150
          hover:brightness-105 active:translate-y-[2px] active:shadow-none sm:text-lg
        "
      >
        {buttonLabel}
        <ArrowRight className="h-5 w-5" />
      </button>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* LEGACY EXPORTS                                                             */
/* -------------------------------------------------------------------------- */

export function OtherOption({
  selected,
  value,
  onToggle,
  onChange,
}: {
  selected: boolean;
  value: string;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div
      className={`
        overflow-hidden rounded-2xl border-2 transition-all duration-150
        ${
          selected
            ? 'border-orange bg-[#29241F]'
            : 'border-[#37464F] bg-[#202F35] hover:border-orange/40'
        }
      `}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        className="w-full px-5 py-4 text-left font-sans text-[15px] font-extrabold transition-colors"
      >
        <span className={selected ? 'text-orange' : 'text-white'}>Other</span>
      </button>

      {selected && (
        <div className="px-4 pb-4">
          <input
            autoFocus
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Something else"
            className="
              h-12 w-full rounded-xl border border-[#3D555E] bg-[#16262C]
              px-4 font-sans text-[15px] text-white outline-none
              placeholder:text-[#60757E] focus:border-orange/70
            "
          />
        </div>
      )}
    </div>
  );
}