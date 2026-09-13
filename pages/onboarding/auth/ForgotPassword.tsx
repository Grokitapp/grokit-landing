import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { completePasswordReset, sendPasswordResetCode } from './authService';
import { GrokitLogo } from '../../../components/Grokitlogo';
import { getMissingPasswordRequirements, isStrongPassword } from './password';
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
  if (missing.length === 1) return `Add ${missing[0]} to your new password.`;
  if (missing.length === 2) return `Add ${missing[0]} and ${missing[1]} to your new password.`;
  return `Add ${missing.slice(0, -1).join(', ')}, and ${missing[missing.length - 1]} to your new password.`;
};

// ─── Shared styles ────────────────────────────────────────────────────────────

const errorTextClasses = 'text-sm text-red-600 font-sans font-semibold';
const backButtonClasses = 'inline-flex items-center gap-2 text-body hover:text-ink font-sans font-bold text-sm transition-colors';
const inputBaseClasses = 'w-full h-16 px-5 sm:px-6 bg-surface-alt border-2 rounded-2xl text-ink font-sans text-base sm:text-lg placeholder:text-muted focus:outline-none transition-colors';
const primaryButtonClasses = 'btn-duo w-full px-6 py-4 text-base sm:text-lg disabled:opacity-40';

// ─── Reusable components ─────────────────────────────────────────────────────

function ErrorMessage({ message, withIcon = false, className = '' }: { message: string; withIcon?: boolean; className?: string }) {
  if (!message) return null;
  return (
    <p className={`${errorTextClasses} ${withIcon ? 'flex items-center gap-2' : ''} ${className}`}>
      {withIcon && <AlertCircle className="w-4 h-4 shrink-0" />}
      {message}
    </p>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={backButtonClasses}>
      <ArrowLeft className="w-5 h-5" />
      Back to log in
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ForgotPassword({ initialEmail, onBack, onComplete }: ForgotPasswordProps) {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [stage, setStage] = useState<Stage>('request');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  const requestCode = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return setEmailError('Email is required.');
    if (!EMAIL_REGEX.test(trimmedEmail)) return setEmailError('Enter a valid email address.');

    setEmailError('');
    setError('');
    setLoading(true);

    try {
      const { nextStep } = await sendPasswordResetCode(trimmedEmail);
      setStage(nextStep.resetPasswordStep === 'CONFIRM_RESET_PASSWORD_WITH_CODE' ? 'confirm' : 'done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send the reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!code.trim()) return setError('Enter the verification code from your email.');
    if (!password) return setPasswordError('New password is required.');
    if (!isStrongPassword(password)) return setPasswordError(formatMissingPasswordError(password));

    setPasswordError('');
    setError('');
    setLoading(true);

    try {
      await completePasswordReset(email.trim(), code.trim(), password);
      setStage('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset your password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Success view ─────────────────────────────────────────────────────── */

  if (stage === 'done') {
    return (
      <div className="flex-1 flex flex-col px-5 sm:px-8 py-8 sm:py-12">
        <div className="w-full max-w-5xl mx-auto">
          <BackButton onClick={onComplete} />
        </div>

        <div className="flex-1 flex items-center justify-center py-10">
          <div className="w-full max-w-2xl text-center">
            <div className="flex justify-center mb-8">
              <GrokitLogo size={124} className="text-ink" />
            </div>

            <div className="w-16 h-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>

            <h1 className="font-display text-4xl sm:text-5xl text-ink font-extrabold mb-3">
              Password updated
            </h1>

            <p className="text-body font-sans text-base sm:text-lg max-w-xl mx-auto mb-9">
              Your password has been changed successfully. You can now sign in with your new password.
            </p>

            <button onClick={onComplete} className="btn-duo w-full max-w-xl mx-auto px-6 py-4 text-base sm:text-lg">
              Back to log in
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Request / Confirm views ──────────────────────────────────────────── */

  const isRequest = stage === 'request';

  return (
    <div className="flex-1 flex flex-col px-5 sm:px-8 py-8 sm:py-12">
      <div className="w-full max-w-5xl mx-auto">
        <BackButton onClick={onBack} />
      </div>

      <div className="flex-1 flex items-center justify-center py-8 sm:py-12">
        <div className="w-full max-w-2xl">
          <div className="flex justify-center mb-7">
            <GrokitLogo size={124} className="text-ink" />
          </div>

          <h1 className="font-display text-4xl sm:text-5xl text-ink font-extrabold text-center tracking-tight mb-3">
            {isRequest ? 'Forgot your password?' : 'Create a new password'}
          </h1>

          <p className="text-body font-sans text-base sm:text-lg text-center max-w-xl mx-auto mb-9">
            {isRequest
              ? "Enter your email and we'll send you a verification code."
              : `We sent a code to ${email}. Enter it below, then choose a new password.`}
          </p>

          {isRequest ? (
            <>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(''); setError(''); }}
                placeholder="Email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className={`
                  ${inputBaseClasses}
                  ${emailError ? 'border-red-500' : 'border-line focus:border-orange'}
                `}
              />
              <ErrorMessage message={emailError} withIcon className="mt-2" />
              <ErrorMessage message={error} className="mt-3" />
              <button onClick={requestCode} disabled={loading} className={`${primaryButtonClasses} mt-6`}>
                {loading ? 'Sending...' : 'Send verification code'}
              </button>
            </>
          ) : (
            <>
              <input
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(''); }}
                placeholder="Verification code"
                inputMode="numeric"
                autoComplete="one-time-code"
                className="
                  w-full h-16 text-center tracking-[0.35em] px-5 bg-surface-alt border-2 border-line
                  rounded-2xl text-ink font-sans text-lg font-bold placeholder:text-muted
                  placeholder:tracking-normal placeholder:font-normal focus:outline-none
                  focus:border-orange transition-colors mb-4
                "
              />

              <PasswordField
                name="new-password"
                value={password}
                onChange={(value) => { setPassword(value); setPasswordError(''); setError(''); }}
                placeholder="New password"
                autoComplete="new-password"
                error={Boolean(passwordError)}
              />

              <ErrorMessage message={passwordError} withIcon className="mt-2" />
              <ErrorMessage message={error} className="mt-3" />

              <button onClick={resetPassword} disabled={loading} className={`${primaryButtonClasses} mt-6`}>
                {loading ? 'Updating...' : 'Reset password'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}