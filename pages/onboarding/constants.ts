// Option data and step navigation config for onboarding.

export const STEP = {
  AUTH: 0,
  WELCOME: 1,
  INTRO: 2,
  WORK_TYPE: 3,
  T_PERSONALIZED: 4,
  TOPICS: 5,
  T_PERFECT: 6,
  GOALS: 7,
  T_GREAT: 8,
  TIME: 9,
  T_BOOKS: 10,
  LOADING: 11,
  FINAL: 12,
} as const;

export type Step = (typeof STEP)[keyof typeof STEP];

export const TOTAL_QUESTIONS = 4;

export const PROGRESS_BY_STEP: Partial<Record<Step, number>> = {
  [STEP.WORK_TYPE]: 1, [STEP.T_PERSONALIZED]: 1,
  [STEP.TOPICS]: 2, [STEP.T_PERFECT]: 2,
  [STEP.GOALS]: 3, [STEP.T_GREAT]: 3,
  [STEP.TIME]: 4, [STEP.T_BOOKS]: 4,
};

// Where the back button leads from each step. Steps absent from this map
// (AUTH, WELCOME, LOADING, FINAL) don't show navigation.
export const BACK_STEP: Partial<Record<Step, Step>> = {
  [STEP.INTRO]: STEP.WELCOME,
  [STEP.WORK_TYPE]: STEP.INTRO,
  [STEP.T_PERSONALIZED]: STEP.WORK_TYPE,
  [STEP.TOPICS]: STEP.T_PERSONALIZED,
  [STEP.T_PERFECT]: STEP.TOPICS,
  [STEP.GOALS]: STEP.T_PERFECT,
  [STEP.T_GREAT]: STEP.GOALS,
  [STEP.TIME]: STEP.T_GREAT,
  [STEP.T_BOOKS]: STEP.TIME,
};

export const WORK_TYPES = [
  'Product Manager', 'Business/Management', 'Designer/Creative', 'Student',
  'Developer/Engineer', 'Research/Academic', 'Finance/Investment', 'Marketing',
];

export const TOPIC_OPTIONS = [
  'AI', 'Business', 'Psychology', 'Science', 'Philosophy', 'Economics',
  'History', 'Investing', 'Design', 'Self-Improvement', 'Strategy',
  'Learning', 'Longevity', 'Decision Making', 'Software Engineering',
];

export const GOAL_OPTIONS = [
  'Make better use of my time', 'Build new skills', 'Boost my career',
  'Understand complex topics', 'Explore new topics', 'Just for fun',
  'Remember important learning',
];

export const TIME_OPTIONS = [
  { id: '5', label: '5 min', description: 'Just a quick spark' },
  { id: '10', label: '10 min', description: 'Your coffee break' },
  { id: '15', label: '15 min', description: 'A lunch-break session' },
  { id: '20', label: '20+ min', description: "I'm serious about this" },
];

export const EXAMPLE_COURSES = [
  { title: 'Atomic Habits', author: 'James Clear', tag: 'Self-Improvement', blurb: 'Build better habits to optimize your study time.' },
  { title: 'Deep Dive Into LLMs', author: 'Andrej Karpathy', tag: 'AI', blurb: 'Explores the core technology behind modern language models.' },
];

// NOTE: swap this once your Discord server exists.
export const DISCORD_INVITE_URL = 'https://discord.gg/your-invite';

export const lessonsPerWeekFor = (timeId: string | null) =>
  timeId === '5' ? 7 : timeId === '10' ? 10 : timeId === '15' ? 12 : 14;