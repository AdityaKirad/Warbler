import * as cookie from "cookie";

const key = "google_oauth_state";

export const destroyGoogleOauthStateCookie = cookie.serialize(key, "", { maxAge: -1 });

export const getGoogleOauthStateCookieHeader = (googleOauthState: string) =>
  cookie.serialize(key, googleOauthState, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    sameSite: "lax",
  });

export function getGoogleOauthStateCookieValue(request: Request) {
  const rawCookie = request.headers.get("cookie");
  const parsedCookies = rawCookie ? cookie.parse(rawCookie) : {};
  const googleOauthState = parsedCookies[key];
  return googleOauthState || null;
}
