import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { generateOutline } from '../functions/generate-outline/resource';
import { generateLesson } from '../functions/generate-lesson/resource';

const schema = a.schema({
  Course: a
    .model({
      owner: a.string(),
      title: a.string().required(),
      topic: a.string().required(),
      description: a.string(),
      heroImageUrl: a.string(),
      personalizationProfile: a.json(),
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
    })
    .authorization((allow) => [
      allow.owner(),
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
  allow.resource(generateLesson),
]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});