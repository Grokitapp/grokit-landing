import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router';

import {
  completePasswordReset,
  sendPasswordResetCode,
} from './authService';

import { GrokitLogo } from '../../components/Grokitlogo';

import {
  getMissingPasswordRequirements,
  isStrongPassword,
} from './password';

import PasswordField from './PasswordField';

interface ForgotPasswordProps {
  initialEmail: string;
  onBack: () => void;
  onComplete: () => void;
}

type Stage = 'request' | 'confirm' | 'done';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatMissingPasswordError = (password: string) => {
  const missing = getMissingPasswordRequirements(password);

  if (missing.length === 0) return '';

  if (missing.length === 1) {
    return `Add ${missing[0]} to your new password.`;
  }

  if (missing.length === 2) {
    return `Add ${missing[0]} and ${missing[1]} to your new password.`;
  }

  return `Add ${missing.slice(0, -1).join(', ')}, and ${
    missing[missing.length - 1]
  } to your new password.`;
};

// -----------------------------------------------------------------------------
// Shared styles
// -----------------------------------------------------------------------------

const errorTextClasses =
  'flex items-start gap-2 text-sm text-red-400 font-sans font-semibold';

const primaryButtonClasses = `
  w-full
  h-[56px]
  rounded-full
  bg-orange
  text-white
  font-sans
  font-extrabold
  text-[15px]
  flex
  items-center
  justify-center
  gap-3
  shadow-[0_4px_0_#C94713]
  hover:brightness-105
  active:translate-y-[2px]
  active:shadow-none
  transition-all
  duration-150
  disabled:opacity-40
  disabled:pointer-events-none
`;

const backButtonClasses = `
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
  text-[#71858E]
  hover:text-white
  hover:bg-white/[0.04]
  transition-colors
  active:scale-95
`;

const emailInputClasses = `
  w-full
  h-[56px]
  px-5
  rounded-full
  bg-[#202F35]
  border
  text-white
  font-sans
  text-[15px]
  placeholder:text-[#91A4AC]
  outline-none
  transition-colors
  disabled:opacity-50
`;

// -----------------------------------------------------------------------------
// Error message
// -----------------------------------------------------------------------------

