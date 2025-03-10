import { invariant } from "@epic-web/invariant";
import { redirect } from "@remix-run/node";
import { commitSession, getOnboardingSession } from "~/services/session/onboarding.server";
import { verificationSessionStorage } from "~/services/session/verify.server";
import { ONBOARDING_SESSION_KEY } from "./onboarding";
import { type VerifyFunctionArgs } from "./verify.server";

export async function handleVerification({ request, submission, target }: VerifyFunctionArgs) {
  invariant(submission.status === "success", "Submission should be successfull now");

  const { redirectTo } = submission.value;

  const verifySession = await verificationSessionStorage.getSession();
  const onboardingSession = await getOnboardingSession(request);

  verifySession.set(ONBOARDING_SESSION_KEY, target);

  const redirectURL = redirectTo ? `/onboarding?redirectTo=${redirectTo}` : "/onboarding";

  const headers = new Headers();
  headers.append("set-cookie", await verificationSessionStorage.commitSession(verifySession));
  headers.append("set-cookie", await commitSession(onboardingSession));

  throw redirect(redirectURL, {
    headers,
  });
}
