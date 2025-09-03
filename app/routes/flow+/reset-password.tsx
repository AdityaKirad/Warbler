import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import type { VerificationPayload } from "~/.server/authenticator";
import {
  checkCommonPassword,
  parseSignedToken,
  requireAnonymous,
  resetPassword,
} from "~/.server/authenticator";
import { checkHoneyPot } from "~/.server/honeypot";
import { Field } from "~/components/forms";
import { Button } from "~/components/ui/button";
import { Loader } from "~/components/ui/loader";
import { useIsPending } from "~/hooks/use-is-pending";
import { PasswordAndConfirmPasswordSchema as schema } from "~/lib/user-validation";
import { Form, redirect } from "react-router";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import type { Route } from "./+types/reset-password";
import { getVerificationToken } from "./verify.server";

export const meta = () => [{ title: "Warbler - Reset your password" }];

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
    schema: schema.superRefine(async ({ password }, ctx) => {
      const isCommonPassword = await checkCommonPassword(password);
      if (isCommonPassword) {
        ctx.addIssue({
          path: ["password"],
          code: "custom",
          message: "Password is too common",
        });
      }
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const { password } = submission.value;

  const payload =
    parseSignedToken<Extract<VerificationPayload, { type: "forget-password" }>>(
      token,
    );

  if (!payload || new Date(payload.expiresAt) < new Date()) {
    throw redirect("/login");
  }

  try {
    await resetPassword({ userId: payload.data.id, password });
  } catch {
    return submission.reply({
      formErrors: ["Something went wrong. Please try again later."],
    });
  }

  return redirect("/flow/login");
}

export default function Page({ actionData }: Route.ComponentProps) {
  const isPending = useIsPending();
  const [form, fields] = useForm({
    id: "reset-password",
    lastResult: actionData,
    constraint: getZodConstraint(schema),
    shouldValidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });
  return (
    <>
      <h1>Choose a new password</h1>
      <p className="text-muted-foreground text-sm">
        Make sure your new password is 8 characters or more. Try including
        numbers, letters, and punctuation marks for a strong password.
      </p>
      <p className="text-muted-foreground text-sm">
        You&apos;ll be logged out of all active X sessions after your password
        is changed.
      </p>
      <Form className="space-y-4" method="POST" {...getFormProps(form)}>
        <HoneypotInputs />

        <Field
          errors={fields.password.errors}
          inputProps={{
            ...getInputProps(fields.password, { type: "password" }),
            placeholder: "Enter a new password",
          }}
        />

        <Field
          errors={fields.confirmPassword.errors}
          inputProps={{
            ...getInputProps(fields.confirmPassword, { type: "password" }),
            placeholder: "Confirm your password",
          }}
        />

        {form.errors && (
          <p className="text-destructive text-center text-sm">
            {form.errors.join(", ")}
          </p>
        )}

        <Button
          className="w-full rounded-full"
          disabled={isPending}
          type="submit">
          {isPending ? <Loader /> : "Next"}
        </Button>
      </Form>
    </>
  );
}
