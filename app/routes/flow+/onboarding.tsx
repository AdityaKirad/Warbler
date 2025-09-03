import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import type { VerificationPayload } from "~/.server/authenticator";
import {
  checkCommonPassword,
  parseSignedToken,
  requireAnonymous,
  signup,
} from "~/.server/authenticator";
import { db } from "~/.server/drizzle";
import { checkHoneyPot } from "~/.server/honeypot";
import { Field } from "~/components/forms";
import { Button } from "~/components/ui/button";
import { Loader } from "~/components/ui/loader";
import { useIsPending } from "~/hooks/use-is-pending";
import {
  PasswordAndConfirmPasswordSchema,
  UsernameSchema,
} from "~/lib/user-validation";
import { Form } from "react-router";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { z } from "zod";
import type { Route } from "./+types/onboarding";
import { handleNewSession } from "./login.server";
import { getVerificationToken } from "./verify.server";

const schema = z
  .object({
    username: UsernameSchema,
  })
  .and(PasswordAndConfirmPasswordSchema);

export const meta = () => [{ title: "Setup your account" }];

export async function loader({ request }: Route.LoaderArgs) {
  await requireAnonymous(request);
  getVerificationToken(request);
  return null;
}
export async function action({ request }: Route.ActionArgs) {
  await requireAnonymous(request);

  const token = getVerificationToken(request);

  const formData = await request.formData();

  checkHoneyPot(formData);

  const submission = await parseWithZod(formData, {
    schema: schema.superRefine(async ({ username, password }, ctx) => {
      const isTaken = await db.query.user.findFirst({
        columns: { id: true },
        where: (user, { eq }) => eq(user.username, username),
      });

      if (isTaken) {
        ctx.addIssue({
          code: "custom",
          path: ["username"],
          message: "username already taken",
        });
      }

      const isCommonPassword = await checkCommonPassword(password);

      if (isCommonPassword) {
        ctx.addIssue({
          code: "custom",
          path: ["password"],
          message: "password is too common",
        });
      }
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const payload =
    parseSignedToken<Extract<VerificationPayload, { type: "signup" }>>(token);

  if (!payload || Date.now() > new Date(payload.expiresAt).getTime()) {
    return submission.reply({ formErrors: ["Invalid Token"] });
  }

  const { username, password } = submission.value;

  const session = await signup(request, {
    accountInfo: { provider: "credentials", password },
    userInfo: { username, emailVerified: true, ...payload.data },
  });

  if (!session) {
    return submission.reply({
      formErrors: [
        "We're having trouble logging you in. Please try again later.",
      ],
    });
  }

  return handleNewSession({
    session,
    redirectTo: new URL(request.url).searchParams.get("redirectTo"),
  });
}

export default function Page({ actionData }: Route.ComponentProps) {
  const isSubmitting = useIsPending();
  const [form, fields] = useForm({
    id: "onboarding",
    lastResult: actionData,
    shouldValidate: "onBlur",
    constraint: getZodConstraint(schema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });
  return (
    <>
      <h1>Setup your account</h1>
      <Form
        className="flex flex-col gap-2"
        method="POST"
        {...getFormProps(form)}>
        <HoneypotInputs />

        <Field
          errors={fields.username.errors}
          inputProps={{ ...getInputProps(fields.username, { type: "text" }) }}
          labelProps={{ children: "UserName" }}
        />

        <Field
          errors={fields.password.errors}
          inputProps={{
            ...getInputProps(fields.password, { type: "password" }),
            placeholder: "Enter new password",
          }}
          labelProps={{ children: "Password" }}
        />

        <Field
          errors={fields.confirmPassword.errors}
          inputProps={{
            ...getInputProps(fields.confirmPassword, { type: "password" }),
            placeholder: "Confirm Password",
          }}
          labelProps={{ children: "Confirm Password" }}
        />

        {form.errors && (
          <p className="text-destructive text-center text-sm">
            {form.errors.join(", ")}
          </p>
        )}

        <Button className="rounded-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? <Loader /> : "Next"}
        </Button>
      </Form>
    </>
  );
}
