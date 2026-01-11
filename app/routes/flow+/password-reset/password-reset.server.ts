import { parseWithZod } from "@conform-to/zod";
import {
  createVerification,
  isDateExpired,
  resetPassword,
} from "~/.server/authentication";
import { db } from "~/.server/drizzle";
import { sendEmail } from "~/.server/email";
import { flashSessionStorage } from "~/.server/session/flash";
import { VerificationMail } from "~/components/verification-mail";
import {
  IdentifierSchema,
  PasswordAndConfirmPasswordSchema,
} from "~/lib/user-validation";
import { base64url } from "~/lib/utils";
import { redirect } from "react-router";
import { z } from "zod";
import { getVerificationToken } from "../verify/verify.server";

export async function handleIdentify(request: Request, formData: FormData) {
  const submission = await parseWithZod(formData, {
    schema: (intent) =>
      IdentifierSchema.transform(async (data, ctx) => {
        if (intent !== null) {
          return {
            ...data,
            user: null,
          };
        }

        const user = await db.query.user.findFirst({
          columns: { id: true, email: true, username: true },
          where: (user, { eq, or }) =>
            or(
              eq(user.email, data.identifier),
              eq(user.username, data.identifier),
            ),
        });

        if (!user) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "No account with following credentials",
            path: ["identifier"],
          });
          return z.NEVER;
        }

        return { ...data, user };
      }),
    async: true,
  });

  if (submission.status !== "success" || !submission.value.user) {
    return submission.reply();
  }

  const { user } = submission.value;

  const verification = await createVerification({
    target: user.email,
    type: "password-reset",
    data: { userId: user.id },
  });

  if (!verification) {
    return submission.reply({
      formErrors: ["Something went wrong, please try again later"],
    });
  }

  const { code, token } = verification;

  await sendEmail({
    to: user.email,
    subject: "Password reset request",
    react: VerificationMail({
      code,
      username: user.username,
      type: "password-reset",
    }),
  });

  const url = new URL(request.url);

  url.searchParams.set("requested_variant", base64url.encode("verify"));
  url.searchParams.set("signature", token);

  throw redirect(url.toString());
}

export async function handleChangePassword(
  request: Request,
  formData: FormData,
) {
  const token = getVerificationToken<{
    data: { userId: string };
    emailVerified: boolean;
    expiresAt: string;
  }>(request);

  if (
    !token ||
    !token.emailVerified ||
    isDateExpired(new Date(token.expiresAt))
  ) {
    const session = await flashSessionStorage.getSession();

    session.flash("__flash", "Invalid Token");

    throw redirect("/flow/login", {
      headers: {
        "set-cookie": await flashSessionStorage.commitSession(session),
      },
    });
  }

  const submission = parseWithZod(formData, {
    schema: PasswordAndConfirmPasswordSchema,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  await resetPassword({
    userId: token.data.userId,
    password: submission.value.password,
  });

  throw redirect("/flow/login");
}
