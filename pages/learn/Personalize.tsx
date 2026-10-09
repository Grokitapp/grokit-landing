import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ChevronLeft, Sparkles } from 'lucide-react';
import grokitOcto from '../../assets/grokit-octo.png';

interface LocationState {
  prompt?: string;
}

const levels = [
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

const pageClasses =
  'min-h-[100dvh] bg-[#131F24] text-white flex flex-col items-center px-5 py-10 sm:py-12 relative';

const primaryButtonClasses =
  'w-full min-h-[52px] rounded-full bg-orange text-white font-sans font-extrabold text-[15px] shadow-[0_4px_0_#C94713] hover:brightness-105 active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed';

const secondaryButtonClasses =
  'w-full min-h-[48px] rounded-full bg-[#202F35] border border-[#37464F] text-white font-sans font-bold text-[14px] hover:border-orange/50 transition-all';

export default function Personalize() {
  const navigate = useNavigate();
  const location = useLocation();
  const { prompt } = (location.state as LocationState) ?? {};

  const [level, setLevel] = useState('beginner');
  const [knowledge, setKnowledge] = useState<string[]>([]);
  const [focus, setFocus] = useState('');

  const goBack = () => navigate(-1);

  const createDirectly = () => {
    if (!prompt?.trim()) {
      navigate('/create');
      return;
    }

    navigate('/learn/generating', {
      state: {
        prompt: prompt.trim(),
        personalized: false,
      },
    });
  };

  const createPersonalized = () => {
    if (!prompt?.trim()) {
      navigate('/create');
      return;
    }

    const personalizationProfile = {
      experienceLevel: level,
      existingKnowledge: knowledge,
      learningFocus: focus.trim(),
    };

    navigate('/learn/generating', {
      state: {
        prompt: prompt.trim(),
        personalized: true,
        personalizationProfile,
      },
    });
  };

  return (
    <main className={pageClasses}>
      <button
        type="button"
        onClick={goBack}
        aria-label="Go back"
        className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-full text-[#91A4AC] transition-colors hover:bg-[#202F35] hover:text-white sm:left-8 sm:top-8"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="w-full max-w-[620px] pt-12 sm:pt-6">
        <div className="mb-8 flex flex-col items-center text-center">
          <img
            src={grokitOcto}
            alt=""
            className="mb-5 h-24 w-24 object-contain sm:h-28 sm:w-28"
          />

          <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#91A4AC]">
            Make it yours
          </p>

          <h1 className="mb-3 font-display text-[28px] font-extrabold leading-tight text-white sm:text-[36px]">
            Let's find your starting point
          </h1>

          <p className="max-w-[480px] text-sm leading-6 text-[#91A4AC] sm:text-base">
            Tell us what you already know about your topic. We'll use it to
            shape a course that fits you.
          </p>

          {prompt && (
            <div className="mt-5 w-full rounded-2xl border border-[#37464F] bg-[#19282E] px-4 py-3 text-left">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#718993]">
                Your topic
              </p>
              <p className="text-sm leading-6 text-white">{prompt}</p>
            </div>
          )}
        </div>

        <section className="mb-7">
          <h2 className="mb-1 text-base font-extrabold text-white sm:text-lg">
            1. How familiar are you with this topic?
          </h2>
          <p className="mb-4 text-sm text-[#91A4AC]">
            Choose the level that feels closest to you.
          </p>

          <div className="space-y-2">
            {levels.map((item) => {
              const selected = level === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setLevel(item.value)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-all sm:p-4 ${
                    selected
                      ? 'border-orange bg-[#253238]'
                      : 'border-[#37464F] bg-[#19262B] hover:border-[#52666F]'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      selected
                        ? 'border-orange'
                        : 'border-[#60757E]'
                    }`}
                  >
                    {selected && (
                      <span className="h-2.5 w-2.5 rounded-full bg-orange" />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-white">
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

        <section className="mb-7">
          <h2 className="mb-1 text-base font-extrabold text-white sm:text-lg">
            2. What do you already know?
          </h2>
          <p className="mb-4 text-sm text-[#91A4AC]">
            Select anything that applies. You can skip this question.
          </p>

          <div className="space-y-3">
            {knowledgeOptions.map((item) => {
              const checked = knowledge.includes(item.value);

              return (
                <label
                  key={item.value}
                  className="flex cursor-pointer items-center gap-3 text-sm text-[#D5DEE2]"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      setKnowledge((current) =>
                        event.target.checked
                          ? [...current, item.value]
                          : current.filter((value) => value !== item.value),
                      );
                    }}
                    className="h-4 w-4 accent-[#FF6B00]"
                  />
                  {item.label}
                </label>
              );
            })}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-1 text-base font-extrabold text-white sm:text-lg">
            3. What would you especially like to understand?
          </h2>
          <p className="mb-3 text-sm text-[#91A4AC]">
            Optional. Tell us about a question, skill, or real-world application.
          </p>

          <textarea
            value={focus}
            onChange={(event) => setFocus(event.target.value)}
            maxLength={1200}
            rows={3}
            placeholder="e.g. How neural networks learn and where AI is used..."
            className="w-full resize-y rounded-2xl border border-[#37464F] bg-[#19282E] p-4 text-sm leading-6 text-white outline-none transition-colors placeholder:text-[#718993] focus:border-orange"
          />
        </section>

        <div className="space-y-3">
          <button
            type="button"
            onClick={createPersonalized}
            disabled={!prompt?.trim()}
            className={primaryButtonClasses}
          >
            <span className="inline-flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4" />
              Create my learning journey
            </span>
          </button>

          <button
            type="button"
            onClick={createDirectly}
            className={secondaryButtonClasses}
          >
            Skip questions and create directly
          </button>
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-[#718993]">
          Your learning preferences from onboarding can help shape your course,
          too.
        </p>
      </div>
    </main>
  );
}