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

import {
  getMissingPasswordRequirements,
  isStrongPassword,
} from './password';

import PasswordField from './PasswordField';
import GoogleButton from './GoogleButton';
import ForgotPassword from './ForgotPassword';

import type { AuthMode, AuthView } from './authTypes';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getErrorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';

const isAlreadySignedInError = (message: string) =>
  /already.*signed.?in|signed.?in.*user|UserAlreadyAuthenticated/i.test(message);

const formatMissingPasswordError = (password: string) => {
  const missing = getMissingPasswordRequirements(password);
  if (missing.length === 0) return '';
  if (missing.length === 1) return `Add ${missing[0]} to your password.`;
  if (missing.length === 2) return `Add ${missing[0]} and ${missing[1]} to your password.`;
  return `Add ${missing.slice(0, -1).join(', ')}, and ${missing[missing.length - 1]} to your password.`;
};

// ─── Shared styles ────────────────────────────────────────────────────────────

const errorTextClasses = 'flex items-start gap-2 text-sm text-red-400 font-sans font-semibold';
const alertIconClasses = 'w-4 h-4 shrink-0 mt-0.5';
const primaryButtonClasses = `
  w-full h-[56px] rounded-full bg-orange text-white font-sans font-extrabold text-[15px]
  flex items-center justify-center shadow-[0_4px_0_#C94713] hover:brightness-105
  active:translate-y-[2px] active:shadow-none transition-all duration-150
  disabled:opacity-40 disabled:pointer-events-none
`;
const backButtonClasses = `
  absolute top-5 left-5 sm:top-6 sm:left-6 md:top-7 md:left-7 lg:top-8 lg:left-8 z-10
  flex items-center justify-center w-10 h-10 rounded-full text-[#71858E]
  hover:text-white hover:bg-white/[0.04] transition-colors
`;
const inputBaseClasses = `
  w-full h-[56px] px-5 rounded-full bg-[#202F35] border text-white font-sans text-[15px]
  placeholder:text-[#91A4AC] outline-none transition-colors disabled:opacity-50
`;

// ─── Reusable components ─────────────────────────────────────────────────────

function ErrorMessage({ message, className = '' }: { message: string; className?: string }) {
  if (!message) return null;
  return (
    <p className={`${errorTextClasses} ${className}`}>
      <AlertCircle className={alertIconClasses} />
      <span>{message}</span>
    </p>
  );
}

