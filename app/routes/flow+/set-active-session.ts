import {
  createMultiSessionCookieId,
  MULTI_SESSION_COOKIE_PREFIX,
  sessionCookie,
  sessionCookieOptions,
} from "~/.server/cookies/session";
import { db } from "~/.server/drizzle";
import { createCookie, redirect, redirectDocument } from "react-router";
import type { Route } from "./+types/set-active-session";

export async function action({ request }: Route.ActionArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    throw redirect("/login");
  }

  const multiSessionCookie = createCookie(
    `${MULTI_SESSION_COOKIE_PREFIX}${createMultiSessionCookieId(token)}`,
    sessionCookieOptions,
  );

  if (!(await multiSessionCookie.parse(request.headers.get("cookie")))) {
    throw redirect("/login");
  }

  const session = await db.query.session.findFirst({
    columns: { token: true, expiresAt: true },
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

  throw redirectDocument(referer ?? "/home", {
    headers,
  });
}
