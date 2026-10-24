import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

// -----------------------------------------------------------------------------
// Ads shown to Free learners.
//
// Three kinds, in this order of preference:
//   1. Sponsors: AdCampaign records an admin sets to ACTIVE (paid, labelled).
//   2. House ads: Grokit's own promos, below (always available as a fallback).
//   3. A Google ad network: switched on only by ADSENSE_CLIENT_ID (see
//      GoogleAdSlot.tsx); off by default.
//
// Sponsors and house ads are first-party: no third-party scripts, no cookies.
// Pro learners never see any of them.
// -----------------------------------------------------------------------------

const client = generateClient<Schema>();

/** Master switch. Set to false to hide every ad without touching anything else. */
export const ADS_ENABLED = true;

/** /pricing exists, so "Remove ads" links there. (Checkout itself is switched on in lib/billing.ts.) */
export const PRO_AVAILABLE = true;

export const PRICING_PATH = '/pricing';

/** Share of visits that show a sponsor when one is available (0 to 1). */
const SPONSOR_SHARE = 0.6;

/**
 * Your Google AdSense publisher id ("ca-pub-1234567890123456"). Leave empty
 * until Google has approved the site and the crawler login is set up.
 */
export const ADSENSE_CLIENT_ID = '';

/** Cache key for the sponsor list (see AdCard). */
export const AD_CAMPAIGNS_KEY = 'ads:campaigns';

export type AdTone = 'orange' | 'teal' | 'violet' | 'sky';
export type AdIcon = 'compass' | 'sparkles' | 'globe' | 'award' | 'crown';

export interface AdCta {
  label: string;
  /** In-app destination. */
  to?: string;
  /** Router state for `to`. */
  state?: Record<string, unknown>;
  /** External destination (sponsors only; always https). */
  href?: string;
}

export interface AdItem {
  /** Campaign id for sponsors; a short name for house ads. */
  id: string;
  kind: 'house' | 'sponsor';
  tone: AdTone;
  icon: AdIcon;
  eyebrow: string;
  title: string;
  body: string;
  cta: AdCta;
  advertiser?: string;
  imageUrl?: string;
  /** Relative share between sponsors. */
  weight?: number;
  /** House ads only. */
  requiresPublish?: boolean;
  requiresPro?: boolean;
}

export const HOUSE_ADS: AdItem[] = [
  {
    id: 'explore',
    kind: 'house',
    tone: 'sky',
    icon: 'compass',
    eyebrow: 'Explore',
    title: 'Skip the setup',
    body: 'Browse journeys other learners made and import one in a tap.',
    cta: { label: 'Browse Explore', to: '/explore' },
  },
  {
    id: 'create',
    kind: 'house',
    tone: 'orange',
    icon: 'sparkles',
    eyebrow: 'Create',
    title: 'Learn anything',
    body: 'Type a topic and Grokit builds a journey matched to your level.',
    cta: { label: 'Create a journey', to: '/create' },
  },
  {
    id: 'badges',
    kind: 'house',
    tone: 'violet',
    icon: 'award',
    eyebrow: 'Badges',
    title: 'Collect them all',
    body: 'Keep your streak going and unlock every badge on your profile.',
    cta: { label: 'See my badges', to: '/profile' },
  },
  {
    id: 'publish',
    kind: 'house',
    tone: 'teal',
    icon: 'globe',
    eyebrow: 'Share',
    title: 'Publish your journey',
    body: 'Put this journey in Explore so others can learn it too.',
    cta: { label: 'Publish to Explore' }, // destination is filled in by the card
    requiresPublish: true,
  },
  {
    id: 'pro',
    kind: 'house',
    tone: 'orange',
    icon: 'crown',
    eyebrow: 'Grokit Pro',
    title: 'Learn without ads',
    body: 'More lessons, more journeys and more natural voice every day.',
    cta: { label: 'See Pro', to: PRICING_PATH },
    requiresPro: true,
  },
];

// -----------------------------------------------------------------------------
// Sponsors (AdCampaign records)
// -----------------------------------------------------------------------------

type Campaign = Schema['AdCampaign']['type'];

