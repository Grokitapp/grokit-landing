import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { useCachedQuery } from './cache';
import {
  effectivePlan,
  isPlanId,
  type PlanId,
  type SubscriptionStatus,
} from '../amplify/functions/shared/plans';

export type Plan = PlanId;

export interface PlanInfo {
  /** The plan that applies right now: 'free' or 'pro'. */
  plan: PlanId;
  /** True on Pro. Pro learners never see ads. */
  isPro: boolean;
  /** True while the plan is still being looked up. */
  loading: boolean;
  status: SubscriptionStatus | null;
  interval: 'month' | 'year' | null;
  /** ISO time the current period (or trial) ends. Empty for manual or lifetime grants. */
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  onTrial: boolean;
}

interface SubscriptionInfo {
  plan: string | null;
  status: string | null;
  interval: string | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
}

/** Wrapped, because "no subscription row" (Free) is a normal answer, not a missing one. */
interface Loaded {
  row: SubscriptionInfo | null;
}

export const PLAN_CACHE_KEY = 'plan:subscription';

const client = generateClient<Schema>();

/** The learner's own Subscription row (they can only ever read their own). */
async function loadSubscription(): Promise<Loaded> {
  const { data, errors } = await client.models.Subscription.list({ authMode: 'userPool', limit: 5 });

  if (errors?.length) {
    console.error('[plan] Failed to load subscription:', errors);
    throw new Error('PLAN_LOAD_FAILED');
  }

  const row = data?.[0];

  return {
    row: row
      ? {
          plan: row.plan ?? null,
          status: row.status ?? null,
          interval: row.interval ?? null,
          currentPeriodEnd: row.currentPeriodEnd ?? null,
          trialEndsAt: row.trialEndsAt ?? null,
          cancelAtPeriodEnd: Boolean(row.cancelAtPeriodEnd),
        }
      : null,
  };
}

const FREE_PLAN: PlanInfo = {
  plan: 'free',
  isPro: false,
  loading: false,
  status: null,
  interval: null,
  currentPeriodEnd: null,
  trialEndsAt: null,
  cancelAtPeriodEnd: false,
  onTrial: false,
};

function toPlanInfo(row: SubscriptionInfo | null | undefined, loading: boolean): PlanInfo {
  if (!row) return { ...FREE_PLAN, loading };

  const plan = effectivePlan(row);

  return {
    plan,
    isPro: plan === 'pro',
    loading,
    status: (row.status as SubscriptionStatus | null) ?? null,
    interval: row.interval === 'month' || row.interval === 'year' ? row.interval : null,
    currentPeriodEnd: row.currentPeriodEnd,
    trialEndsAt: row.trialEndsAt,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    onTrial: plan !== 'free' && row.status === 'trialing',
  };
}

/**
 * The signed-in learner's plan, for showing things (ads, badges, the Upgrade
 * button). The limits themselves are enforced on the server from the same
 * table, so this can only ever change what is DISPLAYED.
 *
 * Uses the same effectivePlan() as the backend, so the screen and the
 * enforced limit cannot disagree. If the lookup fails the learner is shown as Free.
 */
export function usePlan(): PlanInfo {
  const query = useCachedQuery<Loaded>(PLAN_CACHE_KEY, loadSubscription, { staleMs: 60_000 });

  return toPlanInfo(query.data?.row, query.loading && query.data === undefined);
}

/** Same answer without a hook, for plain async code (e.g. checking a limit before a form). */
export async function loadPlan(): Promise<PlanId> {
  try {
    const { row } = await loadSubscription();
    const plan = row ? effectivePlan(row) : 'free';

    return isPlanId(plan) ? plan : 'free';
  } catch {
    return 'free';
  }
}
