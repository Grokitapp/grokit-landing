import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';

import { WaitlistModal } from '../components/Waitlistmodal';
import { saveProfile } from '../lib/profile';
import type { MascotPose } from '../components/Grokitmascot';

import AuthScreen from './onboarding/auth/AuthScreen';
import Welcome from './onboarding/Welcome';

import {
  BACK_STEP,
  DISCORD_INVITE_URL,
  PROGRESS_BY_STEP,
  STEP,
  TOTAL_QUESTIONS,
  lessonsPerWeekFor,
  type Step,
} from './onboarding/constants';

import {
  ProgressBar,
  TransitionScreen,
} from './onboarding/shared';

import {
  GoalsStep,
  IntroStep,
  LoadingStep,
  TimeStep,
  TopicsStep,
  WorkTypeStep,
} from './onboarding/steps';

/* -------------------------------------------------------------------------- */
/* STATIC TRANSITION SCREENS                                                 */
/* -------------------------------------------------------------------------- */

interface TransitionConfig {
  pose: MascotPose;
  heading: string;
  sub: string;
  note?: string;
  next: Step;
}

const STATIC_TRANSITIONS: Partial<
  Record<Step, TransitionConfig>
> = {
  [STEP.T_PERSONALIZED]: {
    pose: 'thinking',
    heading: 'Personalized learning for you',
    sub: "We'll use examples relevant to your role and expertise when it's helpful.",
    note: 'You can update this anytime in your settings.',
    next: STEP.TOPICS,
  },

  [STEP.T_PERFECT]: {
    pose: 'celebrate',
    heading:
      "Perfect choice! We'll use this to find the best courses for you",
    sub: 'You can also build your own course for any topic you want to learn.',
    next: STEP.GOALS,
  },

  [STEP.T_GREAT]: {
    pose: 'wave',
    heading:
      "Great! We'll help you learn what you thought you didn't have time for",
    sub: "Finally learn the things you've always wanted to learn.",
    next: STEP.TIME,
  },
};

/* -------------------------------------------------------------------------- */
/* DARK STEPS                                                                */
/* -------------------------------------------------------------------------- */

const DARK_STEPS = new Set<Step>([
  STEP.INTRO,
  STEP.WORK_TYPE,
  STEP.T_PERSONALIZED,
  STEP.TOPICS,
  STEP.T_PERFECT,
  STEP.GOALS,
  STEP.T_GREAT,
  STEP.TIME,
  STEP.T_BOOKS,
  STEP.LOADING,
]);

/* -------------------------------------------------------------------------- */
/* ONBOARDING                                                                */
/* -------------------------------------------------------------------------- */

