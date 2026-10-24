/**
 * The Grokit plans: Free and Pro. The single source of truth for prices,
 * limits and the feature lists on the pricing page.
 *
 * NO imports on purpose: the Lambda functions enforce these numbers and the
 * browser shows them, so what /pricing promises is exactly what is checked.
 *
 * To change a price or a limit, change it here and nowhere else.
 *
 * A Max plan is deliberately NOT here yet. With limits a person can really use,
 * Max would only sell extra listening and extra journeys, which is a weak
 * reason to pay twice as much. Add it back (a new PlanId, a new PLANS entry,
 * and "max" in the checks in usage-limits.ts) once PDF sources or tutor chat
 * exist and paying users ask for more.
 *
 * How the limits are set: from what a human can actually do. A lesson takes
 * about 15 minutes, and natural voice plays at about 900 characters a minute.
 *   - Free: 7 lessons a day is about 1.5 to 2 hours of learning. An engaged
 *     learner reaches it in a real session, which is the moment to offer Pro.
 *   - Pro: 20 lessons a day is about 5 hours, more than anyone studies in a
 *     day. It is a "never think about limits" plan, not a bigger-numbers plan.
 *   - Journeys: a journey is about 29 lessons, so nobody finishes more than a
 *     handful a month: 3 on Free, 10 on Pro.
 *
 * How the prices are set: below Duolingo Super (about 13 a month, 85 a year)
 * and Wondering Pro (14.99 a month, 107.99 a year), because Grokit is a new
 * name. Round, easy to remember, and yearly (the real offer, about 7 months
 * of monthly) is shown first. India is priced near the regional median for
 * apps, GST included.
 *
 * Cost check: your plan's typical Pro learner costs about 2 dollars a month,
 * so a yearly payer (about 5.80 a month before fees) leaves a margin. A
 * learner who hit every cap every day would cost about 10 dollars, almost all
 * of it natural voice; replays of audio that already exists are free.
 */

export type PlanId = 'free' | 'pro';

export const PLAN_IDS: readonly PlanId[] = ['free', 'pro'];

export const isPlanId = (value: unknown): value is PlanId => value === 'free' || value === 'pro';

export interface PlanLimits {
  /** New lessons written by the AI per day (IST). */
  lessonsPerDay: number;
  /** New journeys per calendar month (IST). Imports from Explore do not count. */
  journeysPerMonth: number;
  /** New natural-voice characters per day. */
  voiceCharsPerDay: number;
  /**
   * New natural-voice characters per month, per learner. null = Free, which
   * draws on the shared monthly pool instead (see READ_ALOUD_MONTHLY_POOL_CHARACTERS).
   */
  voiceCharsPerMonth: number | null;
}

export interface PlanPrice {
  monthly: number;
  yearly: number;
}

export interface PlanDef {
  id: PlanId;
  name: string;
  tagline: string;
  /** International price in US dollars. */
  usd: PlanPrice;
  /** India price in rupees, GST included. */
  inr: PlanPrice;
  /** Free trial length in days (0 = no trial). */
  trialDays: number;
  limits: PlanLimits;
  /** Shown under "Everything in <previous plan> and:". */
  features: string[];
}

/** Speech runs at roughly 900 characters a minute. Only for friendly numbers. */
const minutes = (characters: number): number => Math.round(characters / 900);
const hours = (characters: number): number => Math.round(minutes(characters) / 60);

const FREE_LIMITS: PlanLimits = {
  lessonsPerDay: 7,
  journeysPerMonth: 3,
  voiceCharsPerDay: 20_000,
  voiceCharsPerMonth: null,
};

const PRO_LIMITS: PlanLimits = {
  lessonsPerDay: 20,
  journeysPerMonth: 10,
  voiceCharsPerDay: 40_000,
  voiceCharsPerMonth: 500_000,
};

export const PLANS: Record<PlanId, PlanDef> = {
  free: {
    id: 'free',
    name: 'Free',
    tagline: 'Learn anything, every day',
    usd: { monthly: 0, yearly: 0 },
    inr: { monthly: 0, yearly: 0 },
    trialDays: 0,
    limits: FREE_LIMITS,
    features: [
      `${FREE_LIMITS.lessonsPerDay} new AI-written lessons a day`,
      `${FREE_LIMITS.journeysPerMonth} new journeys a month`,
      `About ${minutes(FREE_LIMITS.voiceCharsPerDay)} minutes of natural voice a day`,
      'Unlimited device voice read-aloud',
      'Streaks, XP, leagues and badges',
      'Import journeys from Explore',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'For daily learners: limits never get in the way',
    usd: { monthly: 9.99, yearly: 69.99 },
    inr: { monthly: 299, yearly: 1999 },
    trialDays: 14,
    limits: PRO_LIMITS,
    features: [
      'No ads',
      `${PRO_LIMITS.lessonsPerDay} new AI-written lessons a day`,
      `${PRO_LIMITS.journeysPerMonth} new journeys a month`,
      `About ${minutes(PRO_LIMITS.voiceCharsPerDay)} minutes of natural voice a day`,
      `Up to ${hours(PRO_LIMITS.voiceCharsPerMonth ?? 0)} hours of natural voice a month`,
      'Your own voice allowance, never shared with free learners',
    ],
  },
};

/** The plan above this one, or null when there is nothing above it. */
export const nextPlan = (plan: PlanId): PlanId | null => (plan === 'free' ? 'pro' : null);

/** Percent saved by paying yearly instead of twelve months (rounded down). */
export const yearlySavingPercent = (price: PlanPrice): number =>
  price.monthly > 0 ? Math.floor((1 - price.yearly / (price.monthly * 12)) * 100) : 0;

// -----------------------------------------------------------------------------
// Which plan a learner is on right now
// -----------------------------------------------------------------------------

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';

/** The fields of a Subscription row that decide the plan. */
export interface SubscriptionLike {
  plan?: string | null;
  status?: string | null;
  currentPeriodEnd?: string | null;
}

/**
 * A late renewal webhook, or a card that needs a retry, should not drop a
 * paying learner to Free the same minute. They keep their plan this long.
 */
const GRACE_MS = 3 * 24 * 3600 * 1000;

/**
 * The plan that applies now. The browser and the backend both call this, so
 * the badge on screen and the limit that is enforced can never disagree.
 *
 *   - no row, or Free, or an unknown plan name: free
 *   - active / trialing: paid until the period ends (plus a short grace);
 *     no end date means "until changed" (used for lifetime and manual grants)
 *   - past_due: paid for the grace period after the period ended
 *   - canceled: paid until the period they already paid for ends
 *   - anything else: free
 */
export function effectivePlan(row: SubscriptionLike | null | undefined, now: Date = new Date()): PlanId {
  if (!row || !isPlanId(row.plan) || row.plan === 'free') return 'free';

  const end = row.currentPeriodEnd ? Date.parse(row.currentPeriodEnd) : Number.NaN;
  const hasEnd = !Number.isNaN(end);
  const t = now.getTime();

  switch (row.status) {
    case 'active':
    case 'trialing':
      return !hasEnd || t < end + GRACE_MS ? row.plan : 'free';
    case 'past_due':
      return hasEnd && t < end + GRACE_MS ? row.plan : 'free';
    case 'canceled':
      return hasEnd && t < end ? row.plan : 'free';
    default:
      return 'free';
  }
}
