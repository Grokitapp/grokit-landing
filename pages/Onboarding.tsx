import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { signUp, confirmSignUp, signIn, signInWithRedirect } from 'aws-amplify/auth';
import { ArrowLeft, ArrowRight, Check, Plus, Zap } from 'lucide-react';
import { GrokitLogo } from '../components/Grokitlogo';
import { GrokitMascot, type MascotPose } from '../components/Grokitmascot';
import { WaitlistModal } from '../components/Waitlistmodal';
import { saveProfile } from '../lib/profile';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const WORK_TYPES = [
'Product Manager', 'Business/Management', 'Designer/Creative', 'Student',
'Developer/Engineer', 'Research/Academic', 'Finance/Investment', 'Marketing'];


const TOPIC_OPTIONS = [
'AI', 'Business', 'Psychology', 'Science', 'Philosophy', 'Economics',
'History', 'Investing', 'Design', 'Self-Improvement', 'Strategy',
'Learning', 'Longevity', 'Decision Making', 'Software Engineering'];


const GOAL_OPTIONS = [
'Make better use of my time', 'Build new skills', 'Boost my career',
'Understand complex topics', 'Explore new topics', 'Just for fun',
'Remember important learning'];


const TIME_OPTIONS = [
{ id: '5', label: '5 min', description: 'Just a quick spark' },
{ id: '10', label: '10 min', description: 'Your coffee break' },
{ id: '15', label: '15 min', description: 'A lunch-break session' },
{ id: '20', label: '20+ min', description: "I'm serious about this" }];


const EXAMPLE_COURSES = [
{ title: 'Atomic Habits', author: 'James Clear', tag: 'Self-Improvement', blurb: 'Build better habits to optimize your study time.' },
{ title: 'Deep Dive Into LLMs', author: 'Andrej Karpathy', tag: 'AI', blurb: 'Explores the core technology behind modern language models.' }];


// NOTE: swap this once your Discord server exists.
const DISCORD_INVITE_URL = 'https://discord.gg/your-invite';

const STEP = {
  AUTH: 0,
  WELCOME: 1,
  INTRO: 2,
  WORK_TYPE: 3,
  T_PERSONALIZED: 4,
  TOPICS: 5,
  T_PERFECT: 6,
  GOALS: 7,
  T_GREAT: 8,
  TIME: 9,
  T_BOOKS: 10,
  LOADING: 11,
  FINAL: 12
} as const;

const TOTAL_QUESTIONS = 4;
const PROGRESS_BY_STEP: Record<number, number> = {
  [STEP.WORK_TYPE]: 1, [STEP.T_PERSONALIZED]: 1,
  [STEP.TOPICS]: 2, [STEP.T_PERFECT]: 2,
  [STEP.GOALS]: 3, [STEP.T_GREAT]: 3,
  [STEP.TIME]: 4, [STEP.T_BOOKS]: 4
};

// ---------------------------------------------------------------------------
// Small shared pieces
// ---------------------------------------------------------------------------

function ProgressBar({ value }: {value: number;}) {
  return (
    <div className="w-full px-6 pt-6 pb-2">
      <div className="max-w-xl mx-auto h-2.5 rounded-full bg-surface-alt border border-line overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-orange to-amber"
          initial={false}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeInOut' }} />

      </div>
    </div>);

}

function OptionRow({ label, selected, onClick }: {label: string;selected: boolean;onClick: () => void;}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-5 py-4 rounded-2xl border-2 font-sans font-bold transition-colors ${
      selected ?
      'bg-orange/10 border-orange text-ink' :
      'bg-surface-alt border-line text-body hover:border-orange/30'}`
      }>

      <span className="flex items-center gap-3">
        <span className={`w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center ${
        selected ? 'bg-orange border-orange' : 'border-line'}`
        }>
          {selected && <Check className="w-3.5 h-3.5 text-white" />}
        </span>
        {label}
      </span>
    </button>);

}

function PillOption({ label, selected, onClick }: {label: string;selected: boolean;onClick: () => void;}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-5 py-3 rounded-full border-2 font-sans font-bold text-sm sm:text-base transition-colors ${
      selected ?
      'bg-orange/10 border-orange text-ink' :
      'bg-surface-alt border-line text-body hover:border-orange/30'}`
      }>

      {selected && <Check className="w-4 h-4 text-orange" />}
      {label}
    </button>);

}

