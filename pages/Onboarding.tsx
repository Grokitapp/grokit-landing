import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, GraduationCap, Code2, TrendingUp, Compass, Check } from 'lucide-react';
import { GrokitLogo } from '../components/Grokitlogo';
import { WaitlistModal } from '../components/Waitlistmodal';

// ---- Step config ---------------------------------------------------------

interface RoleOption {
  id: string;
  label: string;
  icon: typeof GraduationCap;
}

const ROLE_OPTIONS: RoleOption[] = [
{ id: 'student', label: 'Student', icon: GraduationCap },
{ id: 'developer', label: 'Developer', icon: Code2 },
{ id: 'finance', label: 'Finance professional', icon: TrendingUp },
{ id: 'curious', label: 'Curious learner', icon: Compass }];


const INTEREST_OPTIONS = [
'AI', 'Finance', 'Behavioral Science', 'Startups',
'Science', 'History', 'Design', 'Marketing'];


const GOAL_OPTIONS = [
{ id: 'skills', label: 'Build new skills', description: 'Pick up practical, applicable knowledge' },
{ id: 'career', label: 'Boost my career', description: 'Get ahead in my current field or a new one' },
{ id: 'understand', label: 'Understand complex topics', description: 'Go deep on things I\'ve always wondered about' },
{ id: 'explore', label: 'Just exploring', description: 'See what Grokit can teach me' }];


const TIME_OPTIONS = [
{ id: '5', label: '5 min', description: 'A quick daily habit' },
{ id: '10', label: '10 min', description: 'Steady, consistent progress' },
{ id: '15', label: '15 min', description: 'A solid daily session' },
{ id: '20', label: '20+ min', description: 'I\'m ready to dive in' }];


