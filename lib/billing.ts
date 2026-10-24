import type { PlanId } from '../amplify/functions/shared/plans';

/**
 * Switch to true once the payment webhook is deployed (Stage C). Until then the
 * pricing page shows "Coming soon" on the paid plans, and plans are granted by
 * hand with scripts/grant-plan.mjs for testing.
 */
export const CHECKOUT_ENABLED = false;

export type BillingInterval = 'month' | 'year';

export type Currency = 'USD' | 'INR';

/**
 * Starts checkout for a plan. Stage C fills this in: Razorpay (UPI autopay) for
 * INR, Stripe or a merchant of record for USD. It will return the hosted
 * checkout address and the pricing page will send the learner there.
 */
export async function startCheckout(
  _plan: Exclude<PlanId, 'free'>,
  _interval: BillingInterval,
  _currency: Currency,
): Promise<string> {
  throw new Error('CHECKOUT_NOT_READY');
}
