import type { Submission } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { redirect } from "@remix-run/react";
import { generateUniqueId, getExpirationDate } from "~/lib/utils";
import { db } from "~/services/db.server";
import { verificationSessionStorage } from "~/services/session/verify.server";
import { generateTOTP, verifyTOTP } from "~/services/totp.server";
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
  const verificationData = {
    id: generateUniqueId(),
    type,
    target,
    ...verificationConfig,
    expiresAt: getExpirationDate(),
  };
  await db.verification.upsert({
    where: { target_type: { target, type } },
    create: verificationData,
    update: verificationData,
  });
  const session = await verificationSessionStorage.getSession();
  session.set(targetQueryParam, target);
  session.set(typeQueryParam, type);
  const verificationSession = await verificationSessionStorage.commitSession(session, {
    expires: verificationData.expiresAt,
  });
  return { otp, verificationSession, expiresAt: verificationData.expiresAt };
}

export async function isCodeValid({ otp, target, type }: { otp: string; target: string; type: VerificationType }) {
  const config = await db.verification.findUnique({
    where: { target_type: { target, type }, AND: { expiresAt: { gt: new Date() } } },
    select: { algorithm: true, charSet: true, digits: true, period: true, secret: true },
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

  async function deleteVerification() {
    await db.verification.delete({
      where: {
        target_type: {
          target,
          type,
        },
      },
    });
  }

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
