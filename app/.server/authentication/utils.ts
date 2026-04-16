import { redirect } from "react-router";
import { flashSessionStorage } from "../session/flash";
import { generateRandomString } from "../utils/generate-random-string";

export const createSessionToken = () => generateRandomString(32);

export const getUserAgent = (request: Request) =>
  request.headers.get("user-agent");

export const getExpirationDate = (time = 600) =>
  new Date(Date.now() + time * 1000);

export const getSessionExpirationDate = () =>
  getExpirationDate(30 * 24 * 60 * 60);

export const isDateExpired = (date: Date) =>
  new Date().getTime() > date.getTime();

export async function redirectWithFlash({
  error,
  headers,
  redirectTo,
}: {
  error: string;
  headers?: HeadersInit;
  redirectTo?: string | null;
}) {
  const session = await flashSessionStorage.getSession();

  session.flash("__flash", error);

  headers = new Headers(headers);

  headers.append(
    "set-cookie",
    await flashSessionStorage.commitSession(session),
  );

  redirectTo = redirectTo
    ? `/flow/login?redirectTo=${redirectTo}`
    : "/flow/login";

  throw redirect(redirectTo, {
    headers,
  });
}
