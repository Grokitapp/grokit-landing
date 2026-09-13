import { ArrowRight, X } from 'lucide-react';
import { GrokitMascot } from '../../components/Grokitmascot';
import {
  EXAMPLE_COURSES,
  GOAL_OPTIONS,
  TIME_OPTIONS,
  TOPIC_OPTIONS,
  WORK_TYPES,
} from './constants';
import {
  OptionRow,
  OtherInput,
  PillOption,
} from './shared';

/* -------------------------------------------------------------------------- */
/* GENERIC STEP PROPS                                                        */
/* -------------------------------------------------------------------------- */

interface StepProps {
  onContinue: () => void;
}

/* -------------------------------------------------------------------------- */
/* CONTINUE BUTTON                                                           */
/* -------------------------------------------------------------------------- */

interface ContinueButtonProps
  extends StepProps {
  disabled?: boolean;
  className?: string;
}

export function ContinueButton({
  onContinue,
  disabled,
  className = '',
}: ContinueButtonProps) {
  return (
    <button
      type="button"
      onClick={onContinue}
      disabled={disabled}
      className={`
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
        disabled:opacity-40
        disabled:pointer-events-none
        ${className}
      `}
    >
      Continue

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
  );
}

/* -------------------------------------------------------------------------- */
/* QUESTION SHELL                                                            */
/* -------------------------------------------------------------------------- */

interface QuestionShellProps {
  title: string;
  subtitle?: string;
  maxWidth?: string;
  canContinue?: boolean;
  onContinue: () => void;
  children: React.ReactNode;
  dark?: boolean;
}

