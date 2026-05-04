import { getExpirationDate } from "~/.server/authentication";
import {
  createMultiSessionCookieId,
  MULTI_SESSION_COOKIE_PREFIX,
  sessionCookie,
  sessionCookieOptions,
} from "~/.server/cookies/session";
import type { SessionSelectType, UserSelectType } from "~/.server/drizzle";
import { sessionDataStorage } from "~/.server/session/session-data";
import { createCookie, redirect } from "react-router";
import { safeRedirect } from "remix-utils/safe-redirect";

export async function handleNewSession({
  session,
  user,
  headers,
  redirectTo,
}: {
  session: Pick<SessionSelectType, "token" | "updatedAt" | "expiresAt">;
  user: Pick<
    UserSelectType,
    "id" | "name" | "username" | "photo" | "profileVerified"
  >;
  headers?: HeadersInit;
  redirectTo: string | null;
}): Promise<never> {
  const sessionData = await sessionDataStorage.getSession();

  sessionData.set("session", {
    session: {
      expiresAt: session.expiresAt.getTime(),
      updatedAt: session.updatedAt.getTime(),
    },
    user,
  });
  sessionData.set("updatedAt", Date.now());
  sessionData.set("expiresAt", getExpirationDate(5 * 60).getTime());

  headers = new Headers(headers);

  headers.append(
    "set-cookie",
    await sessionCookie.serialize(session.token, {
      expires: session.expiresAt,
    }),
  );
  headers.append(
    "set-cookie",
    await sessionDataStorage.commitSession(sessionData),
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
