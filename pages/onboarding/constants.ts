export const STEP = {
  AUTH: 0,
  WELCOME: 1,
  MOTIVATION: 2,
  INTERESTS: 3,
  STARTING_PREFERENCE: 4,
  COMPREHENSION: 5,
  OUTCOMES: 6,
  TIME: 7,
  COMPLETE: 8,
} as const;

export type Step = (typeof STEP)[keyof typeof STEP];

export const TOTAL_QUESTIONS = 6;
export const TOTAL_PROGRESS_STEPS = 7;

export const PROGRESS_BY_STEP: Partial<Record<Step, number>> = {
  [STEP.MOTIVATION]: 2,
  [STEP.INTERESTS]: 3,
  [STEP.STARTING_PREFERENCE]: 4,
  [STEP.COMPREHENSION]: 5,
  [STEP.OUTCOMES]: 6,
  [STEP.TIME]: 7,
};

export const BACK_STEP: Partial<Record<Step, Step>> = {
  [STEP.MOTIVATION]: STEP.WELCOME,
  [STEP.INTERESTS]: STEP.MOTIVATION,
  [STEP.STARTING_PREFERENCE]: STEP.INTERESTS,
  [STEP.COMPREHENSION]: STEP.STARTING_PREFERENCE,
  [STEP.OUTCOMES]: STEP.COMPREHENSION,
  [STEP.TIME]: STEP.OUTCOMES,
};

/* -------------------------------------------------------------------------- */
/* Question 1 — Motivation                                                    */
/* -------------------------------------------------------------------------- */

export const MOTIVATION_OPTIONS = [
  'Grow in my career',
  'Understand things better',
  'Build something of my own',
  'Prepare for what’s ahead',
  'Explore what interests me',
  'Keep learning and growing',
  'Turn my ideas into reality',
  'Something else',
] as const;

export const MOTIVATION_MAX_SELECTIONS = 3;

/* -------------------------------------------------------------------------- */
/* Question 2 — Interests                                                     */
/* -------------------------------------------------------------------------- */

export const INTEREST_OPTIONS = [
  'Technology & AI',
  'Business & startups',
  'Finance & markets',
  'Science & engineering',
  'Design & creativity',
  'Psychology & people',
  'History & culture',
  'Communication',
  'Health & performance',
  'Something else',
] as const;

export const INTEREST_MAX_SELECTIONS = 3;

/* -------------------------------------------------------------------------- */
/* Question 3 — Starting preference                                           */
/* -------------------------------------------------------------------------- */

export const STARTING_PREFERENCE_OPTIONS = [
  {
    id: 'basics',
    label: 'Start with the basics',
    description: 'Build a strong foundation first.',
  },
  {
    id: 'big-picture',
    label: 'See the big picture first',
    description: 'Understand how everything fits together.',
  },
  {
    id: 'existing-knowledge',
    label: 'Build on what I already know',
    description: 'Connect new ideas to familiar ones.',
  },
  {
    id: 'practical',
    label: 'Start with something practical',
    description: 'Learn by doing something real.',
  },
  {
    id: 'figure-it-out',
    label: 'Figure things out as I go',
    description: 'Give me enough to get started.',
  },
  {
    id: 'depends',
    label: 'It depends on the topic',
    description: 'I like to adapt.',
  },
] as const;

/* -------------------------------------------------------------------------- */
/* Question 4 — Comprehension                                                 */
/* -------------------------------------------------------------------------- */

export const COMPREHENSION_OPTIONS = [
  'Seeing it visually',
  'Working through a real example',
  'Breaking it into smaller steps',
  'Connecting it to what I already know',
  'Using a simple analogy',
  'Practicing it myself',
  'Comparing different ideas',
  'Understanding why it works',
  'Something else',
] as const;

export const COMPREHENSION_MAX_SELECTIONS = 4;

/* -------------------------------------------------------------------------- */
/* Question 5 — Outcomes                                                      */
/* -------------------------------------------------------------------------- */

export const OUTCOME_OPTIONS = [
  'Apply it in my work',
  'Build something useful',
  'Solve problems more effectively',
  'Explain it clearly to others',
  'Make better decisions',
  'Feel confident using it',
  'Prepare for a test or interview',
  'Explore an idea more deeply',
  'Something else',
] as const;

export const OUTCOME_MAX_SELECTIONS = 3;

/* -------------------------------------------------------------------------- */
/* Question 6 — Time                                                          */
/* -------------------------------------------------------------------------- */

export const TIME_OPTIONS = [
  {
    id: 'quick-sparks',
    label: 'Quick sparks',
    description: '5 – 10 min',
  },
  {
    id: 'little-every-day',
    label: 'A little every day',
    description: '10 – 20 min',
  },
  {
    id: 'focused-sessions',
    label: 'Focused sessions',
    description: '20 – 30 min',
  },
  {
    id: 'deep-dives',
    label: 'Deep dives',
    description: '30 – 60 min',
  },
  {
    id: 'whenever',
    label: 'Whenever I have time',
    description: 'No fixed schedule',
  },
] as const;

/* -------------------------------------------------------------------------- */
/* Existing Learn page examples                                               */
/* -------------------------------------------------------------------------- */

/**
 * These examples belong to the Learn dashboard, not onboarding.
 *
 * Keep this export here because Learn.tsx already consumes it from this
 * module. The explicit type also prevents `course` from becoming `any`
 * inside EXAMPLE_COURSES.map(...).
 */
export interface ExampleCourse {
  readonly title: string;
  readonly tag: string;
  readonly author: string;
  readonly blurb: string;
}

export const EXAMPLE_COURSES: readonly ExampleCourse[] = [
  {
    title: 'Artificial Intelligence',
    tag: 'AI',
    author: 'Grokit',
    blurb: 'Understand how AI works, from the core ideas to modern applications.',
  },
  {
    title: 'How the Stock Market Works',
    tag: 'FINANCE',
    author: 'Grokit',
    blurb: 'Build a clear mental model of markets, stocks, and investing.',
  },
  {
    title: 'Build a Startup',
    tag: 'STARTUPS',
    author: 'Grokit',
    blurb: 'Go from an idea to understanding the fundamentals of building a business.',
  },
  {
    title: 'Psychology of People',
    tag: 'PSYCHOLOGY',
    author: 'Grokit',
    blurb: 'Explore the ideas behind how people think, decide, and behave.',
  },
] as const;

export const DISCORD_INVITE_URL = 'https://discord.gg/your-invite';