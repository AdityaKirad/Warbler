import { createCookieSessionStorage } from "@remix-run/node";
import { getExpirationDate } from "~/lib/utils";

type SessionData = {
  sessionId: string;
  expires: Date;
};

type SessionFlashData = {
  error: string;
};

export const authSessionStorage = createCookieSessionStorage<SessionData, SessionFlashData>({
  cookie: {
    name: "__session",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60,
    secrets: process.env.SESSION_SECRET.split(","),
    secure: process.env.NODE_ENV === "production",
  },
});

const originalCommitSession = authSessionStorage.commitSession;

Object.defineProperty(authSessionStorage, "commitSession", {
  value: async function commitSession(...args: Parameters<typeof originalCommitSession>) {
    const [session, options] = args;

    if (options?.expires) {
      session.set("expires", options.expires);
    }

    if (options?.maxAge) {
      session.set("expires", getExpirationDate(options.maxAge));
    }

    const expires = session.has("expires") ? new Date(session.get("expires")!) : undefined;

    const setCookieHeader = await originalCommitSession(session, {
      ...options,
      expires,
    });

    return setCookieHeader;
  },
});

export const sessionKey = "sessionId";

export async function getAuthSession(request: Request) {
  const session = await authSessionStorage.getSession(request.headers.get("Cookie"));
  const sessionId = session.get(sessionKey);
  return { session, sessionId };
}
