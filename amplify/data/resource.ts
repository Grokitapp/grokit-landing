import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { generateOutline } from '../functions/generate-outline/resource';
import { generateOutlineWorker } from '../functions/generate-outline-worker/resource';
import { generateLesson } from '../functions/generate-lesson/resource';
import { generateLessonWorker } from '../functions/generate-lesson-worker/resource';
import { changeUsername } from '../functions/change-username/resource';

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
    })
    .authorization((allow) => [
      allow
        .ownerDefinedIn('owner')
        .identityClaim('sub'),
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

  UserProgress: a
    .model({
      courseId: a.id().required(),
      lessonId: a.id().required(),
      completedAt: a.datetime(),
      xp: a.integer().default(0),
    })
    .authorization((allow) => [
      allow.owner(),
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
        .identityClaim('sub'),
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
}).authorization((allow) => [
  allow.resource(generateOutline),
  allow.resource(generateOutlineWorker),
  allow.resource(generateLesson),
  allow.resource(generateLessonWorker),
]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});