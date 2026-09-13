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
  /already.*signed.?in|signed.?in.*user|UserAlreadyAuthenticated/i.test(
    message,
  );

const formatMissingPasswordError = (password: string) => {
  const missing = getMissingPasswordRequirements(password);

  if (missing.length === 0) return '';

  if (missing.length === 1) {
    return `Add ${missing[0]} to your password.`;
  }

  if (missing.length === 2) {
    return `Add ${missing[0]} and ${missing[1]} to your password.`;
  }

  return `Add ${missing.slice(0, -1).join(', ')}, and ${
    missing[missing.length - 1]
  } to your password.`;
};

export default function AuthScreen({
  onAuthenticated,
}: AuthScreenProps) {
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

        if (active) {
          onAuthenticated();
        }
      } catch {
        if (active) {
          setLoading(false);
        }
      }
    };

    checkExistingSession();

    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (!active) return;

      if (
        payload.event === 'signInWithRedirect' ||
        payload.event === 'signedIn'
      ) {
        getAuthenticatedUser()
          .then(() => {
            if (active) onAuthenticated();
          })
          .catch(() => {
            if (active) setLoading(false);
          });
      }

      if (payload.event === 'signInWithRedirect_failure') {
        setGoogleLoading(false);
        setLoading(false);
        setError(
          'Google sign-in could not be completed. Please try again.',
        );
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
    } else if (
      mode === 'signup' &&
      !isStrongPassword(password)
    ) {
      setPasswordError(formatMissingPasswordError(password));
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
        const { nextStep } = await signUpWithEmail(
          username,
          password,
        );

        if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
          setView('confirm');
        } else if (
          nextStep.signUpStep === 'COMPLETE_AUTO_SIGN_IN'
        ) {
          const result = await signInWithEmail(
            username,
            password,
          );

          if (result.nextStep.signInStep === 'DONE') {
            onAuthenticated();
          }
        } else {
          onAuthenticated();
        }
      } else {
        const { nextStep } = await signInWithEmail(
          username,
          password,
        );

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
            setError(
              'Your account requires an additional sign-in step. Please contact support.',
            );
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
      setError('Enter the verification code from your email.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const username = email.trim();

      await confirmEmailSignUp(
        username,
        confirmCode.trim(),
      );

      const result = await signInWithEmail(
        username,
        password,
      );

      if (result.nextStep.signInStep === 'DONE') {
        onAuthenticated();
      } else if (
        result.nextStep.signInStep === 'RESET_PASSWORD'
      ) {
        setView('forgot');
      } else {
        setError(
          'Your account needs one more sign-in step. Please try logging in again.',
        );
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

  /*
   * ---------------------------------------------------------
   * Loading
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="flex flex-col items-center gap-4">
          <GrokitLogo
            size={80}
            className="text-ink"
          />

          <p className="text-sm text-muted font-sans font-semibold">
            Checking your session...
          </p>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * Forgot password
   * ---------------------------------------------------------
   */

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

  /*
   * ---------------------------------------------------------
   * Email confirmation
   * ---------------------------------------------------------
   */

  if (view === 'confirm') {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        {/* Top navigation */}
        <div className="absolute top-0 left-0 p-6 sm:p-7 md:p-8">
          <button
            type="button"
            onClick={() => {
              setView('form');
              setError('');
            }}
            aria-label="Back"
            className="
              flex
              items-center
              justify-center
              w-10
              h-10
              text-body
              hover:text-ink
              transition-colors
            "
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Confirmation content */}
        <main className="flex-1 flex items-center justify-center px-5 py-20">
          <div className="w-full max-w-[450px] text-center">
            <div className="flex justify-center mb-6">
              <GrokitLogo
                size={88}
                className="text-ink"
              />
            </div>

            <h1
              className="
                font-display
                text-[30px]
                sm:text-[32px]
                text-ink
                font-extrabold
                leading-tight
                tracking-tight
              "
            >
              Check your email
            </h1>

            <p
              className="
                text-body
                font-sans
                text-[15px]
                sm:text-base
                leading-relaxed
                mt-3
                mb-7
              "
            >
              We sent a verification code to{' '}
              <span className="font-bold text-ink">
                {email}
              </span>
              . Enter it below to finish creating your account.
            </p>

            <input
              value={confirmCode}
              onChange={(event) => {
                setConfirmCode(event.target.value);
                setError('');
              }}
              placeholder="Verification code"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="
                w-full
                h-[58px]
                px-5
                bg-surface-alt
                border
                border-line
                rounded-[14px]
                text-ink
                font-sans
                text-base
                text-center
                tracking-[0.3em]
                outline-none
                focus:border-orange
                transition-colors
                placeholder:tracking-normal
                placeholder:font-normal
                placeholder:text-muted
              "
            />

            {error && (
              <p className="flex items-start gap-2 text-sm text-red-600 font-sans font-semibold mt-3 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </p>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              disabled={!confirmCode.trim() || submitting}
              className="
                w-full
                h-[58px]
                mt-4
                rounded-[14px]
                bg-orange
                text-white
                font-sans
                font-extrabold
                text-base
                flex
                items-center
                justify-center
                shadow-[0_3px_0_rgba(0,0,0,0.16)]
                hover:brightness-105
                active:translate-y-[2px]
                active:shadow-none
                transition-all
                disabled:opacity-40
                disabled:pointer-events-none
              "
            >
              {submitting
                ? 'Verifying...'
                : 'Verify email'}
            </button>
          </div>
        </main>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * Main auth screen
   * ---------------------------------------------------------
   */

  return (
    <div className="min-h-screen bg-surface relative overflow-x-hidden">
      {/* ---------------------------------------------------
          Top-left back button
          --------------------------------------------------- */}
      <button
        type="button"
        onClick={() => navigate('/')}
        aria-label="Back to Grokit"
        className="
          absolute
          top-5
          left-5
          sm:top-6
          sm:left-6
          md:top-7
          md:left-7
          lg:top-8
          lg:left-8
          z-10
          flex
          items-center
          justify-center
          w-10
          h-10
          rounded-full
          text-body
          hover:text-ink
          hover:bg-black/[0.03]
          transition-colors
        "
      >
        <ArrowLeft className="w-[22px] h-[22px]" />
      </button>

      {/* ---------------------------------------------------
          Auth content

          The important part here is that this is NOT a
          vertically centered card. The content starts
          slightly above center and leaves large negative
          space underneath — like the Duolingo reference.
          --------------------------------------------------- */}
      <main
        className="
          min-h-screen
          flex
          justify-center
          px-5
          pt-[120px]
          pb-12
          sm:pt-[135px]
          md:pt-[145px]
        "
      >
        <div className="w-full max-w-[450px]">
          {/* ------------------------------------------------
              Logo
              ------------------------------------------------ */}
          <div className="flex justify-center mb-5">
            <GrokitLogo
              size={88}
              className="text-orange"
            />
          </div>

          {/* ------------------------------------------------
              Heading
              ------------------------------------------------ */}
          <h1
            className="
              font-display
              text-[30px]
              sm:text-[32px]
              text-ink
              font-extrabold
              leading-[1.1]
              tracking-tight
              text-center
            "
          >
            {mode === 'signup'
              ? 'Create your account'
              : 'Log in'}
          </h1>

          {/* ------------------------------------------------
              Subtitle
              ------------------------------------------------ */}
          <p
            className="
              text-body
              font-sans
              text-[15px]
              sm:text-base
              leading-relaxed
              text-center
              mt-2
              mb-7
            "
          >
            {mode === 'signup'
              ? 'One step closer to a learning path built around you.'
              : 'Welcome back. Let’s pick up where you left off.'}
          </p>

          {/* ------------------------------------------------
              Form
              ------------------------------------------------ */}
          <div className="flex flex-col gap-3.5">
            {/* Email */}
            <div>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setEmailError('');
                }}
                placeholder="Email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                disabled={submitting || googleLoading}
                className={`
                  w-full
                  h-[58px]
                  px-[18px]
                  bg-surface-alt
                  border
                  rounded-[14px]
                  text-ink
                  font-sans
                  text-base
                  placeholder:text-muted
                  outline-none
                  transition-colors
                  disabled:opacity-50
                  ${
                    emailError
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-line focus:border-orange'
                  }
                `}
              />

              {emailError && (
                <p className="flex items-start gap-2 text-sm text-red-600 font-sans font-semibold mt-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{emailError}</span>
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <PasswordField
                name="password"
                value={password}
                onChange={(value) => {
                  setPassword(value);
                  setPasswordError('');
                }}
                placeholder="Password"
                autoComplete={
                  mode === 'signup'
                    ? 'new-password'
                    : 'current-password'
                }
                error={Boolean(passwordError)}
                disabled={submitting || googleLoading}
              />

              {passwordError && (
                <p className="flex items-start gap-2 text-sm text-red-600 font-sans font-semibold mt-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{passwordError}</span>
                </p>
              )}
            </div>
          </div>

          {/* ------------------------------------------------
              Forgot password
              ------------------------------------------------ */}
          {mode === 'login' && (
            <div className="flex justify-end mt-2.5">
              <button
                type="button"
                onClick={() => {
                  setView('forgot');
                  setError('');
                }}
                className="
                  text-[13px]
                  text-orange
                  font-sans
                  font-bold
                  hover:underline
                "
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* General error */}
          {error && (
            <p className="flex items-start gap-2 text-sm text-red-600 font-sans font-semibold mt-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </p>
          )}

          {/* ------------------------------------------------
              Primary action
              ------------------------------------------------ */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || googleLoading}
            className="
              w-full
              h-[58px]
              mt-5
              rounded-[14px]
              bg-orange
              text-white
              font-sans
              font-extrabold
              text-base
              flex
              items-center
              justify-center
              shadow-[0_3px_0_rgba(0,0,0,0.16)]
              hover:brightness-105
              active:translate-y-[2px]
              active:shadow-none
              transition-all
              disabled:opacity-40
              disabled:pointer-events-none
            "
          >
            {submitting
              ? 'Please wait...'
              : mode === 'signup'
                ? 'Sign up'
                : 'Log in'}
          </button>

          {/* ------------------------------------------------
              Divider
              ------------------------------------------------ */}
          <div
            className="
              flex
              items-center
              gap-3
              my-6
            "
          >
            <div className="h-px flex-1 bg-line" />

            <span
              className="
                text-[12px]
                text-muted
                font-sans
                font-bold
                tracking-wide
              "
            >
              OR
            </span>

            <div className="h-px flex-1 bg-line" />
          </div>

          {/* ------------------------------------------------
              Google
              ------------------------------------------------ */}
          <GoogleButton
            onClick={handleGoogle}
            disabled={googleLoading || submitting}
          />

          {/* ------------------------------------------------
              Switch auth mode
              ------------------------------------------------ */}
          <p
            className="
              text-center
              text-[15px]
              text-muted
              font-sans
              mt-7
            "
          >
            {mode === 'signup'
              ? 'Already have an account? '
              : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() =>
                switchMode(
                  mode === 'signup'
                    ? 'login'
                    : 'signup',
                )
              }
              className="
                text-orange
                font-bold
                hover:underline
              "
            >
              {mode === 'signup'
                ? 'Log in'
                : 'Sign up'}
            </button>
          </p>

          {/* ------------------------------------------------
              Legal
              ------------------------------------------------ */}
          <p
            className="
              text-center
              text-[11px]
              sm:text-xs
              text-muted
              font-sans
              leading-relaxed
              max-w-[390px]
              mx-auto
              mt-4
            "
          >
            By{' '}
            {mode === 'signup'
              ? 'signing up for'
              : 'signing in to'}{' '}
            Grokit, you agree to our{' '}
            <Link
              to="/terms"
              className="text-body font-bold hover:underline"
            >
              Terms
            </Link>{' '}
            and{' '}
            <Link
              to="/privacy"
              className="text-body font-bold hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}