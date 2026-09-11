import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { completePasswordReset, sendPasswordResetCode } from './authService';
import { isStrongPassword } from './password';
import PasswordField from './PasswordField';
import PasswordRequirements from './PasswordRequirements';

interface ForgotPasswordProps {
  initialEmail: string;
  onBack: () => void;
  onComplete: () => void;
}

export default function ForgotPassword({ initialEmail, onBack, onComplete }: ForgotPasswordProps) {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [stage, setStage] = useState<'request' | 'confirm' | 'done'>('request');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  const requestCode = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Email is required');
      return;
    }

    setEmailError('');
    setError('');
    setLoading(true);
    try {
      const { nextStep } = await sendPasswordResetCode(trimmedEmail);
      if (nextStep.resetPasswordStep === 'CONFIRM_RESET_PASSWORD_WITH_CODE') {
        setStage('confirm');
      } else {
        setStage('done');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send the reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!code.trim()) {
      setError('Enter the verification code from your email.');
      return;
    }
    if (!isStrongPassword(password)) {
      setPasswordError('Choose a password that meets all the requirements below.');
      return;
    }

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

  if (stage === 'done') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-7 h-7 text-green-600" />
          </div>
          <h1 className="font-display text-3xl text-ink font-extrabold mb-2">Password updated</h1>
          <p className="text-body font-sans text-sm mb-8">Your password has been changed successfully. You can now log in.</p>
          <button onClick={onComplete} className="btn-duo w-full px-6 py-3.5 text-base">Back to log in</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-sm">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-body hover:text-ink font-sans font-bold text-sm mb-7 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to log in
        </button>

        <h1 className="font-display text-3xl text-ink font-extrabold mb-2">Forgot your password?</h1>
        <p className="text-body font-sans text-sm mb-7">
          {stage === 'request'
            ? "Enter your email and we'll send you a verification code."
            : 'Enter the code from your email and choose a new password.'}
        </p>

        {stage === 'request' ? (
          <>
            <input
              type="email"
              value={email}
              onChange={(event) => { setEmail(event.target.value); setEmailError(''); }}
              placeholder="Email"
              autoComplete="email"
              className={`w-full px-4 py-3 bg-surface-alt border rounded-xl text-ink font-sans placeholder:text-muted focus:outline-none transition-colors ${emailError ? 'border-red-500' : 'border-line focus:border-orange'}`}
            />
            {emailError && (
              <p className="flex items-center gap-1.5 text-sm text-red-600 font-sans font-semibold mt-1.5">
                <AlertCircle className="w-4 h-4" />
                {emailError}
              </p>
            )}
            {error && <p className="text-sm text-red-600 font-sans font-semibold mt-3">{error}</p>}
            <button onClick={requestCode} disabled={loading} className="btn-duo w-full px-6 py-3.5 text-base disabled:opacity-40 mt-5">
              {loading ? 'Sending...' : 'Send code'}
            </button>
          </>
        ) : (
          <>
            <input
              value={code}
              onChange={(event) => { setCode(event.target.value); setError(''); }}
              placeholder="Verification code"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="w-full text-center tracking-widest px-4 py-3 bg-surface-alt border border-line rounded-xl text-ink font-sans font-bold placeholder:text-muted placeholder:tracking-normal placeholder:font-normal focus:outline-none focus:border-orange transition-colors mb-3"
            />
            <PasswordField
              value={password}
              onChange={(value) => { setPassword(value); setPasswordError(''); }}
              placeholder="New password"
              autoComplete="new-password"
              error={Boolean(passwordError)}
            />
            <PasswordRequirements password={password} />
            {passwordError && <p className="text-sm text-red-600 font-sans font-semibold mt-2">{passwordError}</p>}
            {error && <p className="text-sm text-red-600 font-sans font-semibold mt-3">{error}</p>}
            <button onClick={resetPassword} disabled={loading} className="btn-duo w-full px-6 py-3.5 text-base disabled:opacity-40 mt-5">
              {loading ? 'Updating...' : 'Reset password'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
