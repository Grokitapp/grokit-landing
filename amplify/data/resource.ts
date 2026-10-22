import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { generateOutline } from '../functions/generate-outline/resource';
import { generateOutlineWorker } from '../functions/generate-outline-worker/resource';
import { generateLesson } from '../functions/generate-lesson/resource';
import { generateLessonWorker } from '../functions/generate-lesson-worker/resource';
import { completeLesson } from '../functions/complete-lesson/resource';
import { changeUsername } from '../functions/change-username/resource';
import { leaderboardSync } from '../functions/leaderboard-sync/resource';
import { readAloud } from '../functions/read-aloud/resource';
import { importJourney } from '../functions/import-journey/resource';
import { trackAdEvent } from '../functions/track-ad-event/resource';

const schema = a.schema({
  Course: a
    .model({
      owner: a.string(),
      title: a.string().required(),
      topic: a.string().required(),
      description: a.string(),
      heroImageUrl: a.string(),
      personalizationProfile: a.json(),
      outline: a.json(),
      status: a.enum([
        'DRAFT',
        'GENERATING',
        'READY',
        'FAILED',
      ]),
      generationError: a.string(),
      // Set when the journey was imported from Explore: which listing it came
      // from and who wrote it (shown as credit).
      sourceJourneyId: a.id(),
      authorUsername: a.string(),
      phases: a.hasMany('Phase', 'courseId'),
      lessons: a.hasMany('Lesson', 'courseId'),
    })
    .authorization((allow) => [
      allow
        .ownerDefinedIn('owner')
        .identityClaim('sub'),
    ]),

  Phase: a
    .model({
      owner: a.string(),
      courseId: a.id().required(),
      course: a.belongsTo('Course', 'courseId'),
      order: a.integer().required(),
      title: a.string().required(),
      locked: a.boolean().default(true),
      lessons: a.hasMany('Lesson', 'phaseId'),
    })
    .authorization((allow) => [
      allow
        .ownerDefinedIn('owner')
        .identityClaim('sub'),
    ]),

  Lesson: a
    .model({
      owner: a.string(),
      courseId: a.id().required(),
      course: a.belongsTo('Course', 'courseId'),
      phaseId: a.id().required(),
      phase: a.belongsTo('Phase', 'phaseId'),
      order: a.integer().required(),
      title: a.string().required(),
      hook: a.string(),
      coreContent: a.string(),
      keyTerms: a.json(),
      quiz: a.json(),
      status: a.enum([
        'PENDING',
        'GENERATING',
        'READY',
        'FAILED',
      ]),
      generationError: a.string(),

      // Card-style lessons. `content` holds the prediction, cards and knowledge
      // cards; `practice` holds the questions (with their answers), written
      // by a second step while the learner reads. Older lessons only have
      // coreContent / keyTerms / quiz above.
      content: a.json(),
      contentVersion: a.integer(),
      // When the cards were written. The Usage page counts today's lessons from it.
      generatedAt: a.datetime(),
      practice: a.json(),
      practiceStatus: a.enum([
        'PENDING',
        'GENERATING',
        'READY',
        'FAILED',
      ]),
    })
    .authorization((allow) => [
      // Lessons are written by the generation functions only. If a learner
      // could create or edit a lesson, they could write their own "practice"
      // and farm XP, so the browser may only read and delete (delete is used
      // when a journey is removed).
      allow
        .ownerDefinedIn('owner')
        .identityClaim('sub')
        .to(['read', 'delete']),
    ]),

  UserProfile: a
    .model({
      email: a.string().required(),
      motivations: a.string().array(),
      interests: a.string().array(),
      startingPreference: a.string(),
      learningPreferences: a.string().array(),
      comprehensionPreferences: a.string().array(),
      desiredOutcomes: a.string().array(),
      timeCommitment: a.string(),
      workTypes: a.string().array(),
      topics: a.string().array(),
      goals: a.string().array(),
      learnPrompt: a.string(),
      onboardingCompleted: a.boolean().default(false),

      // Username state is read-only for the client. Only the change-username
      // function (which writes to DynamoDB directly) can set these, so the
      // uniqueness and "2 changes per 15 days" rules can't be bypassed.
      username: a
        .string()
        .authorization((allow) => [allow.owner().to(['read'])]),
      usernameChangedAt: a
        .string()
        .array()
        .authorization((allow) => [allow.owner().to(['read'])]),
      usernameVersion: a
        .integer()
        .authorization((allow) => [allow.owner().to(['read'])]),
    })
    .authorization((allow) => [
      allow.owner(),
    ]),

  // One row per taken username. The handle (lowercase) IS the primary key, so
  // DynamoDB itself guarantees uniqueness and lookups stay O(1) at any scale.
  // Clients can only read their own claim; the function does all the writing.
  UsernameClaim: a
    .model({
      handle: a.string().required(),
      owner: a.string().required(),
    })
    .identifier(['handle'])
    .authorization((allow) => [
      allow
        .ownerDefinedIn('owner')
        .identityClaim('sub')
        .to(['read']),
    ]),

  // One row per completed lesson, written ONLY by the completeLesson
  // function (its id is the lesson id, so a lesson can only be completed
  // once). The owner is stored as "<sub>::<username>", the same format
  // allow.owner() used before, so existing rows keep working. The browser can
  // read its own rows and delete them (used when a journey is removed), but
  // never create or edit them, so XP can't be made up.
  UserProgress: a
    .model({
      owner: a.string(),
      courseId: a.id().required(),
      lessonId: a.id().required(),
      completedAt: a.datetime(),
      xp: a.integer().default(0),
      correct: a.integer(),
      total: a.integer(),
    })
    .authorization((allow) => [
      allow
        .ownerDefinedIn('owner')
        .to(['read', 'delete']),
    ]),

  // ---------------------------------------------------------------------------
  // Weekly leaderboard. Every learner can READ these (they only hold public names and XP); nothing here is writable from the browser. The
  // leaderboard-sync and leaderboard-weekly functions write straight to DynamoDB, so XP and leagues can't be faked.
  // ---------------------------------------------------------------------------

  // A learner's current league (0 = Bronze ... 7 = Diamond) and how last week
  // went. One row per learner, keyed by their Cognito sub.
  LeagueMember: a
    .model({
      userId: a.string().required(),
      displayName: a.string(),
      username: a.string(),
      league: a.integer(),
      lastWeekId: a.string(),
      lastRank: a.integer(),
      lastResult: a.string(),
      lastWeekXp: a.integer(),
    })
    .identifier(['userId'])
    .authorization((allow) => [
      allow.authenticated().to(['read']),
    ]),

  // One row per learner per week: their XP and the group (cohortId) they
  // compete in. Everyone in a group is read with the cohortId index.
  LeaderboardEntry: a
    .model({
      weekId: a.string().required(),
      userId: a.string().required(),
      cohortId: a.string().required(),
      league: a.integer().required(),
      xp: a.integer().required(),
      displayName: a.string(),
      username: a.string(),
      lastXpAt: a.string(),
    })
    .identifier(['weekId', 'userId'])
    .secondaryIndexes((index) => [
      index('cohortId').sortKeys(['xp']).queryField('listByCohort'),
    ])
    .authorization((allow) => [
      allow.authenticated().to(['read']),
    ]),

  // Internal counters: how many learners joined each league this week (used to
  // fill groups of 30) and "week finished" markers.
  LeagueCounter: a
    .model({
      bucket: a.string().required(),
      count: a.integer(),
    })
    .identifier(['bucket'])
    .authorization((allow) => [
      allow.authenticated().to(['read']),
    ]),

  // A published copy of a journey that every signed-in learner can browse in
  // Explore. Learners can read these; only the owner can create or edit them.
  PublicJourney: a
    .model({
      owner: a.string(),
      courseId: a.id().required(),
      title: a.string().required(),
      topic: a.string().required(),
      category: a.string(),
      heroImageUrl: a.string(),
      zoneCount: a.integer(),
      lessonCount: a.integer(),
      authorUsername: a.string(),
      featured: a.boolean().default(false),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow
        .ownerDefinedIn('owner')
        .identityClaim('sub')
        .to(['read', 'update', 'delete']),
    ]),

  // A snapshot of a public journey the learner bookmarked from Explore.
  SavedJourney: a
    .model({
      publicJourneyId: a.id().required(),
      title: a.string().required(),
      topic: a.string().required(),
      category: a.string(),
      heroImageUrl: a.string(),
      zoneCount: a.integer(),
      lessonCount: a.integer(),
      authorUsername: a.string(),
    })
    .authorization((allow) => [
      allow.owner(),
    ]),

  // Private notes shown in Library. courseId / courseTitle are optional so
  // notes can later be attached to a journey or lesson.
  Note: a
    .model({
      title: a.string().required(),
      content: a.string(),
      courseId: a.id(),
      courseTitle: a.string(),
    })
    .authorization((allow) => [
      allow.owner(),
    ]),

  // Result of a username check / change. Expected outcomes (taken, invalid,
  // rate limited) come back here rather than as GraphQL errors.
  UsernameResult: a.customType({
    ok: a.boolean().required(),
    code: a.string().required(),
    message: a.string(),
    username: a.string(),
    nextChangeAt: a.string(),
    changesRemaining: a.integer(),
  }),

  changeUsername: a
    .mutation()
    .arguments({
      profileId: a.id().required(),
      username: a.string().required(),
    })
    .returns(a.ref('UsernameResult'))
    .authorization((allow) => [
      allow.authenticated(),
    ])
    .handler(a.handler.function(changeUsername)),

  checkUsername: a
    .query()
    .arguments({
      username: a.string().required(),
    })
    .returns(a.ref('UsernameResult'))
    .authorization((allow) => [
      allow.authenticated(),
    ])
    .handler(a.handler.function(changeUsername)),

  // Copies the learner's public name and username onto their leaderboard rows.
  syncLeaderboardIdentity: a
    .mutation()
    .arguments({
      profileId: a.id().required(),
      displayName: a.string().required(),
    })
    .returns(a.boolean())
    .authorization((allow) => [
      allow.authenticated(),
    ])
    .handler(a.handler.function(leaderboardSync)),

  generateOutline: a
    .mutation()
    .arguments({
      topic: a.string().required(),
      personalizationProfile: a.json(),
    })
    .returns(a.ref('Course'))
    .authorization((allow) => [
      allow.authenticated(),
    ])
    .handler(a.handler.function(generateOutline)),

  // Copies a published journey (zones and finished lessons) into the caller's
  // account. Done by a function because other people's journeys are private
  // and lessons can only be written server-side.
  importJourney: a
    .mutation()
    .arguments({
      publicJourneyId: a.id().required(),
    })
    .returns(a.ref('Course'))
    .authorization((allow) => [
      allow.authenticated(),
    ])
    .handler(a.handler.function(importJourney)),

  // Result of finishing a lesson. xp is 0 when the lesson was already completed.
  LessonCompletion: a.customType({
    xp: a.integer().required(),
    correct: a.integer().required(),
    total: a.integer().required(),
    alreadyCompleted: a.boolean().required(),
  }),

  // Grades the learner's first-try practice answers (an array of option
  // indexes, one per question, -1 if unanswered), decides the XP and records
  // the lesson as complete.
  completeLesson: a
    .mutation()
    .arguments({
      lessonId: a.id().required(),
      answers: a.json(),
    })
    .returns(a.ref('LessonCompletion'))
    .authorization((allow) => [
      allow.authenticated(),
    ])
    .handler(a.handler.function(completeLesson)),

  generateLesson: a
    .mutation()
    .arguments({
      lessonId: a.id().required(),
    })
    .returns(a.ref('Lesson'))
    .authorization((allow) => [
      allow.authenticated(),
    ])
    .handler(a.handler.function(generateLesson)),

  // A playable link to natural-sounding speech for one screen of a lesson.
  // `url` is short-lived; `cached` is false only the first time a screen is
  // read in a given voice (that is the only time speech is billed).
  // status is 'ok' (url is set) or 'limit' (today's natural-voice allowance is
  // used up: no url, the app reads in the device voice instead). A limit is an
  // expected outcome, so it comes back here rather than as an error.
  ReadAloudResult: a.customType({
    status: a.string().required(),
    url: a.string(),
    cached: a.boolean().required(),
    characters: a.integer().required(),
    usedCharacters: a.integer(),
    limitCharacters: a.integer(),
    resetsAt: a.string(),
  }),

  // How much new natural speech a learner has used today (one row per learner
  // per day). Written ONLY by the read-aloud function straight to DynamoDB;
  // the browser can read its own row (for the Settings page) but never edit it.
  ReadAloudUsage: a
    .model({
      userId: a.string().required(),
      day: a.string().required(),
      characters: a.integer(),
      owner: a.string(),
    })
    .identifier(['userId', 'day'])
    .authorization((allow) => [
      allow
        .ownerDefinedIn('owner')
        .identityClaim('sub')
        .to(['read']),
    ]),

  // How much of a limited action (new journeys, AI-written lessons) a learner
  // has used today. One row per learner per action per day. Written ONLY by the
  // generation functions straight to DynamoDB, in one atomic "add one if under
  // the limit" step; the browser can read its own counts (for the Usage page)
  // but never change them. Rows expire on their own after 14 days.
  UsageCounter: a
    .model({
      userId: a.string().required(),
      bucket: a.string().required(),
      count: a.integer(),
      owner: a.string(),
    })
    .identifier(['userId', 'bucket'])
    .authorization((allow) => [
      allow
        .ownerDefinedIn('owner')
        .identityClaim('sub')
        .to(['read']),
    ]),

  // ---------------------------------------------------------------------------
  // Ads. Campaigns are written by admins (Cognito group "admins"); every
  // signed-in learner can read them so the app can show the active ones.
  // ---------------------------------------------------------------------------
  AdCampaign: a
    .model({
      name: a.string().required(), // internal label
      advertiser: a.string().required(),
      status: a.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED']),
      placement: a.string(), // 'journey-rail' (default)
      tone: a.string(), // 'orange' | 'teal' | 'violet' | 'sky'
      icon: a.string(), // 'compass' | 'sparkles' | 'globe' | 'award' | 'crown'
      eyebrow: a.string(),
      title: a.string().required(),
      body: a.string().required(),
      ctaLabel: a.string().required(),
      ctaUrl: a.string().required(), // must be https
      imageUrl: a.string(),
      startsAt: a.date(),
      endsAt: a.date(),
      weight: a.integer(), // relative share between sponsors (default 1)
    })
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.group('admins'),
    ]),

  // Impressions and clicks per campaign per day (UTC). Written ONLY by the
  // trackAdEvent function, so the browser can't inflate them.
  AdDailyStat: a
    .model({
      campaignId: a.string().required(),
      day: a.string().required(), // YYYY-MM-DD
      impressions: a.integer(),
      clicks: a.integer(),
    })
    .identifier(['campaignId', 'day'])
    .authorization((allow) => [allow.group('admins').to(['read'])]),

  // One row per learner per campaign per day per event type, so a learner's
  // repeat views are not counted twice. Written only by trackAdEvent; rows
  // expire on their own after 3 days.
  AdDedupe: a
    .model({
      userId: a.string().required(),
      bucket: a.string().required(),
      count: a.integer(),
    })
    .identifier(['userId', 'bucket'])
    .authorization((allow) => [allow.group('admins').to(['read'])]),

  // event: 'impression' | 'click'. Returns false when it was a repeat (ignored).
  trackAdEvent: a
    .mutation()
    .arguments({
      campaignId: a.string().required(),
      event: a.string().required(),
    })
    .returns(a.boolean())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(trackAdEvent)),

  // part: 'prediction' | 'card' | 'review' | 'sample'. The text is built on the
  // server from the learner's own lesson, so it can't be used to read arbitrary
  // text. lessonId is not needed for 'sample' (a fixed voice preview).
  readAloud: a
    .mutation()
    .arguments({
      lessonId: a.id(),
      part: a.string().required(),
      cardIndex: a.integer(),
      voiceId: a.string().required(),
    })
    .returns(a.ref('ReadAloudResult'))
    .authorization((allow) => [
      allow.authenticated(),
    ])
    .handler(a.handler.function(readAloud)),
}).authorization((allow) => [
  allow.resource(generateOutline),
  allow.resource(importJourney),
  allow.resource(generateOutlineWorker),
  allow.resource(generateLesson),
  allow.resource(generateLessonWorker),
  allow.resource(completeLesson),
  allow.resource(readAloud),
]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});