function QuestionShell({
  title,
  subtitle,
  maxWidth = 'max-w-3xl',
  canContinue = true,
  onContinue,
  children,
  dark = false,
}: QuestionShellProps) {
  return (
    <div
      className={`
        flex-1
        min-h-0
        flex
        flex-col
        ${
          dark
            ? 'bg-[#131F24] text-white'
            : 'bg-surface'
        }
      `}
    >
      {/* -------------------------------------------------------------- */}
      {/* QUESTION HEADER                                                */}
      {/* -------------------------------------------------------------- */}

      <div
        className={`
          shrink-0
          w-full
          ${maxWidth}
          mx-auto
          px-5
          sm:px-6
          pt-4
          sm:pt-5
          pb-4
        `}
      >
        <h1
          className={`
            font-display
            text-[27px]
            sm:text-3xl
            md:text-[34px]
            leading-tight
            font-extrabold
            text-center
            ${
              subtitle
                ? 'mb-1.5'
                : 'mb-0'
            }
            ${
              dark
                ? 'text-white'
                : 'text-ink'
            }
          `}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            className={`
              font-sans
              font-medium
              text-center
              text-sm
              sm:text-base
              ${
                dark
                  ? 'text-[#91A4AC]'
                  : 'text-body'
              }
            `}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* -------------------------------------------------------------- */}
      {/* SCROLLABLE ANSWERS AREA                                       */}
      {/* -------------------------------------------------------------- */}

      <div
        className={`
          flex-1
          min-h-0
          overflow-y-auto
          overscroll-contain
          ${
            dark
              ? 'bg-[#131F24]'
              : 'bg-surface'
          }
        `}
      >
        <div
          className={`
            w-full
            ${maxWidth}
            mx-auto
            px-5
            sm:px-6
            pb-5
          `}
        >
          {children}
        </div>
      </div>

      {/* -------------------------------------------------------------- */}
      {/* FIXED CONTINUE AREA                                            */}
      {/* -------------------------------------------------------------- */}

      <div
        className={`
          shrink-0
          border-t
          px-5
          sm:px-6
          pt-4
          pb-[calc(1rem+env(safe-area-inset-bottom))]
          ${
            dark
              ? 'border-[#26383F] bg-[#131F24]'
              : 'border-transparent bg-surface'
          }
        `}
      >
        <div
          className={`
            w-full
            ${maxWidth}
            mx-auto
          `}
        >
          <ContinueButton
            onContinue={onContinue}
            disabled={!canContinue}
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SELECTION TYPES                                                           */
/* -------------------------------------------------------------------------- */

interface SelectionStepProps {
  selected: string[];
  onToggle: (item: string) => void;
  canContinue: boolean;
  onContinue: () => void;
}

interface WorkTypeStepProps
  extends SelectionStepProps {
  otherSelected: boolean;
  otherValue: string;
  onToggleOther: () => void;
  onOtherChange: (value: string) => void;
}

interface TopicsStepProps
  extends SelectionStepProps {
  otherValue: string;
  onOtherChange: (v: string) => void;
  onAddOther: () => void;
}

/* -------------------------------------------------------------------------- */
/* INTRO                                                                      */
/* -------------------------------------------------------------------------- */

export function IntroStep({
  onContinue,
}: StepProps) {
  return (
    <div
      className="
        relative
        flex-1
        min-h-0
        overflow-hidden
        bg-[#131F24]
        text-white
        flex
        flex-col
        items-center
        justify-center
        px-5
        sm:px-8
        py-10
        sm:py-14
        text-center
      "
    >
      {/* Background glow */}
      <div
        className="
          pointer-events-none
          absolute
          -top-40
          left-1/2
          h-80
          w-80
          -translate-x-1/2
          rounded-full
          bg-orange/[0.035]
          blur-3xl
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -bottom-48
          -left-32
          h-96
          w-96
          rounded-full
          bg-[#20333A]/70
          blur-3xl
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -bottom-48
          -right-32
          h-96
          w-96
          rounded-full
          bg-[#20333A]/70
          blur-3xl
        "
      />

      <div
        className="
          relative
          z-10
          w-full
          max-w-[680px]
          mx-auto
          flex
          flex-col
          items-center
        "
      >
        {/* Small sparkle */}
        <div className="relative mb-4 sm:mb-5">
          <div
            className="
              absolute
              inset-0
              rounded-full
              bg-amber/20
              blur-xl
            "
          />

          <div
            className="
              relative
              w-10
              h-10
              sm:w-11
              sm:h-11
              rounded-full
              bg-[#1C3037]
              border
              border-[#30464E]
              flex
              items-center
              justify-center
            "
          >
            <span className="text-amber text-xl">
              ✦
            </span>
          </div>
        </div>

        {/* Mascot */}
        <div className="relative mb-4 sm:mb-5">
          <div
            className="
              absolute
              -inset-8
              rounded-full
              bg-orange/[0.06]
              blur-2xl
            "
          />

          <GrokitMascot
            size={130}
            pose="celebrate"
            className="relative sm:hidden"
          />

          <GrokitMascot
            size={148}
            pose="celebrate"
            className="
              relative
              hidden
              sm:block
            "
          />
        </div>

        {/* Heading */}
        <h1
          className="
            font-display
            text-[29px]
            leading-[1.12]
            sm:text-[37px]
            sm:leading-[1.12]
            font-extrabold
            tracking-[-0.02em]
            text-white
            mb-2.5
          "
        >
          Just 4 short questions
        </h1>

        {/* Subtitle */}
        <p
          className="
            font-sans
            text-[15px]
            sm:text-[16px]
            leading-relaxed
            font-medium
            text-[#91A4AC]
            mb-7
            sm:mb-8
          "
        >
          To build a learning journey designed
          for you.
        </p>

        {/* CTA */}
        <div className="w-full max-w-[680px]">
          <ContinueButton
            onContinue={onContinue}
          />
        </div>

        {/* Small helper */}
        <p
          className="
            mt-4
            text-[11px]
            sm:text-xs
            font-sans
            font-medium
            text-[#60757E]
          "
        >
          Quick, simple, personalized.
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* WORK TYPE                                                                  */
/* -------------------------------------------------------------------------- */

export function WorkTypeStep({
  selected,
  onToggle,
  otherSelected,
  otherValue,
  onToggleOther,
  onOtherChange,
  ...rest
}: WorkTypeStepProps) {
  return (
    <QuestionShell
      title="What types of work do you do?"
      subtitle="Select all that apply"
      dark
      {...rest}
    >
      <div className="flex flex-col gap-2.5">
        {/* Existing professions */}
        {WORK_TYPES.map((type) => (
          <OptionRow
            key={type}
            label={type}
            selected={selected.includes(
              type,
            )}
            onClick={() =>
              onToggle(type)
            }
            dark
          />
        ))}

        {/* ---------------------------------------------------------- */}
        {/* OTHER                                                       */}
        {/* ---------------------------------------------------------- */}

        <div
          className={`
            rounded-2xl
            border-2
            overflow-hidden
            transition-all
            duration-150
            ${
              otherSelected
                ? 'bg-[#2A2927] border-orange'
                : `
                  bg-[#202F35]
                  border-[#37464F]
                  hover:border-orange/60
                `
            }
          `}
        >
          {/* Other selection row */}
          <button
            type="button"
            onClick={onToggleOther}
            aria-pressed={
              otherSelected
            }
            className="
              w-full
              min-h-[58px]
              text-left
              px-5
              py-3
              font-sans
              font-bold
              text-[15px]
              sm:text-base
              text-white
            "
          >
            <span className="flex items-center gap-3.5">
              <span
                className={`
                  w-6
                  h-6
                  shrink-0
                  rounded-[7px]
                  border-2
                  flex
                  items-center
                  justify-center
                  ${
                    otherSelected
                      ? 'bg-orange border-orange'
                      : 'border-[#60757E]'
                  }
                `}
              >
                {otherSelected && (
                  <svg
                    viewBox="0 0 20 20"
                    className="
                      w-4
                      h-4
                      text-white
                    "
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 10.5 8 14l8-8"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>

              Other
            </span>
          </button>

          {/* Other profession input */}
          {otherSelected && (
            <div className="px-4 pb-4">
              <div
                className="
                  flex
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-[#3D555E]
                  bg-[#16262C]
                  px-4
                  h-12
                  focus-within:border-orange/70
                  transition-colors
                "
              >
                <input
                  autoFocus
                  value={otherValue}
                  onChange={(e) =>
                    onOtherChange(
                      e.target.value,
                    )
                  }
                  placeholder="What do you do?"
                  aria-label="Other profession"
                  className="
                    min-w-0
                    flex-1
                    bg-transparent
                    outline-none
                    text-white
                    font-sans
                    text-[15px]
                    placeholder:text-[#60757E]
                  "
                />

                {otherValue && (
                  <button
                    type="button"
                    onClick={() =>
                      onOtherChange('')
                    }
                    className="
                      w-8
                      h-8
                      shrink-0
                      rounded-full
                      flex
                      items-center
                      justify-center
                      text-[#7C9098]
                      hover:text-white
                      hover:bg-white/[0.06]
                      transition-colors
                    "
                    aria-label="Clear other profession"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </QuestionShell>
  );
}

/* -------------------------------------------------------------------------- */
/* TOPICS                                                                     */
/* -------------------------------------------------------------------------- */

export function TopicsStep({
  selected,
  onToggle,
  otherValue,
  onOtherChange,
  onAddOther,
  ...rest
}: TopicsStepProps) {
  const customTopics =
    selected.filter(
      (topic) =>
        !TOPIC_OPTIONS.includes(
          topic,
        ),
    );

  return (
    <QuestionShell
      title="What topics interest you?"
      subtitle="Don't worry, this won't limit your experience"
      maxWidth="max-w-4xl"
      {...rest}
    >
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {TOPIC_OPTIONS.map(
          (topic) => (
            <PillOption
              key={topic}
              label={topic}
              selected={selected.includes(
                topic,
              )}
              onClick={() =>
                onToggle(topic)
              }
            />
          ),
        )}

        {customTopics.map(
          (topic) => (
            <PillOption
              key={topic}
              label={topic}
              selected
              onClick={() =>
                onToggle(topic)
              }
            />
          ),
        )}
      </div>

      <OtherInput
        value={otherValue}
        onChange={onOtherChange}
        placeholder="Other topics (optional)"
        onAdd={onAddOther}
      />
    </QuestionShell>
  );
}

/* -------------------------------------------------------------------------- */
/* GOALS                                                                      */
/* -------------------------------------------------------------------------- */

export function GoalsStep({
  selected,
  onToggle,
  otherValue,
  onOtherChange,
  onAddOther,
  ...rest
}: TopicsStepProps) {
  const customGoals =
    selected.filter(
      (goal) =>
        !GOAL_OPTIONS.includes(
          goal,
        ),
    );

  return (
    <QuestionShell
      title="What do you want to achieve?"
      subtitle="Select all that apply"
      {...rest}
    >
      <div className="flex flex-col gap-3 mb-4">
        {GOAL_OPTIONS.map(
          (goal) => (
            <OptionRow
              key={goal}
              label={goal}
              selected={selected.includes(
                goal,
              )}
              onClick={() =>
                onToggle(goal)
              }
            />
          ),
        )}

        {customGoals.map(
          (goal) => (
            <OptionRow
              key={goal}
              label={goal}
              selected
              onClick={() =>
                onToggle(goal)
              }
            />
          ),
        )}
      </div>

      <OtherInput
        value={otherValue}
        onChange={onOtherChange}
        placeholder="Other (optional)"
        onAdd={onAddOther}
      />
    </QuestionShell>
  );
}

/* -------------------------------------------------------------------------- */
/* TIME                                                                       */
/* -------------------------------------------------------------------------- */

interface TimeStepProps {
  timeId: string | null;
  onSelect: (id: string) => void;
  canContinue: boolean;
  onContinue: () => void;
}

export function TimeStep({
  timeId,
  onSelect,
  canContinue,
  onContinue,
}: TimeStepProps) {
  return (
    <QuestionShell
      title="How long do you want to learn every day?"
      canContinue={
        canContinue
      }
      onContinue={onContinue}
    >
      <div className="flex flex-col gap-3">
        {TIME_OPTIONS.map(
          ({
            id,
            label,
            description,
          }) => (
            <button
              type="button"
              key={id}
              onClick={() =>
                onSelect(id)
              }
              className={`
                w-full
                flex
                items-center
                justify-between
                px-5
                py-4
                rounded-2xl
                border-2
                transition-colors
                ${
                  timeId === id
                    ? 'bg-orange/10 border-orange'
                    : 'bg-surface-alt border-line hover:border-orange/30'
                }
              `}
            >
              <span
                className={`
                  font-display
                  font-extrabold
                  text-lg
                  ${
                    timeId === id
                      ? 'text-ink'
                      : 'text-body'
                  }
                `}
              >
                {label}
              </span>

              <span className="text-muted font-sans text-sm">
                {description}
              </span>
            </button>
          ),
        )}
      </div>
    </QuestionShell>
  );
}

/* -------------------------------------------------------------------------- */
/* LOADING                                                                    */
/* -------------------------------------------------------------------------- */

export function LoadingStep() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
      <GrokitMascot
        size={120}
        pose="thinking"
        className="mb-6"
      />

      <p className="text-body font-sans font-semibold">
        Picking courses based on your role,
        goals, and interests...
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FINAL                                                                      */
/* -------------------------------------------------------------------------- */

interface FinalStepProps {
  learnPrompt: string;
  onPromptChange: (v: string) => void;
  onCreate: () => void;
  onExampleClick: () => void;
}

export function FinalStep({
  learnPrompt,
  onPromptChange,
  onCreate,
  onExampleClick,
}: FinalStepProps) {
  const hasPrompt =
    learnPrompt.trim().length > 0;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-2xl mx-auto text-center">
        <GrokitMascot
          size={90}
          pose="idle"
          className="mx-auto mb-6"
        />

        <h1 className="font-display text-3xl sm:text-4xl text-ink font-extrabold mb-2">
          What do you want to learn?
        </h1>

        <p className="text-body font-sans font-medium mb-8">
          Tell me what you're curious about,
          and I'll build a personalized course
          for you.
        </p>

        <div className="bg-surface-alt border border-line rounded-3xl p-5 mb-3 text-left">
          <textarea
            value={learnPrompt}
            onChange={(e) =>
              onPromptChange(
                e.target.value,
              )
            }
            placeholder="I want to learn about..."
            className="
              w-full
              min-h-[80px]
              bg-transparent
              outline-none
              resize-none
              text-ink
              font-sans
              placeholder:text-muted
            "
          />

          <div className="flex justify-end pt-3 border-t border-line mt-3">
            <button
              type="button"
              onClick={onCreate}
              disabled={!hasPrompt}
              className="
                btn-duo
                px-6
                py-3
                text-base
                disabled:opacity-40
              "
            >
              Create my learning path

              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-sm text-muted font-sans font-semibold text-left mb-4 mt-8">
          Or, see what people like you are learning
        </p>

        <div className="flex flex-col gap-3 text-left">
          {EXAMPLE_COURSES.map(
            (course) => (
              <button
                type="button"
                key={course.title}
                onClick={
                  onExampleClick
                }
                className="
                  flex
                  items-center
                  gap-4
                  p-3
                  rounded-2xl
                  border
                  border-line
                  bg-surface
                  hover:border-orange/30
                  transition-colors
                "
              >
                <span
                  className="
                    shrink-0
                    w-16
                    h-16
                    rounded-xl
                    bg-orange/10
                    flex
                    items-center
                    justify-center
                    text-xs
                    font-bold
                    text-orange
                    text-center
                    px-1
                  "
                >
                  {course.tag}
                </span>

                <span>
                  <span className="block font-display font-bold text-ink">
                    {course.title}
                  </span>

                  <span className="block text-xs text-muted font-sans font-semibold mb-1">
                    {course.author}
                  </span>

                  <span className="block text-sm text-body font-sans">
                    {course.blurb}
                  </span>
                </span>
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}