export default function Onboarding() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(STEP.AUTH);

  /* ------------------------------------------------------------------------ */
  /* PROFILE STATE                                                            */
  /* ------------------------------------------------------------------------ */

  const [workTypes, setWorkTypes] = useState<string[]>([]);
  const [otherWorkType, setOtherWorkType] = useState('');
  const [isOtherWorkTypeSelected, setIsOtherWorkTypeSelected] =
    useState(false);

  const [topics, setTopics] = useState<string[]>([]);
  const [otherTopic, setOtherTopic] = useState('');

  const [goals, setGoals] = useState<string[]>([]);
  const [otherGoal, setOtherGoal] = useState('');

  const [timeId, setTimeId] = useState<string | null>(null);

  /* ------------------------------------------------------------------------ */
  /* UI STATE                                                                */
  /* ------------------------------------------------------------------------ */

  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  const [savingError, setSavingError] = useState<string | null>(
    null,
  );

  const [isSavingProfile, setIsSavingProfile] = useState(false);

  /* ------------------------------------------------------------------------ */
  /* HELPERS                                                                  */
  /* ------------------------------------------------------------------------ */

  const toggleItem = (
    setList: Dispatch<SetStateAction<string[]>>,
    item: string,
  ) => {
    setList((current) =>
      current.includes(item)
        ? current.filter((i) => i !== item)
        : [...current, item],
    );
  };

  const addOther = (
    value: string,
    setList: Dispatch<SetStateAction<string[]>>,
    clear: () => void,
  ) => {
    const trimmed = value.trim();

    if (!trimmed) return;

    setList((current) =>
      current.includes(trimmed)
        ? current
        : [...current, trimmed],
    );

    clear();
  };

  /* ------------------------------------------------------------------------ */
  /* DERIVED STATE                                                            */
  /* ------------------------------------------------------------------------ */

  const hasOtherWorkType =
    isOtherWorkTypeSelected &&
    otherWorkType.trim().length > 0;

  const finalWorkTypes = hasOtherWorkType
    ? [
        ...workTypes,
        ...(workTypes.includes(otherWorkType.trim())
          ? []
          : [otherWorkType.trim()]),
      ]
    : workTypes;

  const canContinue =
    step === STEP.WORK_TYPE
      ? finalWorkTypes.length > 0
      : step === STEP.TOPICS
        ? topics.length > 0
        : step === STEP.GOALS
          ? goals.length > 0
          : step === STEP.TIME
            ? timeId !== null
            : true;

  const prevStep = BACK_STEP[step];

  const progress = PROGRESS_BY_STEP[step];

  /* ------------------------------------------------------------------------ */
  /* FINAL ONBOARDING SAVE                                                    */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (step !== STEP.LOADING) {
      return;
    }

    let cancelled = false;

    const finalizeOnboarding = async () => {
      setIsSavingProfile(true);
      setSavingError(null);

      if (!timeId) {
        setSavingError(
          'Your learning time preference is missing.',
        );
        setIsSavingProfile(false);
        return;
      }

      try {
        /*
         * THIS IS THE ONLY PLACE WHERE THE COMPLETE
         * ONBOARDING PROFILE IS SENT TO AWS.
         */
        await saveProfile({
          workTypes: finalWorkTypes,
          topics,
          goals,
          timeCommitment: timeId,
          onboardingCompleted: true,
        });

        if (cancelled) return;

        /*
         * Onboarding is now officially complete.
         *
         * "What do you want to learn?" lives at /learn,
         * outside the onboarding flow.
         */
        navigate('/learn', {
          replace: true,
        });
      } catch (error) {
        console.error(
          'Failed to finalize onboarding profile:',
          error,
        );

        if (!cancelled) {
          setSavingError(
            'We could not save your learning profile.',
          );
          setIsSavingProfile(false);
        }
      }
    };

    const timer = window.setTimeout(
      finalizeOnboarding,
      1200,
    );

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    step,
    timeId,
    finalWorkTypes,
    topics,
    goals,
    navigate,
  ]);

  /* ------------------------------------------------------------------------ */
  /* RENDER STEP                                                              */
  /* ------------------------------------------------------------------------ */

  const renderStep = () => {
    switch (step) {
      /* -------------------------------------------------------------------- */
      /* AUTH                                                                 */
      /* -------------------------------------------------------------------- */

      case STEP.AUTH:
        return (
          <AuthScreen
            onAuthenticated={() =>
              setStep(STEP.WELCOME)
            }
          />
        );

      /* -------------------------------------------------------------------- */
      /* WELCOME                                                              */
      /* -------------------------------------------------------------------- */

      case STEP.WELCOME:
        return (
          <Welcome
            onContinue={() =>
              setStep(STEP.INTRO)
            }
            discordInviteUrl={DISCORD_INVITE_URL}
          />
        );

      /* -------------------------------------------------------------------- */
      /* INTRO                                                                */
      /* -------------------------------------------------------------------- */

      case STEP.INTRO:
        return (
          <IntroStep
            onContinue={() =>
              setStep(STEP.WORK_TYPE)
            }
          />
        );

      /* -------------------------------------------------------------------- */
      /* WORK TYPE                                                            */
      /* -------------------------------------------------------------------- */

      case STEP.WORK_TYPE:
        return (
          <WorkTypeStep
            selected={workTypes}
            onToggle={(type) =>
              toggleItem(
                setWorkTypes,
                type,
              )
            }
            otherSelected={
              isOtherWorkTypeSelected
            }
            otherValue={otherWorkType}
            onToggleOther={() =>
              setIsOtherWorkTypeSelected(
                (value) => !value,
              )
            }
            onOtherChange={setOtherWorkType}
            canContinue={canContinue}
            onContinue={() =>
              setStep(
                STEP.T_PERSONALIZED,
              )
            }
          />
        );

      /* -------------------------------------------------------------------- */
      /* TRANSITIONS                                                          */
      /* -------------------------------------------------------------------- */

      case STEP.T_PERSONALIZED:
      case STEP.T_PERFECT:
      case STEP.T_GREAT: {
        const transition =
          STATIC_TRANSITIONS[step];

        if (!transition) {
          return null;
        }

        return (
          <TransitionScreen
            pose={transition.pose}
            heading={transition.heading}
            sub={transition.sub}
            note={transition.note}
            onContinue={() =>
              setStep(transition.next)
            }
          />
        );
      }

      /* -------------------------------------------------------------------- */
      /* TOPICS                                                               */
      /* -------------------------------------------------------------------- */

      case STEP.TOPICS:
        return (
          <TopicsStep
            selected={topics}
            onToggle={(topic) =>
              toggleItem(
                setTopics,
                topic,
              )
            }
            otherValue={otherTopic}
            onOtherChange={setOtherTopic}
            onAddOther={() =>
              addOther(
                otherTopic,
                setTopics,
                () => setOtherTopic(''),
              )
            }
            canContinue={canContinue}
            onContinue={() =>
              setStep(
                STEP.T_PERFECT,
              )
            }
          />
        );

      /* -------------------------------------------------------------------- */
      /* GOALS                                                                */
      /* -------------------------------------------------------------------- */

      case STEP.GOALS:
        return (
          <GoalsStep
            selected={goals}
            onToggle={(goal) =>
              toggleItem(
                setGoals,
                goal,
              )
            }
            otherValue={otherGoal}
            onOtherChange={setOtherGoal}
            onAddOther={() =>
              addOther(
                otherGoal,
                setGoals,
                () => setOtherGoal(''),
              )
            }
            canContinue={canContinue}
            onContinue={() =>
              setStep(
                STEP.T_GREAT,
              )
            }
          />
        );

      /* -------------------------------------------------------------------- */
      /* TIME                                                                 */
      /* -------------------------------------------------------------------- */

      case STEP.TIME:
        return (
          <TimeStep
            timeId={timeId}
            onSelect={setTimeId}
            canContinue={canContinue}
            onContinue={() => {
              if (!timeId) return;

              setStep(STEP.T_BOOKS);
            }}
          />
        );

      /* -------------------------------------------------------------------- */
      /* FIRST WEEK                                                           */
      /* -------------------------------------------------------------------- */

      case STEP.T_BOOKS:
        return (
          <TransitionScreen
            pose="celebrate"
            heading={`${lessonsPerWeekFor(timeId)} lessons in your first week`}
            sub="You're on your way to building a lasting learning habit!"
            onContinue={() =>
              setStep(STEP.LOADING)
            }
          />
        );

      /* -------------------------------------------------------------------- */
      /* LOADING / AWS FINALIZATION                                           */
      /* -------------------------------------------------------------------- */

      case STEP.LOADING:
        return (
          <LoadingStep
            error={savingError}
            onRetry={
              savingError
                ? () => {
                    setSavingError(null);
                    setIsSavingProfile(true);

                    /*
                     * Re-entering LOADING triggers the
                     * effect again.
                     */
                    setStep(STEP.TIME);
                  }
                : undefined
            }
          />
        );

      default:
        return null;
    }
  };

  /* ------------------------------------------------------------------------ */
  /* CANVAS                                                                   */
  /* ------------------------------------------------------------------------ */

  const isDarkOnboarding =
    DARK_STEPS.has(step);

  const canvasBg = isDarkOnboarding
    ? 'bg-[#131F24]'
    : 'bg-surface';

  /* ------------------------------------------------------------------------ */
  /* PAGE                                                                     */
  /* ------------------------------------------------------------------------ */

  return (
    <div
      className={`
        min-h-[100dvh]
        h-[100dvh]
        flex
        flex-col
        overflow-hidden
        ${canvasBg}
      `}
    >
      {/* Navigation + progress */}
      {prevStep !== undefined && (
        <div
          className={`
            relative
            z-30
            w-full
            shrink-0
            px-5
            sm:px-6
            pt-4
            sm:pt-5
            pb-1
            flex
            items-start
            ${canvasBg}
          `}
        >
          <button
            type="button"
            onClick={() =>
              setStep(prevStep)
            }
            className={`
              p-2
              -ml-2
              shrink-0
              rounded-full
              transition-colors
              ${
                isDarkOnboarding
                  ? 'text-[#91A4AC] hover:text-white hover:bg-white/5'
                  : 'text-body hover:text-ink'
              }
            `}
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {progress !== undefined && (
            <div className="flex-1 min-w-0">
              <ProgressBar
                value={
                  progress /
                  TOTAL_QUESTIONS
                }
              />
            </div>
          )}
        </div>
      )}

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{
            opacity: 0,
            x: 20,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          exit={{
            opacity: 0,
            x: -20,
          }}
          transition={{
            duration: 0.3,
          }}
          className={`
            flex-1
            min-h-0
            flex
            flex-col
            ${canvasBg}
          `}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      <WaitlistModal
        isOpen={isWaitlistOpen}
        onClose={() =>
          setIsWaitlistOpen(false)
        }
      />
    </div>
  );
}