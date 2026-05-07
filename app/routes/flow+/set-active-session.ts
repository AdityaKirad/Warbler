import { getExpirationDate } from "~/.server/authentication";
import {
  createMultiSessionCookieId,
  MULTI_SESSION_COOKIE_PREFIX,
  sessionCookie,
  sessionCookieOptions,
} from "~/.server/cookies/session";
import { db } from "~/.server/drizzle";
import { sessionDataStorage } from "~/.server/session/session-data";
import { createCookie, redirect, redirectDocument } from "react-router";
import type { Route } from "./+types/set-active-session";

export async function action({ request }: Route.ActionArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  const cookie = request.headers.get("cookie");

  if (!token) {
    throw redirect("/login");
  }

  const multiSessionCookie = createCookie(
    `${MULTI_SESSION_COOKIE_PREFIX}${createMultiSessionCookieId(token)}`,
    sessionCookieOptions,
  );

  if (!(await multiSessionCookie.parse(cookie))) {
    throw redirect("/login");
  }

  const session = await db.query.session.findFirst({
    columns: { token: true, updatedAt: true, expiresAt: true },
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          username: true,
          photo: true,
          profileVerified: true,
          onboardingStepsCompleted: true,
        },
      },
    },
    where: (session, { and, eq, gt }) =>
      and(eq(session.token, token), gt(session.expiresAt, new Date())),
  });

  if (!session) {
    throw redirect("/login", {
      headers: {
        "set-cookie": await multiSessionCookie.serialize("", { maxAge: -1 }),
      },
    });
  }

  const sessionData = await sessionDataStorage.getSession(cookie);

  const sessionDataExpiresAt = getExpirationDate(5 * 60);

  sessionData.set("session", {
    session: {
      updatedAt: session.updatedAt.getTime(),
      expiresAt: session.expiresAt.getTime(),
    },
    user: session.user,
  });
  sessionData.set("updatedAt", Date.now());
  sessionData.set("expiresAt", sessionDataExpiresAt.getTime());

  const referer = request.headers.get("referer");

  const headers = new Headers();

  headers.append(
    "set-cookie",
    await sessionCookie.serialize(session.token, {
      expires: session.expiresAt,
    }),
  );
  headers.append(
    "set-cookie",
    await multiSessionCookie.serialize(session.token, {
      expires: session.expiresAt,
    }),
  );
  headers.append(
    "set-cookie",
    await sessionDataStorage.commitSession(sessionData, {
      expires: sessionDataExpiresAt,
    }),
  );

  throw redirectDocument(referer ?? "/home", {
    headers,
  });
}
