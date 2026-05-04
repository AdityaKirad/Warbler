import type { Cookie } from "react-router";
import { createCookie } from "react-router";
import { isMultiSessionCookie, sessionCookieOptions } from "../cookies/session";
import type {
  SessionSelectType,
  UserInsertType,
  UserSelectType,
} from "../drizzle";
import { account, db, user } from "../drizzle";
import {
  createSession,
  generateUsernameSuggestions,
  MAX_SESSIONS,
} from "../utils";
import { parseCookies } from "../utils/parse-cookies";
import { getPasswordHash, verifyPassword } from "./password";

export const CREDENTIAL_PROVIDER_KEY = "credential";

export async function resolveLoginMethod(identifier: string) {
  const user = await db.query.user.findFirst({
    columns: { email: true },
    where: (user, { eq, or }) =>
      or(eq(user.email, identifier), eq(user.username, identifier)),
  });

  if (!user) {
    return null;
  }

  const type = user.email === identifier ? "Email" : "Username";

  return {
    identifier,
    type,
    method: CREDENTIAL_PROVIDER_KEY,
  };
}

export async function login(
  request: Request,
  {
    identifier,
    password,
  }: {
    identifier: string;
    password: string;
  },
): Promise<
  | { headers: HeadersInit; sessionCapReached: true }
  | {
      headers: HeadersInit;
      session: SessionSelectType;
      user: UserSelectType;
      sessionCapReached?: never;
    }
  | null
> {
  const dbUser = await db.query.user.findFirst({
    with: { accounts: true },
    where: (user, { eq, or }) =>
      or(eq(user.email, identifier), eq(user.username, identifier)),
  });

  if (!dbUser) {
    await getPasswordHash(password);
    return null;
  }

  const { accounts, ...user } = dbUser;

  const account = accounts.find(
    (account) => account.provider === CREDENTIAL_PROVIDER_KEY,
  );

  if (!account?.password) {
    await getPasswordHash(password);
    return null;
  }

  const isValid = await verifyPassword({ password, hash: account.password });

  if (!isValid) {
    return null;
  }

  const cookie = request.headers.get("cookie");

  const cookies = parseCookies(cookie ?? "");

  const headers = new Headers();

  const parsedCookies = (
    await Promise.all(
      Array.from(cookies.keys())
        .filter(isMultiSessionCookie)
        .map(async (key) => {
          const multiSessionCookie = createCookie(key, sessionCookieOptions);
          const token = await multiSessionCookie.parse(cookie);
          if (!token) {
            headers.append(
              "set-cookie",
              await multiSessionCookie.serialize(null, { maxAge: -1 }),
            );
            return null;
          }
          return { token, cookie: multiSessionCookie };
        }),
    )
  ).filter(Boolean) as { cookie: Cookie; token: string }[];

  if (!parseCookies.length) {
    const [session] = await createSession(request, db, user.id);

    if (!session) {
      throw new Error("Failed to create session");
    }

    return { headers, session, user };
  }

  const sessions = await db.query.session.findMany({
    where: (session, { and, inArray, gt }) =>
      and(
        inArray(
          session.token,
          parsedCookies.map(({ token }) => token),
        ),
        gt(session.expiresAt, new Date()),
      ),
  });

  const sessionsTokenSet = new Set(sessions.map((session) => session.token));
  const staleCookies = parsedCookies.filter(
    ({ token }) => !sessionsTokenSet.has(token),
  );

  for (const { cookie } of staleCookies) {
    headers.append("set-cookie", await cookie.serialize(null, { maxAge: -1 }));
  }

  const existingSession = sessions.find(
    (session) => session.userId === user.id,
  );

  if (existingSession) {
    return { headers, user, session: existingSession };
  }

  if (sessions.length >= MAX_SESSIONS) {
    return { headers, sessionCapReached: true };
  }

  const [session] = await createSession(request, db, user.id);

  if (!session) {
    throw new Error("Failed to create session");
  }

  return { headers, session, user };
}

export function signup(
  request: Request,
  {
    password,
    userInfo,
  }: {
    password: string;
    userInfo: Pick<UserInsertType, "name" | "email" | "emailVerified"> & {
      dob: Date;
    };
  },
) {
  return db.transaction(async (tx) => {
    const [username] = await generateUsernameSuggestions(tx, {
      ...userInfo,
      count: 1,
    });

    const [createdUser] = await tx
      .insert(user)
      .values({
        username: username!,
        onboardingStepsCompleted: ["dob", "verify-email"],
        ...userInfo,
      })
      .returning();

    if (!createdUser) {
      throw new Error("Failed to create user");
    }

    await tx.insert(account).values({
      userId: createdUser.id,
      provider: CREDENTIAL_PROVIDER_KEY,
      providerId: createdUser.id,
      password: await getPasswordHash(password),
    });

    const [createdSession] = await createSession(request, tx, createdUser.id);

    if (!createdSession) {
      throw new Error("Failed to create session");
    }

    return { user: createdUser, session: createdSession };
  });
}

export async function resetPassword({
  userId,
  password,
}: {
  userId: string;
  password: string;
}) {
  password = await getPasswordHash(password);

  return db
    .insert(account)
    .values({
      userId,
      password,
      provider: CREDENTIAL_PROVIDER_KEY,
      providerId: userId,
    })
    .onConflictDoUpdate({
      set: {
        password,
      },
      target: [account.provider, account.providerId],
    });
}
