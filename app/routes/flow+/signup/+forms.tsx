import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { DateField, Field } from "~/components/forms";
import { Button } from "~/components/ui/button";
import { Loader } from "~/components/ui/loader";
import { useIsPending } from "~/hooks/use-is-pending";
import { PasswordSchema } from "~/lib/user-validation";
import { Form, useActionData } from "react-router";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import type { action } from ".";
import { signupSchema } from ".";

export function SignupForm() {
  const isSubmitting = useIsPending();
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    lastResult,
    id: "signup",
    shouldValidate: "onBlur",
    constraint: getZodConstraint(signupSchema),
    onValidate: ({ formData }) =>
      parseWithZod(formData, {
        schema: signupSchema,
      }),
  });
  return (
    <>
      <h2 className="text-heading">Create your account</h2>
      <Form className="contents" method="POST" {...getFormProps(form)}>
        <HoneypotInputs />

        <Field
          inputProps={{
            ...getInputProps(fields.name, { type: "text" }),
            placeholder: "Your name",
          }}
          labelProps={{ children: "Name" }}
          errors={fields.name.errors}
        />

        <Field
          inputProps={{
            ...getInputProps(fields.email, { type: "email" }),
            placeholder: "Your email",
          }}
          labelProps={{ children: "Email" }}
          errors={fields.email.errors}
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

        <Button
          className="mt-auto mb-4 rounded-full"
          disabled={isSubmitting}
          type="submit"
          name="intent"
          value="signup">
          {isSubmitting ? <Loader /> : "Next"}
        </Button>
      </Form>
    </>
  );
}

export function SetPasswordForm() {
  const isSubmitting = useIsPending();
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    lastResult,
    id: "set-password",
    shouldValidate: "onBlur",
    constraint: getZodConstraint(PasswordSchema),
    onValidate: ({ formData }) =>
      parseWithZod(formData, {
        schema: PasswordSchema,
      }),
  });
  return (
    <>
      <h2 className="text-heading">You'll need a password</h2>
      <Form className="contents" method="POST" {...getFormProps(form)}>
        <HoneypotInputs />

        <p className="text-muted-foreground text-sm">
          Make sure it's 8 characters or more
        </p>

        <Field
          inputProps={{
            ...getInputProps(fields.password, { type: "password" }),
            placeholder: "Enter new password",
          }}
          labelProps={{ children: "Password" }}
          errors={fields.password.errors}
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
          value="set-password">
          {isSubmitting ? <Loader /> : "Next"}
        </Button>
      </Form>
    </>
  );
}
