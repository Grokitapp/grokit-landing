import {
  useEffect,
  useState,
} from 'react';

import {
  AnimatePresence,
  motion,
} from 'framer-motion';

import { ArrowLeft } from 'lucide-react';

import { useNavigate } from 'react-router';

import {
  GrokitMascot,
} from '../components/Grokitmascot';

import AuthScreen from './auth/AuthScreen';

import { getAuthenticatedUser } from './auth/authService';

import Welcome from './onboarding/Welcome';

import {
  getProfileWithRetry,
  saveProfile,
} from '../lib/profile';

import {
  BACK_STEP,
  DISCORD_INVITE_URL,
  PROGRESS_BY_STEP,
  STEP,
  type Step,
} from './onboarding/constants';

import {
  ProgressBar,
} from './onboarding/shared';

import {
  ComprehensionStep,
  CompleteStep,
  InterestsStep,
  MotivationStep,
  OutcomesStep,
  StartingPreferenceStep,
  TimeStep,
} from './onboarding/steps';

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function toStringArray(
  values:
    | readonly (string | null | undefined)[]
    | null
    | undefined,
): string[] {
  return (values ?? []).filter(
    (value): value is string =>
      typeof value === 'string',
  );
}

/**
 * Converts internal save failures into a safe,
 * user-facing message.
 *
 * Technical details are intentionally kept out
 * of the UI. The original error is still logged
 * to the browser console for debugging.
 */
function getSafeProfileSaveMessage(
  error: unknown,
): string {
  if (
    typeof navigator !== 'undefined' &&
    navigator.onLine === false
  ) {
    return 'Please check your internet connection and try again.';
  }

  if (
    error instanceof Error &&
    /timeout|network|fetch|connection/i.test(
      error.message,
    )
  ) {
    return 'Something went wrong while saving your profile. Please check your connection and try again.';
  }

  return 'We couldn’t save your learning profile right now. Please try again.';
}

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

