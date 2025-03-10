import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { ForgotPasswordMail } from "~/components/mails/forgot-password";
import { Button } from "~/components/ui/button";
import { Field, FieldError } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Loader } from "~/components/ui/loader";
import { useIsPending } from "~/hooks/use-is-pending";
import { IdentifierSchema } from "~/lib/user-validation";
import { db } from "~/services/db.server";
import { sendEmail } from "~/services/email.server";
import { checkHoneyPot } from "~/services/honeypot.server";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { z } from "zod";
import { prepareVerification } from "./verify.server";

export const schema = z.object({
  identifier: IdentifierSchema,
});

export const meta = () => [{ title: "Warbler - Find Your Account" }];

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  checkHoneyPot(formData);

  const submission = await parseWithZod(formData, {
    schema: schema.superRefine(async ({ identifier }, ctx) => {
      const doesUserExist = await db.user.findFirst({
        where: {
          OR: [{ email: identifier }, { username: identifier }],
        },
        select: {
          id: true,
        },
      });
      if (!doesUserExist) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["identifer"],
          message: "No accout with following credentials",
        });
        return;
      }
    }),
    async: true,
  });

  if (submission.status !== "success") return submission.reply();

  const { identifier } = submission.value;

  const user = await db.user.findFirstOrThrow({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
    select: {
      email: true,
      username: true,
    },
  });

  const { otp, verificationSession } = await prepareVerification({
    period: 60 * 10,
    request,
    target: identifier,
    type: "reset-password",
  });

  const { success } = await sendEmail({
    to: user.email,
    subject: "Password reset request",
    react: ForgotPasswordMail({ otp, username: user.username }),
  });

  if (!success) {
    return submission.reply({ formErrors: ["Failed to send email please try again"] });
  }

  throw redirect("/verify", {
    headers: {
      "set-cookie": verificationSession,
    },
  });
}

export default function Page() {
  const isPending = useIsPending();
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    id: "forgot-password",
    lastResult,
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });
  return (
    <>
      <h1>Find your Warbler Account</h1>
      <p className="text-sm text-muted-foreground">
        Enter email or username associated with your account to change password
      </p>
      <Form method="POST" className="mt-8" {...getFormProps(form)}>
        <HoneypotInputs />

        <Field>
          <Input placeholder="Enter email or username" {...getInputProps(fields.identifier, { type: "text" })} />
          <FieldError>{fields.identifier.errors?.join(", ")}</FieldError>
        </Field>

        <Button className="mt-24 w-full rounded-full" disabled={isPending}>
          {isPending ? <Loader /> : "Next"}
        </Button>
      </Form>
    </>
  );
}