function OtherInput({ value, onChange, onAdd, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-2 px-5 py-3 rounded-full border-2 border-line bg-surface-alt focus-within:border-orange/40 transition-colors">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) {
            e.preventDefault();
            onAdd();
          }
        }}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-ink font-sans placeholder:text-muted" />

      <button
        onClick={onAdd}
        disabled={!value.trim()}
        aria-label="Add"
        className="w-7 h-7 shrink-0 rounded-full bg-orange text-white flex items-center justify-center disabled:opacity-30 transition-opacity">

        <Plus className="w-4 h-4" />
      </button>
    </div>);

}

function TransitionScreen({ pose, heading, sub, note, onContinue }: {
  pose: MascotPose;
  heading: string;
  sub: string;
  note?: string;
  onContinue: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
      <GrokitMascot size={130} pose={pose} className="mb-8" />
      <h1 className="font-display text-2xl sm:text-3xl md:text-4xl text-ink font-extrabold mb-3 max-w-lg">
        {heading}
      </h1>
      <p className="text-body font-sans font-medium max-w-md mb-2">{sub}</p>
      {note && <p className="text-muted font-sans text-sm max-w-md">{note}</p>}

      <div className="w-full max-w-xl mt-10">
        <button onClick={onContinue} className="btn-duo w-full px-8 py-4 text-lg">
          Continue
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>);

}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(STEP.AUTH);

  // Auth — real Cognito calls. Sign-up requires an email confirmation code,
  // so there's a small 'form' -> 'confirm' sub-stage within this one step.
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [authStage, setAuthStage] = useState<'form' | 'confirm'>('form');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Question answers
  const [workTypes, setWorkTypes] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [otherTopic, setOtherTopic] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [otherGoal, setOtherGoal] = useState('');
  const [timeId, setTimeId] = useState<string | null>(null);
  const [learnPrompt, setLearnPrompt] = useState('');

  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  const toggle = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  // Fire a profile save without blocking navigation — persistence is
  // best-effort here, not a gate on the onboarding UX.
  const persist = (fields: Parameters<typeof saveProfile>[0]) => {
    saveProfile(fields).catch((err) => console.error('Failed to save profile:', err));
  };

  useEffect(() => {
    if (step === STEP.LOADING) {
      const t = setTimeout(() => setStep(STEP.FINAL), 1800);
      return () => clearTimeout(t);
    }
  }, [step]);

  const handleBack = () => {
    if (step === STEP.AUTH) {
      navigate('/');
    } else {
      setStep((s) => s - 1);
    }
  };

  const handleAuthSubmit = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      if (authMode === 'signup') {
        await signUp({
          username: authEmail,
          password: authPassword,
          options: { userAttributes: { email: authEmail } }
        });
        setAuthStage('confirm');
      } else {
        await signIn({ username: authEmail, password: authPassword });
        setStep(STEP.WELCOME);
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleConfirmSubmit = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      await confirmSignUp({ username: authEmail, confirmationCode: confirmCode });
      await signIn({ username: authEmail, password: authPassword });
      setStep(STEP.WELCOME);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Invalid code. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Requires Google configured as an external provider in
  // amplify/auth/resource.ts with your own OAuth app credentials — see the
  // comment in that file. Will error until that's set up.
  const handleGoogleAuth = () => {
    signInWithRedirect({ provider: 'Google' }).catch((err) =>
    setAuthError(err instanceof Error ? err.message : "Google sign-in isn't configured yet.")
    );
  };

  const canContinue =
  step === STEP.AUTH ? authEmail.trim().length > 0 && authPassword.trim().length > 0 :
  step === STEP.WORK_TYPE ? workTypes.length > 0 :
  step === STEP.TOPICS ? topics.length > 0 :
  step === STEP.GOALS ? goals.length > 0 :
  step === STEP.TIME ? timeId !== null :
  true;

  const progress = PROGRESS_BY_STEP[step];

  return (
    <div className="min-h-[100dvh] bg-surface flex flex-col">
      {/* Top bar */}
      <div className="w-full px-6 pt-6 pb-2 flex items-start">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 text-body hover:text-ink transition-colors shrink-0"
          aria-label="Back">

          <ArrowLeft className="w-5 h-5" />
        </button>
        {progress !== undefined &&
        <div className="flex-1">
            <ProgressBar value={progress / TOTAL_QUESTIONS} />
          </div>
        }
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${step}-${authStage}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col">

          {/* --- AUTH ------------------------------------------------ */}
          {step === STEP.AUTH && authStage === 'form' &&
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
              <div className="w-full max-w-sm">
                <div className="flex justify-center mb-6">
                  <GrokitLogo size={40} className="text-ink" />
                </div>
                <h1 className="font-display text-3xl text-ink font-extrabold mb-1 text-center">
                  {authMode === 'signup' ? 'Create your account' : 'Log in'}
                </h1>
                <p className="text-body font-sans text-sm text-center mb-8">
                  {authMode === 'signup' ?
                'One step from a personalized learning path.' :
                'Welcome back.'}
                </p>

                <div className="flex flex-col gap-3 mb-2">
                  <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-4 py-3 bg-surface-alt border border-line rounded-xl text-ink font-sans placeholder:text-muted focus:outline-none focus:border-orange transition-colors" />

                  <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-4 py-3 bg-surface-alt border border-line rounded-xl text-ink font-sans placeholder:text-muted focus:outline-none focus:border-orange transition-colors" />

                </div>

                {authError &&
              <p className="text-sm text-red-600 font-sans font-semibold mb-3">{authError}</p>
              }

                <button
                onClick={handleAuthSubmit}
                disabled={!canContinue || authLoading}
                className="btn-duo w-full px-6 py-3.5 text-base disabled:opacity-40 mb-5 mt-3">

                  {authLoading ? 'Please wait...' : authMode === 'signup' ? 'Sign up' : 'Log in'}
                </button>

                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-line" />
                  <span className="text-xs text-muted font-sans font-bold uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-line" />
                </div>

                <button
                onClick={handleGoogleAuth}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-line text-ink font-sans font-bold hover:bg-surface-alt transition-colors mb-6">

                  <span className="text-[#4285F4] font-extrabold">G</span> Continue with Google
                </button>

                <p className="text-center text-sm text-muted font-sans">
                  {authMode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
                  <button
                  onClick={() => {
                    setAuthMode(authMode === 'signup' ? 'login' : 'signup');
                    setAuthError('');
                  }}
                  className="text-orange font-bold hover:underline">

                    {authMode === 'signup' ? 'Log in' : 'Sign up'}
                  </button>
                </p>
              </div>
            </div>
          }

          {/* --- AUTH: email confirmation ----------------------------- */}
          {step === STEP.AUTH && authStage === 'confirm' &&
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
              <div className="w-full max-w-sm text-center">
                <h1 className="font-display text-3xl text-ink font-extrabold mb-2">Check your email</h1>
                <p className="text-body font-sans text-sm mb-8">
                  We sent a code to <span className="font-bold text-ink">{authEmail}</span>. Enter it below.
                </p>
                <input
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                placeholder="Confirmation code"
                className="w-full text-center tracking-widest px-4 py-3 bg-surface-alt border border-line rounded-xl text-ink font-sans font-bold placeholder:text-muted placeholder:tracking-normal placeholder:font-normal focus:outline-none focus:border-orange transition-colors mb-3" />

                {authError &&
              <p className="text-sm text-red-600 font-sans font-semibold mb-3">{authError}</p>
              }
                <button
                onClick={handleConfirmSubmit}
                disabled={!confirmCode.trim() || authLoading}
                className="btn-duo w-full px-6 py-3.5 text-base disabled:opacity-40">

                  {authLoading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>
          }

          {/* --- WELCOME ---------------------------------------------- */}
          {step === STEP.WELCOME &&
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
              <div className="relative mb-8">
                <div className="px-5 py-3 rounded-2xl bg-surface-alt border border-line font-sans font-bold text-ink mb-3">
                  Thanks for being here!
                </div>
                <GrokitMascot size={110} pose="wave" className="mx-auto" />
              </div>
              <h1 className="font-display text-2xl sm:text-3xl text-ink font-extrabold mb-2 max-w-md">
                You're one of the first to explore Grokit
              </h1>
              <p className="text-body font-sans font-medium max-w-sm mb-10">
                It's early — your input will help shape what's next.
              </p>

              <div className="w-full max-w-xl">
                <p className="text-sm text-body font-sans font-semibold mb-2 text-left">
                  Join our Discord for feedback and learning tips!
                </p>
                <a
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-duo-outline w-full px-6 py-3.5 text-base mb-3">

                  Join our Discord
                </a>
                <button onClick={() => setStep(STEP.INTRO)} className="btn-duo w-full px-6 py-3.5 text-base">
                  Let's go!
                </button>
              </div>
            </div>
          }

          {/* --- INTRO -------------------------------------------------- */}
          {step === STEP.INTRO &&
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-alt flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-amber" />
              </div>
              <h1 className="font-display text-3xl sm:text-4xl text-ink font-extrabold mb-2">
                Just 4 short questions
              </h1>
              <p className="text-body font-sans font-medium mb-10">
                to build a learning journey designed for you!
              </p>
              <div className="w-full max-w-xl">
                <button onClick={() => setStep(STEP.WORK_TYPE)} className="btn-duo w-full px-8 py-4 text-lg">
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          }

          {/* --- WORK TYPE ------------------------------------------- */}
          {step === STEP.WORK_TYPE &&
          <div className="flex-1 flex flex-col px-6 py-8">
              <div className="w-full max-w-xl mx-auto flex-1">
                <h1 className="font-display text-3xl text-ink font-extrabold mb-1 text-center">
                  What types of work do you do?
                </h1>
                <p className="text-body font-sans font-medium text-center mb-8">Select all that apply</p>
                <div className="flex flex-col gap-3">
                  {WORK_TYPES.map((type) =>
                <OptionRow
                  key={type}
                  label={type}
                  selected={workTypes.includes(type)}
                  onClick={() => toggle(workTypes, setWorkTypes, type)} />

                )}
                </div>
              </div>
              <div className="w-full max-w-xl mx-auto mt-8">
                <button
                onClick={() => {
                  if (!canContinue) return;
                  persist({ workTypes });
                  setStep(STEP.T_PERSONALIZED);
                }}
                disabled={!canContinue}
                className="btn-duo w-full px-8 py-4 text-lg disabled:opacity-40">

                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          }

          {step === STEP.T_PERSONALIZED &&
          <TransitionScreen
            pose="thinking"
            heading="Personalized learning for you"
            sub="We'll use examples relevant to your role and expertise when it's helpful."
            note="You can update this anytime in your settings."
            onContinue={() => setStep(STEP.TOPICS)} />

          }

          {/* --- TOPICS ------------------------------------------------ */}
          {step === STEP.TOPICS &&
          <div className="flex-1 flex flex-col px-6 py-8">
              <div className="w-full max-w-2xl mx-auto flex-1">
                <h1 className="font-display text-3xl text-ink font-extrabold mb-1 text-center">
                  What topics interest you?
                </h1>
                <p className="text-body font-sans font-medium text-center mb-8">
                  Don't worry, this won't limit your experience
                </p>
                <div className="flex flex-wrap justify-center gap-3 mb-6">
                  {TOPIC_OPTIONS.map((topic) =>
                <PillOption
                  key={topic}
                  label={topic}
                  selected={topics.includes(topic)}
                  onClick={() => toggle(topics, setTopics, topic)} />

                )}
                  {topics.
                filter((t) => !TOPIC_OPTIONS.includes(t)).
                map((topic) =>
                <PillOption key={topic} label={topic} selected onClick={() => toggle(topics, setTopics, topic)} />
                )}
                </div>
                <OtherInput
                value={otherTopic}
                onChange={setOtherTopic}
                placeholder="Other topics (optional)"
                onAdd={() => {
                  if (otherTopic.trim()) {
                    setTopics([...topics, otherTopic.trim()]);
                    setOtherTopic('');
                  }
                }} />

              </div>
              <div className="w-full max-w-2xl mx-auto mt-8">
                <button
                onClick={() => {
                  if (!canContinue) return;
                  persist({ topics });
                  setStep(STEP.T_PERFECT);
                }}
                disabled={!canContinue}
                className="btn-duo w-full px-8 py-4 text-lg disabled:opacity-40">

                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          }

          {step === STEP.T_PERFECT &&
          <TransitionScreen
            pose="celebrate"
            heading="Perfect choice! We'll use this to find the best courses for you"
            sub="You can also build your own course for any topic you want to learn."
            onContinue={() => setStep(STEP.GOALS)} />

          }

          {/* --- GOALS --------------------------------------------------- */}
          {step === STEP.GOALS &&
          <div className="flex-1 flex flex-col px-6 py-8">
              <div className="w-full max-w-xl mx-auto flex-1">
                <h1 className="font-display text-3xl text-ink font-extrabold mb-1 text-center">
                  What do you want to achieve?
                </h1>
                <p className="text-body font-sans font-medium text-center mb-8">Select all that apply</p>
                <div className="flex flex-col gap-3 mb-4">
                  {GOAL_OPTIONS.map((goal) =>
                <OptionRow
                  key={goal}
                  label={goal}
                  selected={goals.includes(goal)}
                  onClick={() => toggle(goals, setGoals, goal)} />

                )}
                  {goals.
                filter((g) => !GOAL_OPTIONS.includes(g)).
                map((goal) =>
                <OptionRow key={goal} label={goal} selected onClick={() => toggle(goals, setGoals, goal)} />
                )}
                </div>
                <OtherInput
                value={otherGoal}
                onChange={setOtherGoal}
                placeholder="Other (optional)"
                onAdd={() => {
                  if (otherGoal.trim()) {
                    setGoals([...goals, otherGoal.trim()]);
                    setOtherGoal('');
                  }
                }} />

              </div>
              <div className="w-full max-w-xl mx-auto mt-8">
                <button
                onClick={() => {
                  if (!canContinue) return;
                  persist({ goals });
                  setStep(STEP.T_GREAT);
                }}
                disabled={!canContinue}
                className="btn-duo w-full px-8 py-4 text-lg disabled:opacity-40">

                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          }

          {step === STEP.T_GREAT &&
          <TransitionScreen
            pose="wave"
            heading="Great! We'll help you learn what you thought you didn't have time for"
            sub="Finally learn the things you've always wanted to learn."
            onContinue={() => setStep(STEP.TIME)} />

          }

          {/* --- TIME --------------------------------------------------- */}
          {step === STEP.TIME &&
          <div className="flex-1 flex flex-col px-6 py-8">
              <div className="w-full max-w-xl mx-auto flex-1">
                <h1 className="font-display text-3xl text-ink font-extrabold mb-8 text-center">
                  How long do you want to learn every day?
                </h1>
                <div className="flex flex-col gap-3">
                  {TIME_OPTIONS.map(({ id, label, description }) =>
                <button
                  key={id}
                  onClick={() => setTimeId(id)}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-colors ${
                  timeId === id ?
                  'bg-orange/10 border-orange' :
                  'bg-surface-alt border-line hover:border-orange/30'}`
                  }>

                      <span className={`font-display font-extrabold text-lg ${timeId === id ? 'text-ink' : 'text-body'}`}>
                        {label}
                      </span>
                      <span className="text-muted font-sans text-sm">{description}</span>
                    </button>
                )}
                </div>
              </div>
              <div className="w-full max-w-xl mx-auto mt-8">
                <button
                onClick={() => {
                  if (!canContinue || !timeId) return;
                  persist({ timeCommitment: timeId });
                  setStep(STEP.T_BOOKS);
                }}
                disabled={!canContinue}
                className="btn-duo w-full px-8 py-4 text-lg disabled:opacity-40">

                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          }

          {step === STEP.T_BOOKS && (() => {
            const lessonsPerWeek = timeId === '5' ? 7 : timeId === '10' ? 10 : timeId === '15' ? 12 : 14;
            return (
              <TransitionScreen
                pose="celebrate"
                heading={`${lessonsPerWeek} lessons in your first week`}
                sub="You're on your way to building a lasting learning habit!"
                onContinue={() => setStep(STEP.LOADING)} />);


          })()}

          {/* --- LOADING ------------------------------------------------- */}
          {step === STEP.LOADING &&
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
              <GrokitMascot size={120} pose="thinking" className="mb-6" />
              <p className="text-body font-sans font-semibold">
                Picking courses based on your role, goals, and interests...
              </p>
            </div>
          }

          {/* --- FINAL PROMPT --------------------------------------------- */}
          {step === STEP.FINAL &&
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
              <div className="w-full max-w-2xl mx-auto text-center">
                <GrokitMascot size={90} pose="idle" className="mx-auto mb-6" />
                <h1 className="font-display text-3xl sm:text-4xl text-ink font-extrabold mb-2">
                  What do you want to learn?
                </h1>
                <p className="text-body font-sans font-medium mb-8">
                  Tell me what you're curious about, and I'll build a personalized course for you.
                </p>

                <div className="bg-surface-alt border border-line rounded-3xl p-5 mb-3 text-left">
                  <textarea
                  value={learnPrompt}
                  onChange={(e) => setLearnPrompt(e.target.value)}
                  placeholder="I want to learn about..."
                  className="w-full min-h-[80px] bg-transparent outline-none resize-none text-ink font-sans placeholder:text-muted" />

                  <div className="flex justify-end pt-3 border-t border-line mt-3">
                    <button
                    onClick={() => {
                      if (!learnPrompt.trim()) return;
                      persist({ learnPrompt, onboardingCompleted: true });
                      setIsWaitlistOpen(true);
                    }}
                    disabled={!learnPrompt.trim()}
                    className="btn-duo px-6 py-3 text-base disabled:opacity-40">

                      Create my learning path
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-muted font-sans font-semibold text-left mb-4 mt-8">
                  Or, see what people like you are learning
                </p>
                <div className="flex flex-col gap-3 text-left">
                  {EXAMPLE_COURSES.map((course) =>
                <button
                  key={course.title}
                  onClick={() => setIsWaitlistOpen(true)}
                  className="flex items-center gap-4 p-3 rounded-2xl border border-line bg-surface hover:border-orange/30 transition-colors">

                      <span className="shrink-0 w-16 h-16 rounded-xl bg-orange/10 flex items-center justify-center text-xs font-bold text-orange text-center px-1">
                        {course.tag}
                      </span>
                      <span>
                        <span className="block font-display font-bold text-ink">{course.title}</span>
                        <span className="block text-xs text-muted font-sans font-semibold mb-1">{course.author}</span>
                        <span className="block text-sm text-body font-sans">{course.blurb}</span>
                      </span>
                    </button>
                )}
                </div>
              </div>
            </div>
          }
        </motion.div>
      </AnimatePresence>

      <WaitlistModal isOpen={isWaitlistOpen} onClose={() => setIsWaitlistOpen(false)} />
    </div>
    );
}