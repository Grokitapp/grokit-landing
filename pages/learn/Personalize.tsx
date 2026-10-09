import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ChevronLeft, Sparkles } from 'lucide-react';

interface LocationState {
  prompt?: string;
}

type Level = 'new' | 'beginner' | 'intermediate' | 'advanced';

const levels: {
  value: Level;
  label: string;
  description: string;
}[] = [
  {
    value: 'new',
    label: 'Completely new',
    description: 'Start with the fundamentals.',
  },
  {
    value: 'beginner',
    label: 'I know a little',
    description: 'I know a few terms but need clarity.',
  },
  {
    value: 'intermediate',
    label: 'I know the fundamentals',
    description: 'Help me build a deeper understanding.',
  },
  {
    value: 'advanced',
    label: 'Already experienced',
    description: 'Focus on advanced concepts and applications.',
  },
];

const knowledgeOptions = [
  { value: 'concepts', label: 'I understand the basic concepts' },
  { value: 'terminology', label: 'I know the key terminology' },
  { value: 'practical', label: 'I have tried practical examples' },
  { value: 'technical', label: 'I understand the technical details' },
];

const focusOptions = [
  { value: 'deeper', label: 'Understand how it works in depth' },
  { value: 'practical', label: 'Apply it to real-world problems' },
  { value: 'advanced', label: 'Explore advanced techniques' },
  { value: 'projects', label: 'Build something practical' },
];

const primaryButtonClasses =
  'flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-orange px-5 text-[15px] font-extrabold text-white shadow-[0_4px_0_#C94713] transition-all hover:brightness-105 active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50';

const secondaryButtonClasses =
  'flex min-h-[48px] w-full items-center justify-center rounded-full border border-[#37464F] bg-[#202F35] px-5 text-sm font-bold text-white transition-colors hover:border-orange/60';

