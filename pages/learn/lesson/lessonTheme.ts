/**
 * Colours and shared class names for the card lesson screens.
 * Same dark palette as the rest of the learning area, kept in one place so
 * the cards, practice and completion screens always match.
 */

export const COLORS = {
  page: '#131F24',
  card: '#1D2A33',
  cardSoft: '#18252C',
  border: '#2C3E4A',
  borderStrong: '#40535E',
  muted: '#91A4AC',
  body: '#D5DEE3',
  orange: '#F4611F',
  orangeShadow: '#C94D16',
  success: '#3DDC84',
  successBg: '#1C3027',
  successLine: '#2F6B4A',
  error: '#FF5A5F',
  errorBg: '#322225',
  errorLine: '#7A3A3E',
  gold: '#FFB020',
  goldBg: '#2D2920',
  goldLine: '#51432B',
} as const;

/** Soft tints used to tell visual tiles apart (background, border). */
export const TINTS = [
  { bg: '#1B3340', line: '#2F5568' },
  { bg: '#1E3329', line: '#2F5A44' },
  { bg: '#38271F', line: '#6B3F2B' },
  { bg: '#2B2740', line: '#473F73' },
] as const;

export const primaryButton =
  'inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#F4611F] px-7 font-display text-[17px] font-bold tracking-wide text-white shadow-[0_4px_0_#C94D16] transition-all hover:brightness-105 active:translate-y-[3px] active:shadow-[0_1px_0_#C94D16] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-[0_4px_0_#C94D16] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F4611F]/30';

export const secondaryButton =
  'inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-2 border-[#2C3E4A] bg-[#1D2A33] px-6 font-display text-[17px] font-bold tracking-wide text-white shadow-[0_4px_0_#2C3E4A] transition-all hover:bg-[#233440] active:translate-y-[3px] active:shadow-[0_1px_0_#2C3E4A] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/10';

/** Short label above a card's title, by card kind. */
export const KIND_LABELS: Record<string, string> = {
  hook: 'Why it matters',
  concept: 'The idea',
  analogy: 'Think of it like this',
  example: 'Example',
  misconception: 'Common mistake',
  reflection: 'Think about it',
  apply: 'Put it to work',
};