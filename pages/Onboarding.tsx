import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  AnimatePresence,
  motion,
} from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
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
  FinalStep,
  GoalsStep,
  IntroStep,
  LoadingStep,
  TimeStep,
  TopicsStep,
  WorkTypeStep,
} from './onboarding/steps';

/* -------------------------------------------------------------------------- */
/* STATIC TRANSITION SCREENS                                                  */
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
/* ONBOARDING                                                                 */
/* -------------------------------------------------------------------------- */

export default function Onboarding() {
  const [step, setStep] = useState<Step>(
    STEP.AUTH,
  );

  const [workTypes, setWorkTypes] =
    useState<string[]>([]);

  const [otherWorkType, setOtherWorkType] =
    useState('');

  const [
    isOtherWorkTypeSelected,
    setIsOtherWorkTypeSelected,
  ] = useState(false);

  const [topics, setTopics] =
    useState<string[]>([]);

  const [otherTopic, setOtherTopic] =
    useState('');

  const [goals, setGoals] =
    useState<string[]>([]);

  const [otherGoal, setOtherGoal] =
    useState('');

  const [timeId, setTimeId] =
    useState<string | null>(null);

  const [learnPrompt, setLearnPrompt] =
    useState('');

  const [isWaitlistOpen, setIsWaitlistOpen] =
    useState(false);

  /* ------------------------------------------------------------------------ */
  /* HELPERS                                                                  */
  /* ------------------------------------------------------------------------ */

  const toggleItem = (
    setList: Dispatch<
      SetStateAction<string[]>
    >,
    item: string,
  ) =>
    setList((curr) =>
      curr.includes(item)
        ? curr.filter((i) => i !== item)
        : [...curr, item],
    );

  const addOther = (
    value: string,
    setList: Dispatch<
      SetStateAction<string[]>
    >,
    clear: () => void,
  ) => {
    const trimmed = value.trim();

    if (!trimmed) return;

    setList((curr) =>
      curr.includes(trimmed)
        ? curr
        : [...curr, trimmed],
    );

    clear();
  };

  const persist = (
    fields: Parameters<
      typeof saveProfile
    >[0],
  ) => {
    saveProfile(fields).catch((err) =>
      console.error(
        'Failed to save profile:',
        err,
      ),
    );
  };

  /* ------------------------------------------------------------------------ */
  /* LOADING                                                                   */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (step !== STEP.LOADING) return;

    const t = setTimeout(
      () => setStep(STEP.FINAL),
      1800,
    );

    return () => clearTimeout(t);
  }, [step]);

  /* ------------------------------------------------------------------------ */
  /* VALIDATION                                                                */
  /* ------------------------------------------------------------------------ */

  const hasOtherWorkType =
    isOtherWorkTypeSelected &&
    otherWorkType.trim().length > 0;

  const canContinue =
    step === STEP.WORK_TYPE
      ? workTypes.length > 0 ||
        hasOtherWorkType
      : step === STEP.TOPICS
        ? topics.length > 0
        : step === STEP.GOALS
          ? goals.length > 0
          : step === STEP.TIME
            ? timeId !== null
            : true;

  const prevStep = BACK_STEP[step];

  const progress =
    PROGRESS_BY_STEP[step];

  /* ------------------------------------------------------------------------ */
  /* RENDER STEP                                                               */
  /* ------------------------------------------------------------------------ */

  const renderStep = () => {
    switch (step) {
      case STEP.AUTH:
        return (
          <AuthScreen
            onAuthenticated={() =>
              setStep(STEP.WELCOME)
            }
          />
        );

      case STEP.WELCOME:
        return (
          <Welcome
            onContinue={() =>
              setStep(STEP.INTRO)
            }
            discordInviteUrl={
              DISCORD_INVITE_URL
            }
          />
        );

      case STEP.INTRO:
        return (
          <IntroStep
            onContinue={() =>
              setStep(STEP.WORK_TYPE)
            }
          />
        );

      case STEP.WORK_TYPE:
        return (
          <WorkTypeStep
            selected={workTypes}
            onToggle={(t) =>
              toggleItem(
                setWorkTypes,
                t,
              )
            }
            otherSelected={
              isOtherWorkTypeSelected
            }
            otherValue={otherWorkType}
            onToggleOther={() =>
              setIsOtherWorkTypeSelected(
                (v) => !v,
              )
            }
            onOtherChange={
              setOtherWorkType
            }
            canContinue={canContinue}
            onContinue={() => {
              const finalWorkTypes =
                hasOtherWorkType
                  ? [
                      ...workTypes,
                      otherWorkType.trim(),
                    ]
                  : workTypes;

              persist({
                workTypes:
                  finalWorkTypes,
              });

              setStep(
                STEP.T_PERSONALIZED,
              );
            }}
          />
        );

      case STEP.T_PERSONALIZED:
      case STEP.T_PERFECT:
      case STEP.T_GREAT: {
        const t =
          STATIC_TRANSITIONS[step];

        if (!t) return null;

        return (
          <TransitionScreen
            pose={t.pose}
            heading={t.heading}
            sub={t.sub}
            note={t.note}
            onContinue={() =>
              setStep(t.next)
            }
          />
        );
      }

      case STEP.TOPICS:
        return (
          <TopicsStep
            selected={topics}
            onToggle={(t) =>
              toggleItem(
                setTopics,
                t,
              )
            }
            otherValue={otherTopic}
            onOtherChange={
              setOtherTopic
            }
            onAddOther={() =>
              addOther(
                otherTopic,
                setTopics,
                () =>
                  setOtherTopic(''),
              )
            }
            canContinue={canContinue}
            onContinue={() => {
              persist({
                topics,
              });

              setStep(
                STEP.T_PERFECT,
              );
            }}
          />
        );

      case STEP.GOALS:
        return (
          <GoalsStep
            selected={goals}
            onToggle={(g) =>
              toggleItem(
                setGoals,
                g,
              )
            }
            otherValue={otherGoal}
            onOtherChange={
              setOtherGoal
            }
            onAddOther={() =>
              addOther(
                otherGoal,
                setGoals,
                () =>
                  setOtherGoal(''),
              )
            }
            canContinue={canContinue}
            onContinue={() => {
              persist({
                goals,
              });

              setStep(
                STEP.T_GREAT,
              );
            }}
          />
        );

      case STEP.TIME:
        return (
          <TimeStep
            timeId={timeId}
            onSelect={setTimeId}
            canContinue={canContinue}
            onContinue={() => {
              if (!timeId) return;

              persist({
                timeCommitment:
                  timeId,
              });

              setStep(
                STEP.T_BOOKS,
              );
            }}
          />
        );

      case STEP.T_BOOKS:
        return (
          <TransitionScreen
            pose="celebrate"
            heading={`${lessonsPerWeekFor(
              timeId,
            )} lessons in your first week`}
            sub="You're on your way to building a lasting learning habit!"
            onContinue={() =>
              setStep(STEP.LOADING)
            }
          />
        );

      case STEP.LOADING:
        return <LoadingStep />;

      case STEP.FINAL:
        return (
          <FinalStep
            learnPrompt={learnPrompt}
            onPromptChange={
              setLearnPrompt
            }
            onCreate={() => {
              if (
                !learnPrompt.trim()
              ) {
                return;
              }

              persist({
                learnPrompt,
                onboardingCompleted:
                  true,
              });

              setIsWaitlistOpen(true);
            }}
            onExampleClick={() =>
              setIsWaitlistOpen(true)
            }
          />
        );
    }
  };

  /* ------------------------------------------------------------------------ */
  /* CANVAS                                                                    */
  /* ------------------------------------------------------------------------ */

  /*
   * Keep the entire onboarding experience on
   * one consistent dark canvas.
   *
   * This prevents individual question screens
   * from switching back to the light surface.
   */
  const canvasBg =
    'bg-[#131F24]';

  const isAuth =
    step === STEP.AUTH;

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
      {/* ------------------------------------------------------------------ */}
      {/* NAVIGATION + PROGRESS                                               */}
      {/* ------------------------------------------------------------------ */}

      {!isAuth &&
        prevStep !== undefined && (
          <div
            className="
              relative
              z-30
              w-full
              shrink-0
              px-5
              sm:px-6
              pt-4
              sm:pt-5
              pb-3
              flex
              items-center
              gap-5
              bg-[#131F24]
            "
          >
            {/* Back button */}
            <button
              type="button"
              onClick={() =>
                setStep(prevStep)
              }
              className="
                shrink-0
                w-8
                h-8
                rounded-full
                flex
                items-center
                justify-center
                text-[#91A4AC]
                hover:text-white
                hover:bg-white/[0.05]
                transition-colors
              "
              aria-label="Back"
            >
              <ArrowLeft
                className="w-5 h-5"
                strokeWidth={2}
              />
            </button>

            {/* Progress */}
            {progress !== undefined && (
              <div
                className="
                  flex-1
                  min-w-0
                  max-w-[860px]
                  mx-auto
                "
              >
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

      {/* ------------------------------------------------------------------ */}
      {/* STEP CONTENT                                                        */}
      {/* ------------------------------------------------------------------ */}

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

      {/* ------------------------------------------------------------------ */}
      {/* WAITLIST                                                             */}
      {/* ------------------------------------------------------------------ */}

      <WaitlistModal
        isOpen={isWaitlistOpen}
        onClose={() =>
          setIsWaitlistOpen(false)
        }
      />
    </div>
  );
}