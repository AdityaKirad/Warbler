import { redirect } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/services/authenticator.server";
import { getRedirectCookieHeader } from "~/services/redirect-cookie.server";

export const loader = () => redirect("/");

export async function action({ request }: ActionFunctionArgs) {
  try {
    return authenticator.authenticate("google", request);
  } catch (error) {
    if (error instanceof Response) {
      const formData = await request.formData();
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
