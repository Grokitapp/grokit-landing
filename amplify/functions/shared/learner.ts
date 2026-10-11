/**
 * Turns everything we know about the learner into one compact, safe prompt
 * block. Two sources feed it, both stored on Course.personalizationProfile:
 *
 *  1. Course-time answers (Personalize.tsx):
 *       experienceLevel, existingKnowledge, focusAreas, learningFocus
 *  2. Onboarding answers (snapshotted by the frontend at creation time):
 *       onboarding.{ motivations, interests, startingPreference,
 *                    comprehensionPreferences, desiredOutcomes, timeCommitment }
 *
 * Free-text answers are length-capped and flattened to one line each. The
 * prompts also tell the model to treat this block as information only.
 */

export interface LearnerBrief {
  /** Prompt-ready text. Never empty. */
  text: string;
  hasProfile: boolean;
  /** Target length of a lesson's coreContent. */
  wordRange: { min: number; max: number };
  /** Human-readable session length, e.g. "10–20 minutes". */
  sessionLabel: string;
}

const EXPERIENCE: Record<string, string> = {
  new: 'Completely new to this topic. Assume no prior knowledge; define every term; use everyday language.',
  beginner: 'Knows a little. Has met a few terms but needs clarity and firm foundations.',
  intermediate: 'Knows the fundamentals. Wants a deeper understanding of how and why things work.',
  advanced: 'Already experienced. Skip basics; go into mechanisms, trade-offs, edge cases and applications.',
};

const KNOWLEDGE: Record<string, string> = {
  concepts: 'understands the basic concepts',
  terminology: 'knows the key terminology',
  practical: 'has tried practical examples',
  technical: 'understands the technical details',
};

const FOCUS: Record<string, string> = {
  deeper: 'understand how it works in depth',
  practical: 'apply it to real-world problems',
  advanced: 'explore advanced techniques',
  projects: 'build something practical',
};

const START: Record<string, string> = {
  basics: 'start with the basics and build a strong foundation',
  'big-picture': 'see the big picture first, then fill in the details',
  'existing-knowledge': 'build on what they already know',
  practical: 'start with something practical and learn by doing',
  'figure-it-out': 'get just enough to start, then figure things out as they go',
  depends: 'adapts to the topic (no fixed preference)',
};

const TIME: Record<string, { label: string; min: number; max: number }> = {
  'quick-sparks': { label: '5–10 minutes', min: 450, max: 650 },
  'little-every-day': { label: '10–20 minutes', min: 650, max: 950 },
  'focused-sessions': { label: '20–30 minutes', min: 950, max: 1350 },
  'deep-dives': { label: '30–60 minutes', min: 1350, max: 2000 },
  whenever: { label: 'no fixed schedule', min: 800, max: 1150 },
};

const DEFAULT_RANGE = { min: 800, max: 1150 };

function clean(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function cleanList(value: unknown, maxItems = 8, maxLength = 120): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of value) {
    const text = clean(item, maxLength);
    if (!text || seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    result.push(text);
    if (result.length >= maxItems) break;
  }

  return result;
}

function mapIds(ids: string[], dictionary: Record<string, string>): string[] {
  return ids.map((id) => dictionary[id] ?? id);
}

export function buildLearnerBrief(raw: unknown): LearnerBrief {
  const profile =
    raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};

  const onboardingRaw = profile.onboarding;
  const onboarding =
    onboardingRaw && typeof onboardingRaw === 'object' && !Array.isArray(onboardingRaw)
      ? (onboardingRaw as Record<string, unknown>)
      : {};

  const lines: string[] = [];

  /* Course-time answers */
  const level = clean(profile.experienceLevel, 20);
  if (level && EXPERIENCE[level]) lines.push(`- Familiarity with this topic: ${EXPERIENCE[level]}`);

  const knows = mapIds(cleanList(profile.existingKnowledge), KNOWLEDGE);
  if (knows.length) lines.push(`- Already: ${knows.join('; ')}`);

  const focusAreas = mapIds(cleanList(profile.focusAreas), FOCUS);
  if (focusAreas.length) lines.push(`- Wants to: ${focusAreas.join('; ')}`);

  const specific = clean(profile.learningFocus, 600);
  if (specific) lines.push(`- Specific interest or challenge (their words): "${specific}"`);

  /* Onboarding answers */
  const motivations = cleanList(onboarding.motivations);
  if (motivations.length) lines.push(`- Why they are learning: ${motivations.join('; ')}`);

  const interests = cleanList(onboarding.interests);
  if (interests.length) lines.push(`- General interests (use for examples and analogies): ${interests.join('; ')}`);

  const start = mapIds([clean(onboarding.startingPreference, 40)].filter(Boolean), START);
  if (start.length) lines.push(`- Prefers to: ${start[0]}`);

  const comprehension = cleanList(onboarding.comprehensionPreferences);
  if (comprehension.length) lines.push(`- Understands best through: ${comprehension.join('; ')}`);

  const outcomes = cleanList(onboarding.desiredOutcomes);
  if (outcomes.length) lines.push(`- Wants to be able to: ${outcomes.join('; ')}`);

  const timeId = clean(onboarding.timeCommitment, 40);
  const time = TIME[timeId];
  if (time) lines.push(`- Time per session: ${time.label}`);

  const hasProfile = lines.length > 0;

  return {
    text: hasProfile
      ? lines.join('\n')
      : '- No learner details provided. Assume a curious beginner with no prior knowledge.',
    hasProfile,
    wordRange: time ? { min: time.min, max: time.max } : DEFAULT_RANGE,
    sessionLabel: time?.label ?? 'about 15 minutes',
  };
}
