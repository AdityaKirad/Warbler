import cryto from "node:crypto";
import type { Password, User } from "@prisma/client";
import { redirect } from "@remix-run/node";
import { generateUniqueId, getExpirationDate } from "~/lib/utils";
import bcrypt from "bcryptjs";
import { Authenticator } from "remix-auth";
import { GoogleStrategy } from "remix-auth-google";
import { db } from "./db.server";
import { authSessionStorage, getAuthSession } from "./session/auth.server";
import { oauthProviderSessionStorage } from "./session/oauth-provider.server";

export const SESSION_EXPIRATION_TIME = getExpirationDate(7 * 24 * 60 * 60);

export const authenticator = new Authenticator<{
  name: string;
  email: string;
  image: string;
}>(oauthProviderSessionStorage);

const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.URL}/auth/google/callback`,
    prompt: "consent",
  },
  async ({ profile }) => {
    return {
      name: [profile.name.givenName, profile.name.middleName, profile.name.familyName].filter(Boolean).join(" "),
      email: profile.emails[0].value,
      image: profile.photos[0].value,
    };
  },
);

authenticator.use(googleStrategy);

export async function getUserId(request: Request, { redirectTo }: { redirectTo?: string | null } = {}) {
  const { session: authSession, sessionId } = await getAuthSession(request);
  if (!sessionId) return null;
  const session = await db.session.findUnique({
    where: { id: sessionId, expiresAt: { gt: new Date() } },
    select: { userId: true },
  });
  if (!session?.userId) {
    const loginRedirect = getLoginRedirectURI(request, { redirectTo });
    throw redirect(loginRedirect, {
      headers: {
        "Set-Cookie": await authSessionStorage.destroySession(authSession),
      },
    });
  }
  return session.userId;
}

export async function requireAnonymous(request: Request) {
  const user = await getUserId(request);
  if (user) {
    throw redirect("/home");
  }
}

export async function requireUserId(request: Request) {
  const redirectTo = new URL(request.url).pathname;
  const user = await getUserId(request, { redirectTo });
  if (!user) {
    const loginURI = getLoginRedirectURI(request, { redirectTo });
    throw redirect(loginURI);
  }
  return user;
}
export async function login({
  identifier,
  password,
}: {
  identifier: User["username"] | User["email"];
  password: Password["hash"];
}) {
  const user = await verifyUserWithPassword({ identifier, password });

  if (!user) return null;

  return db.session.create({
    data: {
      id: generateUniqueId(),
      userId: user.id,
      expiresAt: SESSION_EXPIRATION_TIME,
    },
    select: { id: true, expiresAt: true },
  });
}

export async function logout(request: Request) {
  const { session, sessionId } = await getAuthSession(request);

  if (sessionId) {
    void db.session
      .deleteMany({
        where: { id: sessionId },
      })
      .catch(() => {});
  }

  throw redirect("/login", {
    headers: {
      "Set-Cookie": await authSessionStorage.destroySession(session),
    },
  });
}

export async function signup({
  password,
  ...profile
}: Pick<User, "name" | "username" | "dob" | "email" | "image"> & { password: string }) {
  return db.session.create({
    data: {
      id: generateUniqueId(),
      expiresAt: SESSION_EXPIRATION_TIME,
      user: {
        create: {
          id: generateUniqueId(),
          ...profile,
          password: {
            create: {
              hash: await getPasswordHash(password),
            },
          },
        },
      },
    },
    select: { id: true, expiresAt: true },
  });
}

function getLoginRedirectURI(request: Request, { redirectTo }: { redirectTo?: string | null }) {
  const requestUrl = new URL(request.url);
  redirectTo = redirectTo === null ? null : (redirectTo ?? `${requestUrl.pathname}${requestUrl.search}`);
  const loginParams = redirectTo ? new URLSearchParams({ redirectTo }) : null;
  const loginRedirect = ["/login", loginParams?.toString()].filter(Boolean).join("?");
  return loginRedirect;
}

const getPasswordHash = (password: string) => bcrypt.hash(password, 10);

async function verifyUserWithPassword({ identifier, password }: { identifier: string; password: Password["hash"] }) {
  const userWithPassword = await db.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
    select: { id: true, password: { select: { hash: true } } },
  });

  if (!userWithPassword || !userWithPassword.password) {
    return null;
  }

  const isValid = await bcrypt.compare(password, userWithPassword.password.hash);

  if (!isValid) {
    return null;
  }

  return { id: userWithPassword.id };
}

export async function resetPassword({ email, password }: { email: string; password: string }) {
  const hash = await getPasswordHash(password);
  return db.user.update({
    where: { email },
    data: {
      password: {
        upsert: {
          create: { hash },
          update: { hash },
        },
      },
    },
  });
}

export async function checkCommonPassword(password: string) {
  const hash = cryto.createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
  const [prefix, suffix] = [hash.slice(0, 5), hash.slice(5)];
  const controller = new AbortController();

  try {
    const timeout = setTimeout(() => controller.abort(), 1000);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${encodeURIComponent(prefix)}`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`PwnedPasswords API responded with ${res.status} status`);
      return false;
    }

    const data = await res.text();

    return data.split("/\r?\n/").some((line) => line.includes(suffix));
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn("Password check timed out");
    } else {
      console.warn("Unknown error occurred while checking password", error);
    }
    return false;
  }
}
