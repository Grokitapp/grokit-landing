import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { fetchAuthSession } from 'aws-amplify/auth';

import { GrokitMascot } from '../../components/Grokitmascot';
import { getAuthenticatedUser } from './authService';
import { getProfileWithRetry } from '../../lib/profile';

interface Props {
  children: React.ReactNode;
}

type AuthState =
  | 'loading'
  | 'login'
  | 'onboarding'
  | 'ready';

// Real progress steps, shown while the checks below actually run.
const LOADING_STEPS = [
  'Checking your session',
  'Loading your profile',
  'Opening your learning space',
];

// If the checks take longer than this, reassure the learner.
const SLOW_AFTER_MS = 8000;

function AuthLoading({ step, slow }: { step: number; slow: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center bg-[#131F24] px-6"
    >
      <style>{`
        @keyframes grokit-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes grokit-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        @keyframes grokit-fade-up {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .grokit-float, .grokit-slide, .grokit-fade-up { animation: none !important; }
        }
      `}</style>

      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <div className="absolute -inset-10 animate-pulse rounded-full bg-orange/[0.08] blur-3xl motion-reduce:animate-none" />

          <div
            className="grokit-float relative"
            style={{ animation: 'grokit-float 2.6s ease-in-out infinite' }}
          >
            <GrokitMascot pose="thinking" size={110} />
          </div>
        </div>

        <h1 className="mt-7 font-display text-2xl font-extrabold tracking-[-0.01em] text-white">
          Getting Grokit ready
        </h1>

        <p
          key={step}
          className="grokit-fade-up mt-2 flex items-center gap-1 text-sm font-semibold text-[#91A4AC]"
          style={{ animation: 'grokit-fade-up 300ms ease-out' }}
        >
          {LOADING_STEPS[Math.min(step, LOADING_STEPS.length - 1)]}
          <span aria-hidden="true" className="inline-flex gap-0.5">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="inline-block h-1 w-1 animate-bounce rounded-full bg-orange motion-reduce:animate-none"
                style={{ animationDelay: `${dot * 150}ms` }}
              />
            ))}
          </span>
        </p>

        <div
          aria-hidden="true"
          className="mt-6 h-1.5 w-48 overflow-hidden rounded-full bg-[#1F3038]"
        >
          <div
            className="grokit-slide h-full w-1/3 rounded-full bg-orange"
            style={{ animation: 'grokit-slide 1.4s ease-in-out infinite' }}
          />
        </div>

        <p
          className={`mt-4 h-4 text-xs font-medium text-[#60757E] transition-opacity duration-500 ${
            slow ? 'opacity-100' : 'opacity-0'
          }`}
        >
          This is taking a little longer than usual. Hang tight.
        </p>
      </div>
    </div>
  );
}

export default function AuthGuard({ children }: Props) {
  const [state, setState] = useState<AuthState>('loading');
  const [step, setStep] = useState(0);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function check() {
      try {
        // Confirm that a Cognito user is currently signed in.
        await getAuthenticatedUser();

        // Confirm that the current authenticated session is valid.
        await fetchAuthSession();

        if (mounted) setStep(1);

        // Profile reads can temporarily lag immediately after
        // onboarding is saved, so use the retry-aware lookup.
        const profile = await getProfileWithRetry();

        if (!mounted) return;

        setStep(2);

        if (profile?.onboardingCompleted === true) {
          setState('ready');
        } else {
          setState('onboarding');
        }
      } catch (error) {
        console.error('AuthGuard check failed:', error);

        if (mounted) {
          setState('login');
        }
      }
    }

    check();

    return () => {
      mounted = false;
    };
  }, []);

  // Reassure the learner if the checks are slow.
  useEffect(() => {
    if (state !== 'loading') return;

    const timer = window.setTimeout(() => setSlow(true), SLOW_AFTER_MS);

    return () => window.clearTimeout(timer);
  }, [state]);

  if (state === 'loading') {
    return <AuthLoading step={step} slow={slow} />;
  }

  if (state === 'login') {
    return <Navigate to="/onboarding" replace />;
  }

  if (state === 'onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}