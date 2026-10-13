import type {
  Badge,
  BadgeIcon,
  BadgeTone,
  GamificationStats,
} from './gamification';

export type ExtraBadgeIcon =
  | 'graduation'
  | 'crown'
  | 'shield'
  | 'sparkles'
  | 'rocket'
  | 'gem'
  | 'calendar'
  | 'mountain';

export type ExtraBadgeTone = 'indigo' | 'pink' | 'lime' | 'cyan';

/** A badge from the core set or one of the extra badges below. */
export interface ProfileBadge extends Omit<Badge, 'icon' | 'tone'> {
  icon: BadgeIcon | ExtraBadgeIcon;
  tone: BadgeTone | ExtraBadgeTone;
}

// Display order: lessons, streaks, XP, then consistency.
const ORDER = [
  'first-step',
  'getting-going',
  'seeker',
  'dedicated',
  'scholar',
  'on-fire',
  'week-warrior',
  'habit-builder',
  'unstoppable',
  'legend',
  'century',
  'rising-star',
  'powered-up',
  'xp-master',
  'regular',
  'committed',
];

function extra(
  id: string,
  title: string,
  description: string,
  icon: ExtraBadgeIcon,
  tone: BadgeTone | ExtraBadgeTone,
  value: number,
  target: number,
): ProfileBadge {
  return {
    id,
    title,
    description,
    icon,
    tone,
    value: Math.min(value, target),
    target,
    earned: value >= target,
  };
}

/**
 * The core badges from `computeStats` plus extra ones, all derived from the
 * same stats (nothing extra is stored).
 */
export function buildProfileBadges(stats: GamificationStats): ProfileBadge[] {
  const lessons = stats.lessonsCompleted;
  const streak = stats.longestStreak;
  const xp = stats.totalXp;
  const activeDays = stats.activeDays.size;

  const extras: ProfileBadge[] = [
    extra('dedicated', 'Dedicated', 'Complete 50 lessons', 'graduation', 'indigo', lessons, 50),
    extra('scholar', 'Scholar', 'Complete 100 lessons', 'crown', 'gold', lessons, 100),
    extra('habit-builder', 'Habit builder', 'Reach a 14 day streak', 'shield', 'cyan', streak, 14),
    extra('legend', 'Legend', 'Reach a 100 day streak', 'sparkles', 'pink', streak, 100),
    extra('powered-up', 'Powered up', 'Earn 1,000 XP', 'rocket', 'indigo', xp, 1000),
    extra('xp-master', 'XP master', 'Earn 2,500 XP', 'gem', 'cyan', xp, 2500),
    extra('regular', 'Regular', 'Learn on 10 different days', 'calendar', 'emerald', activeDays, 10),
    extra('committed', 'Committed', 'Learn on 30 different days', 'mountain', 'lime', activeDays, 30),
  ];

  const byId = new Map<string, ProfileBadge>();

  for (const badge of [...stats.badges, ...extras]) byId.set(badge.id, badge);

  const ordered = ORDER.flatMap((id) => {
    const badge = byId.get(id);

    return badge ? [badge] : [];
  });

  // Anything not in ORDER (e.g. a badge added to computeStats later) goes last.
  const rest = [...byId.values()].filter((badge) => !ORDER.includes(badge.id));

  return [...ordered, ...rest];
}