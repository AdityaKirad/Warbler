import { and, eq, gt, inArray, sql } from "drizzle-orm";
import { createCookie, redirect } from "react-router";
import { getClientIPAddress } from "remix-utils/get-client-ip-address";
import {
  createSessionToken,
  getSessionExpirationDate,
  getUserAgent,
} from "../authentication";
import {
  isMultiSessionCookie,
  sessionCookie,
  sessionCookieOptions,
} from "../cookies/session";
import type { DrizzleAdapter } from "../drizzle";
import { db } from "../drizzle";
import { session, user } from "../drizzle/schema";
import { sessionDataStorage } from "../session/session-data";
import { getIpLocation } from "./ip-location";
import { parseCookies } from "./parse-cookies";

export const MAX_SESSIONS = 5;

export const createSession = async (
  request: Request,
  adapter: DrizzleAdapter,
  userId: string,
) =>
  adapter
    .insert(session)
    .values({
      userId,
      location: await getIpLocation(request),
      token: createSessionToken(),
      userAgent: getUserAgent(request),
      ipAddress: getClientIPAddress(request),
      expiresAt: getSessionExpirationDate(),
    })
    .returning();

export async function getUsers(request: Request) {
  const cookie = request.headers.get("cookie");

  const activeSessionToken = await sessionCookie.parse(cookie);

  const cookies = parseCookies(cookie ?? "");

  const headers = new Headers();

  const tokens = (
    await Promise.all(
      Array.from(cookies.keys())
        .filter(isMultiSessionCookie)
        .map(async (key) => {
          const multiSessionCookie = createCookie(key, sessionCookieOptions);
          const token = await multiSessionCookie.parse(cookie);
          if (!token) {
            headers.append(
              "set-cookie",
              await multiSessionCookie.serialize("", { maxAge: -1 }),
            );
          }
          return token;
        }),
    )
  ).filter(Boolean) as string[];

  if (!tokens.length) {
    return { headers, sessions: [] };
  }

  const sessions = await db
    .select({
      active: sql<boolean>`${session.token} = ${activeSessionToken}`,
      session: {
        id: session.id,
        token: session.token,
      },
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        photo: user.photo,
        profileVerified: user.profileVerified,
      },
    })
    .from(session)
    .where(
      and(inArray(session.token, tokens), gt(session.expiresAt, new Date())),
    )
    .innerJoin(user, eq(session.userId, user.id))
    .orderBy(sql`1 DESC`);

  return {
    headers,
    sessions,
  };
}

export async function getUser(
  request: Request,
  { getFreshSession = false }: { getFreshSession?: boolean } = {},
) {
  const token = await sessionCookie.parse(request.headers.get("cookie"));

  if (!token) {
    return { clearSessionHeader: null, user: null };
  }

  const dbSession = await db.query.session.findFirst({
    columns: { updatedAt: true, expiresAt: true },
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
    where: (session, { eq }) => eq(session.token, token),
  });

  if (!dbSession || dbSession.expiresAt < new Date()) {
    if (dbSession) {
      void db
        .delete(session)
        .where(eq(session.token, token))
        .catch((err) => console.error("Failed to delete session:", err));
    }

    return {
      clearSessionHeader: await sessionCookie.serialize("", { maxAge: -1 }),
      user: null,
    };
  }

  return {
    user: dbSession.user,
  };
}

export async function requireAnonymous(request: Request) {
  const { user } = await getUser(request);

  if (user) {
    throw redirect("/home");
  }
}

export async function requireUser(request: Request) {
  const { user, clearSessionHeader } = await getUser(request);

  if (!user) {
    const url = new URL(request.url);
    url.searchParams.set("redirectTo", url.pathname + url.search);
    url.pathname = "/flow/login";
    throw redirect(url.toString(), {
      headers: {
        "set-cookie": clearSessionHeader,
      },
    });
  }

  return user;
}
