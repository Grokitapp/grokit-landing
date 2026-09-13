import { useState, type ReactNode } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { GrokitMascot } from '../../components/Grokitmascot';
import {
  EXAMPLE_COURSES,
  GOAL_OPTIONS,
  TIME_OPTIONS,
  TOPIC_OPTIONS,
  WORK_TYPES,
} from './constants';
import { OptionRow, OtherInput, PillOption } from './shared';

/* -------------------------------------------------------------------------- */
/* GENERIC STEP PROPS                                                         */
/* -------------------------------------------------------------------------- */

interface StepProps {
  onContinue: () => void;
}

/* -------------------------------------------------------------------------- */
/* CONTINUE BUTTON                                                            */
/* -------------------------------------------------------------------------- */

interface ContinueButtonProps extends StepProps {
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
  );
}

/* -------------------------------------------------------------------------- */
/* QUESTION SHELL                                                             */
/* -------------------------------------------------------------------------- */

interface QuestionShellProps {
  title: string;
  subtitle?: string;
  maxWidth?: string;
  canContinue?: boolean;
  onContinue: () => void;
  children: ReactNode;
  dark?: boolean;
}

function QuestionShell({
  title,
  subtitle,
  maxWidth = 'max-w-3xl',
  canContinue = true,
  onContinue,
  children,
  dark = true,
}: QuestionShellProps) {
  const shellBg = dark
    ? 'bg-[#131F24] text-white'
    : 'bg-surface';

  const titleColor = dark
    ? 'text-white'
    : 'text-ink';

  const subtitleColor = dark
    ? 'text-[#91A4AC]'
    : 'text-body';

  const footerTheme = dark
    ? 'border-[#26383F] bg-[#131F24]'
    : 'border-transparent bg-surface';

  return (
    <div
      className={`
        flex-1
        min-h-0
        flex
        flex-col
        ${shellBg}
      `}
    >
      {/* Header */}
      <div
        className={`
          shrink-0
          w-full
          ${maxWidth}
          mx-auto
          px-5
          sm:px-6
          pt-6
          sm:pt-7
          pb-3
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
            tracking-[-0.015em]
            ${
              subtitle
                ? 'mb-1.5'
                : 'mb-0'
            }
            ${titleColor}
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
              ${subtitleColor}
            `}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Scrollable answers */}
      <div
        className={`
          flex-1
          min-h-0
          overflow-y-auto
          overscroll-contain
          ${shellBg}
        `}
      >
        <div
          className={`
            w-full
            ${maxWidth}
            mx-auto
            px-5
            sm:px-6
            pb-8
          `}
        >
          {children}
        </div>
      </div>

      {/* Fixed continue area */}
      <div
        className={`
          shrink-0
          border-t
          px-5
          sm:px-6
          pt-4
          pb-[calc(1rem+env(safe-area-inset-bottom))]
          ${footerTheme}
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
/* SELECTION TYPES                                                            */
/* -------------------------------------------------------------------------- */

interface SelectionStepProps {
  selected: string[];
  onToggle: (item: string) => void;
  canContinue: boolean;
  onContinue: () => void;
}

interface WorkTypeStepProps
  extends SelectionStepProps {
  otherSelected?: boolean;
  otherValue?: string;
  onToggleOther?: () => void;
  onOtherChange?: (value: string) => void;
}

interface TopicsStepProps
  extends SelectionStepProps {
  otherValue: string;
  onOtherChange: (v: string) => void;
  onAddOther: () => void;
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

const customItems = (
  selected: string[],
  options: string[],
) =>
  selected.filter(
    (item) => !options.includes(item),
  );

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
        <div className="relative mb-5">
          <GrokitMascot
            size={130}
            pose="celebrate"
            className="relative sm:hidden"
          />

          <GrokitMascot
            size={148}
            pose="celebrate"
            className="relative hidden sm:block"
          />
        </div>

        <h1
          className="
            font-display
            text-[29px]
            leading-[1.12]
            sm:text-[37px]
            font-extrabold
            tracking-[-0.02em]
            text-white
            mb-2.5
          "
        >
          Just 4 short questions
        </h1>

        <p
          className="
            font-sans
            text-[15px]
            sm:text-base
            leading-relaxed
            font-medium
            text-[#91A4AC]
            mb-7
            sm:mb-8
          "
        >
          To build a learning journey designed for you.
        </p>

        <div className="w-full max-w-[680px]">
          <ContinueButton
            onContinue={onContinue}
          />
        </div>

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
/* OTHER OPTION                                                               */
/* -------------------------------------------------------------------------- */

interface OtherOptionProps {
  selected: boolean;
  value: string;
  onToggle: () => void;
  onChange: (value: string) => void;
}

function OtherOption({
  selected,
  value,
  onToggle,
  onChange,
}: OtherOptionProps) {
  return (
    <div
      className={`
        rounded-2xl
        border-2
        overflow-hidden
        transition-all
        duration-150
        ${
          selected
            ? 'bg-orange/10 border-orange'
            : 'bg-[#202F35] border-[#37464F] hover:border-[#52656D]'
        }
      `}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
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
                selected
                  ? 'bg-orange border-orange'
                  : 'border-[#60757E]'
              }
            `}
          >
            {selected && (
              <svg
                viewBox="0 0 20 20"
                className="w-4 h-4 text-white"
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

      {selected && (
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
              value={value}
              onChange={(e) =>
                onChange(e.target.value)
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

            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
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
  );
}

/* -------------------------------------------------------------------------- */
/* WORK TYPE                                                                  */
/* -------------------------------------------------------------------------- */

export function WorkTypeStep({
  selected,
  onToggle,
  canContinue,
  onContinue,
  otherSelected: otherSelectedProp,
  otherValue: otherValueProp,
  onToggleOther,
  onOtherChange,
}: WorkTypeStepProps) {
  const [
    otherSelectedInternal,
    setOtherSelectedInternal,
  ] = useState(false);

  const [
    otherValueInternal,
    setOtherValueInternal,
  ] = useState('');

  const otherSelected =
    otherSelectedProp ??
    otherSelectedInternal;

  const otherValue =
    otherValueProp ??
    otherValueInternal;

  const toggleOther =
    onToggleOther ??
    (() =>
      setOtherSelectedInternal(
        (v) => !v,
      ));

  const changeOther =
    onOtherChange ??
    setOtherValueInternal;

  return (
    <QuestionShell
      title="What types of work do you do?"
      subtitle="Select all that apply"
      dark
      canContinue={canContinue}
      onContinue={onContinue}
    >
      <div className="flex flex-col gap-2.5">
        {WORK_TYPES.map((type) => (
          <OptionRow
            key={type}
            label={type}
            selected={selected.includes(type)}
            onClick={() => onToggle(type)}
            dark
          />
        ))}

        <OtherOption
          selected={otherSelected}
          value={otherValue}
          onToggle={toggleOther}
          onChange={changeOther}
        />
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
  canContinue,
  onContinue,
  otherValue,
  onOtherChange,
  onAddOther,
}: TopicsStepProps) {
  return (
    <QuestionShell
      title="What topics interest you?"
      subtitle="Don't worry, this won't limit your experience"
      maxWidth="max-w-4xl"
      dark
      canContinue={canContinue}
      onContinue={onContinue}
    >
      {/* Topic pills */}
      <div
        className="
          flex
          flex-wrap
          justify-center
          gap-2.5
          sm:gap-3
          mb-6
          sm:mb-7
        "
      >
        {TOPIC_OPTIONS.map((topic) => (
          <PillOption
            key={topic}
            label={topic}
            selected={selected.includes(topic)}
            onClick={() => onToggle(topic)}
            dark
          />
        ))}

        {customItems(
          selected,
          TOPIC_OPTIONS,
        ).map((topic) => (
          <PillOption
            key={topic}
            label={topic}
            selected
            onClick={() => onToggle(topic)}
            dark
          />
        ))}
      </div>

      {/* Other topics */}
      <OtherInput
        value={otherValue}
        onChange={onOtherChange}
        placeholder="Other topics (optional)"
        onAdd={onAddOther}
      />

      {/* Small helper */}
      <p
        className="
          mt-4
          text-center
          text-xs
          sm:text-sm
          font-sans
          font-medium
          text-[#60757E]
        "
      >
        You can select multiple topics
      </p>
    </QuestionShell>
  );
}

/* -------------------------------------------------------------------------- */
/* GOALS                                                                      */
/* -------------------------------------------------------------------------- */

export function GoalsStep({
  selected,
  onToggle,
  canContinue,
  onContinue,
  otherValue,
  onOtherChange,
  onAddOther,
}: TopicsStepProps) {
  return (
    <QuestionShell
      title="What do you want to achieve?"
      subtitle="Select all that apply"
      dark
      canContinue={canContinue}
      onContinue={onContinue}
    >
      <div className="flex flex-col gap-2.5 mb-4">
        {GOAL_OPTIONS.map((goal) => (
          <OptionRow
            key={goal}
            label={goal}
            selected={selected.includes(goal)}
            onClick={() => onToggle(goal)}
            dark
          />
        ))}

        {customItems(
          selected,
          GOAL_OPTIONS,
        ).map((goal) => (
          <OptionRow
            key={goal}
            label={goal}
            selected
            onClick={() => onToggle(goal)}
            dark
          />
        ))}
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
      dark
      canContinue={canContinue}
      onContinue={onContinue}
    >
      <div className="flex flex-col gap-2.5">
        {TIME_OPTIONS.map(
          ({
            id,
            label,
            description,
          }) => (
            <button
              type="button"
              key={id}
              onClick={() => onSelect(id)}
              aria-pressed={timeId === id}
              className={`
                w-full
                min-h-[62px]
                flex
                items-center
                justify-between
                gap-4
                px-5
                py-4
                rounded-2xl
                border-2
                transition-all
                duration-150
                ${
                  timeId === id
                    ? 'bg-orange/10 border-orange'
                    : 'bg-[#202F35] border-[#37464F] hover:border-[#52656D]'
                }
              `}
            >
              <span
                className={`
                  font-display
                  font-extrabold
                  text-base
                  sm:text-lg
                  text-left
                  ${
                    timeId === id
                      ? 'text-white'
                      : 'text-white'
                  }
                `}
              >
                {label}
              </span>

              <span
                className="
                  shrink-0
                  text-[#91A4AC]
                  font-sans
                  text-xs
                  sm:text-sm
                "
              >
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
    <div
      className="
        flex-1
        flex
        flex-col
        items-center
        justify-center
        px-6
        py-8
        text-center
        bg-[#131F24]
      "
    >
      <GrokitMascot
        size={120}
        pose="thinking"
        className="mb-6"
      />

      <p
        className="
          text-[#91A4AC]
          font-sans
          font-semibold
        "
      >
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
    <div
      className="
        flex-1
        flex
        flex-col
        items-center
        justify-center
        px-6
        py-8
        bg-[#131F24]
        overflow-y-auto
      "
    >
      <div className="w-full max-w-2xl mx-auto text-center">
        <GrokitMascot
          size={90}
          pose="idle"
          className="mx-auto mb-6"
        />

        <h1
          className="
            font-display
            text-3xl
            sm:text-4xl
            text-white
            font-extrabold
            mb-2
          "
        >
          What do you want to learn?
        </h1>

        <p
          className="
            text-[#91A4AC]
            font-sans
            font-medium
            mb-8
          "
        >
          Tell me what you're curious about,
          and I'll build a personalized course
          for you.
        </p>

        <div
          className="
            bg-[#202F35]
            border
            border-[#37464F]
            rounded-3xl
            p-5
            mb-3
            text-left
          "
        >
          <textarea
            value={learnPrompt}
            onChange={(e) =>
              onPromptChange(e.target.value)
            }
            placeholder="I want to learn about..."
            className="
              w-full
              min-h-[80px]
              bg-transparent
              outline-none
              resize-none
              text-white
              font-sans
              placeholder:text-[#60757E]
            "
          />

          <div
            className="
              flex
              justify-end
              pt-3
              border-t
              border-[#37464F]
              mt-3
            "
          >
            <button
              type="button"
              onClick={onCreate}
              disabled={!hasPrompt}
              className="
                group
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-full
                bg-orange
                text-white
                font-sans
                font-extrabold
                px-6
                py-3
                text-base
                shadow-[0_3px_0_#C94713]
                hover:brightness-105
                active:translate-y-[2px]
                active:shadow-none
                transition-all
                disabled:opacity-40
              "
            >
              Create my learning path

              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p
          className="
            text-sm
            text-[#60757E]
            font-sans
            font-semibold
            text-left
            mb-4
            mt-8
          "
        >
          Or, see what people like you are
          learning
        </p>

        <div className="flex flex-col gap-3 text-left">
          {EXAMPLE_COURSES.map(
            (course) => (
              <button
                type="button"
                key={course.title}
                onClick={onExampleClick}
                className="
                  flex
                  items-center
                  gap-4
                  p-3
                  rounded-2xl
                  border
                  border-[#37464F]
                  bg-[#202F35]
                  hover:border-[#52656D]
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
                  <span
                    className="
                      block
                      font-display
                      font-bold
                      text-white
                    "
                  >
                    {course.title}
                  </span>

                  <span
                    className="
                      block
                      text-xs
                      text-[#60757E]
                      font-sans
                      font-semibold
                      mb-1
                    "
                  >
                    {course.author}
                  </span>

                  <span
                    className="
                      block
                      text-sm
                      text-[#91A4AC]
                      font-sans
                    "
                  >
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