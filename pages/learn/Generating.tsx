import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Compass,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

import grokitMascot from '../../assets/grokit-hero-mascot.png';
import { createCourseFromPrompt } from '../../lib/courseGeneration';
import type { Schema } from '../../amplify/data/resource';

type Course = Schema['Course']['type'];

type ExperienceLevel =
  | 'new'
  | 'beginner'
  | 'intermediate'
  | 'advanced';

type PersonalizationProfile = {
  experienceLevel: ExperienceLevel;
  existingKnowledge: string[];
  learningFocus: string;
  focusAreas: string[];
};

type LocationState = {
  prompt?: unknown;
  personalized?: unknown;
  personalizationProfile?: unknown;
};

type Stage = 'building' | 'revealing' | 'ready' | 'error';

const EXPERIENCE_LEVELS = new Set<ExperienceLevel>([
  'new',
  'beginner',
  'intermediate',
  'advanced',
]);

const ACTIVITY_MESSAGES = [
  'Understanding what you want to learn',
  'Designing your learning path',
  'Organizing the topics into clear steps',
  'Preparing your first dive',
];

const pageClasses =
  'relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#131F24] px-5 py-12 text-white';

const backButtonClasses =
  'absolute left-5 top-5 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#91A4AC] transition hover:bg-[#202F35] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange sm:left-8 sm:top-8';

