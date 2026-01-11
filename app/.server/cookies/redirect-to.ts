import { createCookie } from "react-router";

const redirectCookie = createCookie("redirectTo");
export const destroyRedirectToHeader = () =>
  redirectCookie.serialize("", {
    maxAge: -1,
  });

export function getRedirectCookieHeader(redirectTo: string) {
  if (redirectTo !== "/") {
    throw new Error("Invalid redirect");
  }
  return redirectCookie.serialize(redirectTo, { maxAge: 60 * 10 });
}

export function getRedirectCookieValue(request: Request) {
  return redirectCookie.parse(request.headers.get("cookie")) || null;
}
