import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Award, Compass, Crown, Globe, Sparkles } from 'lucide-react';

import { SmartImage } from '../../../components/SmartImage';
import { useCachedQuery } from '../../../lib/cache';
import {
  AD_CAMPAIGNS_KEY,
  ADS_ENABLED,
  PRICING_PATH,
  PRO_AVAILABLE,
  loadSponsorAds,
  pickAd,
  trackAdEvent,
  type AdContext,
  type AdIcon,
  type AdItem,
  type AdTone,
} from '../../../lib/ads';
import { usePlan } from '../../../lib/plan';

// -----------------------------------------------------------------------------
// Look
// -----------------------------------------------------------------------------

const ICONS: Record<AdIcon, typeof Sparkles> = {
  compass: Compass,
  sparkles: Sparkles,
  globe: Globe,
  award: Award,
  crown: Crown,
};

// Same gradients as the streak and badge cards.
const TONES: Record<AdTone, { from: string; to: string }> = {
  orange: { from: '#FF8A3D', to: '#F4611F' },
  teal: { from: '#2DD4BF', to: '#0D9488' },
  violet: { from: '#C084FC', to: '#8B3FD9' },
  sky: { from: '#60C5FF', to: '#1D8FE1' },
};

const ctaClasses =
  'mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-extrabold text-[#131F24] transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#19282E]';

function Cta({
  ad,
  context,
  onClick,
}: {
  ad: AdItem;
  context: AdContext;
  onClick: () => void;
}) {
  // The publish promo opens this journey's publish screen.
  if (ad.id === 'house-publish' && context.courseId) {
    return (
      <Link
        to={`/learn/course/${context.courseId}`}
        state={{ openPublish: true }}
        onClick={onClick}
        className={ctaClasses}
      >
        {ad.cta.label}
      </Link>
    );
  }

  if (ad.cta.href) {
    return (
      <a
        href={ad.cta.href}
        onClick={onClick}
        target="_blank"
        rel="sponsored noopener noreferrer"
        className={ctaClasses}
      >
        {ad.cta.label}
      </a>
    );
  }

  if (ad.cta.to) {
    return (
      <Link to={ad.cta.to} state={ad.cta.state} onClick={onClick} className={ctaClasses}>
        {ad.cta.label}
      </Link>
    );
  }

  return null;
}

function AdLabel({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md bg-[#202F35] px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#91A4AC]">
      {children}
    </span>
  );
}

// -----------------------------------------------------------------------------
// Card
// -----------------------------------------------------------------------------

/**
 * A small ad for Free learners, for the gamification rail under the streak and
 * badge cards. Renders nothing for Pro learners or when ads are switched off.
 * Never put it in lessons, practice, summaries, onboarding, Create or Settings.
 */
export default function AdCard({ context = {} }: { context?: AdContext }) {
  const { isPro, loading } = usePlan();
  const sectionRef = useRef<HTMLElement>(null);

  // Sponsors come from the backend (cached for 5 minutes). If they can't be
  // loaded the card simply uses a house ad, so a failure never shows an error.
  const sponsors = useCachedQuery<AdItem[]>(AD_CAMPAIGNS_KEY, loadSponsorAds, {
    enabled: ADS_ENABLED && !isPro && !loading,
    staleMs: 5 * 60_000,
  });
  const sponsorsReady = !sponsors.loading;

  // Chosen once per visit, so it doesn't change while the page re-renders.
  const [ad, setAd] = useState<AdItem | null>(null);
  const chosen = useRef(false);
  const { courseId, canPublish } = context;

  useEffect(() => {
    if (chosen.current || isPro || loading || !sponsorsReady) return;

    chosen.current = true;
    setAd(pickAd({ courseId, canPublish }, sponsors.data ?? []));
  }, [isPro, loading, sponsorsReady, sponsors.data, courseId, canPublish]);

  // Counts one impression after at least half the card has been on screen for
  // a second while the tab is visible.
  useEffect(() => {
    const element = sectionRef.current;

    if (!ad || !element) return;

    let timer: number | undefined;
    let counted = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        window.clearTimeout(timer);

        if (!entry.isIntersecting || counted) return;

        timer = window.setTimeout(() => {
          if (document.visibilityState !== 'visible') return;

          counted = true;
          trackAdEvent(ad, 'impression');
          observer.disconnect();
        }, 1000);
      },
      { threshold: 0.5 },
    );

    observer.observe(element);

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [ad]);

  const [showNote, setShowNote] = useState(false);

  if (isPro || loading || !ad) return null;

  const tone = TONES[ad.tone];
  const Icon = ICONS[ad.icon];
  const sponsored = ad.kind === 'sponsor';

  return (
    <section
      ref={sectionRef}
      aria-label={sponsored ? 'Sponsored' : 'Advertisement'}
      className="rounded-2xl border border-[#37464F] bg-[#19282E] p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <AdLabel>{sponsored ? 'Sponsored' : 'Ad'}</AdLabel>

        {sponsored && ad.advertiser && (
          <span className="truncate text-xs font-semibold text-[#91A4AC]">
            {ad.advertiser}
          </span>
        )}
      </div>

      <div
        className="mt-3 overflow-hidden rounded-xl"
        style={{
          backgroundImage: `linear-gradient(135deg, ${tone.from}, ${tone.to})`,
        }}
      >
        {sponsored && ad.imageUrl && (
          <div className="h-28 w-full overflow-hidden bg-black/10">
            <SmartImage
              src={ad.imageUrl}
              alt=""
              className="h-full w-full object-cover"
              draggable={false}
            />
          </div>
        )}

        <div className="p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>

          <p className="mt-3 text-xs font-extrabold uppercase tracking-wider text-white/75">
            {ad.eyebrow}
          </p>

          <p className="mt-0.5 font-display text-xl font-extrabold leading-tight text-white">
            {ad.title}
          </p>

          <p className="mt-1.5 text-sm leading-5 text-white/90">{ad.body}</p>

          <Cta ad={ad} context={context} onClick={() => trackAdEvent(ad, 'click')} />
        </div>
      </div>

      {PRO_AVAILABLE ? (
        <Link
          to={PRICING_PATH}
          className="mt-3 block rounded-lg py-1.5 text-center text-xs font-extrabold uppercase tracking-wider text-orange hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
        >
          Remove ads
        </Link>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setShowNote((value) => !value)}
            aria-expanded={showNote}
            className="mt-3 block w-full rounded-lg py-1.5 text-center text-xs font-extrabold uppercase tracking-wider text-orange hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
          >
            Remove ads
          </button>

          {showNote && (
            <p role="status" className="mt-1 text-center text-xs leading-5 text-[#91A4AC]">
              Grokit Pro is coming soon, and it will remove ads.
            </p>
          )}
        </>
      )}
    </section>
  );
}