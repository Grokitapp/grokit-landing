import { ArrowRight, Zap } from 'lucide-react';
import { GrokitMascot } from '../../components/Grokitmascot';
import {
  EXAMPLE_COURSES,
  GOAL_OPTIONS,
  TIME_OPTIONS,
  TOPIC_OPTIONS,
  WORK_TYPES,
} from './constants';
import { OptionRow, OtherInput, PillOption } from './shared';

interface StepProps {
  onContinue: () => void;
}

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
      onClick={onContinue}
      disabled={disabled}
      className={`group w-full min-h-[58px] px-8 py-4 rounded-full bg-orange text-white font-sans font-extrabold text-base sm:text-lg flex items-center justify-center gap-2 shadow-[0_4px_0_#C94713] hover:brightness-105 active:translate-y-[2px] active:shadow-none transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none ${className}`}
    >
      Continue
      <ArrowRight className="w-5 h-5 transition-transform duration-150 group-hover:translate-x-0.5" />
    </button>
  );
}

interface QuestionShellProps {
  title: string;
  subtitle?: string;
  maxWidth?: string;
  canContinue?: boolean;
  onContinue: () => void;
  children: React.ReactNode;
}

function QuestionShell({
  title,
  subtitle,
  maxWidth = 'max-w-3xl',
  canContinue = true,
  onContinue,
  children,
}: QuestionShellProps) {
  return (
    <div className="flex-1 flex flex-col px-5 sm:px-6 py-6 sm:py-8">
      <div className={`w-full ${maxWidth} mx-auto flex-1`}>
        <h1
          className={`font-display text-3xl text-ink font-extrabold text-center ${
            subtitle ? 'mb-1' : 'mb-8'
          }`}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-body font-sans font-medium text-center mb-8">
            {subtitle}
          </p>
        )}
        {children}
      </div>

      <div className={`w-full ${maxWidth} mx-auto mt-8`}>
        <ContinueButton onContinue={onContinue} disabled={!canContinue} />
      </div>
    </div>
  );
}

interface SelectionStepProps {
  selected: string[];
  onToggle: (item: string) => void;
  canContinue: boolean;
  onContinue: () => void;
}

interface TopicsStepProps extends SelectionStepProps {
  otherValue: string;
  onOtherChange: (v: string) => void;
  onAddOther: () => void;
}

