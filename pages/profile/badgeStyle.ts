import {
  Award,
  BookOpen,
  CalendarCheck,
  Crown,
  Flame,
  Footprints,
  Gem,
  GraduationCap,
  Medal,
  Mountain,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import type { BadgeIcon, BadgeTone } from '../../lib/gamification';
import type { ExtraBadgeIcon, ExtraBadgeTone } from '../../lib/badges';

/** Icon for every badge (core and extra). Shared by Profile and the journey page. */
export const BADGE_ICONS: Record<BadgeIcon | ExtraBadgeIcon, LucideIcon> = {
  footprints: Footprints,
  book: BookOpen,
  medal: Medal,
  flame: Flame,
  trophy: Trophy,
  award: Award,
  star: Star,
  zap: Zap,
  graduation: GraduationCap,
  crown: Crown,
  shield: Shield,
  sparkles: Sparkles,
  rocket: Rocket,
  gem: Gem,
  calendar: CalendarCheck,
  mountain: Mountain,
};

/** Accent colour for every badge tone. */
export const BADGE_COLORS: Record<BadgeTone | ExtraBadgeTone, string> = {
  emerald: '#34D399',
  teal: '#2DD4BF',
  violet: '#A78BFA',
  orange: '#F4611F',
  gold: '#F59E0B',
  rose: '#FB7185',
  sun: '#FACC15',
  sky: '#38BDF8',
  indigo: '#818CF8',
  pink: '#F472B6',
  lime: '#A3E635',
  cyan: '#22D3EE',
};