const primaryButtonClasses =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange px-6 font-bold text-white shadow-[0_4px_0_#C94713] transition hover:brightness-105 active:translate-y-0.5 active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-[#131F24] disabled:cursor-not-allowed disabled:opacity-60';

const secondaryButtonClasses =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#37464F] px-6 font-semibold text-[#C8D3DA] transition hover:bg-[#202F35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange';

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return [
    ...new Set(
      value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function normalizeProfile(
  value: unknown,
): PersonalizationProfile | undefined {
  if (!value || typeof value !== 'object') return undefined;

  const profile = value as Record<string, unknown>;

  const level =
    typeof profile.experienceLevel === 'string' &&
    EXPERIENCE_LEVELS.has(profile.experienceLevel as ExperienceLevel)
      ? (profile.experienceLevel as ExperienceLevel)
      : 'new';

  return {
    experienceLevel: level,
    existingKnowledge: normalizeStringList(profile.existingKnowledge),
    learningFocus:
      typeof profile.learningFocus === 'string'
        ? profile.learningFocus.trim()
        : '',
    focusAreas: normalizeStringList(profile.focusAreas),
  };
}

function getFriendlyError(): string {
  return 'We couldn’t create your journey this time. Please try again, or return to Create to adjust your idea.';
}

function BackToCreate({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={backButtonClasses}
    >
      <ChevronLeft className="h-5 w-5" />
      Back to Create
    </button>
  );
}

export default function Generating() {
  const navigate = useNavigate();
  const location = useLocation();

  const locationState = (location.state ?? {}) as LocationState;

  const prompt =
    typeof locationState.prompt === 'string'
      ? locationState.prompt.trim()
      : '';

  const personalized = locationState.personalized === true;

  // Memoizing the normalized profile keeps the generation callback stable
  // across ordinary renders, preventing accidental effect re-runs.
  const personalizationProfile = useMemo(
    () => normalizeProfile(locationState.personalizationProfile),
    [locationState.personalizationProfile],
  );

  const hasPrompt = Boolean(prompt);

  const [stage, setStage] = useState<Stage>('building');
  const [activityIndex, setActivityIndex] = useState(0);
  const [typedTitle, setTypedTitle] = useState('');
  const [journey, setJourney] = useState<Course | null>(null);
  const [attempt, setAttempt] = useState(0);

  const activeRequest = useRef(0);
  const fullTitle = useRef('');

  const goBack = useCallback(() => {
    navigate('/create');
  }, [navigate]);

  const runGeneration = useCallback(async () => {
    const requestId = ++activeRequest.current;

    if (!hasPrompt) {
      setJourney(null);
      setTypedTitle('');
      setStage('error');
      return;
    }

    setStage('building');
    setJourney(null);
    setTypedTitle('');
    setActivityIndex(0);
    fullTitle.current = '';

    try {
      const result = await createCourseFromPrompt(
        prompt,
        personalized ? personalizationProfile : undefined,
      );

      // Ignore results from stale or cancelled requests.
      if (requestId !== activeRequest.current) return;

      if (!result?.id || !result.title?.trim()) {
        throw new Error('JOURNEY_RESULT_INCOMPLETE');
      }

      setJourney(result);
      fullTitle.current = result.title.trim();
      setStage('revealing');
    } catch (error) {
      if (requestId !== activeRequest.current) return;

      // Diagnostics are kept out of the visible interface.
      console.error('[Generating] Journey creation failed:', error);
      setJourney(null);
      setStage('error');
    }
  }, [
    hasPrompt,
    prompt,
    personalized,
    personalizationProfile,
  ]);

  useEffect(() => {
    void runGeneration();

    return () => {
      // Invalidate this request if the screen unmounts or dependencies change.
      activeRequest.current += 1;
    };
  }, [runGeneration, attempt]);

  useEffect(() => {
    if (stage !== 'building') return;

    const interval = window.setInterval(() => {
      setActivityIndex(
        (current) => (current + 1) % ACTIVITY_MESSAGES.length,
      );
    }, 2400);

    return () => window.clearInterval(interval);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'revealing') return;

    const title = fullTitle.current;
    let index = 0;

    setTypedTitle('');

    if (!title) {
      setStage('ready');
      return;
    }

    const interval = window.setInterval(() => {
      index += 1;
      setTypedTitle(title.slice(0, index));

      if (index >= title.length) {
        window.clearInterval(interval);
        setStage('ready');
      }
    }, 24);

    return () => window.clearInterval(interval);
  }, [stage]);

  const retry = useCallback(() => {
    if (!hasPrompt) {
      goBack();
      return;
    }

    // A retry deliberately starts a new generation attempt.
    setAttempt((current) => current + 1);
  }, [hasPrompt, goBack]);

  const openJourney = useCallback(() => {
    if (stage !== 'ready' || !journey?.id) return;

    navigate(`/learn/course/${journey.id}`, {
      state: {
        newlyCreatedJourneyId: journey.id,
        refreshJourneys: true,
      },
    });
  }, [stage, journey, navigate]);

  if (stage === 'error') {
    return (
      <main className={pageClasses}>
        <BackToCreate onClick={goBack} />

        <div className="flex w-full max-w-lg flex-col items-center text-center">
          <div className="mb-7 flex h-28 w-28 items-center justify-center rounded-full border border-[#37464F] bg-[#202F35]">
            <img
              src={grokitMascot}
              alt="Grokit"
              className="h-24 w-24 object-contain"
            />
          </div>

          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-orange">
            A small detour
          </p>

          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
            Your journey isn’t ready yet
          </h1>

          <p className="mt-4 max-w-md text-sm leading-6 text-[#91A4AC] sm:text-base">
            {getFriendlyError()}
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center">
            {hasPrompt && (
              <button
                type="button"
                onClick={retry}
                className={primaryButtonClasses}
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
            )}

            <button
              type="button"
              onClick={goBack}
              className={secondaryButtonClasses}
            >
              Edit my idea
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (stage === 'building') {
    return (
      <main className={pageClasses}>
        <BackToCreate onClick={goBack} />

        <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange/[0.06] blur-3xl" />

        <div className="relative flex w-full max-w-xl flex-col items-center text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-orange">
            Your next adventure
          </p>

          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
            Building your journey
          </h1>

          <p className="mt-3 max-w-md text-sm leading-6 text-[#91A4AC] sm:text-base">
            Turning your idea into a clear path, one step at a time.
          </p>

          <div className="my-8 flex h-40 w-40 items-center justify-center rounded-full border border-[#37464F] bg-[#202F35]/80 shadow-[0_0_70px_rgba(255,107,0,0.08)] sm:h-48 sm:w-48">
            <img
              src={grokitMascot}
              alt="Grokit is preparing your journey"
              className="h-36 w-36 animate-[float_3s_ease-in-out_infinite] object-contain sm:h-44 sm:w-44"
            />
          </div>

          <div className="w-full max-w-md rounded-2xl border border-[#37464F] bg-[#19282E] p-5 text-left">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange/10 text-orange">
                <Sparkles className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white">
                  Working on your learning path
                </p>

                <p
                  aria-live="polite"
                  className="mt-1 text-sm text-[#91A4AC]"
                >
                  {ACTIVITY_MESSAGES[activityIndex]}
                </p>
              </div>

              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-orange"
              />
            </div>

            <div
              role="progressbar"
              aria-label="Preparing your journey"
              aria-valuetext="In progress"
              className="h-2 overflow-hidden rounded-full bg-[#0D181C]"
            >
              <div className="h-full w-2/5 animate-[loading-bar_1.8s_ease-in-out_infinite] rounded-full bg-orange" />
            </div>
          </div>

          <p className="mt-5 text-xs text-[#60757E]">
            This can take a little while. Grokit is working on your learning path.
          </p>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-7px); }
          }

          @keyframes loading-bar {
            0% { transform: translateX(-120%); }
            100% { transform: translateX(280%); }
          }

          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              scroll-behavior: auto !important;
            }
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#131F24] px-5 py-10 text-white">
      <BackToCreate onClick={goBack} />

      <div className="w-full max-w-4xl">
        <div className="mb-7 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Your journey is ready
          </div>

          <h1 className="mx-auto max-w-3xl font-display text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
            {typedTitle || journey?.title}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#91A4AC] sm:text-base">
            A learning path built around your idea. Take it at your own pace
            and pick up where you leave off.
          </p>
        </div>

        <section className="relative overflow-hidden rounded-[28px] border border-[#37464F] bg-gradient-to-br from-[#20343A] via-[#1B2B31] to-[#202F35] p-6 sm:p-9">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-orange/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-teal-400/[0.07] blur-3xl" />

          <div className="relative grid items-center gap-7 sm:grid-cols-[1fr_auto] sm:gap-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange">
                Your first dive starts here
              </p>

              <h2 className="mt-3 font-display text-xl font-bold sm:text-2xl">
                A path made for you
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-[#B5C5CB] sm:text-base">
                {journey?.description?.trim() ||
                  'Your journey is ready. Explore the learning zones and begin with the foundations.'}
              </p>

              <div className="mt-5 inline-flex items-center gap-2 text-sm text-[#91A4AC]">
                <Compass className="h-4 w-4 text-orange" />
                Learn step by step, at your own pace
              </div>
            </div>

            <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full border border-white/10 bg-[#142329]/70 sm:h-40 sm:w-40">
              <img
                src={grokitMascot}
                alt="Grokit welcomes you to your new journey"
                className="h-28 w-28 object-contain sm:h-36 sm:w-36"
              />
            </div>
          </div>
        </section>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={openJourney}
            disabled={!journey?.id}
            className={`${primaryButtonClasses} min-h-14 flex-1 rounded-2xl`}
          >
            Start your journey
            <ArrowRight className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={goBack}
            className={`${secondaryButtonClasses} min-h-14 rounded-2xl`}
          >
            <Sparkles className="h-4 w-4" />
            Create another
          </button>
        </div>
      </div>
    </main>
  );
}