export default function Personalize() {
  const navigate = useNavigate();
  const location = useLocation();
  const { prompt } = (location.state as LocationState) ?? {};

  const [level, setLevel] = useState<Level | null>(null);
  const [knowledge, setKnowledge] = useState<string[]>([]);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [focus, setFocus] = useState('');

  const goBack = () => navigate(-1);

  const toggleItem = (
    value: string,
    current: string[],
    update: (next: string[]) => void,
  ) => {
    update(
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const startGeneration = (personalized: boolean) => {
    const topic = prompt?.trim();

    if (!topic) {
      navigate('/create');
      return;
    }

    const personalizationProfile =
      personalized && level
        ? {
            experienceLevel: level,
            existingKnowledge: level === 'new' ? [] : knowledge,
            learningFocus:
              level === 'new'
                ? ''
                : focus.trim(),
            focusAreas: level === 'new' ? [] : focusAreas,
          }
        : undefined;

    navigate('/learn/generating', {
      state: {
        prompt: topic,
        personalized: Boolean(personalizationProfile),
        ...(personalizationProfile
          ? { personalizationProfile }
          : {}),
      },
    });
  };

  const showFollowUps = level !== null && level !== 'new';

  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden bg-[#131F24] text-white">
      {/* Fixed top navigation */}
      <header className="relative z-10 shrink-0 border-b border-white/[0.04] bg-[#131F24] px-5 pb-3 pt-[max(12px,env(safe-area-inset-top))] sm:px-8">
        <button
          type="button"
          onClick={goBack}
          aria-label="Go back"
          className="absolute left-4 top-3 flex h-10 w-10 items-center justify-center rounded-full text-[#91A4AC] transition-colors hover:bg-[#202F35] hover:text-white sm:left-8 sm:top-4"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="mx-auto w-full max-w-[720px] px-1 pt-12 sm:pt-10">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#91A4AC]">
            Make it yours
          </p>

          <h1 className="font-display text-[25px] font-extrabold leading-tight sm:text-[32px]">
            Let&apos;s find your starting point
          </h1>

          <p className="mt-2 max-w-[560px] text-sm leading-6 text-[#91A4AC] sm:text-[15px]">
            A quick check-in helps us create a journey that starts at the
            right level for you.
          </p>
        </div>
      </header>

      {/* Only this region scrolls */}
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8 sm:py-8"
        style={{ scrollbarGutter: 'stable' }}
      >
        <div className="mx-auto w-full max-w-[680px]">
          {prompt?.trim() && (
            <div className="mb-7 rounded-2xl border border-[#37464F] bg-[#19282E] px-4 py-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#718993]">
                Your topic
              </p>
              <p className="break-words text-sm leading-6 text-white">
                {prompt.trim()}
              </p>
            </div>
          )}

          <section aria-labelledby="familiarity-heading">
            <h2
              id="familiarity-heading"
              className="mb-1 text-base font-extrabold sm:text-lg"
            >
              How familiar are you with this topic?
            </h2>
            <p className="mb-4 text-sm leading-6 text-[#91A4AC]">
              Choose the level that feels closest to you.
            </p>

            <div className="space-y-2.5">
              {levels.map((item) => {
                const selected = level === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setLevel(item.value)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors sm:p-4 ${
                      selected
                        ? 'border-orange bg-[#253238]'
                        : 'border-[#37464F] bg-[#19262B] hover:border-[#52666F]'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        selected ? 'border-orange' : 'border-[#60757E]'
                      }`}
                    >
                      {selected && (
                        <span className="h-2.5 w-2.5 rounded-full bg-orange" />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-[#91A4AC] sm:text-sm">
                        {item.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {level === 'new' && (
            <div className="mt-5 rounded-xl border border-[#37464F] bg-[#19282E] p-4">
              <p className="text-sm font-semibold text-white">
                Perfect. We&apos;ll start with the essentials.
              </p>
              <p className="mt-1 text-sm leading-6 text-[#91A4AC]">
                No more questions needed. We&apos;ll use your topic and
                onboarding preferences to shape your journey.
              </p>
            </div>
          )}

          {level === 'beginner' && (
            <section className="mt-8">
              <h2 className="mb-1 text-base font-extrabold sm:text-lg">
                What do you already know?
              </h2>
              <p className="mb-4 text-sm leading-6 text-[#91A4AC]">
                Select anything that applies. You can leave this blank.
              </p>

              <div className="space-y-3">
                {knowledgeOptions.slice(0, 3).map((item) => (
                  <label
                    key={item.value}
                    className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-[#D5DEE2]"
                  >
                    <input
                      type="checkbox"
                      checked={knowledge.includes(item.value)}
                      onChange={() =>
                        toggleItem(item.value, knowledge, setKnowledge)
                      }
                      className="mt-1 h-4 w-4 shrink-0 accent-[#FF6B00]"
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </section>
          )}

          {level === 'intermediate' && (
            <section className="mt-8">
              <h2 className="mb-1 text-base font-extrabold sm:text-lg">
                What would you like to understand more deeply?
              </h2>
              <p className="mb-4 text-sm leading-6 text-[#91A4AC]">
                Choose any areas that interest you.
              </p>

              <div className="space-y-3">
                {focusOptions.slice(0, 2).map((item) => (
                  <label
                    key={item.value}
                    className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-[#D5DEE2]"
                  >
                    <input
                      type="checkbox"
                      checked={focusAreas.includes(item.value)}
                      onChange={() =>
                        toggleItem(item.value, focusAreas, setFocusAreas)
                      }
                      className="mt-1 h-4 w-4 shrink-0 accent-[#FF6B00]"
                    />
                    {item.label}
                  </label>
                ))}
              </div>

              <label
                htmlFor="learning-focus"
                className="mb-2 mt-5 block text-sm font-semibold text-white"
              >
                Anything specific on your mind? (Optional)
              </label>
              <textarea
                id="learning-focus"
                value={focus}
                onChange={(event) => setFocus(event.target.value)}
                maxLength={1200}
                rows={3}
                placeholder="e.g. How neural networks learn..."
                className="w-full resize-y rounded-2xl border border-[#37464F] bg-[#19282E] p-4 text-sm leading-6 text-white outline-none placeholder:text-[#718993] focus:border-orange"
              />
            </section>
          )}

          {level === 'advanced' && (
            <section className="mt-8">
              <h2 className="mb-1 text-base font-extrabold sm:text-lg">
                What do you want to focus on?
              </h2>
              <p className="mb-4 text-sm leading-6 text-[#91A4AC]">
                Select the direction that best fits your goals.
              </p>

              <div className="space-y-3">
                {focusOptions.map((item) => (
                  <label
                    key={item.value}
                    className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-[#D5DEE2]"
                  >
                    <input
                      type="checkbox"
                      checked={focusAreas.includes(item.value)}
                      onChange={() =>
                        toggleItem(item.value, focusAreas, setFocusAreas)
                      }
                      className="mt-1 h-4 w-4 shrink-0 accent-[#FF6B00]"
                    />
                    {item.label}
                  </label>
                ))}
              </div>

              <label
                htmlFor="learning-focus"
                className="mb-2 mt-5 block text-sm font-semibold text-white"
              >
                Specific challenge or application (Optional)
              </label>
              <textarea
                id="learning-focus"
                value={focus}
                onChange={(event) => setFocus(event.target.value)}
                maxLength={1200}
                rows={3}
                placeholder="What would you like to be able to solve or build?"
                className="w-full resize-y rounded-2xl border border-[#37464F] bg-[#19282E] p-4 text-sm leading-6 text-white outline-none placeholder:text-[#718993] focus:border-orange"
              />
            </section>
          )}
        </div>
      </div>

      {/* Fixed bottom actions */}
      <footer className="z-10 shrink-0 border-t border-white/[0.06] bg-[#131F24] px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 sm:px-8">
        <div className="mx-auto flex w-full max-w-[680px] flex-col gap-3">
          <button
            type="button"
            onClick={() => startGeneration(true)}
            disabled={!prompt?.trim() || !level}
            className={primaryButtonClasses}
          >
            <Sparkles className="h-4 w-4" />
            Create my learning journey
          </button>

          <button
            type="button"
            onClick={() => startGeneration(false)}
            disabled={!prompt?.trim()}
            className={secondaryButtonClasses}
          >
            Skip questions and create directly
          </button>
        </div>
      </footer>
    </main>
  );
}