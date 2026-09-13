import { motion } from 'framer-motion';
import { ArrowRight, Check, Plus } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { GrokitMascot, type MascotPose } from '../../components/Grokitmascot';

/* -------------------------------------------------------------------------- */
/* COLORS                                                                     */
/* -------------------------------------------------------------------------- */

const DARK_BG = '#131F24';
const DARK_SURFACE = '#202F35';
const DARK_BORDER = '#37464F';
const DARK_BORDER_STRONG = '#405761';
const MUTED = '#91A4AC';
const MUTED_DARK = '#60757E';

/* -------------------------------------------------------------------------- */
/* PROGRESS BAR                                                               */
/* -------------------------------------------------------------------------- */

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full">
      <div
        className="
          w-full
          h-2.5
          rounded-full
          overflow-hidden
          bg-[#202F35]
          border
          border-[#37464F]
        "
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-orange to-amber"
          initial={false}
          animate={{
            width: `${Math.min(Math.max(value, 0), 1) * 100}%`,
          }}
          transition={{
            duration: 0.4,
            ease: 'easeInOut',
          }}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SELECTABLE OPTIONS                                                         */
/* -------------------------------------------------------------------------- */

interface SelectableProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  dark?: boolean;
}

const selectedDarkClasses =
  'bg-orange/10 border-orange text-white';

const selectedLightClasses =
  'bg-orange/10 border-orange text-ink';

const unselectedDarkClasses =
  'bg-[#202F35] border-[#37464F] text-white hover:border-[#52656D] hover:bg-[#26383F]';

const unselectedLightClasses =
  'bg-surface-alt border-line text-ink hover:border-orange/30';

const selectableClasses = (
  selected: boolean,
  dark: boolean,
) =>
  selected
    ? dark
      ? selectedDarkClasses
      : selectedLightClasses
    : dark
      ? unselectedDarkClasses
      : unselectedLightClasses;

/* -------------------------------------------------------------------------- */
/* OPTION ROW                                                                 */
/* -------------------------------------------------------------------------- */

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
        w-full
        min-h-[58px]
        text-left
        px-4
        sm:px-5
        py-3.5
        rounded-2xl
        border-2
        font-sans
        font-bold
        text-[15px]
        sm:text-base
        transition-all
        duration-150
        ${selectableClasses(selected, dark)}
      `}
    >
      <span className="flex items-center gap-3">
        <span
          className={`
            w-5
            h-5
            shrink-0
            rounded-md
            border-2
            flex
            items-center
            justify-center
            transition-all
            ${
              selected
                ? 'bg-orange border-orange'
                : dark
                  ? 'border-[#52656D]'
                  : 'border-line'
            }
          `}
        >
          {selected && (
            <Check
              className="w-3.5 h-3.5 text-white"
              strokeWidth={3}
            />
          )}
        </span>

        <span>{label}</span>
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
        inline-flex
        items-center
        justify-center
        gap-2
        min-h-[52px]
        px-5
        sm:px-6
        py-2.5
        rounded-full
        border-2
        font-sans
        font-bold
        text-[14px]
        sm:text-[15px]
        whitespace-nowrap
        transition-all
        duration-150
        ${
          selected
            ? dark
              ? 'bg-orange/10 border-orange text-white'
              : 'bg-orange/10 border-orange text-ink'
            : dark
              ? 'bg-[#202F35] border-[#37464F] text-white hover:border-[#52656D] hover:bg-[#26383F]'
              : 'bg-surface-alt border-line text-ink hover:border-orange/30'
        }
      `}
    >
      {selected && (
        <Check
          className="w-4 h-4 text-orange shrink-0"
          strokeWidth={2.5}
        />
      )}

      {label}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* OTHER INPUT                                                                */
/* -------------------------------------------------------------------------- */

interface OtherInputProps {
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  placeholder: string;
}

