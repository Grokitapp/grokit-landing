import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, AtSign, Check, Loader2, RefreshCw, User } from 'lucide-react';

import {
  USERNAME_CHANGE_LIMIT,
  USERNAME_CHANGE_WINDOW_DAYS,
  USERNAME_MAX_LENGTH,
  USERNAME_RULES_SUMMARY,
  announceUsernameChanged,
  changeUsername,
  checkUsernameAvailability,
  NAME_MAX_LENGTH,
  getUsernameChangeStatus,
  updateDisplayName,
  updateLearningProfile,
  useAccountNames,
  useProfileRecord,
  validateDisplayName,
  validateUsername,
} from '../../lib/profile';
import {
  COMPREHENSION_MAX_SELECTIONS,
  COMPREHENSION_OPTIONS,
  INTEREST_MAX_SELECTIONS,
  INTEREST_OPTIONS,
  MOTIVATION_MAX_SELECTIONS,
  MOTIVATION_OPTIONS,
  OUTCOME_MAX_SELECTIONS,
  OUTCOME_OPTIONS,
  STARTING_PREFERENCE_OPTIONS,
  TIME_OPTIONS,
} from '../onboarding/constants';
import { PillOption } from '../onboarding/shared';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type MaybeStrings = readonly (string | null)[] | null | undefined;

export interface EditableProfile {
  id: string;
  username?: string | null;
  usernameChangedAt?: MaybeStrings;
  motivations?: MaybeStrings;
  interests?: MaybeStrings;
  startingPreference?: string | null;
  comprehensionPreferences?: MaybeStrings;
  desiredOutcomes?: MaybeStrings;
  timeCommitment?: string | null;
}

