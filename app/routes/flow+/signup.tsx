import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { prepareVerification, requireAnonymous } from "~/.server/authenticator";
import { db } from "~/.server/drizzle";
import { sendEmail } from "~/.server/email";
import { checkHoneyPot } from "~/.server/honeypot";
import { DateField, Field } from "~/components/forms";
import { Button } from "~/components/ui/button";
import { Loader } from "~/components/ui/loader";
import { VerificationMail } from "~/components/verification-mail";
import { useIsPending } from "~/hooks/use-is-pending";
import { DOBSchema, EmailSchema, NameSchema } from "~/lib/user-validation";
import { Form, redirect } from "react-router";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { z } from "zod";
import type { Route } from "./+types/signup";

const schema = z.object({
  name: NameSchema,
  email: EmailSchema,
  dob: DOBSchema,
});

export const meta = () => [{ title: "Signup to Warbler" }];

export async function loader({ request }: Route.LoaderArgs) {
  await requireAnonymous(request);
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  await requireAnonymous(request);

  const formData = await request.formData();

  checkHoneyPot(formData);

  const submission = await parseWithZod(formData, {
    schema: schema.superRefine(async ({ email }, ctx) => {
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

  const verification = await prepareVerification({
    type: "signup",
    data: submission.value,
    target: submission.value.email,
  });

  if (!verification) {
    return submission.reply({
      formErrors: ["Something went wrong. Please try again later."],
    });
  }

  const { code, token } = verification;

  try {
    await sendEmail({
      to: submission.value.email,
      subject: `${code} is your Warbler verication code`,
      react: VerificationMail({ code, type: "signup" }),
    });
  } catch {
    return submission.reply({
      formErrors: ["Something went wrong. Please try again later."],
    });
  }

  const url = new URL(request.url);

  url.pathname = "/flow/verify";

  url.searchParams.set("token", token);

  throw redirect(url.toString());
}

export default function Page({ actionData }: Route.ComponentProps) {
  const isSubmitting = useIsPending();
  const [form, fields] = useForm({
    id: "signup",
    lastResult: actionData,
    shouldValidate: "onBlur",
    constraint: getZodConstraint(schema),
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
  });

  return (
    <>
      <h1>Create your account</h1>
      <Form className="contents" method="POST" {...getFormProps(form)}>
        <HoneypotInputs />

        <Field
          errors={fields.name.errors}
          inputProps={{
            ...getInputProps(fields.name, { type: "text" }),
            placeholder: "Your name",
          }}
          labelProps={{ children: "Name" }}
        />

        <Field
          errors={fields.email.errors}
          inputProps={{
            ...getInputProps(fields.email, { type: "email" }),
            placeholder: "Your email",
          }}
          labelProps={{ children: "Email" }}
        />

        <DateField
          description="This will not be shown publicly. Confirm your own age, even if this account is for a business, a pet, or
            something else."
          field={fields.dob}
          label="Date of birth"
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
