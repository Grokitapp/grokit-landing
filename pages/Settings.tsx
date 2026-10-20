import { useEffect, useState, type SubmitEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { deleteUser, fetchUserAttributes, updatePassword } from 'aws-amplify/auth';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Gauge,
  Globe,
  Headphones,
  KeyRound,
  Languages,
  Loader2,
  LogOut,
  Mail,
  Mic,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Volume2,
} from 'lucide-react';

import { cardClasses } from './learn/components/GamificationCards';
import { signOutUser } from './auth/authService';
import { resetGamification } from '../lib/gamification';
import {
  APP_LANGUAGES,
  CONTENT_LANGUAGES,
  PRICING_ENABLED,
  USAGE_GROUPS,
  USAGE_LABELS,
  formatReset,
  hasUsageLimits,
  useUsage,
  type UsageItem,
  updateSettings,
  useSettings,
} from '../lib/settings';
import { playSound } from '../lib/sounds';
import { useReadAloud, useReadAloudUsage } from '../lib/readAloud';
import {
  DEVICE_VOICE_ID,
  READ_ALOUD_VOICES,
  charactersToMinutes,
} from '../amplify/functions/shared/voices';

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-[#131F24]';

const linkRowClasses = `flex items-center justify-between gap-3 px-5 py-4 text-[15px] font-extrabold text-white transition ${focusRing}`;

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

function UsageMeter({
  label,
  item,
}: {
  label: string;
  item: UsageItem;
}) {
  const { used, limit, period } = item;
  const reset = formatReset(item.resetsAt, item.timeZone);

  // No limit is enforced for this item yet: show the real count, no bar.
  if (limit === null) {
    return (
      <div className="flex items-start justify-between gap-4 px-5 py-4">
        <div className="min-w-0">
          <p className="text-[15px] font-extrabold text-white">{label}</p>
          {reset && <p className="mt-0.5 text-xs text-[#91A4AC]">{reset}</p>}
        </div>

        <p className="shrink-0 text-sm font-semibold text-[#C8D3DA]">
          <span className="font-display text-xl font-extrabold text-white">
            {used}
          </span>{' '}
          {period === 'day' ? 'today' : 'this month'}
        </p>
      </div>
    );
  }

  const percent =
    limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const full = limit > 0 && used >= limit;

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[15px] font-extrabold text-white">{label}</p>
          {reset && <p className="mt-0.5 text-xs text-[#91A4AC]">{reset}</p>}
        </div>

        <p className="shrink-0 text-sm font-semibold text-[#C8D3DA]">
          {used} of {limit} used {period === 'day' ? 'today' : 'this month'}
        </p>
      </div>

      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={Math.min(used, limit)}
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#2D3C43]"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${
            full ? 'bg-[#E5365B]' : 'bg-orange'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
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

function SelectControl({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={`h-11 max-w-[170px] rounded-xl border-2 border-[#37464F] bg-[#131F24] px-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

const toOptions = (values: ReadonlyArray<string>) =>
  values.map((value) => ({ value, label: value }));

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

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
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
// Sign-out confirmation
// -----------------------------------------------------------------------------

function SignOutDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const confirm = async () => {
    if (busy) return;

    setBusy(true);
    setError('');

    try {
      await signOutUser();
      resetGamification();
      navigate('/', { replace: true });
    } catch (caught) {
      console.error('[settings] sign out failed:', caught);
      setError('Unable to sign out right now. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="signout-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      onClick={() => !busy && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl border-2 border-[#37464F] bg-[#19282E] p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange/10 text-orange">
          <LogOut className="h-5 w-5" aria-hidden="true" />
        </div>

        <h2
          id="signout-title"
          className="mt-5 font-display text-xl font-extrabold text-white"
        >
          Are you sure you want to sign out?
        </h2>

        <p className="mt-2 text-sm leading-6 text-[#C8D3DA]">
          You’ll need to sign in again to continue learning with Grokit.
        </p>

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
            Cancel
          </button>

          <button
            type="button"
            onClick={() => void confirm()}
            disabled={busy}
            className={primaryButtonClasses}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Signing out...
              </>
            ) : (
              <>
                Sign out
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
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
  const settings = useSettings();
  const voicePreview = useReadAloud();
  const readAloudUsage = useReadAloudUsage();

  const [email, setEmail] = useState('');
  const [usesGoogle, setUsesGoogle] = useState(false);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const { data: usage, error: usageError, refresh: refreshUsage } = useUsage();

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
        <Section id="account" title="Account">
          <Row icon={Mail} title="Email" description={email || 'Loading…'} />
          <Row
            icon={ShieldCheck}
            title="Sign-in method"
            description={usesGoogle ? 'Google' : 'Email and password'}
          />
          {!usesGoogle && email && <PasswordRow />}
        </Section>

        <Section id="preferences" title="Preferences">
          <Row
            icon={Languages}
            title="App language"
            description="The language used for buttons, navigation and settings. More languages are coming soon."
            control={
              <SelectControl
                label="App language"
                value={settings.appLanguage}
                onChange={(appLanguage) => updateSettings({ appLanguage })}
                options={toOptions(APP_LANGUAGES)}
                disabled={APP_LANGUAGES.length < 2}
              />
            }
          />

          <Row
            icon={Globe}
            title="Content language"
            description="The language used for generated lessons. More languages are coming soon."
            control={
              <SelectControl
                label="Content language"
                value={settings.contentLanguage}
                onChange={(contentLanguage) => updateSettings({ contentLanguage })}
                options={toOptions(CONTENT_LANGUAGES)}
                disabled={CONTENT_LANGUAGES.length < 2}
              />
            }
          />
        </Section>

        <Section
          id="usage"
          title="Usage"
          hint={
            hasUsageLimits()
              ? 'Keep track of your limits.'
              : 'What you’ve done today and this month.'
          }
        >
          {usage ? (
            <>
              <UsageMeter
                label={USAGE_LABELS.lessonsTaken}
                item={usage.items.lessonsTaken}
              />
              <UsageMeter
                label={USAGE_LABELS.coursesCreated}
                item={usage.items.coursesCreated}
              />
              <UsageMeter
                label={USAGE_LABELS.lessonsGenerated}
                item={usage.items.lessonsGenerated}
              />
            </>
          ) : usageError ? (
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <p role="alert" className="text-sm font-semibold text-[#FB7185]">
                We couldn’t load your usage.
              </p>
              <button
                type="button"
                onClick={() => void refreshUsage()}
                className={secondaryButtonClasses}
              >
                Try again
              </button>
            </div>
          ) : (
            <p className="px-5 py-4 text-sm text-[#91A4AC]">Loading usage…</p>
          )}

          <div className="px-5 py-4">
            <Link
              to="/settings/usage"
              className={`${secondaryButtonClasses} w-full uppercase tracking-wider`}
            >
              View all usage
            </Link>
          </div>
        </Section>

        <Section id="experience" title="Experience">
          <Row
            icon={Volume2}
            title="Sound effects"
            description="Little sounds when you answer or finish a lesson."
            control={
              <Switch
                label="Sound effects"
                checked={settings.soundEffects}
                onChange={(soundEffects) => {
                  updateSettings({ soundEffects });

                  // A short preview, so the learner hears what they just turned on.
                  if (soundEffects) playSound('correct');
                }}
              />
            }
          />
          <Row
            icon={Headphones}
            title="Auto read aloud"
            description="Read each lesson card out loud as you move through a lesson."
            control={
              <Switch
                label="Auto read aloud"
                checked={settings.autoReadAloud}
                onChange={(autoReadAloud) => updateSettings({ autoReadAloud })}
              />
            }
          />
          <Row
            icon={Mic}
            title="Reading voice"
            description="Natural voices need an internet connection. The device voice works offline but sounds robotic."
            control={
              <div className="flex items-center gap-2">
                <SelectControl
                  label="Reading voice"
                  value={settings.readAloudVoice}
                  onChange={(readAloudVoice) => {
                    updateSettings({ readAloudVoice });

                    // Play a short sample so the learner hears the voice they just picked.
                    voicePreview.preview(readAloudVoice);
                  }}
                  options={[
                    ...READ_ALOUD_VOICES.map((voice) => ({ value: voice.id, label: voice.label })),
                    { value: DEVICE_VOICE_ID, label: 'Device voice (free)' },
                  ]}
                />
                <button
                  type="button"
                  onClick={() =>
                    voicePreview.status === 'idle'
                      ? voicePreview.preview(settings.readAloudVoice)
                      : voicePreview.stop()
                  }
                  aria-label={voicePreview.status === 'idle' ? 'Preview voice' : 'Stop preview'}
                  className={`${secondaryButtonClasses} !min-h-11 !px-3`}
                >
                  {voicePreview.status === 'loading' ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : voicePreview.status === 'speaking' ? (
                    'Stop'
                  ) : (
                    'Preview'
                  )}
                </button>
              </div>
            }
          />
          {settings.readAloudVoice !== DEVICE_VOICE_ID && readAloudUsage.usedCharacters !== null && (
            <Row
              icon={Headphones}
              title="Natural voice today"
              description="Replaying something you've already heard is free. When today's listening runs out, the device voice takes over until midnight."
              control={
                <span className="text-sm font-extrabold text-white">
                  {Math.min(
                    charactersToMinutes(readAloudUsage.usedCharacters),
                    charactersToMinutes(readAloudUsage.limitCharacters),
                  )}{' '}
                  / {charactersToMinutes(readAloudUsage.limitCharacters)} min
                </span>
              }
            />
          )}
          <Row
            icon={Gauge}
            title="Reading speed"
            description="How fast read aloud speaks."
            control={
              <SelectControl
                label="Reading speed"
                value={String(settings.readAloudSpeed)}
                onChange={(value) => updateSettings({ readAloudSpeed: Number(value) })}
                options={[
                  { value: '0.85', label: 'Slow' },
                  { value: '1', label: 'Normal' },
                  { value: '1.2', label: 'Fast' },
                ]}
              />
            }
          />
        </Section>

        <Section id="about" title="About Grokit">
          <Link to="/privacy" state={{ from: '/settings' }} className={linkRowClasses}>
            Privacy policy
            <ChevronRight className="h-4 w-4 text-[#78909A]" aria-hidden="true" />
          </Link>

          <Link to="/terms" state={{ from: '/settings' }} className={linkRowClasses}>
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

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setConfirmingSignOut(true)}
            className={`${secondaryButtonClasses} w-full !min-h-12 !text-[15px]`}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
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

      {confirmingSignOut && (
        <SignOutDialog onClose={() => setConfirmingSignOut(false)} />
      )}

      {confirmingDelete && (
        <DeleteDialog onClose={() => setConfirmingDelete(false)} />
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Usage page (/settings/usage)
// -----------------------------------------------------------------------------

const UPGRADE_PATH = '/pricing';

export function Usage() {
  const navigate = useNavigate();
  const { data, loading, error, refresh } = useUsage();

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[860px] px-4 py-6 sm:px-7 sm:py-10">
      <Link
        to="/settings"
        className="mb-6 inline-flex items-center gap-2 rounded-lg text-sm font-bold text-[#91A4AC] transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Settings
      </Link>

      <header className="mb-8 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-extrabold text-white sm:text-3xl">
            Usage
          </h1>
          <p className="mt-1 text-sm text-[#91A4AC]">
            {hasUsageLimits()
              ? 'Keep track of your limits.'
              : 'What you’ve done today and this month.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#37464F] px-4 text-sm font-bold text-[#C8D3DA] transition hover:border-[#536871] hover:bg-[#26373E] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          )}
          Refresh
        </button>
      </header>

      {error && !data && (
        <p
          role="alert"
          className="rounded-2xl border-2 border-[#E5365B]/40 bg-[#E5365B]/5 p-5 text-sm font-semibold text-[#FB7185]"
        >
          We couldn’t load your usage. Please try refreshing.
        </p>
      )}

      {!data && loading && (
        <div
          className="flex justify-center py-16"
          role="status"
          aria-label="Loading usage"
        >
          <Loader2
            className="h-6 w-6 animate-spin text-[#91A4AC]"
            aria-hidden="true"
          />
        </div>
      )}

      {data && (
        <div className="space-y-8">
          {USAGE_GROUPS.map((group) => (
            <Section
              key={group.title}
              id={`usage-${group.title.toLowerCase()}`}
              title={group.title}
            >
              {group.keys.map((key) => (
                <UsageMeter
                  key={key}
                  label={USAGE_LABELS[key]}
                  item={data.items[key]}
                />
              ))}
            </Section>
          ))}

          {PRICING_ENABLED && data.plan === 'free' && (
            <section
              aria-labelledby="upgrade-title"
              className="flex flex-col gap-4 rounded-2xl border-2 border-orange/40 bg-orange/5 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <h2
                  id="upgrade-title"
                  className="font-display text-lg font-extrabold text-white"
                >
                  Get more with Pro
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#C8D3DA]">
                  Increase your daily and monthly learning and creation limits.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate(UPGRADE_PATH)}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-orange px-5 text-sm font-extrabold text-white shadow-[0_3px_0_#C94713] transition hover:brightness-110 active:translate-y-0.5 active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-[#131F24]"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Upgrade to Pro
              </button>
            </section>
          )}

          <p className="text-xs leading-5 text-[#78909A]">
            Counts update whenever you open this page. Daily counts reset at
            midnight and monthly counts on the 1st, in India Standard Time (IST).
          </p>
        </div>
      )}
    </div>
  );
}