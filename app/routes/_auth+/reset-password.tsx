import { getFormProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { PasswordField } from "~/components/password-field";
import { Button } from "~/components/ui/button";
import { Loader } from "~/components/ui/loader";
import { useIsPending } from "~/hooks/use-is-pending";
import { PasswordAndConfirmPasswordSchema as schema } from "~/lib/user-validation";
import { checkCommonPassword, resetPassword } from "~/services/authenticator.server";
import { checkHoneyPot } from "~/services/honeypot.server";
import { verificationSessionStorage } from "~/services/session/verify.server";
import { HoneypotInputs } from "remix-utils/honeypot/react";

export const VERIFICATION_SESSION_KEY = "resetPasswordEmail";

async function getResetPasswordEmail(request: Request) {
  const session = await verificationSessionStorage.getSession(request.headers.get("Cookie"));
  const email = session.get(VERIFICATION_SESSION_KEY);
  if (typeof email !== "string" || !email) {
    throw redirect("/login");
  }
  return email;
}

export const meta = () => [{ title: "Warbler - Reset your password" }];

export async function loader({ request }: LoaderFunctionArgs) {
  await getResetPasswordEmail(request);
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const resetPasswordEmail = await getResetPasswordEmail(request);

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

  await resetPassword({ email: resetPasswordEmail, password });

  const verificationSession = await verificationSessionStorage.getSession();
  return redirect("/login", {
    headers: {
      "Set-Cookie": await verificationSessionStorage.destroySession(verificationSession),
    },
  });
}

export default function Page() {
  const isPending = useIsPending();
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    id: "reset-password",
    lastResult,
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });
  return (
    <>
      <h1>Choose a new password</h1>
      <p className="text-sm text-muted-foreground">
        Make sure your new password is 8 characters or more. Try including numbers, letters, and punctuation marks for a
        strong password.
      </p>
      <p className="text-sm text-muted-foreground">
        You&apos;ll be logged out of all active X sessions after your password is changed.
      </p>
      <Form method="POST" className="space-y-4" {...getFormProps(form)}>
        <HoneypotInputs />
        <PasswordField field={fields.password} placeholder="Enter a new password" />
        <PasswordField field={fields.confirmPassword} placeholder="Confirm your password" />
        <Button type="submit" className="w-full rounded-full" disabled={isPending}>
          {isPending ? <Loader /> : "Next"}
        </Button>
      </Form>
    </>
  );
}
