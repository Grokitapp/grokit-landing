import { Link } from 'react-router';
import { Sparkles } from 'lucide-react';

import { PRICING_PATH } from '../../../lib/ads';
import { usePlan } from '../../../lib/plan';

/**
 * The "Upgrade · Learn without limits" button for the bottom of the left
 * sidebar, just above the account row. Shown to Free learners only.
 */
export default function UpgradeCard() {
  const { isPro, loading } = usePlan();

  if (loading || isPro) return null;

  return (
    <Link
      to={PRICING_PATH}
      className="flex items-center gap-3 rounded-xl border border-[#5A3820] bg-[#2A1E16] px-3 py-3 transition hover:bg-[#33241A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
    >
      <Sparkles className="h-5 w-5 shrink-0 text-orange" aria-hidden="true" />

      <span className="min-w-0">
        <span className="block text-sm font-extrabold text-orange">Upgrade</span>
        <span className="block truncate text-xs font-semibold text-[#C9A68A]">Learn without limits</span>
      </span>
    </Link>
  );
}
