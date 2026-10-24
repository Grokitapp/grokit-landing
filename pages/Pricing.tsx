import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Check, Leaf, Sprout } from 'lucide-react';

import {
  PLANS,
  PLAN_IDS,
  yearlySavingPercent,
  type PlanDef,
  type PlanId,
} from '../amplify/functions/shared/plans';
import { CHECKOUT_ENABLED, startCheckout, type BillingInterval, type Currency } from '../lib/billing';
import { usePlan } from '../lib/plan';

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const ICONS: Record<PlanId, typeof Leaf> = { free: Leaf, pro: Sprout };

/** India is priced in rupees (GST included); everyone else in dollars. Learners can switch. */
function guessCurrency(): Currency {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return zone === 'Asia/Kolkata' || zone === 'Asia/Calcutta' ? 'INR' : 'USD';
  } catch {
    return 'USD';
  }
}

function money(amount: number, currency: Currency): string {
  return currency === 'INR'
    ? `₹${Math.round(amount).toLocaleString('en-IN')}`
    : `$${amount.toFixed(2)}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '';

  const date = new Date(iso);

  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** What the big number shows, and the line under it. */
function priceFor(plan: PlanDef, interval: BillingInterval, currency: Currency) {
  const table = currency === 'INR' ? plan.inr : plan.usd;

  if (table.monthly === 0) return { big: money(0, currency), small: 'forever' };

  const perMonth = interval === 'year' ? table.yearly / 12 : table.monthly;
  const billed =
    interval === 'year'
      ? `billed yearly at ${money(table.yearly, currency)}`
      : 'billed monthly';

  return {
    big: money(perMonth, currency),
    small: `${currency} / month · ${billed}${currency === 'INR' ? ' (includes GST)' : ''}`,
  };
}

const buttonBase =
  'mt-5 flex min-h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-[#19282E]';

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default function Pricing() {
  const navigate = useNavigate();
  const current = usePlan();

  const [interval, setInterval] = useState<BillingInterval>('year'); // annual first
  const [currency, setCurrency] = useState<Currency>(guessCurrency);
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const choose = async (plan: Exclude<PlanId, 'free'>) => {
    setError(null);
    setBusy(plan);

    try {
      window.location.assign(await startCheckout(plan, interval, currency));
    } catch {
      setError('Checkout isn’t available yet. Please try again soon.');
      setBusy(null);
    }
  };

  const saving = Math.max(
    ...PLAN_IDS.map((id) => yearlySavingPercent(currency === 'INR' ? PLANS[id].inr : PLANS[id].usd)),
  );

  const renewal = formatDate(current.currentPeriodEnd);

  return (
    <div className="min-h-screen bg-[#131F24] text-white">
      <header className="flex items-center gap-3 border-b border-[#37464F] px-4 py-3">
        <button
          type="button"
          onClick={() => navigate(window.history.length > 1 ? -1 : '/learn')}
          aria-label="Go back"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-[#91A4AC] transition hover:bg-[#202F35] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <span className="font-bold">Upgrade</span>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-16 pt-10">
        <h1 className="text-center font-display text-3xl font-extrabold sm:text-4xl">
          Learn more, worry less
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-6 text-[#91A4AC]">
          Grokit is free to learn with. Pro removes the daily limits and the ads, and starts with a free trial.
        </p>

        {current.isPro && (
          <p role="status" className="mt-3 text-center text-sm text-[#91A4AC]">
            You’re on <strong className="text-white">{PLANS[current.plan].name}</strong>
            {current.onTrial && renewal ? ` (free trial until ${renewal})` : ''}
            {!current.onTrial && renewal
              ? current.cancelAtPeriodEnd
                ? `. Ends on ${renewal}.`
                : `. Renews on ${renewal}.`
              : '.'}
          </p>
        )}

        {/* Monthly / Yearly */}
        <div className="mt-8 flex justify-center">
          <div role="group" aria-label="Billing period" className="flex rounded-full bg-[#19282E] p-1">
            {(['month', 'year'] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={interval === value}
                onClick={() => setInterval(value)}
                className={`rounded-full px-5 py-2 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange ${
                  interval === value ? 'bg-[#2B3F48] text-white' : 'text-[#91A4AC] hover:text-white'
                }`}
              >
                {value === 'month' ? 'Monthly' : 'Yearly'}
                {value === 'year' && saving > 0 && (
                  <span className="ml-2 text-xs text-[#58CC02]">Save {saving}%</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {PLAN_IDS.map((id, index) => {
            const plan = PLANS[id];
            const Icon = ICONS[id];
            const price = priceFor(plan, interval, currency);
            const isCurrent = current.plan === id;
            const popular = id === 'pro';
            const previous = index > 0 ? PLANS[PLAN_IDS[index - 1]].name : null;

            return (
              <section
                key={id}
                aria-label={`${plan.name} plan`}
                className={`relative flex flex-col rounded-2xl border bg-[#19282E] p-6 ${
                  popular ? 'border-orange' : 'border-[#37464F]'
                }`}
              >
                {popular && (
                  <span className="absolute right-5 top-5 rounded-full bg-orange px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">
                    Most popular
                  </span>
                )}

                <Icon className="h-10 w-10 text-[#C9D6DB]" aria-hidden="true" />

                <h2 className="mt-5 font-display text-2xl font-extrabold">{plan.name}</h2>
                <p className="mt-1 text-sm text-[#91A4AC]">{plan.tagline}</p>

                <p className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-4xl font-extrabold">{price.big}</span>
                </p>
                <p className="mt-1 min-h-8 text-xs leading-4 text-[#91A4AC]">{price.small}</p>

                {id === 'free' ? (
                  <button type="button" disabled className={`${buttonBase} bg-[#2B3F48] text-[#C9D6DB]`}>
                    {current.plan === 'free' ? 'Your current plan' : 'Free plan'}
                  </button>
                ) : isCurrent ? (
                  <button type="button" disabled className={`${buttonBase} bg-[#2B3F48] text-[#C9D6DB]`}>
                    Your current plan
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!CHECKOUT_ENABLED || busy !== null}
                    onClick={() => void choose(id)}
                    className={`${buttonBase} ${
                      CHECKOUT_ENABLED
                        ? 'bg-white text-[#131F24] hover:bg-white/90'
                        : 'cursor-not-allowed bg-[#2B3F48] text-[#91A4AC]'
                    }`}
                  >
                    {!CHECKOUT_ENABLED
                      ? 'Coming soon'
                      : busy === id
                        ? 'Opening checkout…'
                        : plan.trialDays > 0 && current.plan === 'free'
                          ? `Start ${plan.trialDays}-day free trial`
                          : `Get ${plan.name} plan`}
                  </button>
                )}

                <p className="mt-2 text-center text-xs text-[#6F838C]">
                  {id === 'free'
                    ? 'No card needed'
                    : plan.trialDays > 0
                      ? `${plan.trialDays}-day free trial · Cancel anytime`
                      : 'No commitment · Cancel anytime'}
                </p>

                <div className="mt-6 border-t border-[#37464F] pt-5">
                  {previous && (
                    <p className="mb-3 text-sm font-bold">Everything in {previous} and:</p>
                  )}

                  <ul className="space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-3 text-sm leading-5 text-[#C9D6DB]">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#58CC02]" aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          })}
        </div>

        {error && (
          <p role="alert" className="mt-6 text-center text-sm font-semibold text-[#FF6B6B]">
            {error}
          </p>
        )}

        <p className="mt-10 text-center text-xs leading-5 text-[#6F838C]">
          Usage limits apply and reset at midnight India time. Lessons you’ve already opened are always yours to
          finish. Importing journeys from Explore never uses a journey slot.
          {currency === 'INR' ? ' Prices include GST.' : ''} Prices and plans may change.
          <br />
          <button
            type="button"
            onClick={() => setCurrency(currency === 'INR' ? 'USD' : 'INR')}
            className="mt-2 font-bold text-orange hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
          >
            Show prices in {currency === 'INR' ? 'US dollars' : 'Indian rupees'}
          </button>
        </p>
      </main>
    </div>
  );
}
