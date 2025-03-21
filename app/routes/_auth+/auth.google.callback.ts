import { ObjectParser } from "@pilcrowjs/object-parser";
import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { SESSION_EXPIRATION_TIME } from "~/services/authenticator.server";
import { db } from "~/services/drizzle/index.server";
import { sessions } from "~/services/drizzle/schema";
import { getGoogleCodeVerifierCookieValue } from "~/services/google-code-verifier-cookie.server";
import { getGoogleOauthStateCookieValue } from "~/services/google-oauth-state-cookie.server";
import { google } from "~/services/google-oauth.server";
import { destroyRedirectToHeader, getRedirectCookieValue } from "~/services/redirect-cookie.server";
import { onboardingSessionStorage } from "~/services/session/onboarding.server";
import { verificationSessionStorage } from "~/services/session/verify.server";
import type { OAuth2Tokens } from "arctic";
import { decodeIdToken } from "arctic";
import { handleNewSession } from "./login.server";
import { ONBOARDING_SESSION_KEY } from "./onboarding";

export async function loader({ request }: LoaderFunctionArgs) {
  const redirectTo = getRedirectCookieValue(request);

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = getGoogleOauthStateCookieValue(request);
  const codeVerifier = getGoogleCodeVerifierCookieValue(request);

  if (code === null || state === null || storedState === null || codeVerifier === null) {
    return new Response("Please restart the process", {
      status: 400,
      headers: {
        "set-cookie": destroyRedirectToHeader,
      },
    });
  }

  if (state !== storedState) {
    return new Response("Please restart the process", {
      status: 400,
      headers: {
        "set-cookie": destroyRedirectToHeader,
      },
    });
  }

  let tokens: OAuth2Tokens;

  try {
    tokens = await google.validateAuthorizationCode(code, codeVerifier);
  } catch (error) {
    return new Response("Please restart the process", {
      status: 400,
      headers: {
        "set-cookie": destroyRedirectToHeader,
      },
    });
  }

  const claims = decodeIdToken(tokens.idToken());
  const claimsParser = new ObjectParser(claims);

  const profile = {
    name: claimsParser.getString("name"),
    picture: claimsParser.getString("picture"),
    email: claimsParser.getString("email"),
  };

  const existingUser = await db.query.users.findFirst({
    columns: { id: true },
    where: (user, { eq }) => eq(user.email, profile.email.toLowerCase()),
  });

  if (existingUser) {
    const [session] = await db
      .insert(sessions)
      .values({
        userId: existingUser.id,
        expiresAt: SESSION_EXPIRATION_TIME,
      })
      .returning({ id: sessions.id, expiresAt: sessions.expiresAt });
    return handleNewSession({ session });
  }

  const onboardingSession = await onboardingSessionStorage.getSession();
  const verificationSession = await verificationSessionStorage.getSession();
  verificationSession.set(ONBOARDING_SESSION_KEY, profile.email);
  for (const [key, value] of Object.entries(profile)) {
    onboardingSession.set(key, value);
  }

  const headers = new Headers();
  headers.append("set-cookie", await onboardingSessionStorage.commitSession(onboardingSession));
  headers.append("set-cookie", await verificationSessionStorage.commitSession(verificationSession));

  const redirectURL = redirectTo ? `/flow/google?redirectTo=${redirectTo}` : "/flow/google";

  throw redirect(redirectURL, {
    headers,
  });
}
