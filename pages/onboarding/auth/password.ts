import type { PasswordCheck } from './authTypes';

export const getPasswordChecks = (password: string): PasswordCheck => ({
  minLength: password.length >= 8,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  number: /\d/.test(password),
  special: /[^A-Za-z0-9]/.test(password),
});

export const isStrongPassword = (password: string) =>
  Object.values(getPasswordChecks(password)).every(Boolean);