export function IntroStep({ onContinue }: StepProps) {
  return (
    <div className="relative flex-1 min-h-0 overflow-hidden bg-[#131F24] text-white flex flex-col items-center justify-center px-5 sm:px-8 py-10 sm:py-14 text-center">
      {/* Subtle atmospheric glow. The page stays intentionally minimal. */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-orange/[0.035] blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-48 -left-32 h-96 w-96 rounded-full bg-[#20333A]/70 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-48 -right-32 h-96 w-96 rounded-full bg-[#20333A]/70 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-[680px] mx-auto flex flex-col items-center">
        {/* Learning cue */}
        <div className="relative mb-4 sm:mb-5">
          <div
            className="absolute inset-0 rounded-full bg-amber/20 blur-xl"
            aria-hidden="true"
          />
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#1C3037] border border-[#30464E] flex items-center justify-center">
            <Zap
              className="w-5 h-5 text-amber"
              strokeWidth={2.5}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Mascot */}
        <div className="relative mb-4 sm:mb-5">
          <div
            className="absolute -inset-8 rounded-full bg-orange/[0.06] blur-2xl"
            aria-hidden="true"
          />
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

        <h1 className="font-display text-[29px] leading-[1.12] sm:text-[37px] sm:leading-[1.12] font-extrabold tracking-[-0.02em] text-white mb-2.5">
          Just 4 short questions
        </h1>

        <p className="font-sans text-[15px] sm:text-[16px] leading-relaxed font-medium text-[#91A4AC] mb-7 sm:mb-8">
          To build a learning journey designed for you.
        </p>

        <div className="w-full max-w-[680px]">
          <ContinueButton onContinue={onContinue} />
        </div>

        <p className="mt-4 text-[11px] sm:text-xs font-sans font-medium text-[#60757E]">
          Quick, simple, personalized.
        </p>
      </div>
    </div>
  );
}

export function WorkTypeStep({
  selected,
  onToggle,
  ...rest
}: SelectionStepProps) {
  return (
    <QuestionShell
      title="What types of work do you do?"
      subtitle="Select all that apply"
      {...rest}
    >
      <div className="flex flex-col gap-3">
        {WORK_TYPES.map((type) => (
          <OptionRow
            key={type}
            label={type}
            selected={selected.includes(type)}
            onClick={() => onToggle(type)}
          />
        ))}
      </div>
    </QuestionShell>
  );
}

export function TopicsStep({
  selected,
  onToggle,
  otherValue,
  onOtherChange,
  onAddOther,
  ...rest
}: TopicsStepProps) {
  const customTopics = selected.filter((t) => !TOPIC_OPTIONS.includes(t));

  return (
    <QuestionShell
      title="What topics interest you?"
      subtitle="Don't worry, this won't limit your experience"
      maxWidth="max-w-4xl"
      {...rest}
    >
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {TOPIC_OPTIONS.map((topic) => (
          <PillOption
            key={topic}
            label={topic}
            selected={selected.includes(topic)}
            onClick={() => onToggle(topic)}
          />
        ))}
        {customTopics.map((topic) => (
          <PillOption
            key={topic}
            label={topic}
            selected
            onClick={() => onToggle(topic)}
          />
        ))}
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

export function GoalsStep({
  selected,
  onToggle,
  otherValue,
  onOtherChange,
  onAddOther,
  ...rest
}: TopicsStepProps) {
  const customGoals = selected.filter((g) => !GOAL_OPTIONS.includes(g));

  return (
    <QuestionShell
      title="What do you want to achieve?"
      subtitle="Select all that apply"
      {...rest}
    >
      <div className="flex flex-col gap-3 mb-4">
        {GOAL_OPTIONS.map((goal) => (
          <OptionRow
            key={goal}
            label={goal}
            selected={selected.includes(goal)}
            onClick={() => onToggle(goal)}
          />
        ))}
        {customGoals.map((goal) => (
          <OptionRow
            key={goal}
            label={goal}
            selected
            onClick={() => onToggle(goal)}
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
      canContinue={canContinue}
      onContinue={onContinue}
    >
      <div className="flex flex-col gap-3">
        {TIME_OPTIONS.map(({ id, label, description }) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-colors ${
              timeId === id
                ? 'bg-orange/10 border-orange'
                : 'bg-surface-alt border-line hover:border-orange/30'
            }`}
          >
            <span
              className={`font-display font-extrabold text-lg ${
                timeId === id ? 'text-ink' : 'text-body'
              }`}
            >
              {label}
            </span>
            <span className="text-muted font-sans text-sm">{description}</span>
          </button>
        ))}
      </div>
    </QuestionShell>
  );
}

export function LoadingStep() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
      <GrokitMascot size={120} pose="thinking" className="mb-6" />
      <p className="text-body font-sans font-semibold">
        Picking courses based on your role, goals, and interests...
      </p>
    </div>
  );
}

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
  const hasPrompt = learnPrompt.trim().length > 0;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-2xl mx-auto text-center">
        <GrokitMascot size={90} pose="idle" className="mx-auto mb-6" />
        <h1 className="font-display text-3xl sm:text-4xl text-ink font-extrabold mb-2">
          What do you want to learn?
        </h1>
        <p className="text-body font-sans font-medium mb-8">
          Tell me what you're curious about, and I'll build a personalized
          course for you.
        </p>

        <div className="bg-surface-alt border border-line rounded-3xl p-5 mb-3 text-left">
          <textarea
            value={learnPrompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="I want to learn about..."
            className="w-full min-h-[80px] bg-transparent outline-none resize-none text-ink font-sans placeholder:text-muted"
          />
          <div className="flex justify-end pt-3 border-t border-line mt-3">
            <button
              onClick={onCreate}
              disabled={!hasPrompt}
              className="btn-duo px-6 py-3 text-base disabled:opacity-40"
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
          {EXAMPLE_COURSES.map((course) => (
            <button
              key={course.title}
              onClick={onExampleClick}
              className="flex items-center gap-4 p-3 rounded-2xl border border-line bg-surface hover:border-orange/30 transition-colors"
            >
              <span className="shrink-0 w-16 h-16 rounded-xl bg-orange/10 flex items-center justify-center text-xs font-bold text-orange text-center px-1">
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
          ))}
        </div>
      </div>
    </div>
  );
}