function ErrorMessage({
  message,
  className = '',
}: {
  message: string;
  className?: string;
}) {
  if (!message) return null;

  return (
    <p className={`${errorTextClasses} ${className}`}>
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

// -----------------------------------------------------------------------------
// Back button
// -----------------------------------------------------------------------------

function BackButton({
  onClick,
  label = 'Back to log in',
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={backButtonClasses}
    >
      <ArrowLeft
        className="h-[22px] w-[22px]"
        strokeWidth={1.8}
      />
    </button>
  );
}

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------

export default function ForgotPassword({
  initialEmail,
  onBack,
  onComplete,
}: ForgotPasswordProps) {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [stage, setStage] = useState<Stage>('request');

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] =
    useState('');

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  // ---------------------------------------------------------------------------
  // Request reset code
  // ---------------------------------------------------------------------------

  const requestCode = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError('Email is required.');
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError('Enter a valid email address.');
      return;
    }

    setEmailError('');
    setError('');
    setLoading(true);

    try {
      const { nextStep } = await sendPasswordResetCode(
        trimmedEmail,
      );

      if (
        nextStep.resetPasswordStep ===
        'CONFIRM_RESET_PASSWORD_WITH_CODE'
      ) {
        setStage('confirm');
      } else {
        setStage('done');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to send the reset code. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Complete password reset
  // ---------------------------------------------------------------------------

  const resetPassword = async () => {
    setError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // Verification code
    if (!code.trim()) {
      setError(
        'Enter the verification code from your email.',
      );
      return;
    }

    // New password
    if (!password) {
      setPasswordError('New password is required.');
      return;
    }

    if (!isStrongPassword(password)) {
      setPasswordError(
        formatMissingPasswordError(password),
      );
      return;
    }

    // Confirm password
    if (!confirmPassword) {
      setConfirmPasswordError(
        'Please confirm your new password.',
      );
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError(
        'Passwords do not match.',
      );
      return;
    }

    setLoading(true);

    try {
      await completePasswordReset(
        email.trim(),
        code.trim(),
        password,
      );

      setStage('done');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to reset your password. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Success
  // ---------------------------------------------------------------------------

  if (stage === 'done') {
    return (
      <div
        className="
          relative
          min-h-[100dvh]
          overflow-hidden
          bg-[#131F24]
          text-white
        "
      >
        <BackButton onClick={onComplete} />

        {/* Background */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            fixed
            inset-0
            bg-[radial-gradient(
              ellipse_at_50%_35%,
              #082B40_0%,
              #041C2B_42%,
              #03131E_82%
            )]
          "
        />

        <main
          className="
            relative
            flex
            min-h-[100dvh]
            items-center
            justify-center
            px-5
            py-24
            sm:px-6
          "
        >
          <div
            className="
              flex
              w-full
              max-w-[450px]
              flex-col
              items-center
              text-center
            "
          >
            {/* Logo */}
            <Link
              to="/"
              aria-label="Grokit home"
              className="
                mb-7
                flex
                h-[58px]
                w-[150px]
                items-center
                justify-center
                overflow-hidden
              "
            >
              <GrokitLogo
                size={150}
                className="
                  !h-auto
                  !w-[150px]
                  !max-w-none
                  object-contain
                "
              />
            </Link>

            {/* Success icon */}
            <div
              className="
                mb-5
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-full
                border
                border-emerald-400/20
                bg-emerald-400/10
              "
            >
              <CheckCircle2
                className="h-7 w-7 text-emerald-400"
                strokeWidth={2}
              />
            </div>

            <h1
              className="
                font-display
                text-[32px]
                font-extrabold
                leading-[1.1]
                tracking-tight
                text-white
                sm:text-[36px]
              "
            >
              Password updated
            </h1>

            <p
              className="
                mt-3
                max-w-[400px]
                font-sans
                text-[15px]
                leading-relaxed
                text-[#9DB1BC]
                sm:text-[16px]
              "
            >
              Your password has been changed successfully.
              You can now sign in with your new password.
            </p>

            <button
              type="button"
              onClick={onComplete}
              className={`${primaryButtonClasses} mt-7`}
            >
              <span>Back to log in</span>

              <ArrowRight
                className="h-[18px] w-[18px]"
                strokeWidth={2}
              />
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Request / confirmation
  // ---------------------------------------------------------------------------

  const isRequest = stage === 'request';

  return (
    <div
      className="
        relative
        min-h-[100dvh]
        overflow-hidden
        bg-[#131F24]
        text-white
      "
    >
      {/* Background */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          fixed
          inset-0
          bg-[radial-gradient(
            ellipse_at_50%_35%,
            #082B40_0%,
            #041C2B_42%,
            #03131E_82%
          )]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          fixed
          left-1/2
          top-[36%]
          h-[320px]
          w-[440px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-[#0A5577]/10
          blur-[110px]
        "
      />

      {/* Back */}
      <BackButton onClick={onBack} />

      <main
        className="
          relative
          flex
          min-h-[100dvh]
          items-center
          justify-center
          px-5
          pb-10
          pt-24
          sm:px-6
          sm:pt-28
        "
      >
        <div
          className="
            flex
            w-full
            max-w-[560px]
            flex-col
            items-center
          "
        >
          {/* Logo */}
          <Link
            to="/"
            aria-label="Grokit home"
            className="
              mb-7
              flex
              h-[60px]
              w-[150px]
              items-center
              justify-center
              overflow-hidden
              sm:mb-8
            "
          >
            <GrokitLogo
              size={150}
              className="
                !h-auto
                !w-[150px]
                !max-w-none
                object-contain
              "
            />
          </Link>

          {/* Heading */}
          <h1
            className="
              text-center
              font-display
              text-[32px]
              font-extrabold
              leading-[1.1]
              tracking-[-0.02em]
              text-white
              sm:text-[38px]
              md:text-[40px]
            "
          >
            {isRequest
              ? 'Forgot your password?'
              : 'Create a new password'}
          </h1>

          <p
            className="
              mt-3
              max-w-[540px]
              text-center
              font-sans
              text-[16px]
              leading-[1.55]
              text-[#AABCC6]
              sm:text-[18px]
            "
          >
            {isRequest ? (
              <>
                No worries. Enter your email and we’ll send
                <br className="hidden sm:block" />
                you a code to reset your password.
              </>
            ) : (
              <>
                We sent a code to{' '}
                <span className="font-semibold text-[#D6E0E5]">
                  {email}
                </span>
                .
                <br className="hidden sm:block" />
                Enter the code below and choose a new password.
              </>
            )}
          </p>

          {/* ===================================================================
              REQUEST CODE
              =================================================================== */}

          {isRequest ? (
            <div className="mt-9 w-full sm:mt-10">
              <input
                type="email"
                name="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setEmailError('');
                  setError('');
                }}
                placeholder="Email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                disabled={loading}
                aria-invalid={Boolean(emailError)}
                className={`
                  ${emailInputClasses}
                  ${
                    emailError
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-[#3A4D55] focus:border-orange'
                  }
                `}
              />

              <ErrorMessage
                message={emailError}
                className="mt-2"
              />

              <ErrorMessage
                message={error}
                className="mt-3"
              />

              <button
                type="button"
                onClick={requestCode}
                disabled={loading}
                className={`${primaryButtonClasses} mt-6`}
              >
                <span>
                  {loading ? 'Sending code...' : 'Send code'}
                </span>

                {!loading && (
                  <ArrowRight
                    className="h-[20px] w-[20px]"
                    strokeWidth={2}
                  />
                )}
              </button>

              <p
                className="
                  mt-7
                  text-center
                  font-sans
                  text-[15px]
                  text-[#9DB1BC]
                  sm:text-[16px]
                "
              >
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={onBack}
                  className="
                    font-extrabold
                    text-orange
                    transition-colors
                    hover:text-[#FF8A3D]
                    hover:underline
                  "
                >
                  Log in
                </button>
              </p>
            </div>
          ) : (
            /* =================================================================
               CREATE NEW PASSWORD
               ================================================================= */

            <div className="mt-9 w-full sm:mt-10">
              {/* Verification code */}
              <input
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  setError('');
                }}
                placeholder="Verification code"
                inputMode="numeric"
                autoComplete="one-time-code"
                disabled={loading}
                aria-label="Verification code"
                className="
                  h-[56px]
                  w-full
                  rounded-full
                  border
                  border-[#3A4D55]
                  bg-[#202F35]
                  px-5
                  text-center
                  font-sans
                  text-[16px]
                  font-bold
                  tracking-[0.3em]
                  text-white
                  outline-none
                  transition-colors
                  placeholder:font-normal
                  placeholder:tracking-normal
                  placeholder:text-[#91A4AC]
                  focus:border-orange
                  disabled:opacity-50
                "
              />

              {/* New password */}
              <div className="mt-3">
                <PasswordField
                  name="new-password"
                  value={password}
                  onChange={(value) => {
                    setPassword(value);
                    setPasswordError('');
                    setError('');

                    // Clear mismatch when the passwords become equal.
                    if (
                      confirmPassword &&
                      value === confirmPassword
                    ) {
                      setConfirmPasswordError('');
                    }
                  }}
                  placeholder="New password"
                  autoComplete="new-password"
                  error={Boolean(passwordError)}
                  disabled={loading}
                />
              </div>

              <ErrorMessage
                message={passwordError}
                className="mt-2"
              />

              {/* Confirm password */}
              <div className="mt-3">
                <PasswordField
                  name="confirm-new-password"
                  value={confirmPassword}
                  onChange={(value) => {
                    setConfirmPassword(value);
                    setConfirmPasswordError('');
                    setError('');

                    // Give immediate mismatch feedback.
                    if (
                      value &&
                      password &&
                      value !== password
                    ) {
                      setConfirmPasswordError(
                        'Passwords do not match.',
                      );
                    }
                  }}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  error={Boolean(confirmPasswordError)}
                  disabled={loading}
                />
              </div>

              <ErrorMessage
                message={confirmPasswordError}
                className="mt-2"
              />

              {/* Small helper note */}
              <p
                className="
                  mt-3
                  text-center
                  font-sans
                  text-[12px]
                  leading-relaxed
                  text-[#71858E]
                "
              >
                Make sure both password fields match.
              </p>

              <ErrorMessage
                message={error}
                className="mt-3"
              />

              {/* Reset button */}
              <button
                type="button"
                onClick={resetPassword}
                disabled={loading}
                className={`${primaryButtonClasses} mt-6`}
              >
                <span>
                  {loading
                    ? 'Updating password...'
                    : 'Reset password'}
                </span>

                {!loading && (
                  <ArrowRight
                    className="h-[20px] w-[20px]"
                    strokeWidth={2}
                  />
                )}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}