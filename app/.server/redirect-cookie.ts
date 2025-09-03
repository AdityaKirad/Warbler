import { createCookie } from "react-router";

const redirectCookie = createCookie("redirectTo");
export const destroyRedirectToHeader = () =>
  redirectCookie.serialize("", {
    maxAge: -1,
  });

export function getRedirectCookieHeader(redirectTo?: string) {
  return redirectTo && redirectTo !== "/"
    ? redirectCookie.serialize(redirectTo, { maxAge: 60 * 10 })
    : null;
}

export function getRedirectCookieValue(request: Request) {
  return redirectCookie.parse(request.headers.get("cookie")) || null;
}
