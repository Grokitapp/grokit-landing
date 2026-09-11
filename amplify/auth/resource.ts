import { defineAuth, secret } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: 'CODE',
      verificationEmailSubject: 'Welcome to Grokit — verify your email',
      verificationEmailBody: (createCode) =>
        `Welcome to Grokit!\n\n` +
        `You're one step away from getting started. Enter the verification code below to confirm your email and begin your personalized learning journey.\n\n` +
        `Your verification code: ${createCode()}\n\n` +
        `If you didn't create a Grokit account, you can safely ignore this email.\n\n` +
        `— The Grokit team`,
    },
    externalProviders: {
      google: {
        clientId: secret('GOOGLE_CLIENT_ID'),
        clientSecret: secret('GOOGLE_CLIENT_SECRET'),
      },
      callbackUrls: ['http://localhost:5173/onboarding', 'https://grokit.app/onboarding'],
      logoutUrls: ['http://localhost:5173', 'https://grokit.app'],
    },
  },
});
