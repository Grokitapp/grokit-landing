import type { PreSignUpTriggerHandler } from 'aws-lambda';

import {
  AdminLinkProviderForUserCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
  type UserType,
} from '@aws-sdk/client-cognito-identity-provider';

const cognito = new CognitoIdentityProviderClient({});

const GOOGLE_PROVIDER = 'Google';
const GOOGLE_PROVIDER_NORMALIZED = GOOGLE_PROVIDER.toLowerCase();
const GOOGLE_TRIGGER_SOURCE = 'PreSignUp_ExternalProvider';

function getAttribute(
  user: UserType,
  attributeName: string,
): string | undefined {
  return user.Attributes?.find(
    (attribute) => attribute.Name === attributeName,
  )?.Value;
}

function escapeCognitoFilterValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

function parseFederatedUsername(
  username: string,
): { provider: string; subject: string } | null {
  const separatorIndex = username.indexOf('_');

  if (
    separatorIndex <= 0 ||
    separatorIndex === username.length - 1
  ) {
    return null;
  }

  return {
    provider: username.slice(0, separatorIndex),
    subject: username.slice(separatorIndex + 1),
  };
}

function isVerifiedNativeUser(user: UserType): boolean {
  if (!user.Username) {
    return false;
  }

  const emailVerified = getAttribute(
    user,
    'email_verified',
  );

  return (
    user.UserStatus === 'CONFIRMED' &&
    emailVerified === 'true'
  );
}

export const handler: PreSignUpTriggerHandler = async (
  event,
  context,
) => {
  if (event.triggerSource !== GOOGLE_TRIGGER_SOURCE) {
    return event;
  }

  const email =
    event.request.userAttributes.email?.trim();

  if (!email) {
    throw new Error(
      'GOOGLE_ACCOUNT_LINKING_EMAIL_MISSING',
    );
  }

  /**
   * Cognito gives external-provider users usernames such as:
   *
   * Google_<google-sub>
   *
   * The provider portion may arrive from the trigger as
   * lowercase ("google"), so provider comparison must be
   * case-insensitive.
   *
   * AdminLinkProviderForUser requires the actual Google
   * subject, not the complete Cognito username.
   */
  const federatedIdentity = parseFederatedUsername(
    event.userName,
  );

  if (!federatedIdentity) {
    console.error(
      'Invalid federated username format',
      {
        requestId: context.awsRequestId,
        userName: event.userName,
        triggerSource: event.triggerSource,
      },
    );

    throw new Error(
      'GOOGLE_ACCOUNT_LINKING_INVALID_IDENTITY',
    );
  }

  const normalizedProvider =
    federatedIdentity.provider
      .trim()
      .toLowerCase();

  if (
    normalizedProvider !==
    GOOGLE_PROVIDER_NORMALIZED
  ) {
    console.error(
      'Unexpected external provider',
      {
        requestId: context.awsRequestId,
        provider: federatedIdentity.provider,
        normalizedProvider,
      },
    );

    throw new Error(
      'GOOGLE_ACCOUNT_LINKING_UNSUPPORTED_PROVIDER',
    );
  }

  /**
   * Never automatically link an unverified external email.
   *
   * Google supplies email_verified through OIDC and we
   * explicitly map that attribute in auth/resource.ts.
   */
  const googleEmailVerified =
    event.request.userAttributes.email_verified ===
    'true';

  if (!googleEmailVerified) {
    console.warn(
      'Google email is not verified',
      {
        requestId: context.awsRequestId,
        email,
      },
    );

    throw new Error(
      'GOOGLE_EMAIL_NOT_VERIFIED',
    );
  }

  const filterEmail =
    escapeCognitoFilterValue(email);

  const { Users = [] } = await cognito.send(
    new ListUsersCommand({
      UserPoolId: event.userPoolId,
      Filter: `email = "${filterEmail}"`,
      Limit: 10,
    }),
  );

  /**
   * We only auto-link to an existing native Cognito
   * account.
   *
   * We deliberately do not select another federated
   * account as the destination because the canonical
   * Grokit account is the native Cognito account.
   */
  const nativeUsers = Users.filter((user) => {
    if (!user.Username) {
      return false;
    }

    if (user.Username === event.userName) {
      return false;
    }

    const usernameLower =
      user.Username.toLowerCase();

    if (
      usernameLower.startsWith('google_')
    ) {
      return false;
    }

    return isVerifiedNativeUser(user);
  });

  /**
   * No existing verified native account:
   *
   * This is a brand-new Google user, so Cognito should
   * continue normal federated-user creation.
   */
  if (nativeUsers.length === 0) {
    event.response.autoConfirmUser = true;
    event.response.autoVerifyEmail = true;

    console.info(
      'No existing native account found; allowing Google user creation',
      {
        requestId: context.awsRequestId,
        email,
      },
    );

    return event;
  }

  /**
   * Never arbitrarily choose between multiple verified
   * accounts.
   *
   * Ambiguous identity resolution must fail closed.
   */
  if (nativeUsers.length > 1) {
    console.error(
      'Multiple verified native accounts share an email',
      {
        requestId: context.awsRequestId,
        email,
        userCount: nativeUsers.length,
      },
    );

    throw new Error(
      'GOOGLE_ACCOUNT_LINKING_AMBIGUOUS',
    );
  }

  const destinationUser =
    nativeUsers[0];

  if (!destinationUser.Username) {
    throw new Error(
      'GOOGLE_ACCOUNT_LINKING_DESTINATION_MISSING',
    );
  }

  /**
   * Link Google's stable subject to the existing
   * Cognito user.
   *
   * IMPORTANT:
   *
   * ProviderAttributeValue must be Google's `sub`,
   * not event.userName (`Google_<sub>`).
   */
  await cognito.send(
    new AdminLinkProviderForUserCommand({
      UserPoolId: event.userPoolId,

      DestinationUser: {
        ProviderName: 'Cognito',
        ProviderAttributeValue:
          destinationUser.Username,
      },

      SourceUser: {
        ProviderName: GOOGLE_PROVIDER,
        ProviderAttributeName:
          'Cognito_Subject',
        ProviderAttributeValue:
          federatedIdentity.subject,
      },
    }),
  );

  /**
   * Google has been successfully linked to the existing
   * verified native account.
   *
   * We intentionally do NOT swallow
   * AdminLinkProviderForUser errors.
   *
   * If linking fails, the OAuth signup must fail rather
   * than allowing Cognito to create a second account.
   */
  event.response.autoConfirmUser = true;
  event.response.autoVerifyEmail = true;

  console.info(
    'Google identity linked successfully',
    {
      requestId: context.awsRequestId,
      provider: GOOGLE_PROVIDER,
      destinationUsername:
        destinationUser.Username,
    },
  );

  return event;
};