import { useState, type ReactNode } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { GrokitMascot } from '../../components/Grokitmascot';
import { GOAL_OPTIONS, TIME_OPTIONS, TOPIC_OPTIONS, WORK_TYPES } from './constants';
import { OptionRow, OtherInput, PillOption } from './shared';

// ─── Shared styles ────────────────────────────────────────────────────────────

const continueButtonClasses = `
  group w-full min-h-[58px] px-8 py-4 rounded-full bg-orange text-white font-sans font-extrabold
  text-base sm:text-lg flex items-center justify-center gap-2 shadow-[0_4px_0_#C94713]
  hover:brightness-105 active:translate-y-[2px] active:shadow-none transition-all duration-150
  disabled:opacity-40 disabled:pointer-events-none
`;
const shellBaseClasses = 'flex-1 min-h-0 flex flex-col';
const headerBaseClasses = 'shrink-0 w-full mx-auto px-5 sm:px-6 pt-4 sm:pt-5 pb-4';
const scrollAreaClasses = 'flex-1 min-h-0 overflow-y-auto overscroll-contain';
const contentBaseClasses = 'w-full mx-auto px-5 sm:px-6 pb-5';
const footerBaseClasses = 'shrink-0 border-t px-5 sm:px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]';
const introContainerClasses = 'relative flex-1 min-h-0 overflow-hidden bg-[#131F24] text-white flex flex-col items-center justify-center px-5 sm:px-8 py-10 sm:py-14 text-center';
const introHeadingClasses = 'font-display text-[29px] leading-[1.12] sm:text-[37px] font-extrabold tracking-[-0.02em] text-white mb-2.5';
const introSubtitleClasses = 'font-sans text-[15px] sm:text-base leading-relaxed font-medium text-[#91A4AC] mb-7 sm:mb-8';
const otherOptionWrapperClasses = 'rounded-2xl border-2 overflow-hidden transition-all duration-150';
const otherOptionButtonClasses = 'w-full min-h-[58px] text-left px-5 py-3 font-sans font-bold text-[15px] sm:text-base text-white';
const otherCheckboxClasses = 'w-6 h-6 shrink-0 rounded-[7px] border-2 flex items-center justify-center';
const otherInputWrapperClasses = 'flex items-center gap-2 rounded-xl border border-[#3D555E] bg-[#16262C] px-4 h-12 focus-within:border-orange/70 transition-colors';
const otherInputFieldClasses = 'min-w-0 flex-1 bg-transparent outline-none text-white font-sans text-[15px] placeholder:text-[#60757E]';
const clearButtonClasses = 'w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-[#7C9098] hover:text-white hover:bg-white/[0.06] transition-colors';
const timeOptionBaseClasses = 'w-full flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border-2 transition-colors';
const timeLabelClasses = 'font-display font-extrabold text-lg text-white';
const timeDescriptionClasses = 'text-[#91A4AC] font-sans text-sm text-right';
const loadingContainerClasses = 'flex-1 min-h-0 flex flex-col items-center justify-center px-6 py-8 text-center bg-[#131F24]';
const loadingTextClasses = 'text-[#91A4AC] font-sans font-semibold text-[15px] sm:text-base';
const errorTextClasses = 'text-white font-sans font-semibold text-[15px] sm:text-base max-w-md';
const errorSubtextClasses = 'mt-2 text-[#91A4AC] text-sm max-w-md';
const retryButtonClasses = 'mt-6 px-7 py-3 rounded-full bg-orange text-white font-sans font-extrabold shadow-[0_3px_0_#C94713] active:translate-y-[2px] active:shadow-none';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StepProps {
  onContinue: () => void;
}

interface ContinueButtonProps extends StepProps {
  disabled?: boolean;
  className?: string;
}

interface QuestionShellProps {
  title: string;
  subtitle?: string;
  maxWidth?: string;
  canContinue?: boolean;
  onContinue: () => void;
  children: ReactNode;
  dark?: boolean;
}

