import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { generateUniqueId } from "~/lib/utils";
import { authenticator, SESSION_EXPIRATION_TIME } from "~/services/authenticator.server";
import { db } from "~/services/db.server";
import { destroyRedirectToHeader, getRedirectCookieValue } from "~/services/redirect-cookie.server";
import { onboardingSessionStorage } from "~/services/session/onboarding.server";
import { verificationSessionStorage } from "~/services/session/verify.server";
import { handleNewSession } from "./login.server";
import { ONBOARDING_SESSION_KEY } from "./onboarding";

export async function loader({ request }: LoaderFunctionArgs) {
  const redirectTo = getRedirectCookieValue(request);

  const authResult = await authenticator.authenticate("google", request, { throwOnError: true }).then(
    (data) => ({ success: true, data }) as const,
    (error) => ({ success: false, error }) as const,
  );

  if (!authResult.success) {
    console.error(authResult.error);
    throw redirect("/login", { headers: { "set-cookie": destroyRedirectToHeader } });
  }

  const { data: profile } = authResult;

  const existingUser = await db.user.findUnique({
    where: {
      email: profile.email.toLowerCase(),
    },
    select: { id: true },
  });

  if (existingUser) {
    const session = await db.session.create({
      data: {
        id: generateUniqueId(),
        userId: existingUser.id,
        expiresAt: SESSION_EXPIRATION_TIME,
      },
      select: { id: true, expiresAt: true },
    });
    return handleNewSession({ session });
  }

  const onboardingSession = await onboardingSessionStorage.getSession();
  const verificationSession = await verificationSessionStorage.getSession();
  verificationSession.set(ONBOARDING_SESSION_KEY, profile.email);
  for (const [key, value] of Object.entries(profile)) {
    onboardingSession.set(key, value);
  }

  const headers = new Headers();
  headers.append("set-cookie", await onboardingSessionStorage.commitSession(onboardingSession));
  headers.append("set-cookie", await verificationSessionStorage.commitSession(verificationSession));

  const redirectURL = redirectTo ? `/flow/google?redirectTo=${redirectTo}` : "/flow/google";

  throw redirect(redirectURL, {
    headers,
  });
}
