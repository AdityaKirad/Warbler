import crypto from "node:crypto";
import { redirect } from "react-router";
import { getClientIPAddress } from "remix-utils/get-client-ip-address";
import { db, session } from "../drizzle";
import { authSessionStorage } from "../session/auth-session";
import { flashSessionStorage } from "../session/flash";

export const createToken = (size: number) =>
  crypto.randomBytes(size).toString("hex");

export const createSessionToken = () => createToken(32);

export const getUserAgent = (request: Request) =>
  request.headers.get("user-agent");

export const getExpirationDate = (time = 600) =>
  new Date(Date.now() + time * 1000);

export const getSessionExpirationDate = () =>
  getExpirationDate(30 * 24 * 60 * 60);

export const isDateExpired = (date: Date) =>
  new Date().getTime() > date.getTime();

export const createSession = (request: Request, userId: string) =>
  db
    .insert(session)
    .values({
      userId,
      token: createSessionToken(),
      userAgent: getUserAgent(request),
      ipAddress: getClientIPAddress(request),
      expiresAt: getSessionExpirationDate(),
    })
    .returning({ token: session.token, expiresAt: session.expiresAt })
    .then((res) => res[0]);

function getSignature(data: string) {
  return crypto
    .createHmac("sha256", process.env.AUTH_SECRET)
    .update(data)
    .digest("hex");
}

export function getSignedToken(data: object) {
  const signature = getSignature(JSON.stringify(data));

  return btoa(JSON.stringify({ ...data, signature }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function parseSignedToken<T extends object>(token: string) {
  let base64 = token.replace(/-/g, "+").replace(/_/g, "/");

  while (base64.length % 4) {
    base64 += "=";
  }

  try {
    const { signature, ...payload } = JSON.parse(atob(base64));

    const expectedSignature = getSignature(JSON.stringify(payload));

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    )
      ? (payload as T)
      : null;
  } catch {
    return null;
  }
}

export async function getUser(request: Request) {
  const authSession = await authSessionStorage.getSession(
    request.headers.get("cookie"),
  );

  const token = authSession.get("token");

  if (!token) {
    return null;
  }

  const session = await db.query.session.findFirst({
    columns: { userId: true },
    where: (session, { and, eq, gt }) =>
      and(eq(session.token, token), gt(session.expiresAt, new Date())),
  });

  if (!session?.userId) {
    throw redirect("/flow/login", {
      headers: {
        "set-cookie": await authSessionStorage.destroySession(authSession),
      },
    });
  }

  return session.userId;
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

export async function redirectWithFlash({
  error,
  headers,
  redirectTo,
}: {
  error: string;
  headers?: HeadersInit;
  redirectTo?: string;
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
