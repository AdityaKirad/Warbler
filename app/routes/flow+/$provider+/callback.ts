import { redirectWithFlash } from "~/.server/authentication";
import { cloudinary } from "~/.server/cloudinary";
import {
  oauthCodeVerifierCookie,
  oauthStateCookie,
} from "~/.server/cookies/oauth";
import {
  destroyRedirectToHeader,
  getRedirectCookieValue,
} from "~/.server/cookies/redirect-to";
import type { AccountInsertType, UserInsertType } from "~/.server/drizzle";
import { account, db, user } from "~/.server/drizzle";
import { providers } from "~/.server/oauth-providers";
import {
  createSession,
  generateUsernameSuggestions,
  getIpLocation,
} from "~/.server/utils";
import { handleNewSession } from "../login/login.server";
import type { Route } from "./+types/callback";

export async function loader({ request, params }: Route.LoaderArgs) {
  const provider = providers[params.provider];

  if (!provider) {
    return redirectWithFlash({ error: "Invalid Provider" });
  }

  const result = await provider.handleCallback(request);

  const redirectTo = await getRedirectCookieValue(request);

  const headers = new Headers();

  headers.append("set-cookie", await destroyRedirectToHeader());
  headers.append(
    "set-cookie",
    await oauthStateCookie.serialize(null, { maxAge: -1 }),
  );
  headers.append(
    "set-cookie",
    await oauthCodeVerifierCookie.serialize(null, { maxAge: -1 }),
  );

  if (!result) {
    return redirectWithFlash({
      error: `Invalid ${params.provider} OAuth Request`,
      headers,
    });
  }

  const { email, providerId, ...userData } = result;

  const oauthUser = await findOAuthUser({
    email,
    providerId,
    provider: provider.name,
  });

  if (oauthUser) {
    const { accounts, user } = oauthUser;

    const hasLinked = accounts.find(
      (account) =>
        account.provider === params.provider &&
        account.providerId === providerId,
    );

    if (!hasLinked) {
      try {
        await db
          .insert(account)
          .values({ providerId, provider: provider.name, userId: user.id });
      } catch {
        throw redirectWithFlash({
          redirectTo,
          headers,
          error: `Something went wrong while logging in with ${provider}. Please try again later.`,
        });
      }
    }

    const [session] = await createSession(request, db, user.id);

    if (!session)
      return redirectWithFlash({
        headers,
        redirectTo,
        error: `Something went wrong while logging in with ${provider}. Please try again later.`,
      });

    return handleNewSession({
      session,
      user,
      redirectTo,
      headers,
    });
  }

  const session = await handleOauthSignup(request, {
    accountInfo: {
      providerId,
      provider: provider.name,
    },
    userInfo: {
      email,
      ...userData,
    },
  });

  if (!session) {
    return redirectWithFlash({
      headers,
      redirectTo,
      error: `Something went wrong while logging in with ${provider}. Please try again later.`,
    });
  }

  return handleNewSession({
    headers,
    redirectTo,
    ...session,
  });
}

async function findOAuthUser({
  email,
  provider,
  providerId,
}: {
  email: string;
  provider: string;
  providerId: string;
}) {
  const account = await db.query.account.findFirst({
    where: (account, { and, eq }) =>
      and(eq(account.provider, provider), eq(account.providerId, providerId)),
  });

  if (account) {
    const user = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, account.userId),
    });

    if (user) {
      return {
        user,
        accounts: [account],
      };
    }

    return null;
  }

  const dbUser = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.email, email),
    with: { accounts: true },
  });

  if (dbUser) {
    const { accounts, ...user } = dbUser;
    return {
      user,
      accounts,
    };
  }

  return null;
}

async function handleOauthSignup(
  request: Request,
  {
    accountInfo,
    userInfo,
  }: {
    accountInfo: Pick<AccountInsertType, "provider" | "providerId">;
    userInfo: Pick<
      UserInsertType,
      "email" | "emailVerified" | "photo" | "name"
    >;
  },
) {
  const onboardingStepsCompleted: string[] = [];
  let photo: string;
  if (userInfo.photo) {
    try {
      const result = await cloudinary.uploader.upload(userInfo.photo, {
        folder: "profile-pictures",
        allowed_formats: ["jpg", "png", "webp", ""],
        resource_type: "image",
        transformation: {
          width: 400,
          height: 400,
          crop: "fill",
          gravity: "face",
        },
      });
      photo = result.secure_url;
    } catch (error) {
      console.error("Failed to upload profile picture on cloudinary", error);
    }
    onboardingStepsCompleted.push("profile-photo");
  }
  if (userInfo.emailVerified) {
    onboardingStepsCompleted.push("verify-email");
  }
  return db.transaction(async (tx) => {
    const [username] = await generateUsernameSuggestions(tx, {
      ...userInfo,
      count: 1,
    });

    const [createdUser] = await tx
      .insert(user)
      .values({
        ...userInfo,
        photo,
        onboardingStepsCompleted,
        username: username!,
        location: await getIpLocation(request),
      })
      .returning();

    if (!createdUser) {
      throw new Error("Failed to create user");
    }

    await tx.insert(account).values({
      userId: createdUser.id,
      ...accountInfo,
    });

    const [createdSession] = await createSession(request, tx, createdUser.id);

    if (!createdSession) {
      throw new Error("Failed to create session");
    }

    return { user: createdUser, session: createdSession };
  });
}
