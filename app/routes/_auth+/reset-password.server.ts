import { invariant } from "@epic-web/invariant";
import { redirect } from "@remix-run/node";
import { db } from "~/services/drizzle/index.server";
import { verificationSessionStorage } from "~/services/session/verify.server";
import { VERIFICATION_SESSION_KEY } from "./reset-password";
import type { VerifyFunctionArgs } from "./verify.server";

export async function handleVerification({ submission, target }: VerifyFunctionArgs) {
  invariant(submission.status === "success", "Submission should be successfull now");

  const user = await db.query.users.findFirst({
    columns: { email: true, username: true },
    where: (user, { eq, or }) => or(eq(user.email, target), eq(user.username, target)),
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