const TOTAL_STEPS = 4;

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [goal, setGoal] = useState<string | null>(null);
  const [timeCommitment, setTimeCommitment] = useState<string | null>(null);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  const canContinue =
  step === 0 ? role !== null :
  step === 1 ? interests.length > 0 :
  step === 2 ? goal !== null :
  timeCommitment !== null;

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
    prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleBack = () => {
    if (step === 0) {
      navigate('/');
    } else {
      setStep((s) => s - 1);
    }
  };

  const handleContinue = () => {
    if (!canContinue) return;
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      // Onboarding data collected: { role, interests, goal, timeCommitment }
      // Next step in the roadmap: the "what do you want to learn?" input +
      // generation call. For now this just confirms completion.
      setStep(TOTAL_STEPS);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-surface flex flex-col">
      {/* Top bar: back + progress */}
      <div className="w-full px-6 pt-6 pb-4">
        <div className="max-w-xl mx-auto flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 text-body hover:text-ink transition-colors"
            aria-label="Back">

            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 h-2.5 rounded-full bg-surface-alt border border-line overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cobalt to-purple"
              initial={false}
              animate={{ width: `${Math.min(step, TOTAL_STEPS) / TOTAL_STEPS * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeInOut' }} />

          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">

            {step === 0 &&
            <motion.div
              key="role"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}>

                <h1 className="font-display text-3xl sm:text-4xl text-ink font-extrabold mb-2 text-center">
                  Which one are you?
                </h1>
                <p className="text-body font-sans font-medium text-center mb-8">
                  This helps us shape how we explain things.
                </p>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {ROLE_OPTIONS.map(({ id, label, icon: Icon }) =>
                <button
                  key={id}
                  onClick={() => setRole(id)}
                  className={`flex flex-col items-center gap-3 p-5 sm:p-6 rounded-3xl border-2 transition-colors text-center ${
                  role === id ?
                  'bg-cobalt/10 border-cobalt' :
                  'bg-surface-alt border-line hover:border-cobalt/30'}`
                  }>

                      <Icon className={`w-7 h-7 ${role === id ? 'text-cobalt' : 'text-muted'}`} />
                      <span className={`font-display font-bold text-sm sm:text-base ${role === id ? 'text-ink' : 'text-body'}`}>
                        {label}
                      </span>
                    </button>
                )}
                </div>
              </motion.div>
            }

            {step === 1 &&
            <motion.div
              key="interests"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}>

                <h1 className="font-display text-3xl sm:text-4xl text-ink font-extrabold mb-2 text-center">
                  What are you into?
                </h1>
                <p className="text-body font-sans font-medium text-center mb-8">
                  Pick as many as you like. This just gives us a starting point.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {INTEREST_OPTIONS.map((interest) => {
                  const selected = interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`inline-flex items-center gap-2 px-5 py-3 rounded-full border-2 font-sans font-bold text-sm sm:text-base transition-colors ${
                      selected ?
                      'bg-cobalt/10 border-cobalt text-ink' :
                      'bg-surface-alt border-line text-body hover:border-cobalt/30'}`
                      }>

                        {selected && <Check className="w-4 h-4 text-cobalt" />}
                        {interest}
                      </button>);

                })}
                </div>
              </motion.div>
            }

            {step === 2 &&
            <motion.div
              key="goal"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}>

                <h1 className="font-display text-3xl sm:text-4xl text-ink font-extrabold mb-2 text-center">
                  What's your goal?
                </h1>
                <p className="text-body font-sans font-medium text-center mb-8">
                  We'll shape your path around this.
                </p>
                <div className="flex flex-col gap-3">
                  {GOAL_OPTIONS.map(({ id, label, description }) =>
                <button
                  key={id}
                  onClick={() => setGoal(id)}
                  className={`text-left p-5 rounded-2xl border-2 transition-colors ${
                  goal === id ?
                  'bg-cobalt/10 border-cobalt' :
                  'bg-surface-alt border-line hover:border-cobalt/30'}`
                  }>

                      <div className={`font-display font-bold mb-1 ${goal === id ? 'text-ink' : 'text-body'}`}>
                        {label}
                      </div>
                      <div className="text-sm text-muted font-sans font-medium">{description}</div>
                    </button>
                )}
                </div>
              </motion.div>
            }

            {step === 3 &&
            <motion.div
              key="time"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}>

                <h1 className="font-display text-3xl sm:text-4xl text-ink font-extrabold mb-2 text-center">
                  How much time per day?
                </h1>
                <p className="text-body font-sans font-medium text-center mb-8">
                  Be realistic, you can always change this later.
                </p>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {TIME_OPTIONS.map(({ id, label, description }) =>
                <button
                  key={id}
                  onClick={() => setTimeCommitment(id)}
                  className={`text-center p-5 rounded-2xl border-2 transition-colors ${
                  timeCommitment === id ?
                  'bg-cobalt/10 border-cobalt' :
                  'bg-surface-alt border-line hover:border-cobalt/30'}`
                  }>

                      <div className={`font-display font-extrabold text-2xl mb-1 ${timeCommitment === id ? 'text-ink' : 'text-body'}`}>
                        {label}
                      </div>
                      <div className="text-xs text-muted font-sans font-medium">{description}</div>
                    </button>
                )}
                </div>
              </motion.div>
            }

            {step === TOTAL_STEPS &&
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center">

                <GrokitLogo size={56} className="mx-auto mb-6" animate />
                <h1 className="font-display text-3xl sm:text-4xl text-ink font-extrabold mb-3">
                  You're all set.
                </h1>
                <p className="text-body font-sans font-medium mb-8 max-w-md mx-auto">
                  Next, tell Grokit what you want to learn and we'll build your first course.
                  That part is coming very soon — join the waitlist and we'll email you the
                  moment it's ready.
                </p>
                <div className="flex flex-col items-center gap-4">
                  <button
                  onClick={() => setIsWaitlistOpen(true)}
                  className="btn-duo px-8 py-4 text-lg">

                    Join the waitlist
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                  onClick={() => navigate('/')}
                  className="text-sm text-muted hover:text-body font-sans font-bold transition-colors">

                    Back to home
                  </button>
                </div>
              </motion.div>
            }
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom action bar */}
      {step < TOTAL_STEPS &&
      <div className="w-full px-6 pb-8 pt-4">
          <div className="max-w-xl mx-auto">
            <button
            onClick={handleContinue}
            disabled={!canContinue}
            className="btn-duo w-full px-8 py-4 text-lg disabled:opacity-40">

              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      }

      <WaitlistModal isOpen={isWaitlistOpen} onClose={() => setIsWaitlistOpen(false)} />
    </div>
    );
}