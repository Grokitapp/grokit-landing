import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Hub } from 'aws-amplify/utils';
import { GrokitLogo } from '../../../components/Grokitlogo';
import {
  confirmEmailSignUp,
  getAuthenticatedUser,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from './authService';
import { isStrongPassword } from './password';
import PasswordField from './PasswordField';
import PasswordRequirements from './PasswordRequirements';
import AuthDivider from './AuthDivider';
import GoogleButton from './GoogleButton';
import ForgotPassword from './ForgotPassword';
import type { AuthMode, AuthView } from './authTypes';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong. Please try again.';

const isAlreadySignedInError = (message: string) =>
  /already.*signed.?in|signed.?in.*user|UserAlreadyAuthenticated/i.test(message);

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('signup');
  const [view, setView] = useState<AuthView>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    let active = true;

    const checkExistingSession = async () => {
      try {
        await getAuthenticatedUser();
        if (active) onAuthenticated();
      } catch {
        if (active) setLoading(false);
      }
    };

    checkExistingSession();

    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (!active) return;

      if (payload.event === 'signInWithRedirect') {
        getAuthenticatedUser()
          .then(() => { if (active) onAuthenticated(); })
          .catch(() => { if (active) setLoading(false); });
      }

      if (payload.event === 'signInWithRedirect_failure') {
        setGoogleLoading(false);
        setLoading(false);
        setError('Google sign-in could not be completed. Please try again.');
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [onAuthenticated]);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setView('form');
    setError('');
    setEmailError('');
    setPasswordError('');
    setConfirmCode('');
  };

  const validateForm = () => {
    let valid = true;
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError('Email is required');
      valid = false;
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError('Invalid email address');
      valid = false;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else if (mode === 'signup' && !isStrongPassword(password)) {
      setPasswordError('Choose a password that meets all the requirements below.');
      valid = false;
    } else {
      setPasswordError('');
    }

    return valid;
  };

  const handleSubmit = async () => {
    setError('');
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const username = email.trim();

      if (mode === 'signup') {
        const { nextStep } = await signUpWithEmail(username, password);

        if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
          setView('confirm');
        } else if (nextStep.signUpStep === 'COMPLETE_AUTO_SIGN_IN') {
          // Current backend may opt into automatic sign-in in the future.
          const result = await signInWithEmail(username, password);
          if (result.nextStep.signInStep === 'DONE') onAuthenticated();
        } else {
          onAuthenticated();
        }
      } else {
        const { nextStep } = await signInWithEmail(username, password);

        switch (nextStep.signInStep) {
          case 'DONE':
            onAuthenticated();
            break;
          case 'CONFIRM_SIGN_UP':
            setView('confirm');
            break;
          case 'RESET_PASSWORD':
            setView('forgot');
            break;
          default:
            setError('Your account requires an additional sign-in step. Please contact support.');
        }
      }
    } catch (err) {
      const message = getErrorMessage(err);
      if (isAlreadySignedInError(message)) {
        onAuthenticated();
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmCode.trim()) {
      setError('Enter the confirmation code from your email.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const username = email.trim();
      await confirmEmailSignUp(username, confirmCode.trim());
      const result = await signInWithEmail(username, password);

      if (result.nextStep.signInStep === 'DONE') {
        onAuthenticated();
      } else if (result.nextStep.signInStep === 'RESET_PASSWORD') {
        setView('forgot');
      } else {
        setError('Your account needs one more sign-in step. Please try logging in again.');
      }
    } catch (err) {
      const message = getErrorMessage(err);
      if (isAlreadySignedInError(message)) {
        onAuthenticated();
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setGoogleLoading(false);
      setError(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-4">
          <GrokitLogo size={84} className="text-ink" />
          <p className="text-sm text-muted font-sans font-semibold">Checking your session...</p>
        </div>
      </div>
    );
  }

  if (view === 'forgot') {
    return (
      <ForgotPassword
        initialEmail={email}
        onBack={() => { setView('form'); setMode('login'); setError(''); }}
        onComplete={() => { setView('form'); setMode('login'); setPassword(''); setError(''); }}
      />
    );
  }

  if (view === 'confirm') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">
          <button
            type="button"
            onClick={() => { setView('form'); setError(''); }}
            className="inline-flex items-center gap-2 text-body hover:text-ink font-sans font-bold text-sm mb-7 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="text-center">
            <div className="flex justify-center mb-7">
              <GrokitLogo size={84} className="text-ink" />
            </div>
            <h1 className="font-display text-3xl text-ink font-extrabold mb-2">Check your email</h1>
            <p className="text-body font-sans text-sm mb-7">
              We sent a code to <span className="font-bold text-ink">{email}</span>. Enter it below.
            </p>

            <input
              value={confirmCode}
              onChange={(event) => { setConfirmCode(event.target.value); setError(''); }}
              placeholder="Confirmation code"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="w-full text-center tracking-widest px-4 py-3 bg-surface-alt border border-line rounded-xl text-ink font-sans font-bold placeholder:text-muted placeholder:tracking-normal placeholder:font-normal focus:outline-none focus:border-orange transition-colors"
            />

            {error && (
              <p className="flex items-center gap-1.5 text-sm text-red-600 font-sans font-semibold mt-3 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </p>
            )}

            <button
              onClick={handleConfirm}
              disabled={!confirmCode.trim() || submitting}
              className="btn-duo w-full px-6 py-3.5 text-base disabled:opacity-40 mt-5"
            >
              {submitting ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-sm">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="p-2 -ml-2 text-body hover:text-ink transition-colors"
          aria-label="Back to Grokit"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex justify-center mt-4 mb-6">
          <GrokitLogo size={88} className="text-ink" />
        </div>

        <h1 className="font-display text-3xl text-ink font-extrabold text-center">
          {mode === 'signup' ? 'Create your account' : 'Log in'}
        </h1>
        <p className="text-body font-sans text-sm text-center mt-1 mb-7">
          {mode === 'signup' ? 'One step from a personalized learning path.' : 'Welcome back.'}
        </p>

        <div className="flex flex-col gap-3">
          <div>
            <input
              type="email"
              value={email}
              onChange={(event) => { setEmail(event.target.value); setEmailError(''); }}
              placeholder="Email"
              autoComplete="email"
              className={`w-full px-4 py-3.5 bg-surface-alt border rounded-xl text-ink font-sans placeholder:text-muted focus:outline-none transition-colors ${emailError ? 'border-red-500' : 'border-line focus:border-orange'}`}
            />
            {emailError && (
              <p className="flex items-center gap-1.5 text-sm text-red-600 font-sans font-semibold mt-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {emailError}
              </p>
            )}
          </div>

          <div>
            <PasswordField
              value={password}
              onChange={(value) => { setPassword(value); setPasswordError(''); }}
              placeholder="Password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              error={Boolean(passwordError)}
            />
            {passwordError && (
              <p className="flex items-center gap-1.5 text-sm text-red-600 font-sans font-semibold mt-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {passwordError}
              </p>
            )}
            {mode === 'signup' && <PasswordRequirements password={password} />}
          </div>
        </div>

        {mode === 'login' && (
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={() => { setView('forgot'); setError(''); }}
              className="text-xs text-orange font-bold hover:underline"
            >
              Forgot password?
            </button>
          </div>
        )}

        {error && (
          <p className="flex items-start gap-1.5 text-sm text-red-600 font-sans font-semibold mt-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting || googleLoading}
          className="btn-duo w-full px-6 py-3.5 text-base disabled:opacity-40 mt-5"
        >
          {submitting ? 'Please wait...' : mode === 'signup' ? 'Sign up' : 'Log in'}
        </button>

        <AuthDivider />

        <GoogleButton onClick={handleGoogle} disabled={googleLoading || submitting} />

        <p className="text-center text-sm text-muted font-sans mt-6 mb-4">
          {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
          <button
            type="button"
            onClick={() => switchMode(mode === 'signup' ? 'login' : 'signup')}
            className="text-orange font-bold hover:underline"
          >
            {mode === 'signup' ? 'Log in' : 'Sign up'}
          </button>
        </p>

        <p className="text-center text-xs text-muted font-sans leading-relaxed">
          By {mode === 'signup' ? 'signing up for' : 'signing in to'} Grokit, you agree to our{' '}
          <Link to="/terms" className="text-body font-bold hover:underline">Terms</Link>
          {' '}and{' '}
          <Link to="/privacy" className="text-body font-bold hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
