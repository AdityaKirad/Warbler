import { authenticator, redirectWithFlash } from "~/.server/authenticator";
import { providers } from "~/.server/oauth-providers";
import { getRedirectCookieHeader } from "~/.server/redirect-cookie";
import type { Route } from "./+types/$provider";

export async function loader({ request, params }: Route.LoaderArgs) {
  const provider = providers.find((provider) => provider === params.provider);

  if (!provider) return redirectWithFlash({ error: "Invalid Provider" });

  try {
    return authenticator.authenticate(provider, request);
  } catch (error) {
    if (error instanceof Response) {
      const url = new URL(request.url);
      const rawRedirectTo = url.searchParams.get("redirectTo");
      const redirectTo =
        typeof rawRedirectTo === "string"
          ? rawRedirectTo
          : getReferrerRoute(request);
      const redirectToCookie = await getRedirectCookieHeader(redirectTo);
      if (redirectToCookie) {
        error.headers.append("set-cookie", redirectToCookie);
      }
      throw error;
    }
  }
}

function getReferrerRoute(request: Request) {
  const referrer =
    request.headers.get("referer") ??
    request.headers.get("referrer") ??
    request.referrer;
  const domain = process.env.URL;
  return referrer.startsWith(domain) ? referrer.slice(domain.length) : "/";
}
