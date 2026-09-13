import { motion } from 'framer-motion';
import { ArrowRight, Check, Plus } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import {
  GrokitMascot,
  type MascotPose,
} from '../../components/Grokitmascot';

/* -------------------------------------------------------------------------- */
/* PROGRESS BAR                                                              */
/* -------------------------------------------------------------------------- */

export function ProgressBar({
  value,
}: {
  value: number;
}) {
  return (
    <div className="w-full px-4 sm:px-6 pt-5 sm:pt-6 pb-2">
      <div
        className="
          max-w-3xl
          mx-auto
          h-2.5
          rounded-full
          bg-[#202F35]
          border
          border-[#37464F]
          overflow-hidden
        "
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-orange to-amber"
          initial={false}
          animate={{ width: `${value * 100}%` }}
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
/* SELECTABLE OPTIONS                                                        */
/* -------------------------------------------------------------------------- */

interface SelectableProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  dark?: boolean;
}

const selectedDarkClasses =
  'bg-orange/15 border-orange text-white';

const selectedLightClasses =
  'bg-orange/10 border-orange text-ink';

const unselectedDarkClasses =
  'bg-[#202F35] border-[#37464F] text-white hover:border-orange/50 hover:bg-[#26383F]';

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
      className={`
        w-full
        text-left
        px-4
        sm:px-5
        py-4
        rounded-2xl
        border-2
        font-sans
        font-bold
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
            <Check className="w-3.5 h-3.5 text-white" />
          )}
        </span>

        <span>{label}</span>
      </span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* PILL OPTIONS                                                              */
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
      className={`
        inline-flex
        items-center
        gap-2
        px-5
        py-3
        rounded-full
        border-2
        font-sans
        font-bold
        text-sm
        sm:text-base
        transition-all
        duration-150
        ${selectableClasses(selected, dark)}
      `}
    >
      {selected && (
        <Check className="w-4 h-4 text-orange shrink-0" />
      )}

      {label}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* OTHER INPUT                                                               */
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
        gap-2
        px-4
        sm:px-5
        py-3
        rounded-full
        border-2
        border-[#37464F]
        bg-[#202F35]
        focus-within:border-orange/60
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
          placeholder:text-[#60757E]
        "
      />

      <button
        type="button"
        onClick={onAdd}
        disabled={!value.trim()}
        aria-label="Add"
        className="
          w-8
          h-8
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
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TRANSITION SCREEN                                                         */
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
            opacity: { duration: 0.35 },
            y: {
              duration: 3.5,
              repeat: Infinity,
              ease: 'easeInOut',
            },
            scale: { duration: 0.35 },
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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
          className="w-full max-w-[800px] mt-8 sm:mt-9"
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