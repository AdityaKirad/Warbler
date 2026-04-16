import {
  createMultiSessionCookieId,
  isMultiSessionCookie,
  MULTI_SESSION_COOKIE_PREFIX,
  sessionCookie,
  sessionCookieOptions,
} from "~/.server/cookies/session";
import { db, session } from "~/.server/drizzle";
import { parseCookies } from "~/.server/utils/parse-cookies";
import { eq } from "drizzle-orm";
import { createCookie, redirect } from "react-router";
import type { Route } from "./+types";

export async function action({ request }: Route.ActionArgs) {
  const cookie = request.headers.get("cookie");

  const referer = request.headers.get("referer");

  const url = new URL(referer ?? "/home", process.env.APP_URL);

  url.searchParams.set("redirectTo", url.pathname + url.search);
  url.pathname = "/flow/login";

  const headers = new Headers();

  const token = await sessionCookie.parse(cookie);

  const multiSessionCookie = createCookie(
    `${MULTI_SESSION_COOKIE_PREFIX}${createMultiSessionCookieId(token)}`,
    sessionCookieOptions,
  );

  if (token) {
    db.delete(session)
      .where(eq(session.token, token))
      .catch((err) => console.error("Failed to delete session:", err));

    headers.append(
      "set-cookie",
      await sessionCookie.serialize("", { maxAge: -1 }),
    );
    headers.append(
      "set-cookie",
      await multiSessionCookie.serialize("", { maxAge: -1 }),
    );
  }

  const cookies = parseCookies(cookie ?? "");

  const tokens = (await Promise.all(
    Array.from(cookies.keys())
      .filter(isMultiSessionCookie)
      .map(async (key) => {
        const mutliSessionCookie = createCookie(key, sessionCookieOptions);
        const token = await mutliSessionCookie.parse(cookie);
        if (!token) {
          headers.append(
            "set-cookie",
            await mutliSessionCookie.serialize(null, { maxAge: -1 }),
          );
        }
        return token;
      })
      .filter(Boolean),
  )) as string[];

  if (!tokens.length) {
    throw redirect(url.toString(), {
      headers,
    });
  }

  const sessions = await db.query.session.findMany({
    columns: { token: true, expiresAt: true },
    where: (session, { and, inArray, gt }) =>
      and(inArray(session.token, tokens), gt(session.expiresAt, new Date())),
  });

  if (!sessions.length) {
    throw redirect(url.toString(), {
      headers,
    });
  }

  const nextSession = sessions[0];

  if (nextSession) {
    headers.append(
      "set-cookie",
      await sessionCookie.serialize(nextSession?.token, {
        expires: nextSession?.expiresAt,
      }),
    );

    throw redirect(referer ?? "/home", {
      headers,
    });
  }

  throw redirect(url.toString(), {
    headers,
  });
}
