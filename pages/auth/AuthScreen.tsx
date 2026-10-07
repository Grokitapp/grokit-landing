import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Hub } from 'aws-amplify/utils';
import { GrokitLogo } from '../../components/Grokitlogo';
import {
  confirmEmailSignUp,
  getAuthenticatedUser,
  resendEmailSignUpCode,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from './authService';
import { getMissingPasswordRequirements, isStrongPassword } from './password';
import PasswordField from './PasswordField';
import GoogleButton from './GoogleButton';
import ForgotPassword from './ForgotPassword';
import type { AuthMode, AuthView } from './authTypes';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_SECONDS = 60;

// ─── Helpers ────────────────────────────────────────────────────────────────

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong. Please try again.';

const isAlreadySignedInError = (message: string) =>
  /already.*signed.?in|signed.?in.*user|UserAlreadyAuthenticated/i.test(message);

const formatMissingPasswordError = (password: string) => {
  const missing = getMissingPasswordRequirements(password);

  if (missing.length === 0) return '';
  if (missing.length === 1) return `Add ${missing[0]} to your password.`;
  if (missing.length === 2) return `Add ${missing[0]} and ${missing[1]} to your password.`;

  return `Add ${missing.slice(0, -1).join(', ')}, and ${missing.at(-1)} to your password.`;
};

// ─── Shared styles ──────────────────────────────────────────────────────────

const errorTextClasses = 'flex items-start gap-2 text-sm text-red-400 font-sans font-semibold';
const alertIconClasses = 'w-4 h-4 shrink-0 mt-0.5';

const primaryButtonClasses = `
  w-full h-[56px] rounded-full bg-orange text-white font-sans font-extrabold text-[15px]
  flex items-center justify-center shadow-[0_4px_0_#C94713]
  hover:brightness-105 active:translate-y-[2px] active:shadow-none
  transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none
`;

const backButtonClasses = `
  absolute top-5 left-5 sm:top-6 sm:left-6 md:top-7 md:left-7 lg:top-8 lg:left-8 z-10
  flex items-center justify-center w-10 h-10 rounded-full
  text-[#71858E] hover:text-white hover:bg-white/[0.04] transition-colors
`;

const inputBaseClasses = `
  w-full h-[56px] px-5 rounded-full bg-[#202F35] border text-white
  font-sans text-[15px] placeholder:text-[#91A4AC] outline-none transition-colors disabled:opacity-50
`;

// ─── Reusable components ────────────────────────────────────────────────────

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

// ─── Main component ─────────────────────────────────────────────────────────

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>('signup');
  const [view, setView] = useState<AuthView>('form');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmCode, setConfirmCode] = useState('');

  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendingCode, setResendingCode] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const isBusy = submitting || googleLoading;

  // ─── Existing session ─────────────────────────────────────────────────────

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      try {
        await getAuthenticatedUser();
        if (active) onAuthenticated();
      } catch {
        if (active) setLoading(false);
      }
    };

    checkSession();

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

  // ─── Signup verification countdown ────────────────────────────────────────

  useEffect(() => {
    if (view !== 'confirm' || resendCooldown <= 0) return;

    const timer = window.setInterval(() => {
      setResendCooldown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [view, resendCooldown]);

  // ─── Reset OTP state when leaving confirmation ────────────────────────────

  useEffect(() => {
    if (view !== 'confirm') {
      setResendCooldown(0);
      setResendingCode(false);
    }
  }, [view]);

  // ─── Mode switching ───────────────────────────────────────────────────────

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setView('form');
    setError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setConfirmCode('');
    setResendCooldown(0);
    setResendingCode(false);
    setConfirmPassword('');
  };

  // ─── Validation ───────────────────────────────────────────────────────────

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

    if (mode === 'signup') {
      if (!confirmPassword) {
        setConfirmPasswordError('Please confirm your password.');
        valid = false;
      } else if (password !== confirmPassword) {
        setConfirmPasswordError('Passwords do not match.');
        valid = false;
      } else {
        setConfirmPasswordError('');
      }
    } else {
      setConfirmPasswordError('');
    }

    return valid;
  };

  // ─── Email submit ─────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setError('');
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const username = email.trim();

      if (mode === 'signup') {
        const { nextStep } = await signUpWithEmail(username, password);

        if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
          setConfirmCode('');
          setResendCooldown(RESEND_COOLDOWN_SECONDS);
          setView('confirm');
          setSubmitting(false);
        } else if (nextStep.signUpStep === 'COMPLETE_AUTO_SIGN_IN') {
          const result = await signInWithEmail(username, password);

          if (result.nextStep.signInStep === 'DONE') {
            onAuthenticated();
            return;
          }

          setSubmitting(false);
        } else {
          onAuthenticated();
          return;
        }
      } else {
        const { nextStep } = await signInWithEmail(username, password);

        switch (nextStep.signInStep) {
          case 'DONE':
            onAuthenticated();
            return;

          case 'CONFIRM_SIGN_UP':
            setConfirmCode('');
            setResendCooldown(RESEND_COOLDOWN_SECONDS);
            setView('confirm');
            setSubmitting(false);
            break;

          case 'RESET_PASSWORD':
            setView('forgot');
            setSubmitting(false);
            break;

          default:
            setError('Your account requires an additional sign-in step. Please contact support.');
            setSubmitting(false);
        }
      }
    } catch (err) {
      const message = getErrorMessage(err);

      if (isAlreadySignedInError(message)) {
        onAuthenticated();
        return;
      }

      setError(message);
      setSubmitting(false);
    }
  };

  // ─── Confirm email ────────────────────────────────────────────────────────

  const handleConfirm = async () => {
    const trimmedCode = confirmCode.trim();

    if (!trimmedCode) {
      setError('Enter the verification code from your email.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const username = email.trim();

      // 1. Verify the email.
      await confirmEmailSignUp(username, trimmedCode);

      // 2. Sign the user in.
      const result = await signInWithEmail(username, password);

      // 3. Only finish loading after authentication has actually completed.
      if (result.nextStep.signInStep === 'DONE') {
        onAuthenticated();
        // Keep "Verifying..." visible while the parent redirects.
        return;
      }

      if (result.nextStep.signInStep === 'RESET_PASSWORD') {
        setSubmitting(false);
        setView('forgot');
        return;
      }

      setSubmitting(false);
      setError('Your account needs one more sign-in step. Please try logging in again.');
    } catch (err) {
      const message = getErrorMessage(err);

      if (isAlreadySignedInError(message)) {
        onAuthenticated();
        // Keep "Verifying..." visible while the parent redirects.
        return;
      }

      setError(message);
      setSubmitting(false);
    }
  };

  // ─── Resend signup verification code ──────────────────────────────────────

  const handleResendCode = async () => {
    if (resendCooldown > 0 || resendingCode || submitting) return;

    const username = email.trim();

    if (!username) {
      setError('We could not determine your email address. Please go back and try again.');
      return;
    }

    setError('');
    setResendingCode(true);

    try {
      await resendEmailSignUpCode(username);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setResendingCode(false);
    }
  };

  // ─── Google ───────────────────────────────────────────────────────────────

  const handleGoogle = async () => {
    if (googleLoading) return;

    setError('');
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
    } catch (err) {
      setGoogleLoading(false);
      setError(getErrorMessage(err));
    }
  };

  // ─── Loading state ────────────────────────────────────────────────────────

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

  // ─── Forgot password view ─────────────────────────────────────────────────

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
          setConfirmPassword('');
          setError('');
        }}
      />
    );
  }

  // ─── Email confirmation view ──────────────────────────────────────────────

  if (view === 'confirm') {
    const canResend = resendCooldown === 0 && !resendingCode && !submitting;

    return (
      <div className="min-h-screen bg-[#131F24] flex flex-col relative overflow-hidden text-white">
        <BackButton
          onClick={() => {
            if (submitting) return;
            setView('form');
            setError('');
            setConfirmCode('');
            setResendCooldown(0);
          }}
          label="Back"
        />

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
              onChange={(e) => {
                setConfirmCode(e.target.value);
                setError('');
              }}
              placeholder="Verification code"
              inputMode="numeric"
              autoComplete="one-time-code"
              disabled={submitting}
              className="
                w-full h-[56px] px-5 rounded-full bg-[#202F35] border border-[#3A4D55] text-white
                font-sans text-base text-center tracking-[0.3em] outline-none focus:border-orange
                transition-colors placeholder:tracking-normal placeholder:font-normal
                placeholder:text-[#91A4AC] disabled:opacity-50
              "
            />

            <ErrorMessage message={error} className="mt-3 text-left" />

            <button
              type="button"
              onClick={handleConfirm}
              disabled={!confirmCode.trim() || submitting || resendingCode}
              className={`${primaryButtonClasses} mt-4`}
            >
              {submitting ? 'Verifying...' : 'Verify email'}
            </button>

            <div className="mt-5 text-center">
              <p className="text-[13px] sm:text-[14px] text-[#91A4AC] font-sans">
                Didn't receive the code?
              </p>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={!canResend}
                className="
                  mt-1 text-[13px] sm:text-[14px] font-sans font-extrabold text-orange
                  transition-colors disabled:text-[#71858E] disabled:cursor-not-allowed
                  hover:underline disabled:hover:no-underline
                "
              >
                {resendingCode
                  ? 'Sending...'
                  : resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : 'Resend code'}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── Main auth form ───────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#131F24] relative overflow-x-hidden overflow-y-auto text-white">
      <BackButton onClick={() => navigate('/')} label="Back to Grokit" />

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

      <main className="min-h-screen flex justify-center px-5 sm:px-6 pt-[88px] pb-8 sm:pt-[96px] sm:pb-10 md:pt-[104px] md:pb-12">
        <div className="w-full max-w-[450px] flex flex-col">
          <div className="flex justify-center mb-5 sm:mb-6">
            <GrokitLogo size={104} className="text-orange" />
          </div>

          <h1 className="font-display text-[30px] sm:text-[32px] text-white font-extrabold leading-[1.1] tracking-tight text-center">
            {mode === 'signup' ? 'Create your account' : 'Log in'}
          </h1>

          <p className="text-[#91A4AC] font-sans text-[15px] sm:text-base leading-relaxed text-center mt-2 mb-6 sm:mb-7">
            {mode === 'signup'
              ? 'One step closer to a learning path built around you.'
              : "Welcome back. Let's pick up where you left off."}
          </p>

          <div className="flex flex-col gap-3">
            <div>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
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

            <div>
              <PasswordField
                name="password"
                value={password}
                onChange={(value) => {
                  setPassword(value);
                  setPasswordError('');
                  if (mode === 'signup' && confirmPassword && value === confirmPassword) {
                    setConfirmPasswordError('');
                  }
                }}
                placeholder="Password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                error={Boolean(passwordError)}
                disabled={isBusy}
              />
              <ErrorMessage message={passwordError} className="mt-2" />
            </div>

            {mode === 'signup' && (
              <div>
                <PasswordField
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(value) => {
                    setConfirmPassword(value);
                    setConfirmPasswordError('');
                    if (value && password && value !== password) {
                      setConfirmPasswordError('Passwords do not match.');
                    }
                  }}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  error={Boolean(confirmPasswordError)}
                  disabled={isBusy}
                />
                <ErrorMessage message={confirmPasswordError} className="mt-2" />
              </div>
            )}
          </div>

          {mode === 'login' && (
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => {
                  setView('forgot');
                  setError('');
                }}
                className="
                  text-[12px] text-[#91A4AC] font-sans font-extrabold uppercase tracking-wide
                  hover:text-white hover:underline transition-colors
                "
              >
                Forgot password?
              </button>
            </div>
          )}

          <ErrorMessage message={error} className="mt-3" />

          <button type="button" onClick={handleSubmit} disabled={isBusy} className={`${primaryButtonClasses} mt-4`}>
            {submitting ? 'Please wait...' : mode === 'signup' ? 'Sign up' : 'Log in'}
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-[#34464E]" />
            <span className="text-[12px] text-[#71858E] font-sans font-extrabold tracking-wide">OR</span>
            <div className="h-px flex-1 bg-[#34464E]" />
          </div>

          <GoogleButton onClick={handleGoogle} disabled={isBusy} />

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

          <p className="text-center text-[10px] sm:text-[11px] text-[#647981] font-sans leading-[1.5] max-w-[390px] mx-auto mt-3">
            By {mode === 'signup' ? 'signing up for' : 'signing in to'} Grokit, you agree to our{' '}
            <Link to="/terms" className="text-[#91A4AC] font-bold hover:text-white hover:underline">
              Terms of Service
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