export default function Onboarding() {
  const navigate = useNavigate();

  /* ------------------------------------------------------------------------ */
  /* Initialization                                                           */
  /* ------------------------------------------------------------------------ */

  const [initializing, setInitializing] =
    useState(true);

  const [step, setStep] = useState<Step>(
    STEP.AUTH,
  );

  /* ------------------------------------------------------------------------ */
  /* Learner profile                                                          */
  /* ------------------------------------------------------------------------ */

  const [motivations, setMotivations] =
    useState<string[]>([]);

  const [interests, setInterests] =
    useState<string[]>([]);

  const [startingPreference, setStartingPreference] =
    useState<string | null>(null);

  const [
    comprehensionPreferences,
    setComprehensionPreferences,
  ] = useState<string[]>([]);

  const [desiredOutcomes, setDesiredOutcomes] =
    useState<string[]>([]);

  const [timeCommitment, setTimeCommitment] =
    useState<string | null>(null);

  /* ------------------------------------------------------------------------ */
  /* UI state                                                                 */
  /* ------------------------------------------------------------------------ */

  const [isSavingProfile, setIsSavingProfile] =
    useState(false);

  const [savingError, setSavingError] =
    useState<string | null>(null);

  /* ------------------------------------------------------------------------ */
  /* Initial authentication + profile load                                    */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        await getAuthenticatedUser();

        const profile =
          await getProfileWithRetry();

        if (!mounted) {
          return;
        }

        if (
          profile?.onboardingCompleted === true
        ) {
          navigate('/learn', {
            replace: true,
          });

          return;
        }

        setMotivations(
          toStringArray(profile?.motivations),
        );

        setInterests(
          toStringArray(profile?.interests),
        );

        setStartingPreference(
          profile?.startingPreference ?? null,
        );

        setComprehensionPreferences(
          toStringArray(
            profile?.comprehensionPreferences,
          ),
        );

        setDesiredOutcomes(
          toStringArray(
            profile?.desiredOutcomes,
          ),
        );

        setTimeCommitment(
          profile?.timeCommitment ?? null,
        );

        setStep(STEP.WELCOME);
      } catch (error) {
        console.error(
          'Failed to initialize onboarding:',
          error,
        );

        if (mounted) {
          setStep(STEP.AUTH);
        }
      } finally {
        if (mounted) {
          setInitializing(false);
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  /* ------------------------------------------------------------------------ */
  /* Selection helpers                                                        */
  /* ------------------------------------------------------------------------ */

  const toggleMultiSelect = (
    selected: string[],
    value: string,
    maxSelections: number,
    setter: (
      value:
        | string[]
        | ((current: string[]) => string[]),
    ) => void,
  ) => {
    if (selected.includes(value)) {
      setter(
        selected.filter(
          (item) => item !== value,
        ),
      );

      return;
    }

    if (selected.length >= maxSelections) {
      return;
    }

    setter([
      ...selected,
      value,
    ]);
  };

  /* ------------------------------------------------------------------------ */
  /* Question validation                                                      */
  /* ------------------------------------------------------------------------ */

  const canContinue =
    step === STEP.MOTIVATION
      ? motivations.length > 0
      : step === STEP.INTERESTS
        ? interests.length > 0
        : step === STEP.STARTING_PREFERENCE
          ? startingPreference !== null
          : step === STEP.COMPREHENSION
            ? comprehensionPreferences.length > 0
            : step === STEP.OUTCOMES
              ? desiredOutcomes.length > 0
              : step === STEP.TIME
                ? timeCommitment !== null
                : true;

  /* ------------------------------------------------------------------------ */
  /* Navigation                                                               */
  /* ------------------------------------------------------------------------ */

  const goBack = () => {
    const previousStep = BACK_STEP[step];

    if (previousStep !== undefined) {
      setStep(previousStep);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Save final profile                                                       */
  /* ------------------------------------------------------------------------ */

  const completeOnboarding = async () => {
    if (isSavingProfile) {
      return;
    }

    setIsSavingProfile(true);
    setSavingError(null);

    try {
      const savedProfile = await saveProfile({
        motivations,
        interests,
        startingPreference:
          startingPreference ?? undefined,
        comprehensionPreferences,
        desiredOutcomes,
        timeCommitment:
          timeCommitment ?? undefined,
        onboardingCompleted: true,
      });

      /*
       * A successful mutation should contain the
       * created/updated profile.
       *
       * We intentionally do NOT call getProfileWithRetry()
       * here. A read immediately after a successful write
       * can temporarily return stale data and incorrectly
       * make a successful save look like a failure.
       */
      if (!savedProfile?.data) {
        console.error(
          'Learning profile save returned no profile:',
          savedProfile?.errors,
        );

        throw new Error(
          'PROFILE_SAVE_FAILED',
        );
      }

      /*
       * Save succeeded.
       * Go directly to the learning experience.
       */
      navigate('/learn', {
        replace: true,
      });
    } catch (error) {
      /*
       * Keep the real technical error available
       * for development/debugging only.
       */
      console.error(
        'Failed to save learning profile:',
        error,
      );

      /*
       * Only show a safe, understandable message
       * to the user.
       */
      setSavingError(
        getSafeProfileSaveMessage(error),
      );

      setIsSavingProfile(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Render individual step                                                  */
  /* ------------------------------------------------------------------------ */

  const renderStep = () => {
    switch (step) {
      /* -------------------------------------------------------------------- */
      /* AUTH                                                                 */
      /* -------------------------------------------------------------------- */

      case STEP.AUTH:
        return (
          <AuthScreen
            onAuthenticated={async () => {
              const profile =
                await getProfileWithRetry();

              if (
                profile?.onboardingCompleted ===
                true
              ) {
                navigate('/learn', {
                  replace: true,
                });

                return;
              }

              setStep(STEP.WELCOME);
            }}
          />
        );

      /* -------------------------------------------------------------------- */
      /* WELCOME                                                              */
      /* -------------------------------------------------------------------- */

      case STEP.WELCOME:
        return (
          <Welcome
            onContinue={() =>
              setStep(STEP.MOTIVATION)
            }
            discordInviteUrl={
              DISCORD_INVITE_URL
            }
          />
        );

      /* -------------------------------------------------------------------- */
      /* Q1 — MOTIVATION                                                      */
      /* -------------------------------------------------------------------- */

      case STEP.MOTIVATION:
        return (
          <MotivationStep
            selected={motivations}
            onToggle={(value: string) =>
              toggleMultiSelect(
                motivations,
                value,
                3,
                setMotivations,
              )
            }
            canContinue={canContinue}
            onContinue={() =>
              setStep(STEP.INTERESTS)
            }
          />
        );

      /* -------------------------------------------------------------------- */
      /* Q2 — INTERESTS                                                       */
      /* -------------------------------------------------------------------- */

      case STEP.INTERESTS:
        return (
          <InterestsStep
            selected={interests}
            onToggle={(value: string) =>
              toggleMultiSelect(
                interests,
                value,
                3,
                setInterests,
              )
            }
            canContinue={canContinue}
            onContinue={() =>
              setStep(
                STEP.STARTING_PREFERENCE,
              )
            }
          />
        );

      /* -------------------------------------------------------------------- */
      /* Q3 — STARTING PREFERENCE                                             */
      /* -------------------------------------------------------------------- */

      case STEP.STARTING_PREFERENCE:
        return (
          <StartingPreferenceStep
            selected={startingPreference}
            onSelect={
              setStartingPreference
            }
            canContinue={canContinue}
            onContinue={() =>
              setStep(STEP.COMPREHENSION)
            }
          />
        );

      /* -------------------------------------------------------------------- */
      /* Q4 — COMPREHENSION                                                   */
      /* -------------------------------------------------------------------- */

      case STEP.COMPREHENSION:
        return (
          <ComprehensionStep
            selected={
              comprehensionPreferences
            }
            onToggle={(value: string) =>
              toggleMultiSelect(
                comprehensionPreferences,
                value,
                4,
                setComprehensionPreferences,
              )
            }
            canContinue={canContinue}
            onContinue={() =>
              setStep(STEP.OUTCOMES)
            }
          />
        );

      /* -------------------------------------------------------------------- */
      /* Q5 — OUTCOMES                                                        */
      /* -------------------------------------------------------------------- */

      case STEP.OUTCOMES:
        return (
          <OutcomesStep
            selected={desiredOutcomes}
            onToggle={(value: string) =>
              toggleMultiSelect(
                desiredOutcomes,
                value,
                3,
                setDesiredOutcomes,
              )
            }
            canContinue={canContinue}
            onContinue={() =>
              setStep(STEP.TIME)
            }
          />
        );

      /* -------------------------------------------------------------------- */
      /* Q6 — TIME                                                            */
      /* -------------------------------------------------------------------- */

      case STEP.TIME:
        return (
          <TimeStep
            selected={timeCommitment}
            onSelect={setTimeCommitment}
            canContinue={canContinue}
            onContinue={() =>
              setStep(STEP.COMPLETE)
            }
          />
        );

      /* -------------------------------------------------------------------- */
      /* COMPLETE                                                             */
      /* -------------------------------------------------------------------- */

      case STEP.COMPLETE:
        return (
          <CompleteStep
            isSaving={isSavingProfile}
            error={savingError}
            onContinue={completeOnboarding}
          />
        );

      default:
        return null;
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Initialization screen                                                   */
  /* ------------------------------------------------------------------------ */

  if (initializing) {
    return (
      <div className="
        flex min-h-screen items-center
        justify-center bg-[#131F24]
      ">
        <div className="
          flex flex-col items-center gap-5
        ">
          <GrokitMascot
            pose="thinking"
            size={120}
          />

          <div className="flex gap-1">
            {[0, 1, 2].map((index) => (
              <motion.span
                key={index}
                className="
                  h-2 w-2 rounded-full bg-orange
                "
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.6,
                  delay: index * 0.2,
                }}
              />
            ))}
          </div>

          <p className="
            text-lg font-semibold text-[#91A4AC]
          ">
            Preparing your learning space...
          </p>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Back button + progress                                                  */
  /* ------------------------------------------------------------------------ */

  const previousStep = BACK_STEP[step];

  const progressPosition =
    PROGRESS_BY_STEP[step];

  const showNavigation =
    previousStep !== undefined;

  /* ------------------------------------------------------------------------ */
  /* Page                                                                     */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="
      flex h-[100dvh] min-h-[100dvh]
      flex-col overflow-hidden
      bg-[#131F24] text-white
    ">
      {showNavigation && (
        <>
          {/* Back button keeps the existing visual. */}
          <div className="
            relative z-30 w-full shrink-0
            bg-[#131F24]
            px-5 pb-1 pt-4
            sm:px-6 sm:pt-5
          ">
            <button
              type="button"
              onClick={goBack}
              className="
                -ml-2 shrink-0 rounded-full p-2
                text-[#91A4AC]
                transition-colors
                hover:bg-white/5
                hover:text-white
              "
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>

          {progressPosition !== undefined && (
            <ProgressBar
              value={progressPosition}
            />
          )}
        </>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{
            opacity: 0,
            x: 20,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          exit={{
            opacity: 0,
            x: -20,
          }}
          transition={{
            duration: 0.15,
            ease: 'easeOut',
          }}
          className="
            flex min-h-0 flex-1 flex-col
            overflow-hidden bg-[#131F24]
          "
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}