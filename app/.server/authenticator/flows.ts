import { eq } from "drizzle-orm";
import { Authenticator } from "remix-auth";
import { getClientIPAddress } from "remix-utils/get-client-ip-address";
import type { AccountInsertType, UserInsertType } from "../drizzle";
import { account, db, session, user } from "../drizzle";
import { discordStrategy, googleStrategy } from "../oauth-providers";
import { generateHash, verifyHash } from "./password";
import {
  createSession,
  createSessionToken,
  getSessionExpirationDate,
  getUserAgent,
} from "./utils";

export const authenticator = new Authenticator<{
  providerId: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
}>();

authenticator.use(googleStrategy, "google");
authenticator.use(discordStrategy, "discord");

export async function login({
  identifier,
  password,
  request,
}: {
  identifier: string;
  password: string;
  request: Request;
}) {
  const user = await db.query.user.findFirst({
    with: { accounts: true },
    where: (user, { eq, or }) =>
      or(eq(user.email, identifier), eq(user.username, identifier)),
  });

  if (!user) {
    await generateHash(password);
    return null;
  }

  const { accounts } = user;

  const account = accounts.find(
    (account) => account.provider === "credentials",
  );

  if (!account?.password) return null;

  const isValid = await verifyHash({ data: password, hash: account.password });

  if (!isValid) return null;

  return createSession(request, user.id);
}

export function signup(
  request: Request,
  {
    accountInfo,
    userInfo,
  }: {
    accountInfo:
      | { provider: "credentials"; password: string }
      | {
          provider: Exclude<AccountInsertType["provider"], "credentials">;
          providerId: string;
        };
    userInfo: Omit<UserInsertType, "id" | "createdAt" | "updatedAt">;
  },
) {
  return db.transaction(async (tx) => {
    const createdUser = await tx
      .insert(user)
      .values(userInfo)
      .returning({ id: user.id })
      .then((res) => res[0]);

    if (!createdUser) return null;

    await tx.insert(account).values({
      provider: accountInfo.provider,
      password:
        accountInfo.provider === "credentials"
          ? await generateHash(accountInfo.password)
          : null,
      providerId:
        accountInfo.provider === "credentials"
          ? createdUser.id
          : accountInfo.providerId,
      userId: createdUser.id,
    });

    return tx
      .insert(session)
      .values({
        token: createSessionToken(),
        userId: createdUser.id,
        userAgent: getUserAgent(request),
        ipAddress: getClientIPAddress(request),
        expiresAt: getSessionExpirationDate(),
      })
      .returning({ token: session.token, expiresAt: session.expiresAt })
      .then((res) => res[0]);
  });
}

export const resetPassword = async ({
  userId,
  password,
}: {
  userId: string;
  password: string;
}) => {
  const existingAccountId = await db.query.account
    .findFirst({
      columns: { id: true },
      where: (account, { and, eq }) =>
        and(
          eq(account.provider, "credentials"),
          eq(account.providerId, userId),
        ),
    })
    .then((res) => res?.id);

  return existingAccountId
    ? db
        .update(account)
        .set({ password: await generateHash(password) })
        .where(eq(account.id, existingAccountId))
    : db.insert(account).values({
        userId,
        password: await generateHash(password),
        provider: "credentials",
        providerId: userId,
      });
};
