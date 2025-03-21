import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useActionData, useSearchParams } from "@remix-run/react";
import DateConform from "~/components/conform-inputs/date-conform";
import ConfirmationMail from "~/components/mails/confirmation";
import { Button } from "~/components/ui/button";
import { Field, FieldError } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Loader } from "~/components/ui/loader";
import { useIsPending } from "~/hooks/use-is-pending";
import { DOBSchema, EmailSchema, NameSchema } from "~/lib/user-validation";
import { requireAnonymous } from "~/services/authenticator.server";
import { db } from "~/services/drizzle/index.server";
import { sendEmail } from "~/services/email.server";
import { checkHoneyPot } from "~/services/honeypot.server";
import { createOnboardingUser } from "~/services/session/onboarding.server";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { z } from "zod";
import { prepareVerification } from "./verify.server";

const schema = z.object({
  name: NameSchema,
  email: EmailSchema,
  dob: DOBSchema,
  redirectTo: z.string().optional(),
});

export const meta = () => [{ title: "Signup to Warbler" }];

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAnonymous(request);
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAnonymous(request);

  const formData = await request.formData();

  checkHoneyPot(formData);

  const submission = await parseWithZod(formData, {
    schema: schema.superRefine(async ({ email }, ctx) => {
      const emailTaken = await db.query.users.findFirst({
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

  const { email, dob, name, redirectTo } = submission.value;

  const { otp, expiresAt, verificationSession } = await prepareVerification({
    request,
    target: email,
    type: "onboarding",
    period: 60 * 10,
  });

  const onboardingSession = await createOnboardingUser({ name, email, dob, expiresAt });
  const headers = new Headers();
  headers.append("set-cookie", onboardingSession);
  headers.append("set-cookie", verificationSession);

  const { success } = await sendEmail({
    to: email,
    subject: "Verication code for Warbler",
    react: ConfirmationMail({ otp }),
  });

  if (!success) {
    return submission.reply({ formErrors: ["Failed to send email please try again"] });
  }

  const redirectURL = redirectTo ? `/verify?redirectTo=${redirectTo}` : "/verify";
  throw redirect(redirectURL, {
    headers,
  });
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
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
  });

  return (
    <>
      <h1>Create your account</h1>
      <Form className="contents" method="POST" {...getFormProps(form)}>
        <HoneypotInputs />

        <Field>
          <Label htmlFor={fields.name.id}>Name</Label>
          <Input placeholder="Your name" {...getInputProps(fields.name, { type: "text" })} />
          <FieldError>{fields.name.errors}</FieldError>
        </Field>

        <Field>
          <Label htmlFor={fields.email.id}>Email</Label>
          <Input placeholder="Your email" {...getInputProps(fields.email, { type: "email" })} />
          <FieldError>{fields.email.errors}</FieldError>
        </Field>

        <Field>
          <Label htmlFor={fields.dob.id}>Date of birth</Label>
          <p className="text-sm text-muted-foreground">
            This will not be shown publicly. Confirm your own age, even if this account is for a business, a pet, or
            something else.
          </p>
          <DateConform field={fields.dob} />
          <FieldError>{fields.dob.errors}</FieldError>
        </Field>

        <p className="text-sm text-red-500">{form.errors}</p>

        <Input {...getInputProps(fields.redirectTo, { type: "hidden" })} />
        <Button className="rounded-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader /> : "Next"}
        </Button>
      </Form>
    </>
  );
}
