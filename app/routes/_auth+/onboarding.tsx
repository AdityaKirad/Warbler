import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useSearchParams } from "@remix-run/react";
import { PasswordField } from "~/components/password-field";
import { Button } from "~/components/ui/button";
import { Field, FieldError } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Loader } from "~/components/ui/loader";
import { useIsPending } from "~/hooks/use-is-pending";
import { PasswordAndConfirmPasswordSchema, UsernameSchema } from "~/lib/user-validation";
import { checkCommonPassword, signup } from "~/services/authenticator.server";
import { db } from "~/services/db.server";
import { checkHoneyPot } from "~/services/honeypot.server";
import { authSessionStorage, sessionKey } from "~/services/session/auth.server";
import {
  getOnboardingSession,
  getOnboardingUser,
  onboardingSessionStorage,
} from "~/services/session/onboarding.server";
import { verificationSessionStorage } from "~/services/session/verify.server";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { safeRedirect } from "remix-utils/safe-redirect";
import { z } from "zod";
import { getOnboardingUserEmail } from "./verify.server";

export const ONBOARDING_SESSION_KEY = "onboardingUserEmail";

const schema = z
  .object({
    username: UsernameSchema,
    redirectTo: z.string().optional(),
  })
  .and(PasswordAndConfirmPasswordSchema);

export const meta = () => [{ title: "Setup your account" }];

export async function loader({ request }: LoaderFunctionArgs) {
  await getOnboardingUserEmail(request);
  return null;
}
export async function action({ request }: ActionFunctionArgs) {
  const profile = await getOnboardingUser(request);

  const formData = await request.formData();

  checkHoneyPot(formData);

  const submission = await parseWithZod(formData, {
    schema: (intent) =>
      schema
        .superRefine(async ({ username, password }, ctx) => {
          const isTaken = await db.user.findUnique({ where: { username } });
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
        })
        .transform(async (data) => {
          if (intent !== null) return { ...data, session: null };
          const { password, username } = data;
          const session = await signup({ username, password, ...profile });
          return { ...data, session };
        }),
    async: true,
  });
  if (submission.status !== "success" || !submission.value.session) return submission.reply();

  const { session, redirectTo } = submission.value;

  const authSession = await authSessionStorage.getSession();
  authSession.set(sessionKey, session.id);
  const verificationSession = await verificationSessionStorage.getSession(request.headers.get("Cookie"));
  const onboardingSession = await getOnboardingSession(request);
  const headers = new Headers();
  headers.append("set-cookie", await authSessionStorage.commitSession(authSession, { expires: session.expiresAt }));
  headers.append("set-cookie", await verificationSessionStorage.destroySession(verificationSession));
  headers.append("set-cookie", await onboardingSessionStorage.destroySession(onboardingSession));

  return redirect(safeRedirect(redirectTo, "/home"), { headers });
}

export default function Page() {
  const lastResult = useActionData<typeof action>();
  const isSubmitting = useIsPending();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const [form, fields] = useForm({
    id: "signup",
    lastResult,
    defaultValue: { redirectTo },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });
  return (
    <>
      <h1>Setup your account</h1>
      <Form className="flex flex-col gap-2" method="POST" {...getFormProps(form)}>
        <HoneypotInputs />

        <Field>
          <Label htmlFor={fields.username.id}>UserName</Label>
          <Input placeholder="Enter username" {...getInputProps(fields.username, { type: "text" })} />
          <FieldError>{fields.username.errors?.join(", ")}</FieldError>
        </Field>

        <PasswordField label="Password" field={fields.password} placeholder="Enter new password" />

        <PasswordField label="Confirm Password" field={fields.confirmPassword} placeholder="Confirm Password" />

        <input {...getInputProps(fields.redirectTo, { type: "hidden" })} />

        <Button className="rounded-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader /> : "Next"}
        </Button>
      </Form>
    </>
  );
}
