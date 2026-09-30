import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { fetchAuthSession } from 'aws-amplify/auth';
import { GrokitMascot } from '../../components/Grokitmascot';
import { getAuthenticatedUser } from './authService';
import { getProfile } from '../../lib/profile';

interface Props {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: Props) {
  const [state, setState] = useState<
    'loading' | 'login' | 'onboarding' | 'ready'
  >('loading');

  useEffect(() => {
    let mounted = true;

    async function check() {
      try {
        await getAuthenticatedUser();
        await fetchAuthSession();
        let profile = await getProfile();

        if (!profile) {
          await new Promise(r => setTimeout(r, 400));
          profile = await getProfile();
        }

        if (!mounted) return;

        if (profile?.onboardingCompleted) {
          setState('ready');
        } else {
          setState('onboarding');
        }
      } catch {
        if (mounted) setState('login');
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