export type Plan = 'free' | 'pro';

export interface PlanInfo {
  plan: Plan;
  isPro: boolean;
  /** True while the plan is still being looked up (never, until payments exist). */
  loading: boolean;
}

const FREE_PLAN: PlanInfo = { plan: 'free', isPro: false, loading: false };

/**
 * The signed-in learner's plan.
 *
 * Everyone is on Free until payments exist. When the Subscription table is
 * added, read it here (with useCachedQuery) and return 'pro' for active
 * subscribers; ads, usage limits and the voice caps can all call this, so none
 * of them need to change.
 */
export function usePlan(): PlanInfo {
  return FREE_PLAN;
}