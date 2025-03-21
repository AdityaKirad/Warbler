import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { getGoogleCodeVerifierCookieHeader } from "~/services/google-code-verifier-cookie.server";
import { getGoogleOauthStateCookieHeader } from "~/services/google-oauth-state-cookie.server";
import { google } from "~/services/google-oauth.server";
import { getRedirectCookieHeader } from "~/services/redirect-cookie.server";
import { generateCodeVerifier, generateState } from "arctic";

export const loader = () => redirect("/");

export async function action({ request }: ActionFunctionArgs) {
  try {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const url = google.createAuthorizationURL(state, codeVerifier, ["openid", "profile", "email"]);

    const headers = new Headers();
    headers.append("set-cookie", getGoogleOauthStateCookieHeader(state));
    headers.append("set-cookie", getGoogleCodeVerifierCookieHeader(codeVerifier));

    throw redirect(url.toString(), {
      status: 302,
      headers,
    });
  } catch (error) {
    if (error instanceof Response) {
      const formData = await error.formData();
      const rawRedirectTo = formData.get("redirectTo");
      const redirectTo = typeof rawRedirectTo === "string" ? rawRedirectTo : getReferrerRoute(request);
      const redirectToCookie = getRedirectCookieHeader(redirectTo);
      if (redirectToCookie) {
        error.headers.append("set-cookie", redirectToCookie);
      }
      throw error;
    }
  }
}

function getReferrerRoute(request: Request) {
  const referrer = request.headers.get("referer") ?? request.headers.get("referrer") ?? request.referrer;
  const host = request.headers.get("X-Forwarded-Host") ?? request.headers.get("host") ?? new URL(request.url).host;
  const protocol = request.headers.get("X-Forwarded-Proto") ?? "http";
  const domain = `${protocol}://${host}`;
  if (referrer?.startsWith(domain)) {
    return referrer.slice(domain.length);
  }
  return "/";
}