const TONES: readonly AdTone[] = ['orange', 'teal', 'violet', 'sky'];
const ICONS: readonly AdIcon[] = ['compass', 'sparkles', 'globe', 'award', 'crown'];

function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${now.getFullYear()}-${month}-${day}`;
}

function isLive(campaign: Campaign, today: string) {
  if (campaign.status !== 'ACTIVE') return false;
  if (campaign.placement && campaign.placement !== 'journey-rail') return false;
  if (campaign.startsAt && today < campaign.startsAt) return false;
  if (campaign.endsAt && today > campaign.endsAt) return false;

  // A sponsor link must be a real https address.
  return /^https:\/\//i.test(campaign.ctaUrl ?? '');
}

function toAdItem(campaign: Campaign): AdItem {
  const tone = TONES.find((item) => item === campaign.tone) ?? 'sky';
  const icon = ICONS.find((item) => item === campaign.icon) ?? 'sparkles';

  return {
    id: campaign.id,
    kind: 'sponsor',
    tone,
    icon,
    eyebrow: campaign.eyebrow?.trim() || 'Sponsored',
    title: campaign.title,
    body: campaign.body,
    cta: { label: campaign.ctaLabel, href: campaign.ctaUrl },
    advertiser: campaign.advertiser,
    imageUrl: campaign.imageUrl && /^https:\/\//i.test(campaign.imageUrl) ? campaign.imageUrl : undefined,
    weight: Math.max(1, campaign.weight ?? 1),
  };
}

/** The sponsors that are running today. Throws if they can't be loaded. */
export async function loadSponsorAds(): Promise<AdItem[]> {
  const campaigns: Campaign[] = [];
  let nextToken: string | null | undefined;

  do {
    const { data, errors, nextToken: token } = await client.models.AdCampaign.list({
      authMode: 'userPool',
      limit: 100,
      nextToken,
    });

    if (errors?.length) {
      console.error('[ads] Failed to load campaigns:', errors);
      throw new Error('ADS_LOAD_FAILED');
    }

    campaigns.push(...(data ?? []));
    nextToken = token;
  } while (nextToken && campaigns.length < 200);

  const today = todayKey();

  return campaigns.filter((campaign) => isLive(campaign, today)).map(toAdItem);
}

// -----------------------------------------------------------------------------
// Choosing an ad
// -----------------------------------------------------------------------------

export interface AdContext {
  /** The journey being viewed, when there is one. */
  courseId?: string;
  /** True when the learner wrote this journey (imported ones can't be published). */
  canPublish?: boolean;
}

// House ads take turns, starting somewhere random.
let houseTurn = Math.floor(Math.random() * 100);

function pickWeighted(items: AdItem[]): AdItem {
  const total = items.reduce((sum, item) => sum + (item.weight ?? 1), 0);
  let roll = Math.random() * total;

  for (const item of items) {
    roll -= item.weight ?? 1;
    if (roll < 0) return item;
  }

  return items[items.length - 1];
}

/** The ad for this visit, or null when there is nothing to show. */
export function pickAd(context: AdContext = {}, sponsors: AdItem[] = []): AdItem | null {
  if (!ADS_ENABLED) return null;

  if (sponsors.length > 0 && Math.random() < SPONSOR_SHARE) {
    return pickWeighted(sponsors);
  }

  const house = HOUSE_ADS.filter(
    (ad) =>
      (!ad.requiresPro || PRO_AVAILABLE) &&
      (!ad.requiresPublish || (context.canPublish && context.courseId)),
  );

  if (house.length === 0) return sponsors.length > 0 ? pickWeighted(sponsors) : null;

  const ad = house[houseTurn % house.length];

  houseTurn += 1;

  return ad;
}

// -----------------------------------------------------------------------------
// Tracking (counted on the server; see amplify/functions/track-ad-event)
// -----------------------------------------------------------------------------

export function adTrackingId(ad: AdItem) {
  return ad.kind === 'sponsor' ? `campaign:${ad.id}` : `house:${ad.id}`;
}

/** Fire and forget: a failed count must never affect the learner. */
export function trackAdEvent(ad: AdItem, event: 'impression' | 'click') {
  void client.mutations
    .trackAdEvent({ campaignId: adTrackingId(ad), event }, { authMode: 'userPool' })
    .catch(() => undefined);
}