interface SelectionStepProps {
  selected: string[];
  onToggle: (item: string) => void;
  canContinue: boolean;
  onContinue: () => void;
}

interface WorkTypeStepProps extends SelectionStepProps {
  otherSelected?: boolean;
  otherValue?: string;
  onToggleOther?: () => void;
  onOtherChange?: (value: string) => void;
}

interface TopicsStepProps extends SelectionStepProps {
  otherValue: string;
  onOtherChange: (v: string) => void;
  onAddOther: () => void;
}

interface OtherOptionProps {
  selected: boolean;
  value: string;
  onToggle: () => void;
  onChange: (value: string) => void;
}

interface TimeStepProps {
  timeId: string | null;
  onSelect: (id: string) => void;
  canContinue: boolean;
  onContinue: () => void;
}

interface LoadingStepProps {
  error?: string | null;
  onRetry?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const customItems = (selected: string[], options: string[]) =>
  selected.filter((item) => !options.includes(item));

// ─── Components ───────────────────────────────────────────────────────────────

export function ContinueButton({ onContinue, disabled, className = '' }: ContinueButtonProps) {
  return (
    <button
      type="button"
      onClick={onContinue}
      disabled={disabled}
      className={`${continueButtonClasses} ${className}`}
    >
      Continue
      <ArrowRight className="w-5 h-5 transition-transform duration-150 group-hover:translate-x-0.5" />
    </button>
  );
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
  const shellBg = dark ? 'bg-[#131F24] text-white' : 'bg-surface';
  const titleColor = dark ? 'text-white' : 'text-ink';
  const subtitleColor = dark ? 'text-[#91A4AC]' : 'text-body';
  const footerTheme = dark ? 'border-[#26383F] bg-[#131F24]' : 'border-transparent bg-surface';

  return (
    <div className={`${shellBaseClasses} ${shellBg}`}>
      {/* Header */}
      <div className={`${headerBaseClasses} ${maxWidth}`}>
        <h1 className={`
          font-display text-[27px] sm:text-3xl md:text-[34px] leading-tight font-extrabold text-center
          ${subtitle ? 'mb-1.5' : 'mb-0'} ${titleColor}
        `}>
          {title}
        </h1>

        {subtitle && (
          <p className={`font-sans font-medium text-center text-sm sm:text-base ${subtitleColor}`}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Scrollable answers */}
      <div className={`${scrollAreaClasses} ${shellBg}`}>
        <div className={`${contentBaseClasses} ${maxWidth}`}>
          {children}
        </div>
      </div>

      {/* Fixed continue area */}
      <div className={`${footerBaseClasses} ${footerTheme}`}>
        <div className={`w-full ${maxWidth} mx-auto`}>
          <ContinueButton onContinue={onContinue} disabled={!canContinue} />
        </div>
      </div>
    </div>
  );
}

export function IntroStep({ onContinue }: StepProps) {
  return (
    <div className={introContainerClasses}>
      <div className="relative z-10 w-full max-w-[680px] mx-auto flex flex-col items-center">
        <div className="relative mb-4 sm:mb-5">
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#1C3037] border border-[#30464E] flex items-center justify-center">
            <span className="text-amber text-xl">✦</span>
          </div>
        </div>

        <div className="relative mb-4 sm:mb-5">
          <GrokitMascot size={130} pose="celebrate" className="relative sm:hidden" />
          <GrokitMascot size={148} pose="celebrate" className="relative hidden sm:block" />
        </div>

        <h1 className={introHeadingClasses}>Just 4 short questions</h1>

        <p className={introSubtitleClasses}>
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

function OtherOption({ selected, value, onToggle, onChange }: OtherOptionProps) {
  const wrapperColor = selected
    ? 'bg-[#2A2927] border-orange'
    : 'bg-[#202F35] border-[#37464F] hover:border-orange/60';

  const checkboxColor = selected
    ? 'bg-orange border-orange'
    : 'border-[#60757E]';

  return (
    <div className={`${otherOptionWrapperClasses} ${wrapperColor}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        className={otherOptionButtonClasses}
      >
        <span className="flex items-center gap-3.5">
          <span className={`${otherCheckboxClasses} ${checkboxColor}`}>
            {selected && (
              <svg viewBox="0 0 20 20" className="w-4 h-4 text-white" fill="none" aria-hidden="true">
                <path d="M4 10.5 8 14l8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          Other
        </span>
      </button>

      {selected && (
        <div className="px-4 pb-4">
          <div className={otherInputWrapperClasses}>
            <input
              autoFocus
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="What do you do?"
              aria-label="Other profession"
              className={otherInputFieldClasses}
            />

            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className={clearButtonClasses}
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
  const [otherSelectedInternal, setOtherSelectedInternal] = useState(false);
  const [otherValueInternal, setOtherValueInternal] = useState('');

  const otherSelected = otherSelectedProp ?? otherSelectedInternal;
  const otherValue = otherValueProp ?? otherValueInternal;
  const toggleOther = onToggleOther ?? (() => setOtherSelectedInternal((v) => !v));
  const changeOther = onOtherChange ?? setOtherValueInternal;

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
      canContinue={canContinue}
      onContinue={onContinue}
      dark
    >
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {TOPIC_OPTIONS.map((topic) => (
          <PillOption
            key={topic}
            label={topic}
            selected={selected.includes(topic)}
            onClick={() => onToggle(topic)}
            dark
          />
        ))}

        {customItems(selected, TOPIC_OPTIONS).map((topic) => (
          <PillOption key={topic} label={topic} selected onClick={() => onToggle(topic)} dark />
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
      <div className="flex flex-col gap-3 mb-4">
        {GOAL_OPTIONS.map((goal) => (
          <OptionRow
            key={goal}
            label={goal}
            selected={selected.includes(goal)}
            onClick={() => onToggle(goal)}
            dark
          />
        ))}

        {customItems(selected, GOAL_OPTIONS).map((goal) => (
          <OptionRow key={goal} label={goal} selected onClick={() => onToggle(goal)} dark />
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

export function TimeStep({ timeId, onSelect, canContinue, onContinue }: TimeStepProps) {
  return (
    <QuestionShell
      title="How long do you want to learn every day?"
      canContinue={canContinue}
      onContinue={onContinue}
      dark
    >
      <div className="flex flex-col gap-3">
        {TIME_OPTIONS.map(({ id, label, description }) => {
          const isSelected = timeId === id;
          const optionColor = isSelected
            ? 'bg-orange/10 border-orange'
            : 'bg-[#202F35] border-[#37464F] hover:border-orange/30';

          return (
            <button
              type="button"
              key={id}
              onClick={() => onSelect(id)}
              className={`${timeOptionBaseClasses} ${optionColor}`}
            >
              <span className={timeLabelClasses}>{label}</span>
              <span className={timeDescriptionClasses}>{description}</span>
            </button>
          );
        })}
      </div>
    </QuestionShell>
  );
}

export function LoadingStep({ error = null, onRetry }: LoadingStepProps) {
  return (
    <div className={loadingContainerClasses}>
      <GrokitMascot size={120} pose="thinking" className="mb-6" />

      {!error ? (
        <p className={loadingTextClasses}>
          Picking courses based on your role, goals, and interests...
        </p>
      ) : (
        <>
          <p className={errorTextClasses}>
            We couldn't finish setting up your profile.
          </p>

          <p className={errorSubtextClasses}>
            Please try again. Your answers are still here.
          </p>

          {onRetry && (
            <button type="button" onClick={onRetry} className={retryButtonClasses}>
              Try again
            </button>
          )}
        </>
      )}
    </div>
  );
}