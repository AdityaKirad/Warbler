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
import {
  isMultiSessionCookie,
  sessionCookieOptions,
} from "~/.server/cookies/session";
import type {
  AccountInsertType,
  UserInsertType,
  UserSelectType,
} from "~/.server/drizzle";
import { account, db, user } from "~/.server/drizzle";
import { providers } from "~/.server/oauth-providers";
import {
  createSession,
  generateUsernameSuggestions,
  getIpLocation,
  MAX_SESSIONS,
} from "~/.server/utils";
import { parseCookies } from "~/.server/utils/parse-cookies";
import type { Cookie } from "react-router";
import { createCookie, redirect } from "react-router";
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
    await oauthStateCookie.serialize("", { maxAge: -1 }),
  );
  headers.append(
    "set-cookie",
    await oauthCodeVerifierCookie.serialize("", { maxAge: -1 }),
  );

  if (!result) {
    return redirectWithFlash({
      error: `Invalid ${params.provider} OAuth Request`,
      headers,
    });
  }

  const cookie = request.headers.get("cookie");

  const cookies = parseCookies(cookie ?? "");

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
              await multiSessionCookie.serialize("", { maxAge: -1 }),
            );
            return null;
          }
          return { token, cookie: multiSessionCookie };
        }),
    )
  ).filter(Boolean) as { cookie: Cookie; token: string }[];

  if (!parsedCookies.length) {
    return loginOrSignupUser(request, {
      ...result,
      headers,
      redirectTo,
      provider: provider.name,
    });
  }

  const sessions = await db.query.session.findMany({
    with: { user: true },
    where: (session, { and, inArray, gt }) =>
      and(
        inArray(
          session.token,
          parsedCookies.map(({ token }) => token),
        ),
        gt(session.expiresAt, new Date()),
      ),
  });

  const sessionTokenSet = new Set(sessions.map((session) => session.token));
  const staleCookies = parsedCookies.filter(
    ({ token }) => !sessionTokenSet.has(token),
  );

  for (const { cookie } of staleCookies) {
    headers.append("set-cookie", await cookie.serialize("", { maxAge: -1 }));
  }

  const existingSession = sessions.find(
    (session) => session.user.email === result.email,
  );

  if (existingSession) {
    return handleNewSession({
      headers,
      redirectTo,
      session: existingSession,
      user: existingSession.user,
    });
  }

  if (sessions.length >= MAX_SESSIONS) {
    throw redirect("/home", {
      headers,
    });
  }

  return loginOrSignupUser(request, {
    ...result,
    headers,
    redirectTo,
    provider: provider.name,
  });
}

async function loginOrSignupUser(
  request: Request,
  {
    email,
    provider,
    providerId,
    headers,
    redirectTo,
    ...userData
  }: {
    provider: string;
    providerId: string;
    headers: HeadersInit;
    redirectTo: string | null;
  } & Pick<UserSelectType, "name" | "email" | "emailVerified" | "photo">,
) {
  const oauthUser = await findOAuthUser({
    email,
    provider,
    providerId,
  });

  if (oauthUser) {
    const { user, linkedAccount } = oauthUser;

    if (!linkedAccount) {
      try {
        await db
          .insert(account)
          .values({ provider, providerId, userId: user.id });
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
      provider,
      providerId,
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
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          username: true,
          photo: true,
          profileVerified: true,
        },
      },
    },
    where: (account, { and, eq }) =>
      and(eq(account.provider, provider), eq(account.providerId, providerId)),
  });

  if (account) {
    const { user, ...linkedAccount } = account;
    if (user) {
      return {
        linkedAccount,
        user,
      };
    }

    return null;
  }

  const user = await db.query.user.findFirst({
    columns: {
      id: true,
      name: true,
      username: true,
      photo: true,
      profileVerified: true,
    },
    where: (user, { eq }) => eq(user.email, email),
  });

  if (user) {
    return {
      user,
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
        allowed_formats: ["jpg", "png", "webp"],
        resource_type: "image",
        transformation: {
          width: 400,
          height: 400,
          crop: "fill",
          gravity: "face",
        },
      });
      photo = result.secure_url;
      onboardingStepsCompleted.push("profile-photo");
    } catch (error) {
      console.error("Failed to upload profile picture on cloudinary", error);
    }
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
      .returning({
        id: user.id,
        name: user.name,
        username: user.username,
        photo: user.photo,
        profileVerified: user.profileVerified,
      });

    if (!createdUser) {
      throw new Error("Failed to create user");
    }

    await tx.insert(account).values({
      userId: createdUser.id,
      ...accountInfo,
    });

    const [session] = await createSession(request, tx, createdUser.id);

    if (!session) {
      throw new Error("Failed to create session");
    }

    return { session, user: createdUser };
  });
}
