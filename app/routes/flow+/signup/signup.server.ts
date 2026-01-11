import { parseWithZod } from "@conform-to/zod";
import {
  createVerification,
  isDateExpired,
  signup,
} from "~/.server/authentication";
import { db } from "~/.server/drizzle";
import { sendEmail } from "~/.server/email";
import { flashSessionStorage } from "~/.server/session/flash";
import { VerificationMail } from "~/components/verification-mail";
import { PasswordSchema } from "~/lib/user-validation";
import { base64url } from "~/lib/utils";
import { redirect } from "react-router";
import { signupSchema } from ".";
import { handleNewSession } from "../login/login.server";
import { getVerificationToken } from "../verify/verify.server";

export async function handleSignup(request: Request, formData: FormData) {
  const submission = await parseWithZod(formData, {
    schema: signupSchema.superRefine(async ({ email }, ctx) => {
      const emailTaken = await db.query.user.findFirst({
        columns: { id: true },
        where: (user, { eq }) => eq(user.email, email),
      });

      if (emailTaken) {
        ctx.addIssue({
          path: ["email"],
          code: "custom",
          message: "Email already taken",
        });
      }
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const { email: target } = submission.value;

  const verification = await createVerification({
    target,
    type: "signup",
    data: submission.value,
  });

  if (!verification) {
    return submission.reply({
      formErrors: ["Something went wrong. Please try again later."],
    });
  }

  const { code, token } = verification;

  await sendEmail({
    to: target,
    subject: `${code} is your Warbler verication code`,
    react: VerificationMail({ code, type: "signup" }),
  });

  const url = new URL(request.url);

  url.searchParams.set("requested_variant", base64url.encode("verify"));
  url.searchParams.set("signature", token);

  throw redirect(url.toString());
}

export async function handleOnboarding(request: Request, formData: FormData) {
  const token = getVerificationToken<{
    data: { name: string; email: string; dob: string };
    emailVerified: boolean;
    expiresAt: string;
  }>(request);

  if (
    !token ||
    !token.emailVerified ||
    isDateExpired(new Date(token.expiresAt))
  ) {
    const session = await flashSessionStorage.getSession();

    session.flash("__flash", "Invalid verification token");

    return redirect("/flow/signup", {
      headers: {
        "set-cookie": await flashSessionStorage.commitSession(session),
      },
    });
  }

  const submisssion = parseWithZod(formData, {
    schema: PasswordSchema,
  });

  if (submisssion.status !== "success") {
    return submisssion.reply();
  }

  const { password } = submisssion.value;

  const session = await signup(request, {
    password,
    userInfo: {
      ...token.data,
      emailVerified: token.emailVerified,
      dob: new Date(token.data.dob),
    },
  });

  if (!session)
    return submisssion.reply({
      formErrors: [
        "We're having trouble logging you in. Please try again later.",
      ],
    });

  return handleNewSession({
    ...session,
    redirectTo: new URL(request.url).searchParams.get("redirectTo"),
  });
}
