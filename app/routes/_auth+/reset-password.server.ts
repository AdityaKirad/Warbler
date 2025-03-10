import { invariant } from "@epic-web/invariant";
import { redirect } from "@remix-run/node";
import { db } from "~/services/db.server";
import { verificationSessionStorage } from "~/services/session/verify.server";
import { VERIFICATION_SESSION_KEY } from "./reset-password";
import type { VerifyFunctionArgs } from "./verify.server";

export async function handleVerification({ submission, target }: VerifyFunctionArgs) {
  invariant(submission.status === "success", "Submission should be successfull now");

  const user = await db.user.findFirst({
    where: {
      OR: [{ username: target }, { email: target }],
    },
    select: { email: true, username: true },
  });

  if (!user) {
    return submission.reply({ fieldErrors: { otp: ["Invalid code"] } });
  }

  const session = await verificationSessionStorage.getSession();
  session.set(VERIFICATION_SESSION_KEY, user.email);
  throw redirect("/reset-password", {
    headers: {
      "set-cookie": await verificationSessionStorage.commitSession(session),
    },
  });
}
