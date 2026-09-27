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

export const getMissingPasswordRequirements = (password: string) => {
  const checks = getPasswordChecks(password);
  const missing: string[] = [];

  if (!checks.minLength) missing.push('at least 8 characters');
  if (!checks.uppercase) missing.push('an uppercase letter');
  if (!checks.lowercase) missing.push('a lowercase letter');
  if (!checks.number) missing.push('a number');
  if (!checks.special) missing.push('a special character');

  return missing;
};