export function OtherInput({
  value,
  onChange,
  onAdd,
  placeholder,
}: OtherInputProps) {
  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      onAdd();
    }
  };

  return (
    <div
      className="
        flex
        items-center
        gap-3
        w-full
        min-h-[58px]
        px-4
        sm:px-5
        py-2.5
        rounded-full
        border-2
        border-[#37464F]
        bg-[#202F35]
        focus-within:border-orange/70
        transition-colors
      "
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="
          flex-1
          min-w-0
          bg-transparent
          outline-none
          text-white
          font-sans
          text-[15px]
          placeholder:text-[#60757E]
        "
      />

      <button
        type="button"
        onClick={onAdd}
        disabled={!value.trim()}
        aria-label="Add"
        className="
          w-9
          h-9
          shrink-0
          rounded-full
          bg-orange
          text-white
          flex
          items-center
          justify-center
          disabled:opacity-30
          hover:brightness-105
          active:scale-95
          transition-all
        "
      >
        <Plus
          className="w-[18px] h-[18px]"
          strokeWidth={2.5}
        />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* GOOGLE ICON                                                                */
/* -------------------------------------------------------------------------- */

export function GoogleIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
    >
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12 12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />

      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039 l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />

      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />

      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.002,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24 C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* TRANSITION SCREEN                                                          */
/* -------------------------------------------------------------------------- */

const fadeUp = (delay = 0) => ({
  initial: {
    opacity: 0,
    y: 10,
  },

  animate: {
    opacity: 1,
    y: 0,
  },

  transition: {
    delay,
    duration: 0.35,
  },
});

interface TransitionScreenProps {
  pose: MascotPose;
  heading: string;
  sub: string;
  note?: string;
  onContinue: () => void;
}

export function TransitionScreen({
  pose,
  heading,
  sub,
  note,
  onContinue,
}: TransitionScreenProps) {
  return (
    <div
      className="
        relative
        flex-1
        min-h-0
        flex
        flex-col
        items-center
        justify-center
        px-5
        sm:px-6
        py-8
        sm:py-10
        text-center
        bg-[#131F24]
        overflow-hidden
      "
    >
      <div className="relative z-10 w-full max-w-[820px] flex flex-col items-center">
        {/* Mascot is retained only for transition screens */}
        <motion.div
          initial={{
            opacity: 0,
            y: 14,
            scale: 0.94,
          }}
          animate={{
            opacity: 1,
            y: [0, -4, 0],
            scale: 1,
          }}
          transition={{
            opacity: {
              duration: 0.35,
            },
            y: {
              duration: 3.5,
              repeat: Infinity,
              ease: 'easeInOut',
            },
            scale: {
              duration: 0.35,
            },
          }}
          className="mb-5 sm:mb-6"
        >
          <GrokitMascot
            size={118}
            pose={pose}
          />
        </motion.div>

        <motion.h1
          {...fadeUp(0.08)}
          className="
            font-display
            text-[28px]
            leading-[1.12]
            sm:text-3xl
            md:text-[38px]
            text-white
            font-extrabold
            tracking-[-0.02em]
            mb-3
            max-w-[760px]
          "
        >
          {heading}
        </motion.h1>

        <motion.p
          {...fadeUp(0.14)}
          className="
            text-[#91A4AC]
            font-sans
            font-medium
            text-[15px]
            sm:text-base
            md:text-[17px]
            leading-relaxed
            max-w-[680px]
          "
        >
          {sub}
        </motion.p>

        {note && (
          <motion.p
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              delay: 0.2,
              duration: 0.35,
            }}
            className="
              text-[#60757E]
              font-sans
              text-sm
              sm:text-[15px]
              mt-2
            "
          >
            {note}
          </motion.p>
        )}

        <motion.div
          {...fadeUp(0.22)}
          className="
            w-full
            max-w-[800px]
            mt-8
            sm:mt-9
          "
        >
          <button
            type="button"
            onClick={onContinue}
            className="
              group
              w-full
              min-h-[58px]
              px-8
              py-4
              rounded-full
              bg-orange
              text-white
              font-sans
              font-extrabold
              text-base
              sm:text-lg
              flex
              items-center
              justify-center
              gap-2
              shadow-[0_4px_0_#C94713]
              hover:brightness-105
              active:translate-y-[2px]
              active:shadow-none
              transition-all
              duration-150
            "
          >
            <span>Continue</span>

            <ArrowRight
              className="
                w-5
                h-5
                transition-transform
                duration-150
                group-hover:translate-x-0.5
              "
            />
          </button>
        </motion.div>
      </div>
    </div>
  );
}