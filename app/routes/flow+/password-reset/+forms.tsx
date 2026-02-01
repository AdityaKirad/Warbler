import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Field } from "~/components/forms";
import { Spinner } from "~/components/spinner";
import { Button } from "~/components/ui/button";
import { useIsPending } from "~/hooks/use-is-pending";
import {
  IdentifierSchema,
  PasswordAndConfirmPasswordSchema,
} from "~/lib/user-validation";
import { Form, useActionData } from "react-router";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import type { action } from ".";

export function IdentifyForm() {
  const isPending = useIsPending();
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    lastResult,
    id: "identify",
    shouldValidate: "onBlur",
    constraint: getZodConstraint(IdentifierSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: IdentifierSchema });
    },
  });
  return (
    <>
      <h2 className="text-heading">Find your Warbler Account</h2>
      <p className="text-muted-foreground text-sm">
        Enter email or username associated with your account to change password
      </p>
      <Form className="contents" method="POST" {...getFormProps(form)}>
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

        <Button
          className="mt-auto mb-4 rounded-full"
          type="submit"
          name="intent"
          value="identify"
          disabled={isPending}>
          {isPending ? <Spinner /> : "Next"}
        </Button>
      </Form>
    </>
  );
}

export function ChangePasswordForm() {
  const isPending = useIsPending();
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    lastResult,
    id: "change-password",
    constraint: getZodConstraint(PasswordAndConfirmPasswordSchema),
    shouldValidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: PasswordAndConfirmPasswordSchema,
      });
    },
  });
  return (
    <>
      <h2 className="text-heading">Choose a new password</h2>
      <p className="text-muted-foreground text-sm">
        Make sure your new password is 8 characters or more. Try including
        numbers, letters, and punctuation marks for a strong password.
      </p>
      <p className="text-muted-foreground text-sm">
        You'll be logged out of all active X sessions after your password is
        changed.
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
          type="submit"
          name="intent"
          value="change-password"
          disabled={isPending}>
          {isPending ? <Spinner /> : "Next"}
        </Button>
      </Form>
    </>
  );
}
