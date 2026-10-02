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

export default function AuthGuard({ children }: Props) {
  const [state, setState] = useState<AuthState>('loading');

  useEffect(() => {
    let mounted = true;

    async function check() {
      try {
        // Confirm that a Cognito user is currently signed in.
        await getAuthenticatedUser();

        // Confirm that the current authenticated session is valid.
        await fetchAuthSession();

        // Profile reads can temporarily lag immediately after
        // onboarding is saved, so use the retry-aware lookup.
        const profile = await getProfileWithRetry();

        if (!mounted) return;

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

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-[#131F24] flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <GrokitMascot pose="thinking" size={110} />

          <p className="text-[#91A4AC] font-semibold">
            Preparing your learning space...
          </p>
        </div>
      </div>
    );
  }

  if (state === 'login') {
    return <Navigate to="/onboarding" replace />;
  }

  if (state === 'onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}