import {
  createMultiSessionCookieId,
  MULTI_SESSION_COOKIE_PREFIX,
  sessionCookie,
  sessionCookieOptions,
} from "~/.server/cookies/session";
import type { SessionSelectType, UserSelectType } from "~/.server/drizzle";
import { createCookie, redirect } from "react-router";
import { safeRedirect } from "remix-utils/safe-redirect";

export async function handleNewSession({
  redirectTo,
  session,
  user: _user,
  headers,
}: {
  session: SessionSelectType;
  user: Pick<UserSelectType, "name" | "username" | "photo" | "profileVerified">;
  headers?: HeadersInit;
  redirectTo: string | null;
}): Promise<never> {
  headers = new Headers(headers);

  headers.append(
    "set-cookie",
    await sessionCookie.serialize(session.token, {
      expires: session.expiresAt,
    }),
  );
  headers.append(
    "set-cookie",
    await createCookie(
      `${MULTI_SESSION_COOKIE_PREFIX}${createMultiSessionCookieId(session.token)}`,
      sessionCookieOptions,
    ).serialize(session.token, {
      expires: session.expiresAt,
    }),
  );

  throw redirect(safeRedirect(redirectTo ?? "/home"), { headers });
}
