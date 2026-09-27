import {
  confirmResetPassword,
  confirmSignUp,
  getCurrentUser,
  resetPassword,
  signIn,
  signInWithRedirect,
  signUp,
} from 'aws-amplify/auth';

export const getAuthenticatedUser = () => getCurrentUser();

export const signUpWithEmail = (username: string, password: string) =>
  signUp({
    username,
    password,
    options: { userAttributes: { email: username } },
  });

export const confirmEmailSignUp = (username: string, confirmationCode: string) =>
  confirmSignUp({ username, confirmationCode });

export const signInWithEmail = (username: string, password: string) =>
  signIn({ username, password });

export const signInWithGoogle = () =>
  signInWithRedirect({ provider: 'Google' });

export const sendPasswordResetCode = (username: string) =>
  resetPassword({ username });

export const completePasswordReset = (
  username: string,
  confirmationCode: string,
  newPassword: string,
) =>
  confirmResetPassword({ username, confirmationCode, newPassword });
