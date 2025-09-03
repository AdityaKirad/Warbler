import { OAuth2Strategy } from "remix-auth-oauth2";
import { z } from "zod";

const schema = z.object({
  sub: z.string(),
  name: z.string(),
  email: z.string().email().toLowerCase(),
  email_verified: z.boolean(),
  picture: z.string().url(),
});

export const googleStrategy = new OAuth2Strategy(
  {
    cookie: {
      name: "oauth2",
      sameSite: "Lax",
      maxAge: 600,
      httpOnly: true,
      secure: true,
    },
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    redirectURI: `${process.env.URL}/flow/google/callback`,
    scopes: [
      "openid",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  },
  async ({ tokens }) => {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`,
      },
    });

    if (!res.ok)
      throw new Error(`Failed to fetch user profile: ${res.statusText}`);

    const data = schema.parse(await res.json());

    return {
      providerId: data.sub,
      name: data.name,
      email: data.email,
      emailVerified: data.email_verified,
      image: data.picture,
    };
  },
);
