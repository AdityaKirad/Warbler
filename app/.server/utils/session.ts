import { redirect } from "react-router";
import { getClientIPAddress } from "remix-utils/get-client-ip-address";
import {
  createSessionToken,
  getSessionExpirationDate,
  getUserAgent,
} from "../authentication";
import { sessionCookie } from "../cookies/session";
import type { DrizzleAdapter } from "../drizzle";
import { db } from "../drizzle";
import * as schema from "../drizzle/schema";
import { getIpLocation } from "./ip-location";

export const createSession = async (
  request: Request,
  adapter: DrizzleAdapter,
  userId: string,
) =>
  adapter
    .insert(schema.session)
    .values({
      userId,
      location: await getIpLocation(request).then((location) =>
        location ? `${location.city}, ${location.region}` : null,
      ),
      token: createSessionToken(),
      userAgent: getUserAgent(request),
      ipAddress: getClientIPAddress(request),
      expiresAt: getSessionExpirationDate(),
    })
    .returning();

export async function getUser(request: Request) {
  const token = await sessionCookie.parse(request.headers.get("cookie"));

  if (!token) {
    return null;
  }

  const session = await db.query.session.findFirst({
    with: { user: true },
    where: (session, { and, eq, gt }) =>
      and(eq(session.token, token), gt(session.expiresAt, new Date())),
  });

  if (!session) {
    return null;
  }

  const { user, ...sessionData } = session;

  return {
    user,
    session: sessionData,
  };
}

export async function requireAnonymous(request: Request) {
  const user = await getUser(request);

  if (user) {
    throw redirect("/home");
  }
}

export async function requireUser(request: Request) {
  const user = await getUser(request);

  if (!user) {
    const url = new URL(request.url);
    throw redirect(
      `/flow/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`,
    );
  }

  return user;
}
