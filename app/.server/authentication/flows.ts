import type { UserInsertType } from "../drizzle";
import { account, db, user } from "../drizzle";
import { createSession, generateUsernameSuggestions } from "../utils";
import { getPasswordHash, verifyPassword } from "./password";

export const credentialProviderKey = "credential";

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
    method: credentialProviderKey,
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
) {
  const user = await db.query.user.findFirst({
    with: { accounts: true },
    where: (user, { eq, or }) =>
      or(eq(user.email, identifier), eq(user.username, identifier)),
  });

  if (!user) {
    await getPasswordHash(password);
    return null;
  }

  const { accounts, ...userData } = user;

  const account = accounts.find(
    (account) => account.provider === credentialProviderKey,
  );

  if (!account?.password) {
    return null;
  }

  const isValid = await verifyPassword({ password, hash: account.password });

  if (!isValid) {
    return null;
  }

  const [session] = await createSession(request, db, user.id);

  if (!session) {
    throw new Error("Failed to create session");
  }

  return { user: userData, session };
}

export function signup(
  request: Request,
  {
    password,
    userInfo,
  }: {
    password: string;
    userInfo: Pick<UserInsertType, "name" | "email" | "emailVerified" | "dob">;
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
        onboardingStepsCompleted: ['dob', 'verify-email'],
        ...userInfo,
      })
      .returning();

    if (!createdUser) {
      throw new Error("Failed to create user");
    }

    await tx.insert(account).values({
      userId: createdUser.id,
      provider: credentialProviderKey,
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
      provider: credentialProviderKey,
      providerId: userId,
    })
    .onConflictDoUpdate({
      set: {
        password,
      },
      target: [account.provider, account.providerId],
    });
}
