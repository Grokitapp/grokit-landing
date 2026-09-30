import type { PreSignUpTriggerHandler } from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminLinkProviderForUserCommand,
  type UserType,
} from "@aws-sdk/client-cognito-identity-provider";

const cognito = new CognitoIdentityProviderClient({});

export const handler: PreSignUpTriggerHandler = async (event) => {
  // Only handle Google sign-ins
  if (event.triggerSource !== "PreSignUp_ExternalProvider") {
    return event;
  }

  const email = event.request.userAttributes.email;
  if (!email) return event;

  const { Users = [] } = await cognito.send(
    new ListUsersCommand({
      UserPoolId: event.userPoolId,
      Filter: `email = "${email}"`,
      Limit: 5,
    })
  );

  const existingPasswordUser = Users.find((u: UserType) => {
    if (!u.Username) return false;

    return (
      u.Username !== event.userName &&
      !u.Username.startsWith("Google_") &&
      !u.Username.startsWith("google_")
    );
  });

  if (existingPasswordUser?.Username) {
    try {
      await cognito.send(
        new AdminLinkProviderForUserCommand({
          UserPoolId: event.userPoolId,

          DestinationUser: {
            ProviderName: "Cognito",
            ProviderAttributeValue: existingPasswordUser.Username,
          },

          SourceUser: {
            ProviderName: "Google",
            ProviderAttributeName: "Cognito_Subject",
            ProviderAttributeValue: event.userName,
          },
        })
      );
    } catch (err) {
      console.log("Account linking skipped:", err);
    }
  }

  event.response.autoConfirmUser = true;
  event.response.autoVerifyEmail = true;

  return event;
};