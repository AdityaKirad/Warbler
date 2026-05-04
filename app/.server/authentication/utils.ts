import { redirect } from "react-router";
import { flashSessionStorage } from "../session/flash";

export const SESSION_EXPIRES_AGE = 30 * 24 * 60 * 60;
export const SESSION_UPDATE_AGE = 15 * 24 * 60 * 60;

export const getExpirationDate = (time = 600) =>
  new Date(Date.now() + time * 1000);

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
