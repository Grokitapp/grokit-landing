import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { WaitlistModal } from '../components/Waitlistmodal';
import { saveProfile } from '../lib/profile';
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
import { ProgressBar, TransitionScreen } from './onboarding/shared';
import {
  FinalStep,
  GoalsStep,
  IntroStep,
  LoadingStep,
  TimeStep,
  TopicsStep,
  WorkTypeStep,
} from './onboarding/steps';

export default function Onboarding() {
  const [step, setStep] = useState<Step>(STEP.AUTH);

  const [workTypes, setWorkTypes] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [otherTopic, setOtherTopic] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [otherGoal, setOtherGoal] = useState('');
  const [timeId, setTimeId] = useState<string | null>(null);
  const [learnPrompt, setLearnPrompt] = useState('');
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  const toggleItem = (
    setList: Dispatch<SetStateAction<string[]>>,
    item: string,
  ) =>
    setList((curr) =>
      curr.includes(item)
        ? curr.filter((i) => i !== item)
        : [...curr, item],
    );

  const persist = (fields: Parameters<typeof saveProfile>[0]) => {
    saveProfile(fields).catch((err) =>
      console.error('Failed to save profile:', err),
    );
  };

  useEffect(() => {
    if (step !== STEP.LOADING) return;
    const t = setTimeout(() => setStep(STEP.FINAL), 1800);
    return () => clearTimeout(t);
  }, [step]);

  const canContinue =
    step === STEP.WORK_TYPE
      ? workTypes.length > 0
      : step === STEP.TOPICS
        ? topics.length > 0
        : step === STEP.GOALS
          ? goals.length > 0
          : step === STEP.TIME
            ? timeId !== null
            : true;

  const prevStep = BACK_STEP[step];
  const progress = PROGRESS_BY_STEP[step];

  const addOther = (
    value: string,
    setList: Dispatch<SetStateAction<string[]>>,
    clear: () => void,
  ) => {
    if (!value.trim()) return;
    setList((curr) => [...curr, value.trim()]);
    clear();
  };

  const renderStep = () => {
    switch (step) {
      case STEP.AUTH:
        return <AuthScreen onAuthenticated={() => setStep(STEP.WELCOME)} />;

      case STEP.WELCOME:
        return (
          <Welcome
            onContinue={() => setStep(STEP.INTRO)}
            discordInviteUrl={DISCORD_INVITE_URL}
          />
        );

      case STEP.INTRO:
        return <IntroStep onContinue={() => setStep(STEP.WORK_TYPE)} />;

      case STEP.WORK_TYPE:
        return (
          <WorkTypeStep
            selected={workTypes}
            onToggle={(t) => toggleItem(setWorkTypes, t)}
            canContinue={canContinue}
            onContinue={() => {
              persist({ workTypes });
              setStep(STEP.T_PERSONALIZED);
            }}
          />
        );

      case STEP.T_PERSONALIZED:
        return (
          <TransitionScreen
            pose="thinking"
            heading="Personalized learning for you"
            sub="We'll use examples relevant to your role and expertise when it's helpful."
            note="You can update this anytime in your settings."
            onContinue={() => setStep(STEP.TOPICS)}
          />
        );

      case STEP.TOPICS:
        return (
          <TopicsStep
            selected={topics}
            onToggle={(t) => toggleItem(setTopics, t)}
            otherValue={otherTopic}
            onOtherChange={setOtherTopic}
            onAddOther={() =>
              addOther(otherTopic, setTopics, () => setOtherTopic(''))
            }
            canContinue={canContinue}
            onContinue={() => {
              persist({ topics });
              setStep(STEP.T_PERFECT);
            }}
          />
        );

      case STEP.T_PERFECT:
        return (
          <TransitionScreen
            pose="celebrate"
            heading="Perfect choice! We'll use this to find the best courses for you"
            sub="You can also build your own course for any topic you want to learn."
            onContinue={() => setStep(STEP.GOALS)}
          />
        );

      case STEP.GOALS:
        return (
          <GoalsStep
            selected={goals}
            onToggle={(g) => toggleItem(setGoals, g)}
            otherValue={otherGoal}
            onOtherChange={setOtherGoal}
            onAddOther={() =>
              addOther(otherGoal, setGoals, () => setOtherGoal(''))
            }
            canContinue={canContinue}
            onContinue={() => {
              persist({ goals });
              setStep(STEP.T_GREAT);
            }}
          />
        );

      case STEP.T_GREAT:
        return (
          <TransitionScreen
            pose="wave"
            heading="Great! We'll help you learn what you thought you didn't have time for"
            sub="Finally learn the things you've always wanted to learn."
            onContinue={() => setStep(STEP.TIME)}
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
              persist({ timeCommitment: timeId });
              setStep(STEP.T_BOOKS);
            }}
          />
        );

      case STEP.T_BOOKS:
        return (
          <TransitionScreen
            pose="celebrate"
            heading={`${lessonsPerWeekFor(timeId)} lessons in your first week`}
            sub="You're on your way to building a lasting learning habit!"
            onContinue={() => setStep(STEP.LOADING)}
          />
        );

      case STEP.LOADING:
        return <LoadingStep />;

      case STEP.FINAL:
        return (
          <FinalStep
            learnPrompt={learnPrompt}
            onPromptChange={setLearnPrompt}
            onCreate={() => {
              if (!learnPrompt.trim()) return;
              persist({ learnPrompt, onboardingCompleted: true });
              setIsWaitlistOpen(true);
            }}
            onExampleClick={() => setIsWaitlistOpen(true)}
          />
        );
    }
  };

  // The intro gets its own Duolingo-inspired dark canvas. Other onboarding
  // steps keep the existing light Grokit surface so this is a visual upgrade
  // without unexpectedly changing every question screen.
  const isDarkIntro = step === STEP.INTRO;

  return (
    <div
      className={`min-h-[100dvh] flex flex-col ${
        isDarkIntro ? 'bg-[#131F24]' : 'bg-surface'
      }`}
    >
      {prevStep !== undefined && (
        <div
          className={`w-full px-5 sm:px-6 pt-5 sm:pt-6 pb-2 flex items-start ${
            isDarkIntro ? 'bg-[#131F24]' : ''
          }`}
        >
          <button
            onClick={() => setStep(prevStep)}
            className={`p-2 -ml-2 transition-colors shrink-0 ${
              isDarkIntro
                ? 'text-[#91A4AC] hover:text-white'
                : 'text-body hover:text-ink'
            }`}
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {progress !== undefined && (
            <div className="flex-1">
              <ProgressBar value={progress / TOTAL_QUESTIONS} />
            </div>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col"
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      <WaitlistModal
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
      />
    </div>
  );
}
