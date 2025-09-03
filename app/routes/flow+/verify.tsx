import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { requireAnonymous } from "~/.server/authenticator";
import { checkHoneyPot } from "~/.server/honeypot";
import { OTPField } from "~/components/forms";
import { Button } from "~/components/ui/button";
import { Loader } from "~/components/ui/loader";
import { useIsPending } from "~/hooks/use-is-pending";
import { Form } from "react-router";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { z } from "zod";
import type { Route } from "./+types/verify";
import { getVerificationToken, validateRequest } from "./verify.server";

export const schema = z
  .object({
    code: z
      .string({ required_error: "Verification code is required" })
      .optional(),
    intent: z.enum(["resend", "verify"]),
  })
  .superRefine((data, ctx) => {
    if (data.intent !== "resend" && data.code?.length !== 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Verification code must be 6 digits",
        path: ["code"],
      });
    }
  });

export const meta = () => [{ title: "Verify your account" }];

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

  const redirectTo = new URL(request.url).searchParams.get("redirectTo");

  return validateRequest(request, { formData, redirectTo, token });
}

export default function Page({ actionData }: Route.ComponentProps) {
  const isSubmitting = useIsPending();
  const [form, fields] = useForm({
    id: "verify",
    lastResult: actionData,
    constraint: getZodConstraint(schema),
    shouldValidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });
  return (
    <>
      <h1>We have sent you a code</h1>
      <Form method="POST" {...getFormProps(form)}>
        <HoneypotInputs />

        <OTPField
          errors={fields.code.errors}
          inputProps={{ ...getInputProps(fields.code, { type: "text" }) }}
          labelProps={{ children: "Enter it below to verify your email" }}
        />

        <button
          disabled={isSubmitting}
          hidden
          name="intent"
          type="submit"
          value="verify"
        />

        <p className="text-muted-foreground text-sm">
          Didn&apos;t receive the code?{" "}
          <Button
            className="p-0 font-normal text-blue-500"
            name="intent"
            type="submit"
            value="resend"
            variant="link">
            Resend
          </Button>
        </p>

        {form.errors && (
          <p className="text-destructive text-sm">{form.errors.join(", ")}</p>
        )}

        <Button
          className="mt-24 w-full rounded-full text-[1rem]"
          disabled={isSubmitting}
          name="intent"
          type="submit"
          value="verify">
          {isSubmitting ? <Loader /> : "Next"}
        </Button>
      </Form>
    </>
  );
}
