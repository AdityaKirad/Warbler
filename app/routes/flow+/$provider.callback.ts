import {
  authenticator,
  createSession,
  prepareVerification,
  redirectWithFlash,
} from "~/.server/authenticator";
import type { AccountSelectType } from "~/.server/drizzle";
import { account, db } from "~/.server/drizzle";
import { sendEmail } from "~/.server/email";
import { providers } from "~/.server/oauth-providers";
import {
  destroyRedirectToHeader,
  getRedirectCookieValue,
} from "~/.server/redirect-cookie";
import { onboardingSessionStorage } from "~/.server/session/onboarding";
import { VerificationMail } from "~/components/verification-mail";
import { redirect } from "react-router";
import type { Route } from "./+types/$provider.callback";
import { handleNewSession } from "./login.server";

export async function loader({ request, params }: Route.LoaderArgs) {
  const provider = providers.find((provider) => provider === params.provider);

  if (!provider) return redirectWithFlash({ error: "Invalid Provider" });

  const authResult = await authenticator.authenticate(provider, request).then(
    (data) => ({ success: true, data }) as const,
    (error) => ({ success: false, error }) as const,
  );

  const redirectTo = await getRedirectCookieValue(request);

  const headers = new Headers();

  headers.append("set-cookie", await destroyRedirectToHeader());

  if (!authResult.success) {
    console.error(authResult.error);
    return redirectWithFlash({
      error: `Invalid ${provider} OAuth Request`,
      headers,
    });
  }

  const { data } = authResult;

  const oauthUser = await findOAuthUser({
    email: data.email,
    providerId: data.providerId,
    provider,
  });

  if (oauthUser) {
    const { accounts, user } = oauthUser;

    const isLinked = accounts.find(
      (account) =>
        account.provider === provider && account.providerId === data.providerId,
    );

    if (!isLinked) {
      try {
        await db
          .insert(account)
          .values({ provider, providerId: data.providerId, userId: user.id });
      } catch {
        throw redirectWithFlash({
          redirectTo,
          headers,
          error: `Something went wrong while logging in with ${provider}. Please try again later.`,
        });
      }
    }

    if (!user.emailVerified) {
      const verification = await prepareVerification({
        target: user.email,
        type: "verify-email",
        data: { id: user.id, username: user.username },
      });

      if (!verification) {
        throw redirectWithFlash({
          redirectTo,
          headers,
          error: `Something went wrong while logging in with ${provider}. Please try again later.`,
        });
      }

      const { code, token } = verification;

      try {
        await sendEmail({
          to: user.email,
          subject: "Verify your email",
          react: VerificationMail({
            code,
            type: "verify-email",
            username: user.username,
          }),
        });
      } catch {
        throw redirectWithFlash({
          headers,
          redirectTo,
          error: `Something went wrong while logging in with ${provider}. Please try again later.`,
        });
      }

      const url = new URL(process.env.URL);

      url.pathname = "/flow/verify";

      if (redirectTo) {
        url.searchParams.set("redirectTo", redirectTo);
      }

      url.searchParams.set("token", token);

      throw redirect(url.toString(), { headers });
    }

    const sessionData = await createSession(request, user.id);

    if (!sessionData)
      return redirectWithFlash({
        headers,
        redirectTo,
        error: `Something went wrong while logging in with ${provider}. Please try again later.`,
      });

    return handleNewSession({ session: sessionData, redirectTo, headers });
  }

  const onboardingSession = await onboardingSessionStorage.getSession();

  onboardingSession.set("data", { provider, ...data });

  headers.append(
    "set-cookie",
    await onboardingSessionStorage.commitSession(onboardingSession),
  );

  throw redirect("/home", {
    headers,
  });
}

async function findOAuthUser({
  email,
  provider,
  providerId,
}: {
  email: string;
  provider: Exclude<AccountSelectType["provider"], "credentials">;
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
