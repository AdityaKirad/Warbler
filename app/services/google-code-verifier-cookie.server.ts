import * as cookie from "cookie";

const key = "google_code_verifier";

export const destroyGoogleCodeVerifierCookie = cookie.serialize(key, "", { maxAge: -1 });

export const getGoogleCodeVerifierCookieHeader = (googleCodeVerifier: string) =>
  cookie.serialize(key, googleCodeVerifier, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    sameSite: "lax",
  });

export function getGoogleCodeVerifierCookieValue(request: Request) {
  const rawCookie = request.headers.get("cookie");
  const parsedCookies = rawCookie ? cookie.parse(rawCookie) : {};
  const googleCodeVerifier = parsedCookies[key];
  return googleCodeVerifier || null;
}