const toStrings = (value: MaybeStrings): string[] =>
  (value ?? []).filter((item): item is string => typeof item === 'string');

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const primaryButtonClasses =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange px-5 text-sm font-extrabold text-white shadow-[0_3px_0_#C94713] transition hover:brightness-110 active:translate-y-0.5 active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-[#19282E] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none';

const secondaryButtonClasses =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#37464F] px-4 text-sm font-bold text-[#C8D3DA] transition hover:border-[#536871] hover:bg-[#26373E] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange disabled:pointer-events-none disabled:opacity-50';

const inputClasses =
  'min-w-0 flex-1 bg-transparent py-3 text-[15px] font-semibold text-white outline-none placeholder:text-[#60757E] disabled:cursor-not-allowed disabled:opacity-60';

const sectionTitleClasses = 'font-display text-lg font-extrabold text-white';

const formatDateTime = (date: Date) =>
  date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

// -----------------------------------------------------------------------------
// Name
// -----------------------------------------------------------------------------

function NameSection() {
  // Cached, so the saved name is already there when this page opens.
  const { data: account, loading } = useAccountNames();
  const current = account?.fullName ?? '';

  // null = the learner hasn't typed anything; show the saved name.
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value = draft ?? current;
  const validation = validateDisplayName(value);
  const normalized = validation.ok ? validation.name : value.trim();
  const dirty = draft !== null && normalized !== current;
  const canSave = !loading && !saving && dirty && validation.ok;

  const message =
    error ?? (dirty && value.trim() && !validation.ok ? validation.message : null);

  const save = async () => {
    if (!canSave) return;

    setSaving(true);
    setError(null);

    try {
      await updateDisplayName(value);

      setDraft(null);
      setSaved(true);
    } catch (caught) {
      console.error('[EditProfile] Name update failed:', caught);
      setError('We couldn’t save your name right now. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="name-title">
      <h3 id="name-title" className={sectionTitleClasses}>
        Name
      </h3>

      <div className="mt-3 flex items-center gap-2 rounded-xl border-2 border-[#37464F] bg-[#131F24] px-4 transition-colors focus-within:border-orange/60">
        <User className="h-4 w-4 shrink-0 text-[#60757E]" aria-hidden="true" />

        <input
          value={value}
          onChange={(event) => {
            setDraft(event.target.value);
            setSaved(false);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void save();
            }
          }}
          disabled={loading || saving}
          maxLength={NAME_MAX_LENGTH + 1}
          placeholder="Your name"
          aria-label="Name"
          aria-invalid={Boolean(message)}
          autoComplete="name"
          className={inputClasses}
        />
      </div>

      {message && (
        <p role="alert" className="mt-2 text-xs font-semibold text-red-300">
          {message}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={() => void save()} disabled={!canSave} className={primaryButtonClasses}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Save name
        </button>

        {saved && !dirty && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300" role="status">
            <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
            Name saved
          </span>
        )}
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Username
// -----------------------------------------------------------------------------

type UsernameCheck =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'same' }
  | { kind: 'ok' }
  | { kind: 'unknown' }
  | { kind: 'error'; message: string };

function UsernameSection({
  profile,
  onSaved,
}: {
  profile: EditableProfile;
  onSaved: () => void | Promise<void>;
}) {
  const [current, setCurrent] = useState(profile.username?.trim() || '');
  const [draft, setDraft] = useState(current);
  const [check, setCheck] = useState<UsernameCheck>({ kind: 'idle' });
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [limits, setLimits] = useState(() => {
    const status = getUsernameChangeStatus(toStrings(profile.usernameChangedAt));

    return { remaining: status.remaining, nextAt: status.nextAvailableAt };
  });

  const hasUsername = current.length > 0;
  const locked = hasUsername && limits.remaining === 0;

  // Live feedback: format rules locally, availability from the server.
  useEffect(() => {
    setConfirming(false);
    setSaved(false);
    setError(null);

    if (!draft.trim()) {
      setCheck({ kind: 'idle' });
      return;
    }

    const validation = validateUsername(draft);

    if (!validation.ok) {
      setCheck({ kind: 'error', message: validation.message });
      return;
    }

    if (validation.handle === current) {
      setCheck({ kind: 'same' });
      return;
    }

    let cancelled = false;
    setCheck({ kind: 'checking' });

    const timer = window.setTimeout(async () => {
      try {
        const result = await checkUsernameAvailability(draft);

        if (cancelled) return;

        setCheck(
          result.code === 'AVAILABLE' || result.code === 'UNCHANGED'
            ? { kind: 'ok' }
            : {
                kind: 'error',
                message: result.message ?? 'That username isn’t available.',
              },
        );
      } catch {
        // The server makes the final call when saving.
        if (!cancelled) setCheck({ kind: 'unknown' });
      }
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [draft, current]);

  const canSave =
    !saving &&
    !locked &&
    (check.kind === 'ok' || check.kind === 'unknown');

  const save = async () => {
    if (!canSave) return;

    setSaving(true);
    setError(null);

    try {
      const result = await changeUsername(profile.id, draft);

      if (result.ok && result.username) {
        setCurrent(result.username);
        setDraft(result.username);
        setConfirming(false);
        setSaved(true);

        setLimits({
          remaining: result.changesRemaining ?? USERNAME_CHANGE_LIMIT,
          nextAt: result.nextChangeAt ? new Date(result.nextChangeAt) : null,
        });

        announceUsernameChanged(result.username);
        await onSaved();
        return;
      }

      if (result.code === 'RATE_LIMITED') {
        setLimits({
          remaining: 0,
          nextAt: result.nextChangeAt ? new Date(result.nextChangeAt) : null,
        });
      }

      setConfirming(false);
      setError(result.message ?? 'We couldn’t save that username. Please try again.');
    } catch (caught) {
      console.error('[EditProfile] Username change failed:', caught);
      setConfirming(false);
      setError('We couldn’t save your username right now. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClick = () => {
    // Changing an existing username uses up one of the limited changes,
    // so ask first. The first username is free and saves straight away.
    if (hasUsername) setConfirming(true);
    else void save();
  };

  // One short note: the format rules until a username exists, then the change limit.
  const hint = (() => {
    if (!hasUsername) return USERNAME_RULES_SUMMARY;

    if (locked) {
      return limits.nextAt
        ? `No changes left. You can change it again on ${formatDateTime(limits.nextAt)}.`
        : 'No changes left for now.';
    }

    return `${limits.remaining} of ${USERNAME_CHANGE_LIMIT} changes left every ${USERNAME_CHANGE_WINDOW_DAYS} days.`;
  })();

  return (
    <section aria-labelledby="username-title">
      <h3 id="username-title" className={sectionTitleClasses}>
        Username
      </h3>

      <div
        className={`mt-3 flex items-center gap-2 rounded-xl border-2 bg-[#131F24] px-4 transition-colors ${
          check.kind === 'error'
            ? 'border-red-400/60'
            : 'border-[#37464F] focus-within:border-orange/60'
        }`}
      >
        <AtSign className="h-4 w-4 shrink-0 text-[#60757E]" aria-hidden="true" />

        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              if (canSave && !confirming) handleSaveClick();
            }
          }}
          disabled={locked || saving}
          maxLength={USERNAME_MAX_LENGTH + 1}
          placeholder="Choose a username"
          aria-label="Username"
          aria-invalid={check.kind === 'error'}
          aria-describedby="username-hint username-status"
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          className={inputClasses}
        />

        <span className="flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden="true">
          {check.kind === 'checking' && (
            <Loader2 className="h-4 w-4 animate-spin text-[#91A4AC]" />
          )}
          {check.kind === 'ok' && (
            <Check className="h-4 w-4 text-emerald-300" strokeWidth={3} />
          )}
        </span>
      </div>

      {(check.kind === 'error' || check.kind === 'ok' || error) && (
        <p id="username-status" role="status" className="mt-2 text-xs font-semibold">
          {check.kind === 'error' && <span className="text-red-300">{check.message}</span>}
          {check.kind === 'ok' && !error && (
            <span className="text-emerald-300">That username is available.</span>
          )}
          {error && <span className="block text-red-300">{error}</span>}
        </p>
      )}

      <p id="username-hint" className="mt-2 text-xs leading-5 text-[#78909A]">
        {hint}
      </p>

      {confirming ? (
        <div
          role="alertdialog"
          aria-label="Confirm username change"
          className="mt-4 rounded-xl border border-orange/30 bg-orange/[0.06] p-4"
        >
          <p className="text-sm font-bold text-white">
            Change your username to @{draft.trim().replace(/^@+/, '').toLowerCase()}?
          </p>
          <p className="mt-1 text-xs leading-5 text-[#A9BAC0]">
            This uses 1 of your {limits.remaining} remaining{' '}
            {limits.remaining === 1 ? 'change' : 'changes'}, and your old
            username becomes available to others.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => void save()} disabled={saving} className={primaryButtonClasses}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Yes, change it
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={saving} className={secondaryButtonClasses}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-3">
          <button type="button" onClick={handleSaveClick} disabled={!canSave} className={primaryButtonClasses}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {hasUsername ? 'Change username' : 'Save username'}
          </button>

          {saved && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300" role="status">
              <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
              Username saved
            </span>
          )}
        </div>
      )}
    </section>
  );
}

// -----------------------------------------------------------------------------
// Learning profile (the onboarding answers)
// -----------------------------------------------------------------------------

function QuestionCard({
  title,
  count,
  children,
}: {
  title: string;
  count?: ReactNode;
  children: ReactNode;
}) {
  const id = useId();

  return (
    <section
      aria-labelledby={id}
      className="rounded-2xl border-2 border-[#37464F] bg-[#19282E] p-5 sm:p-6"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3
          id={id}
          className="font-display text-base font-extrabold text-white sm:text-lg"
        >
          {title}
        </h3>
        {count}
      </div>

      <div className="mt-4">{children}</div>
    </section>
  );
}

function MultiField({
  title,
  options,
  max,
  selected,
  onChange,
}: {
  title: string;
  options: readonly string[];
  max: number;
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const builtIn = options.filter((option) => option !== 'Something else');
  const custom = selected.filter((item) => !options.includes(item));
  const atMax = selected.length >= max;

  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else if (!atMax) {
      onChange([...selected, option]);
    }
  };

  const addCustom = () => {
    const value = draft.trim();

    if (!value) return;

    const exists = [...builtIn, ...selected].some(
      (item) => item.toLowerCase() === value.toLowerCase(),
    );

    if (!exists && !atMax) onChange([...selected, value]);

    setDraft('');
  };

  return (
    <QuestionCard
      title={title}
      count={
        <span
          className={`shrink-0 text-xs font-bold ${atMax ? 'text-orange' : 'text-[#78909A]'}`}
        >
          {selected.length}/{max}
        </span>
      }
    >
      <div className="flex flex-wrap gap-2">
        {[...builtIn, ...custom].map((option) => (
          <PillOption
            key={option}
            label={option}
            selected={selected.includes(option)}
            onClick={() => toggle(option)}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addCustom();
            }
          }}
          maxLength={60}
          placeholder={atMax ? 'Remove one to add your own' : 'Something else? Add your own'}
          disabled={atMax}
          aria-label={`Add your own answer: ${title}`}
          className="min-w-0 flex-1 rounded-xl border border-[#34464E] bg-[#131F24] px-4 py-2.5 text-[13px] font-medium text-white outline-none placeholder:text-[#60757E] focus:border-[#60757E] disabled:opacity-50"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!draft.trim() || atMax}
          className="shrink-0 rounded-xl bg-[#30424A] px-4 py-2.5 text-[13px] font-extrabold text-[#D8E2E6] transition hover:bg-orange hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </QuestionCard>
  );
}

function SingleField({
  title,
  options,
  selected,
  onChange,
}: {
  title: string;
  options: readonly { id: string; label: string; description: string }[];
  selected: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <QuestionCard title={title}>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const isSelected = selected === option.id;

          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(option.id)}
              className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange ${
                isSelected
                  ? 'border-orange bg-orange/10'
                  : 'border-[#34464E] bg-[#202F35] hover:border-orange/40'
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-extrabold ${isSelected ? 'text-orange' : 'text-white'}`}>
                  {option.label}
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-[#91A4AC]">
                  {option.description}
                </span>
              </span>

              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  isSelected ? 'bg-orange' : 'border-2 border-[#60757E]'
                }`}
              >
                {isSelected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>
    </QuestionCard>
  );
}

interface LearningAnswers {
  motivations: string[];
  interests: string[];
  startingPreference: string | null;
  comprehensionPreferences: string[];
  desiredOutcomes: string[];
  timeCommitment: string | null;
}

function LearningSection({
  profile,
  onSaved,
}: {
  profile: EditableProfile;
  onSaved: () => void | Promise<void>;
}) {
  const initial = useMemo<LearningAnswers>(
    () => ({
      motivations: toStrings(profile.motivations),
      interests: toStrings(profile.interests),
      startingPreference: profile.startingPreference ?? null,
      comprehensionPreferences: toStrings(profile.comprehensionPreferences),
      desiredOutcomes: toStrings(profile.desiredOutcomes),
      timeCommitment: profile.timeCommitment ?? null,
    }),
    // Only the first snapshot matters; edits are tracked in `answers`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [baseline, setBaseline] = useState(initial);
  const [answers, setAnswers] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof LearningAnswers>(key: K, value: LearningAnswers[K]) => {
    setSaved(false);
    setError(null);
    setAnswers((current) => ({ ...current, [key]: value }));
  };

  const dirty = JSON.stringify(answers) !== JSON.stringify(baseline);

  const complete =
    answers.motivations.length > 0 &&
    answers.interests.length > 0 &&
    answers.startingPreference !== null &&
    answers.comprehensionPreferences.length > 0 &&
    answers.desiredOutcomes.length > 0 &&
    answers.timeCommitment !== null;

  // The "saved" confirmation fades out on its own.
  useEffect(() => {
    if (!saved) return;

    const timer = window.setTimeout(() => setSaved(false), 2500);

    return () => window.clearTimeout(timer);
  }, [saved]);

  const save = async () => {
    if (!dirty || !complete || saving) return;

    setSaving(true);
    setError(null);

    try {
      await updateLearningProfile({
        motivations: answers.motivations,
        interests: answers.interests,
        startingPreference: answers.startingPreference ?? undefined,
        comprehensionPreferences: answers.comprehensionPreferences,
        desiredOutcomes: answers.desiredOutcomes,
        timeCommitment: answers.timeCommitment ?? undefined,
      });

      setBaseline(answers);
      setSaved(true);
      await onSaved();
    } catch (caught) {
      console.error('[EditProfile] Saving learning profile failed:', caught);
      setError(
        navigator.onLine === false
          ? 'Please check your internet connection and try again.'
          : 'We couldn’t save your changes right now. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setAnswers(baseline);
    setSaved(false);
    setError(null);
  };

  const showBar = dirty || saved || Boolean(error);

  return (
    <section aria-labelledby="learning-title" className="pt-4">
      <div className="mb-4">
        <h2
          id="learning-title"
          className="font-display text-xl font-extrabold text-white sm:text-2xl"
        >
          Your learning profile
        </h2>
        <p className="mt-1 text-sm text-[#91A4AC]">
          Used to personalize new journeys. Existing journeys won’t change.
        </p>
      </div>

      <div className="space-y-4">
        <MultiField
          title="What brings you here?"
          options={MOTIVATION_OPTIONS}
          max={MOTIVATION_MAX_SELECTIONS}
          selected={answers.motivations}
          onChange={(next) => update('motivations', next)}
        />

        <MultiField
          title="What are you interested in?"
          options={INTEREST_OPTIONS}
          max={INTEREST_MAX_SELECTIONS}
          selected={answers.interests}
          onChange={(next) => update('interests', next)}
        />

        <SingleField
          title="How do you like to start?"
          options={STARTING_PREFERENCE_OPTIONS}
          selected={answers.startingPreference}
          onChange={(id) => update('startingPreference', id)}
        />

        <MultiField
          title="What helps you learn?"
          options={COMPREHENSION_OPTIONS}
          max={COMPREHENSION_MAX_SELECTIONS}
          selected={answers.comprehensionPreferences}
          onChange={(next) => update('comprehensionPreferences', next)}
        />

        <MultiField
          title="What makes learning worth it?"
          options={OUTCOME_OPTIONS}
          max={OUTCOME_MAX_SELECTIONS}
          selected={answers.desiredOutcomes}
          onChange={(next) => update('desiredOutcomes', next)}
        />

        <SingleField
          title="How much time do you have?"
          options={TIME_OPTIONS}
          selected={answers.timeCommitment}
          onChange={(id) => update('timeCommitment', id)}
        />
      </div>

      {showBar && (
        <div
          role="region"
          aria-label="Save changes"
          className="sticky bottom-4 z-10 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#37464F] bg-[#19282E]/95 px-4 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.45)] backdrop-blur"
        >
          <p
            role={error ? 'alert' : 'status'}
            className={`min-w-0 text-sm font-semibold ${
              error
                ? 'text-red-300'
                : saved && !dirty
                  ? 'text-emerald-300'
                  : 'text-[#C8D3DA]'
            }`}
          >
            {error ??
              (dirty
                ? complete
                  ? 'You have unsaved changes.'
                  : 'Pick at least one answer for every question.'
                : 'Changes saved.')}
          </p>

          {dirty && (
            <div className="flex items-center gap-2">
              <button type="button" onClick={discard} disabled={saving} className={secondaryButtonClasses}>
                Discard
              </button>

              <button
                type="button"
                onClick={() => void save()}
                disabled={!complete || saving}
                className={primaryButtonClasses}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Save changes
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

const cardClasses =
  'rounded-2xl border-2 border-[#37464F] bg-[#19282E] p-5 sm:p-7';

export default function EditProfile() {
  // Cached: reopening this page shows the last known profile immediately and
  // refreshes it quietly in the background.
  const { data: profile, loading, refresh } = useProfileRecord();

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[860px] px-4 py-6 sm:px-7 sm:py-10">
      <header className="mb-6 flex items-center gap-3">
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
            Edit profile
          </h1>
          <p className="mt-0.5 text-sm text-[#91A4AC]">
            Update your name, username and how Grokit personalizes your journeys.
          </p>
        </div>
      </header>

      {loading && (
        <div
          aria-busy="true"
          aria-label="Loading your profile"
          className="animate-pulse space-y-6"
        >
          <div className="h-36 rounded-2xl bg-[#19282E]" />
          <div className="h-44 rounded-2xl bg-[#19282E]" />
          <div className="h-72 rounded-2xl bg-[#19282E]" />
        </div>
      )}

      {!loading && !profile && (
        <section
          role="alert"
          className="flex flex-col items-center py-16 text-center"
        >
          <h2 className="font-display text-xl font-extrabold text-white">
            We couldn’t load your profile
          </h2>
          <p className="mt-2 text-sm text-[#91A4AC]">Please try again.</p>

          <button
            type="button"
            onClick={() => void refresh()}
            className={`${primaryButtonClasses} mt-6`}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        </section>
      )}

      {profile && (
        <div className="space-y-6">
          <div className={cardClasses}>
            <NameSection />
          </div>

          <div className={cardClasses}>
            <UsernameSection profile={profile} onSaved={refresh} />
          </div>

          <LearningSection profile={profile} onSaved={refresh} />
        </div>
      )}
    </div>
  );
}