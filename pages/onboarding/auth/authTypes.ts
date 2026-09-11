export type AuthMode = 'signup' | 'login';

export type AuthView = 'form' | 'confirm' | 'forgot';

export type PasswordCheck = {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
};
