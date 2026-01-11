import type { SubmissionResult } from "@conform-to/react";
import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { OTPField } from "~/components/forms";
import { Button } from "~/components/ui/button";
import { Loader } from "~/components/ui/loader";
import { useIsPending } from "~/hooks/use-is-pending";
import { Form, useActionData } from "react-router";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { z } from "zod";

export const schema = z.object({
  code: z
    .string({ required_error: "Verification code is required" })
    .length(6, { message: "Verification code must be 6 digits" }),
});

export function VerificationForm() {
  const lastResult = useActionData<SubmissionResult<string[]> | undefined>();
  const isSubmitting = useIsPending();
  const [form, fields] = useForm({
    lastResult,
    id: "verify",
    shouldValidate: "onBlur",
    constraint: getZodConstraint(schema),
    onValidate: ({ formData }) =>
      parseWithZod(formData, {
        schema,
      }),
  });
  return (
    <>
      <h2 className="text-heading">We have sent you a code</h2>
      <Form className="contents" method="POST" {...getFormProps(form)}>
        <HoneypotInputs />
        <OTPField
          errors={fields.code.errors}
          inputProps={getInputProps(fields.code, { type: "text" })}
          labelProps={{ children: "Enter it below to verify your email" }}
        />

        {form.errors && (
          <p className="text-destructive text-center text-sm">
            {form.errors.join(", ")}
          </p>
        )}

        <Button
          className="mt-auto mb-4 rounded-full"
          disabled={isSubmitting}
          type="submit"
          name="intent"
          value="verify">
          {isSubmitting ? <Loader /> : "Next"}
        </Button>
      </Form>
    </>
  );
}
