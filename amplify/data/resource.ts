import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { generateOutline } from '../functions/generate-outline/resource';
import { generateLesson } from '../functions/generate-lesson/resource';

const schema = a
  .schema({
    Course: a.model({
      owner: a.string(),
      title: a.string().required(),
      topic: a.string().required(),
      description: a.string(),
      heroImageUrl: a.string(),
      personalizationProfile: a.json(),
      status: a.enum(['DRAFT', 'GENERATING', 'READY', 'FAILED']),
      generationError: a.string(),
      phases: a.hasMany('Phase', 'courseId'),
      lessons: a.hasMany('Lesson', 'courseId'),
    }).authorization((allow) => [allow.ownerDefinedIn('owner')]),

    Phase: a.model({
      owner: a.string(),
      courseId: a.id().required(),
      course: a.belongsTo('Course', 'courseId'),
      order: a.integer().required(),
      title: a.string().required(),
      locked: a.boolean().default(true),
      lessons: a.hasMany('Lesson', 'phaseId'),
    }).authorization((allow) => [allow.ownerDefinedIn('owner')]),

    Lesson: a.model({
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
      status: a.enum(['PENDING', 'GENERATING', 'READY', 'FAILED']),
      generationError: a.string(),
    }).authorization((allow) => [allow.ownerDefinedIn('owner')]),

    UserProfile: a.model({
      email: a.string().required(),
      workTypes: a.string().array(),
      topics: a.string().array(),
      goals: a.string().array(),
      timeCommitment: a.string(),
      learnPrompt: a.string(),
      onboardingCompleted: a.boolean().default(false),
    }).authorization((allow) => [allow.owner()]),

    UserProgress: a.model({
      owner: a.string(),
      courseId: a.id().required(),
      lessonId: a.id().required(),
      completedAt: a.datetime(),
      xp: a.integer().default(0),
    }).authorization((allow) => [allow.ownerDefinedIn('owner')]),

    generateOutline: a
      .mutation()
      .arguments({
        topic: a.string().required(),
        personalizationProfile: a.json(),
      })
      .returns(a.ref('Course'))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(generateOutline)),

    generateLesson: a
      .mutation()
      .arguments({
        lessonId: a.id().required(),
      })
      .returns(a.ref('Lesson'))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(generateLesson)),
  })
  .authorization((allow) => [
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