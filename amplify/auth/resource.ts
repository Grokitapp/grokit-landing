import { defineAuth, secret } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: "CODE",
      verificationEmailSubject: "Your Grokit verification code",

      verificationEmailBody: (createCode) => {
        const code = createCode();

        return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Verify your email</title>
</head>

<body style="margin:0;padding:0;background:#F4F6F8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
<tr>
<td align="center">

<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;border:1px solid #E8ECF2;overflow:hidden;box-shadow:0 18px 40px rgba(17,24,39,.08);">

<tr>
<td style="background:#131F24;padding:42px 36px;" align="center">

<div style="font-size:30px;font-weight:800;color:#FF6B00;">
Grokit
</div>

<div style="font-size:15px;color:#A6B3BA;margin-top:8px;">
Personalized AI learning
</div>

</td>
</tr>

<tr>
<td style="padding:42px 36px;">

<h1 style="margin:0;font-size:34px;font-weight:800;color:#111827;text-align:center;">
Verify your email
</h1>

<p style="margin:18px 0 34px;text-align:center;font-size:16px;line-height:1.7;color:#6B7280;">
Use the verification code below to securely verify your Grokit account.
</p>

<div style="text-align:center;margin-bottom:34px;">
<div style="
display:inline-block;
background:#FFF4ED;
border:1px solid #FFD8C2;
border-radius:18px;
padding:20px 36px;
font-size:42px;
font-weight:800;
letter-spacing:12px;
font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
color:#FF6B00;">
${code}
</div>
</div>

<p style="margin:0;font-size:15px;line-height:1.8;color:#374151;text-align:center;">
This verification code expires automatically after a short time.
Never share it with anyone.
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:36px;">
<tr>
<td style="border-top:1px solid #E5E7EB;padding-top:24px;">

<table role="presentation" width="100%">
<tr>

<td align="center" width="33%" style="font-size:13px;color:#6B7280;">
Secure verification
</td>

<td align="center" width="33%" style="font-size:13px;color:#6B7280;">
Personalized profile
</td>

<td align="center" width="33%" style="font-size:13px;color:#6B7280;">
Continue across devices
</td>

</tr>
</table>

</td>
</tr>
</table>

<p style="margin:30px 0 0;text-align:center;font-size:13px;color:#9CA3AF;line-height:1.8;">
If you didn't create a Grokit account, you can safely ignore this email.
</p>

<p style="margin:16px 0 0;text-align:center;">
<a href="https://grokit.app" style="color:#FF6B00;text-decoration:none;font-weight:700;font-size:14px;">
grokit.app
</a>
</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
        `;
      },
    },

    externalProviders: {
      google: {
        clientId: secret("GOOGLE_CLIENT_ID"),
        clientSecret: secret("GOOGLE_CLIENT_SECRET"),
        scopes: ["email", "profile", "openid"],
        attributeMapping: {
          email: "email",
        },
      },

      callbackUrls: [
        "http://localhost:5173/auth/callback",
        "https://grokit.app/auth/callback",
      ],

      logoutUrls: [
        "http://localhost:5173",
        "https://grokit.app",
      ],
    },
  },
});