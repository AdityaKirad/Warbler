import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { prepareVerification, requireAnonymous } from "~/.server/authenticator";
import { db } from "~/.server/drizzle";
import { sendEmail } from "~/.server/email";
import { checkHoneyPot } from "~/.server/honeypot";
import { Field } from "~/components/forms";
import { Button } from "~/components/ui/button";
import { Loader } from "~/components/ui/loader";
import { VerificationMail } from "~/components/verification-mail";
import { useIsPending } from "~/hooks/use-is-pending";
import { IdentifierSchema } from "~/lib/user-validation";
import { Form, redirect } from "react-router";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { z } from "zod";
import type { Route } from "./+types/forgot-password";

export const schema = z.object({
  identifier: IdentifierSchema,
});

export const meta = () => [{ title: "Warbler - Find Your Account" }];

export async function loader({ request }: Route.LoaderArgs) {
  await requireAnonymous(request);
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  await requireAnonymous(request);

  const formData = await request.formData();

  checkHoneyPot(formData);

  const submission = parseWithZod(formData, { schema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const { identifier } = submission.value;

  const user = await db.query.user.findFirst({
    columns: { id: true, email: true, username: true },
    where: (user, { eq, or }) =>
      or(eq(user.email, identifier), eq(user.username, identifier)),
  });

  if (!user) {
    return submission.reply({
      fieldErrors: { identifier: ["No account with following credentials"] },
    });
  }

  const verification = await prepareVerification({
    data: { id: user.id, username: user.username },
    type: "forget-password",
    target: user.email,
  });

  if (!verification) {
    return submission.reply({
      formErrors: ["Something went wrong. Please try again later."],
    });
  }

  const { code, token } = verification;

  try {
    await sendEmail({
      to: user.email,
      subject: "Password reset request",
      react: VerificationMail({
        code,
        type: "forget-password",
        username: user.username,
      }),
    });
  } catch {
    return submission.reply({
      formErrors: ["Something went wrong. Please try again later."],
    });
  }

  throw redirect(`/flow/verify?token=${token}`);
}

export default function Page({ actionData }: Route.ComponentProps) {
  const isPending = useIsPending();
  const [form, fields] = useForm({
    id: "forgot-password",
    lastResult: actionData,
    shouldValidate: "onBlur",
    constraint: getZodConstraint(schema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });
  return (
    <>
      <h1>Find your Warbler Account</h1>
      <p className="text-muted-foreground text-sm">
        Enter email or username associated with your account to change password
      </p>
      <Form className="mt-8" method="POST" {...getFormProps(form)}>
        <HoneypotInputs />

        <Field
          errors={fields.identifier.errors}
          inputProps={{
            ...getInputProps(fields.identifier, { type: "text" }),
            placeholder: "Enter email or username",
          }}
        />

        {form.errors && (
          <p className="text-destructive text-center text-sm">
            {form.errors.join(", ")}
          </p>
        )}

        <Button className="mt-24 w-full rounded-full" disabled={isPending}>
          {isPending ? <Loader /> : "Next"}
        </Button>
      </Form>
    </>
  );
}
