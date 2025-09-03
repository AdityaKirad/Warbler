import type { Submission } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import type {
  VerificationPayload,
  VerificationType,
} from "~/.server/authenticator";
import {
  createSessionToken,
  getExpirationDate,
  getSessionExpirationDate,
  getSignedToken,
  getUserAgent,
  isDateExpired,
  parseSignedToken,
  prepareVerification,
  verifyHash,
} from "~/.server/authenticator";
import { db, session, user, verification } from "~/.server/drizzle";
import { sendEmail } from "~/.server/email";
import { VerificationMail } from "~/components/verification-mail";
import { and, eq } from "drizzle-orm";
import { redirect } from "react-router";
import { getClientIPAddress } from "remix-utils/get-client-ip-address";
import type { z } from "zod";
import { handleNewSession } from "./login.server";
import { schema } from "./verify";

type SchemaType = typeof schema;

type Intent = "resend" | "verify";

type SubmissionType = Submission<
  z.input<SchemaType>,
  string[],
  z.output<SchemaType>
>;

export function validateRequest(
  request: Request,
  {
    formData,
    redirectTo,
    token,
  }: {
    formData: FormData;
    redirectTo: string | null;
    token: string;
  },
) {
  const submission = parseWithZod(formData, { schema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const { code, intent } = submission.value;

  const payload = parseSignedToken<VerificationPayload>(token);

  if (!payload) {
    return submission.reply({ formErrors: ["Invalid Token"] });
  }

  switch (payload.type) {
    case "signup":
      return handleSignup({ code, intent, payload, redirectTo, submission });
    case "forget-password":
      return handleForgetPassword({ code, intent, payload, submission });
    case "verify-email":
      return handleVerifyEmail({
        code,
        intent,
        payload,
        redirectTo,
        request,
        submission,
      });
  }
}

async function handleSignup({
  code,
  intent,
  payload,
  redirectTo,
  submission,
}: {
  code: string | undefined;
  intent: Intent;
  payload: Extract<VerificationPayload, { type: "signup" }>;
  redirectTo: string | null;
  submission: SubmissionType;
}) {
  switch (intent) {
    case "resend":
      return resendVerification({
        mail: async ({ code, target }) =>
          await sendEmail({
            to: target,
            subject: `${code} is your Warbler verification code`,
            react: VerificationMail({ code, type: "signup" }),
          }),
        payload,
        submission,
      });

    case "verify":
      return finalizeVerification({
        code,
        payload,
        submission,
        onVerified({ payload }) {
          const newToken = getSignedToken({
            data: payload.data,
            target: payload.target,
            verified: true,
            expiresAt: getExpirationDate(24 * 60 * 60),
          });

          const url = new URL(process.env.URL);

          url.pathname = "/flow/onboarding";

          if (redirectTo) {
            url.searchParams.set("redirectTo", redirectTo);
          }

          url.searchParams.set("token", newToken);

          throw redirect(url.toString());
        },
      });
    default:
      return submission.reply({ formErrors: ["Invalid Action"] });
  }
}

async function handleForgetPassword({
  code,
  intent,
  payload,
  submission,
}: {
  code: string | undefined;
  intent: Intent;
  payload: Extract<VerificationPayload, { type: "forget-password" }>;
  submission: SubmissionType;
}) {
  switch (intent) {
    case "resend":
      return resendVerification({
        mail: async ({ code, target }) =>
          await sendEmail({
            to: target,
            subject: "Password reset request",
            react: VerificationMail({
              code,
              type: "forget-password",
              username: (
                payload.data as Extract<
                  VerificationPayload,
                  { type: "forget-password" }
                >["data"]
              ).username,
            }),
          }),
        payload,
        submission,
      });
    case "verify": {
      return finalizeVerification({
        code,
        payload,
        submission,
        onVerified({ payload }) {
          const newToken = getSignedToken({
            data: payload.data,
            target: payload.target,
            verified: true,
            expiresAt: getExpirationDate(24 * 60 * 60),
          });

          throw redirect(
            `/flow/reset-password?token=${encodeURIComponent(newToken)}`,
          );
        },
      });
    }
    default:
      return submission.reply({ formErrors: ["Invalid Action"] });
  }
}

async function handleVerifyEmail({
  code,
  intent,
  payload,
  redirectTo,
  request,
  submission,
}: {
  code: string | undefined;
  intent: Intent;
  payload: Extract<VerificationPayload, { type: "verify-email" }>;
  redirectTo: string | null;
  request: Request;
  submission: SubmissionType;
}) {
  switch (intent) {
    case "resend":
      return resendVerification({
        mail: async ({ code, target }) =>
          await sendEmail({
            to: target,
            subject: "Verify your email address",
            react: VerificationMail({
              code,
              type: "verify-email",
              username: (
                payload.data as Extract<
                  VerificationPayload,
                  { type: "verify-email" }
                >["data"]
              ).username,
            }),
          }),
        payload,
        submission,
      });

    case "verify":
      return finalizeVerification({
        code,
        payload,
        submission,
        async onVerified({ payload, submission }) {
          const userId = (
            payload.data as Extract<
              VerificationPayload,
              { type: "verify-email" }
            >["data"]
          ).id;

          const sessionData = await db.transaction(async (tx) => {
            await tx
              .update(user)
              .set({ emailVerified: true })
              .where(eq(user.id, userId));
            return tx
              .insert(session)
              .values({
                userId,
                token: createSessionToken(),
                userAgent: getUserAgent(request),
                ipAddress: getClientIPAddress(request),
                expiresAt: getSessionExpirationDate(),
              })
              .returning({ token: session.token, expiresAt: session.expiresAt })
              .then((res) => res[0]);
          });

          if (!sessionData)
            return submission.reply({
              formErrors: ["Something went wrong. Please try again later."],
            });

          return handleNewSession({ session: sessionData, redirectTo });
        },
      });

    default:
      return submission.reply({ formErrors: ["Invalid Action"] });
  }
}

async function resendVerification({
  mail,
  payload,
  submission,
}: {
  mail: (args: { code: string; target: string }) => Promise<{ success: true }>;
  payload: VerificationPayload;
  submission: SubmissionType;
}) {
  const verification = await prepareVerification(payload);

  if (!verification)
    return submission.reply({
      formErrors: ["Something went wrong. Please try again later."],
    });

  const { code, token } = verification;

  try {
    await mail({ code, target: payload.target });
  } catch {
    return submission.reply({
      formErrors: ["Something went wrong. Please try again later."],
    });
  }

  throw redirect(`/flow/verify?token=${encodeURIComponent(token)}`);
}

async function finalizeVerification({
  code,
  payload,
  submission,
  onVerified,
}: {
  code: string | undefined;
  payload: VerificationPayload;
  submission: SubmissionType;
  onVerified: (args: {
    payload: VerificationPayload;
    submission: SubmissionType;
  }) => void;
}) {
  if (isDateExpired(new Date(payload.expiresAt))) {
    return submission.reply({ formErrors: ["Invalid Token"] });
  }

  const isValid = await isCodeValid({
    code,
    target: payload.target,
    type: payload.type,
  });

  if (!isValid) {
    return submission.reply({ fieldErrors: { code: ["Invalid Code"] } });
  }

  void db
    .delete(verification)
    .where(
      and(
        eq(verification.target, payload.target),
        eq(verification.type, payload.type),
      ),
    )
    .catch(() => {});

  return onVerified({ payload, submission });
}

async function isCodeValid({
  code,
  target,
  type,
}: {
  code: string | undefined;
  target: string;
  type: VerificationType;
}) {
  const hash = await db.query.verification
    .findFirst({
      columns: { hash: true },
      where: (verification, { and, eq, gt }) =>
        and(
          gt(verification.expiresAt, new Date()),
          eq(verification.target, target),
          eq(verification.type, type),
        ),
    })
    .then((res) => res?.hash);

  if (!hash) {
    return false;
  }

  return verifyHash({ data: code, hash });
}

export function getVerificationToken(request: Request) {
  const url = new URL(request.url);

  const token = url.searchParams.get("token");

  if (!token) {
    url.pathname = "flow/login";
    throw redirect(url.toString());
  }

  return token;
}
