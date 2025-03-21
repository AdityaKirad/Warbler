import type { Submission } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { redirect } from "@remix-run/react";
import { getExpirationDate } from "~/lib/utils";
import { db } from "~/services/drizzle/index.server";
import { verifications } from "~/services/drizzle/schema";
import { verificationSessionStorage } from "~/services/session/verify.server";
import { generateTOTP, verifyTOTP } from "~/services/totp.server";
import { and, eq } from "drizzle-orm";
import type { z } from "zod";
import { ONBOARDING_SESSION_KEY } from "./onboarding";
import { handleVerification as handleOnboardingVerification } from "./onboarding.server";
import { handleVerification as handleResetPasswordVerification } from "./reset-password.server";
import { targetQueryParam, typeQueryParam, VerificationSchema, type VerificationType } from "./verify";

export type VerifyFunctionArgs = {
  request: Request;
  submission: Submission<z.input<typeof VerificationSchema>, string[], z.output<typeof VerificationSchema>>;
  target: string;
};

export async function prepareVerification({
  period,
  target,
  type,
}: {
  period: number;
  request: Request;
  target: string;
  type: VerificationType;
}) {
  const { otp, ...verificationConfig } = await generateTOTP({
    algorithm: "SHA-256",
    period,
  });
  const expiresAt = getExpirationDate();
  await db
    .insert(verifications)
    .values({ target, type, expiresAt, ...verificationConfig })
    .onConflictDoUpdate({
      target: [verifications.target, verifications.type],
      set: { expiresAt, ...verificationConfig },
    });
  const session = await verificationSessionStorage.getSession();
  session.set(targetQueryParam, target);
  session.set(typeQueryParam, type);
  const verificationSession = await verificationSessionStorage.commitSession(session, {
    expires: expiresAt,
  });
  return { otp, verificationSession, expiresAt };
}

export async function isCodeValid({ otp, target, type }: { otp: string; target: string; type: VerificationType }) {
  const config = await db.query.verifications.findFirst({
    columns: { createdAt: false, expiresAt: false, target: false, type: false },
    where: (verification, { and, eq, gt }) =>
      and(gt(verification.expiresAt, new Date()), eq(verification.target, target), eq(verification.type, type)),
  });
  if (!config) return false;
  const isValid = await verifyTOTP({ otp, ...config });
  return isValid ? true : false;
}

export async function validateRequest({
  request,
  body,
  target,
  type,
}: {
  body: FormData;
  target: string;
  type: VerificationType;
  request: Request;
}) {
  const submission = await parseWithZod(body, {
    schema: VerificationSchema.superRefine(async (data, ctx) => {
      const isValid = await isCodeValid({
        otp: data.otp,
        target,
        type,
      });
      if (!isValid) {
        ctx.addIssue({
          code: "custom",
          path: ["otp"],
          message: "Invalid code",
        });
        return;
      }
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return submission.reply({ formErrors: ["Invalid code"] });
  }

  const deleteVerification = () =>
    db.delete(verifications).where(and(eq(verifications.target, target), eq(verifications.type, type)));

  switch (type) {
    case "onboarding":
      await deleteVerification();
      return handleOnboardingVerification({ request, submission, target });
    case "reset-password":
      await deleteVerification();
      return handleResetPasswordVerification({ request, submission, target });
  }
}

export async function getOnboardingUserEmail(request: Request) {
  const session = await verificationSessionStorage.getSession(request.headers.get("Cookie"));
  const email = session.get(ONBOARDING_SESSION_KEY);
  if (typeof email !== "string" || !email) {
    const redirectTo = new URL(request.url).searchParams.get("redirectTo");
    const redirectURL = redirectTo ? `/login?redirectTo=${redirectTo}` : "/login";
    throw redirect(redirectURL);
  }
  return email;
}