function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className={backButtonClasses}>
      <ArrowLeft className="w-[22px] h-[22px]" />
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

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

  const isBusy = submitting || googleLoading;

  /* ── Existing session ─────────────────────────────────────────────────── */

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

      if (payload.event === 'signInWithRedirect' || payload.event === 'signedIn') {
        getAuthenticatedUser()
          .then(() => active && onAuthenticated())
          .catch(() => active && setLoading(false));
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

  /* ── Mode switching ───────────────────────────────────────────────────── */

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setView('form');
    setError('');
    setEmailError('');
    setPasswordError('');
    setConfirmCode('');
  };

  /* ── Validation ───────────────────────────────────────────────────────── */

  const validateForm = () => {
    let valid = true;
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError('Email is required.');
      valid = false;
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError('Enter a valid email address.');
      valid = false;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('Password is required.');
      valid = false;
    } else if (mode === 'signup' && !isStrongPassword(password)) {
      setPasswordError(formatMissingPasswordError(password));
      valid = false;
    } else {
      setPasswordError('');
    }

    return valid;
  };

  /* ── Email submit ─────────────────────────────────────────────────────── */

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

  /* ── Confirm email ────────────────────────────────────────────────────── */

  const handleConfirm = async () => {
    if (!confirmCode.trim()) {
      setError('Enter the verification code from your email.');
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

  /* ── Google ───────────────────────────────────────────────────────────── */

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

  /* ── Loading state ────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 bg-[#131F24]">
        <div className="flex flex-col items-center gap-4">
          <GrokitLogo size={88} className="text-orange" />
          <p className="text-sm text-[#91A4AC] font-sans font-semibold">
            Checking your session...
          </p>
        </div>
      </div>
    );
  }

  /* ── Forgot password view ─────────────────────────────────────────────── */

  if (view === 'forgot') {
    return (
      <ForgotPassword
        initialEmail={email}
        onBack={() => {
          setView('form');
          setMode('login');
          setError('');
        }}
        onComplete={() => {
          setView('form');
          setMode('login');
          setPassword('');
          setError('');
        }}
      />
    );
  }

  /* ── Email confirmation view ──────────────────────────────────────────── */

  if (view === 'confirm') {
    return (
      <div className="min-h-screen bg-[#131F24] flex flex-col relative overflow-hidden">
        <BackButton onClick={() => { setView('form'); setError(''); }} label="Back" />

        <main className="min-h-screen flex items-center justify-center px-5 py-20 sm:py-24">
          <div className="w-full max-w-[450px] text-center">
            <div className="flex justify-center mb-5">
              <GrokitLogo size={104} className="text-orange" />
            </div>

            <h1 className="font-display text-[30px] sm:text-[32px] text-white font-extrabold leading-[1.1] tracking-tight">
              Check your email
            </h1>

            <p className="text-[#91A4AC] font-sans text-[15px] sm:text-base leading-relaxed mt-2 mb-6">
              We sent a verification code to{' '}
              <span className="font-bold text-white">{email}</span>. Enter it below to finish
              creating your account.
            </p>

            <input
              value={confirmCode}
              onChange={(e) => { setConfirmCode(e.target.value); setError(''); }}
              placeholder="Verification code"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="
                w-full h-[56px] px-5 rounded-full bg-[#202F35] border border-[#3A4D55]
                text-white font-sans text-base text-center tracking-[0.3em] outline-none
                focus:border-orange transition-colors placeholder:tracking-normal
                placeholder:font-normal placeholder:text-[#91A4AC]
              "
            />

            <ErrorMessage message={error} className="mt-3 text-left" />

            <button
              type="button"
              onClick={handleConfirm}
              disabled={!confirmCode.trim() || submitting}
              className={`${primaryButtonClasses} mt-4`}
            >
              {submitting ? 'Verifying...' : 'Verify email'}
            </button>
          </div>
        </main>
      </div>
    );
  }

  /* ── Main auth form ───────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-[#131F24] relative overflow-x-hidden overflow-y-auto text-white">
      <BackButton onClick={() => navigate('/')} label="Back to Grokit" />

      {/* Mode switch */}
      <button
        type="button"
        onClick={() => switchMode(mode === 'signup' ? 'login' : 'signup')}
        className="
          absolute top-5 right-5 sm:top-6 sm:right-6 md:top-7 md:right-7 lg:top-8 lg:right-8 z-10
          h-[46px] sm:h-[48px] px-5 sm:px-6 rounded-full border-2 border-[#3A4D55] bg-transparent
          text-orange font-sans font-extrabold text-[12px] sm:text-[13px] tracking-wide
          hover:border-orange hover:bg-white/[0.03] transition-all
        "
      >
        {mode === 'signup' ? 'LOG IN' : 'SIGN UP'}
      </button>

      <main className="
        min-h-screen flex justify-center px-5 sm:px-6
        pt-[88px] pb-8 sm:pt-[96px] sm:pb-10 md:pt-[104px] md:pb-12
      ">
        <div className="w-full max-w-[450px] flex flex-col">
          {/* Logo */}
          <div className="flex justify-center mb-5 sm:mb-6">
            <GrokitLogo size={104} className="text-orange" />
          </div>

          {/* Heading */}
          <h1 className="
            font-display text-[30px] sm:text-[32px] text-white font-extrabold
            leading-[1.1] tracking-tight text-center
          ">
            {mode === 'signup' ? 'Create your account' : 'Log in'}
          </h1>

          {/* Subtitle */}
          <p className="
            text-[#91A4AC] font-sans text-[15px] sm:text-base leading-relaxed
            text-center mt-2 mb-6 sm:mb-7
          ">
            {mode === 'signup'
              ? 'One step closer to a learning path built around you.'
              : "Welcome back. Let's pick up where you left off."}
          </p>

          {/* Form */}
          <div className="flex flex-col gap-3">
            {/* Email */}
            <div>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                placeholder="Email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                disabled={isBusy}
                className={`
                  ${inputBaseClasses}
                  ${emailError ? 'border-red-500 focus:border-red-500' : 'border-[#3A4D55] focus:border-orange'}
                `}
              />
              <ErrorMessage message={emailError} className="mt-2" />
            </div>

            {/* Password */}
            <div>
              <PasswordField
                name="password"
                value={password}
                onChange={(value) => { setPassword(value); setPasswordError(''); }}
                placeholder="Password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                error={Boolean(passwordError)}
                disabled={isBusy}
              />
              <ErrorMessage message={passwordError} className="mt-2" />
            </div>
          </div>

          {/* Forgot password */}
          {mode === 'login' && (
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => { setView('forgot'); setError(''); }}
                className="
                  text-[12px] text-[#91A4AC] font-sans font-extrabold uppercase tracking-wide
                  hover:text-white hover:underline transition-colors
                "
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* General error */}
          <ErrorMessage message={error} className="mt-3" />

          {/* Primary button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isBusy}
            className={`${primaryButtonClasses} mt-4`}
          >
            {submitting ? 'Please wait...' : mode === 'signup' ? 'Sign up' : 'Log in'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-[#34464E]" />
            <span className="text-[12px] text-[#71858E] font-sans font-extrabold tracking-wide">
              OR
            </span>
            <div className="h-px flex-1 bg-[#34464E]" />
          </div>

          {/* Google */}
          <GoogleButton onClick={handleGoogle} disabled={isBusy} />

          {/* Switch mode */}
          <p className="text-center text-[14px] sm:text-[15px] text-[#91A4AC] font-sans mt-6">
            {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
            <button
              type="button"
              onClick={() => switchMode(mode === 'signup' ? 'login' : 'signup')}
              className="text-orange font-bold hover:underline transition-colors"
            >
              {mode === 'signup' ? 'Log in' : 'Sign up'}
            </button>
          </p>

          {/* Legal */}
          <p className="
            text-center text-[10px] sm:text-[11px] text-[#647981] font-sans leading-[1.5]
            max-w-[390px] mx-auto mt-3
          ">
            By {mode === 'signup' ? 'signing up for' : 'signing in to'} Grokit, you agree to our{' '}
            <Link to="/terms" className="text-[#91A4AC] font-bold hover:text-white hover:underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-[#91A4AC] font-bold hover:text-white hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}