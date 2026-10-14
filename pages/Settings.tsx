import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  deleteUser,
  fetchUserAttributes,
  signOut,
  updatePassword,
} from 'aws-amplify/auth';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Globe,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  Volume2,
  Wind,
} from 'lucide-react';

import { cardClasses } from './learn/components/GamificationCards';
import { resetGamification } from '../lib/gamification';
import {
  CONTENT_LANGUAGES,
  updateSettings,
  useSettings,
} from '../lib/settings';

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-[#131F24]';

const linkRowClasses = `flex items-center justify-between gap-3 px-5 py-4 text-[15px] font-extrabold text-white transition hover:bg-[#1F3037] ${focusRing}`;

const primaryButtonClasses =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange px-5 text-sm font-extrabold text-white shadow-[0_3px_0_#C94713] transition hover:brightness-110 active:translate-y-0.5 active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-[#19282E] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none';

const secondaryButtonClasses =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#37464F] px-4 text-sm font-bold text-[#C8D3DA] transition hover:border-[#536871] hover:bg-[#26373E] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange disabled:pointer-events-none disabled:opacity-50';

const fieldClasses =
  'w-full rounded-xl border-2 border-[#37464F] bg-[#131F24] px-4 py-3 text-[15px] font-semibold text-white outline-none transition-colors placeholder:text-[#60757E] focus:border-orange/60 disabled:opacity-60';

// -----------------------------------------------------------------------------
// Building blocks
// -----------------------------------------------------------------------------

function Section({
  id,
  title,
  hint,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-title`}>
      <h2
        id={`${id}-title`}
        className="font-display text-xl font-extrabold text-white sm:text-2xl"
      >
        {title}
      </h2>
      {hint && <p className="mt-1 text-sm text-[#91A4AC]">{hint}</p>}

      <div className={`${cardClasses} mt-4 divide-y divide-[#2D3C43] !p-0`}>
        {children}
      </div>
    </section>
  );
}

function Row({
  icon: Icon,
  title,
  description,
  control,
}: {
  icon?: typeof Globe;
  title: string;
  description?: string;
  control?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="flex min-w-0 items-start gap-3.5">
        {Icon && (
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#202F35] text-[#C8D3DA]"
          >
            <Icon className="h-5 w-5" />
          </span>
        )}

        <div className="min-w-0">
          <p className="text-[15px] font-extrabold text-white">{title}</p>
          {description && (
            <p className="mt-0.5 break-words text-sm leading-5 text-[#91A4AC]">
              {description}
            </p>
          )}
        </div>
      </div>

      {control && <div className="shrink-0">{control}</div>}
    </div>
  );
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-14 rounded-full border-2 transition-colors ${focusRing} ${
        checked ? 'border-[#C94713] bg-orange' : 'border-[#37464F] bg-[#202F35]'
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-[left] duration-150 ${
          checked ? 'left-[26px]' : 'left-0.5'
        }`}
      />
    </button>
  );
}

// -----------------------------------------------------------------------------
// Change password (email sign-in only)
// -----------------------------------------------------------------------------

function PasswordRow() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const close = () => {
    setOpen(false);
    setCurrent('');
    setNext('');
    setError('');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (busy) return;

    if (next.length < 8) {
      setError('Your new password needs at least 8 characters.');
      return;
    }

    if (next === current) {
      setError('Your new password must be different from the current one.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      await updatePassword({ oldPassword: current, newPassword: next });
      close();
      setDone(true);
    } catch (caught) {
      const name = (caught as { name?: string })?.name;

      setError(
        name === 'NotAuthorizedException'
          ? 'That current password isn’t right.'
          : name === 'InvalidPasswordException'
            ? 'That password doesn’t meet the requirements. Try a longer one with a mix of characters.'
            : name === 'LimitExceededException'
              ? 'Too many attempts. Please wait a bit and try again.'
              : 'We couldn’t change your password. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setDone(false);
            setOpen(true);
          }}
          className={`${linkRowClasses} w-full text-left`}
        >
          <span className="flex items-center gap-3.5">
            <KeyRound className="h-5 w-5 text-[#C8D3DA]" aria-hidden="true" />
            Change password
          </span>

          {done ? (
            <span
              role="status"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300"
            >
              <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
              Password updated
            </span>
          ) : (
            <ChevronRight className="h-4 w-4 text-[#78909A]" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-3 px-5 py-4">
      <p className="flex items-center gap-3.5 text-[15px] font-extrabold text-white">
        <KeyRound className="h-5 w-5 text-[#C8D3DA]" aria-hidden="true" />
        Change password
      </p>

      <input
        type="password"
        value={current}
        onChange={(event) => setCurrent(event.target.value)}
        autoComplete="current-password"
        placeholder="Current password"
        aria-label="Current password"
        disabled={busy}
        className={fieldClasses}
      />

      <input
        type="password"
        value={next}
        onChange={(event) => setNext(event.target.value)}
        autoComplete="new-password"
        placeholder="New password"
        aria-label="New password"
        disabled={busy}
        className={fieldClasses}
      />

      {error && (
        <p role="alert" className="text-xs font-semibold text-red-300">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy || !current || !next}
          className={primaryButtonClasses}
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Update password
        </button>

        <button
          type="button"
          onClick={close}
          disabled={busy}
          className={secondaryButtonClasses}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// -----------------------------------------------------------------------------
// Delete confirmation
// -----------------------------------------------------------------------------

function DeleteDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };

    window.addEventListener('keydown', onKey);

    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const ready = typed.trim() === 'DELETE';

  const confirm = async () => {
    if (!ready || busy) return;

    setBusy(true);
    setError('');

    try {
      await deleteUser();
      resetGamification();
      navigate('/', { replace: true });
    } catch (caught) {
      console.error('[settings] delete account failed:', caught);
      setError('We couldn’t delete your account. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      onClick={() => !busy && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl border-2 border-[#37464F] bg-[#19282E] p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="delete-title"
          className="font-display text-xl font-extrabold text-white"
        >
          Delete your account?
        </h2>

        <p className="mt-2 text-sm leading-6 text-[#C8D3DA]">
          This permanently deletes your login and can’t be undone. You won’t be
          able to sign in again with this account.
        </p>

        <label
          htmlFor="delete-confirm"
          className="mt-5 block text-sm font-bold text-[#C8D3DA]"
        >
          Type <span className="font-extrabold text-white">DELETE</span> to
          confirm
        </label>

        <input
          id="delete-confirm"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="DELETE"
          className={`${fieldClasses} mt-2`}
        />

        {error && (
          <p role="alert" className="mt-3 text-sm font-semibold text-[#FB7185]">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className={secondaryButtonClasses}
          >
            Keep my account
          </button>

          <button
            type="button"
            onClick={() => void confirm()}
            disabled={!ready || busy}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#E5365B] px-5 text-sm font-extrabold text-white shadow-[0_3px_0_#A8203F] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Delete forever
          </button>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default function Settings() {
  const navigate = useNavigate();
  const settings = useSettings();

  const [email, setEmail] = useState('');
  // Learners who signed in with Google have no Grokit password to change.
  const [usesGoogle, setUsesGoogle] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    let active = true;

    fetchUserAttributes()
      .then((attributes) => {
        if (!active) return;

        setEmail(attributes.email ?? '');
        setUsesGoogle(Boolean((attributes as { identities?: string }).identities));
      })
      .catch(() => {
        // Informational only; the rest of the page still works.
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);

    try {
      await signOut();
      resetGamification();
      navigate('/', { replace: true });
    } catch (caught) {
      console.error('[settings] sign out failed:', caught);
      setSigningOut(false);
    }
  };

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[860px] px-4 py-6 sm:px-7 sm:py-10">
      <header className="mb-8 flex items-center gap-3">
        <Link
          to="/profile"
          aria-label="Back to profile"
          title="Back to profile"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#37464F] text-[#C8D3DA] transition hover:border-[#536871] hover:bg-[#26373E] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>

        <div className="min-w-0">
          <h1 className="font-display text-2xl font-extrabold text-white sm:text-3xl">
            Settings
          </h1>
          <p className="mt-0.5 text-sm text-[#91A4AC]">
            Your account and how Grokit behaves.
          </p>
        </div>
      </header>

      <div className="space-y-10">
        {/* Account */}
        <Section id="account" title="Account">
          <Row
            icon={Mail}
            title="Email"
            description={email || 'Loading…'}
          />

          <Row
            icon={ShieldCheck}
            title="Sign-in method"
            description={usesGoogle ? 'Google' : 'Email and password'}
          />

          {!usesGoogle && email && <PasswordRow />}

          <Link to="/profile/edit" className={linkRowClasses}>
            <span className="flex min-w-0 items-center gap-3.5">
              <UserRound className="h-5 w-5 shrink-0 text-[#C8D3DA]" aria-hidden="true" />
              <span className="min-w-0">
                Edit profile
                <span className="mt-0.5 block text-sm font-normal text-[#91A4AC]">
                  Name, username and your learning profile
                </span>
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-[#78909A]" aria-hidden="true" />
          </Link>
        </Section>

        {/* Lessons */}
        <Section id="lessons" title="Lessons">
          <Row
            icon={Globe}
            title="Lesson language"
            description="The language Grokit writes new lessons in."
            control={
              <select
                aria-label="Lesson language"
                value={settings.contentLanguage}
                onChange={(event) =>
                  updateSettings({ contentLanguage: event.target.value })
                }
                className={`h-11 max-w-[170px] rounded-xl border-2 border-[#37464F] bg-[#131F24] px-3 text-sm font-bold text-white ${focusRing}`}
              >
                {CONTENT_LANGUAGES.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            }
          />
        </Section>

        {/* Experience */}
        <Section id="experience" title="Experience">
          <Row
            icon={Volume2}
            title="Sound effects"
            description="Little sounds when you answer or finish a lesson."
            control={
              <Switch
                label="Sound effects"
                checked={settings.soundEffects}
                onChange={(soundEffects) => updateSettings({ soundEffects })}
              />
            }
          />

          <Row
            icon={Wind}
            title="Reduce motion"
            description="Turn off animations and transitions."
            control={
              <Switch
                label="Reduce motion"
                checked={settings.reduceMotion}
                onChange={(reduceMotion) => updateSettings({ reduceMotion })}
              />
            }
          />
        </Section>

        {/* About */}
        <Section id="about" title="About Grokit">
          <Link to="/privacy" className={linkRowClasses}>
            Privacy policy
            <ChevronRight className="h-4 w-4 text-[#78909A]" aria-hidden="true" />
          </Link>

          <Link to="/terms" className={linkRowClasses}>
            Terms of service
            <ChevronRight className="h-4 w-4 text-[#78909A]" aria-hidden="true" />
          </Link>

          <div className="flex items-center justify-between gap-3 px-5 py-4 text-sm">
            <span className="flex items-center gap-3.5 font-extrabold text-white">
              <Sparkles className="h-5 w-5 text-orange" aria-hidden="true" />
              Version
            </span>
            <span className="font-semibold text-[#91A4AC]">
              {import.meta.env.VITE_APP_VERSION ?? '1.0.0'}
            </span>
          </div>
        </Section>

        {/* Session + danger */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={signingOut}
            className={`${secondaryButtonClasses} w-full !min-h-12 !text-[15px]`}
          >
            {signingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="h-4 w-4" aria-hidden="true" />
            )}
            Sign out
          </button>

          <section
            aria-labelledby="danger-title"
            className="rounded-2xl border-2 border-[#E5365B]/40 bg-[#E5365B]/5 p-5"
          >
            <h2
              id="danger-title"
              className="font-display text-lg font-extrabold text-[#FB7185]"
            >
              Delete account
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#C8D3DA]">
              Permanently delete your account. This can’t be undone.
            </p>

            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-[#E5365B]/60 px-4 text-sm font-extrabold text-[#FB7185] transition hover:bg-[#E5365B]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FB7185]"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete my account
            </button>
          </section>
        </div>
      </div>

      {confirmingDelete && (
        <DeleteDialog onClose={() => setConfirmingDelete(false)} />
      )}
    </div>
  );
}