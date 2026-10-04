import {
  confirmResetPassword,
  confirmSignUp,
  getCurrentUser,
  resetPassword,
  resendSignUpCode,
  signIn,
  signInWithRedirect,
  signUp,
  signOut as amplifySignOut,
} from 'aws-amplify/auth';

// -----------------------------------------------------------------------------
// Current authenticated user
// -----------------------------------------------------------------------------

export const getAuthenticatedUser = () => getCurrentUser();

// -----------------------------------------------------------------------------
// Email sign-up
// -----------------------------------------------------------------------------

export const signUpWithEmail = (
  username: string,
  password: string,
) =>
  signUp({
    username,
    password,
    options: {
      userAttributes: {
        email: username,
      },
    },
  });

// -----------------------------------------------------------------------------
// Email confirmation
// -----------------------------------------------------------------------------

export const confirmEmailSignUp = (
  username: string,
  confirmationCode: string,
) =>
  confirmSignUp({
    username,
    confirmationCode,
  });

// -----------------------------------------------------------------------------
// Resend email confirmation code
// -----------------------------------------------------------------------------

export const resendEmailSignUpCode = (
  username: string,
) =>
  resendSignUpCode({
    username,
  });

// -----------------------------------------------------------------------------
// Email sign-in
// -----------------------------------------------------------------------------

export const signInWithEmail = (
  username: string,
  password: string,
) =>
  signIn({
    username,
    password,
  });

// -----------------------------------------------------------------------------
// Google sign-in
// -----------------------------------------------------------------------------

export const signInWithGoogle = () =>
  signInWithRedirect({
    provider: 'Google',
  });

// -----------------------------------------------------------------------------
// Sign out
// -----------------------------------------------------------------------------

export const signOutUser = () =>
  amplifySignOut();

// -----------------------------------------------------------------------------
// Password reset
// -----------------------------------------------------------------------------

export const sendPasswordResetCode = (
  username: string,
) =>
  resetPassword({
    username,
  });

export const completePasswordReset = (
  username: string,
  confirmationCode: string,
  newPassword: string,
) =>
  confirmResetPassword({
    username,
    confirmationCode,
    newPassword,
  });