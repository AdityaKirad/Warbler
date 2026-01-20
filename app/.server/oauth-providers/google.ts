import type { OAuth2Tokens } from "arctic";
import { generateCodeVerifier, generateState, Google } from "arctic";
import { redirect } from "react-router";
import { z } from "zod";
import type { Provider } from ".";
import { oauthCodeVerifierCookie, oauthStateCookie } from "../cookies/oauth";
import { getRedirectCookieHeader } from "../cookies/redirect-to";

const schema = z.object({
  sub: z.string(),
  name: z.string(),
  email: z.string().email().toLowerCase(),
  email_verified: z.boolean(),
  picture: z.string().url(),
});

const google = new Google(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.URL}/flow/google/callback`,
);

export const GoogleProvider: Provider = {
  name: "google",
  async generateAuth(request) {
    let url = new URL(request.url);

    const redirectTo = url.searchParams.get("redirectTo");
    const state = generateState();
    const codeVerifier = generateCodeVerifier();

    url = google.createAuthorizationURL(state, codeVerifier, [
      "openid",
      "profile",
      "email",
    ]);

    const headers = new Headers();

    if (redirectTo) {
      headers.append("set-cookie", await getRedirectCookieHeader(redirectTo));
    }

    headers.append("set-cookie", await oauthStateCookie.serialize(state));
    headers.append(
      "set-cookie",
      await oauthCodeVerifierCookie.serialize(codeVerifier),
    );

    throw redirect(url.toString(), { headers });
  },
  async handleCallback(request: Request) {
    const cookieHeader = request.headers.get("cookie");
    const { code, state } = Object.fromEntries(
      new URL(request.url).searchParams,
    );
    const storedState = await oauthStateCookie.parse(cookieHeader);
    const codeVerifier = await oauthCodeVerifierCookie.parse(cookieHeader);

    if (
      !code ||
      !state ||
      !storedState ||
      !codeVerifier ||
      state !== storedState
    ) {
      return null;
    }

    let tokens: OAuth2Tokens;

    try {
      tokens = await google.validateAuthorizationCode(code, codeVerifier);
    } catch (error) {
      console.error("Failed to validate oauth code: ", error);
      return null;
    }

    const response = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken()}`,
        },
      },
    );

    if (!response.ok) {
      console.error("Failed to fetch user profile: ", response.statusText);
      return null;
    }

    const user = schema.safeParse(await response.json());

    if (!user.success) {
      console.error("Failed to parse user profile: ", user.error);
      return null;
    }

    const { sub, email_verified, picture, ...values } = user.data;

    return {
      providerId: sub,
      emailVerified: email_verified,
      photo: picture,
      ...values,
    };
  },
};
