import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Field } from "~/components/forms";
import { DiscordLogin, GoogleLogin } from "~/components/social-login";
import { Spinner } from "~/components/spinner";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { useIsPending } from "~/hooks/use-is-pending";
import { IdentifierSchema } from "~/lib/user-validation";
import { Form, Link, useActionData, useLoaderData } from "react-router";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import type { action, loader } from ".";
import { createCredentialLoginSchema } from ".";

export function CredentialLogin() {
  const lastResult = useActionData<typeof action>();
  const schema = createCredentialLoginSchema(
    lastResult?.variant?.type as string,
  );
  const [form, fields] = useForm({
    id: "login",
    defaultValue: {
      identifier: lastResult?.variant?.identifier,
    },
    lastResult: lastResult?.result,
    constraint: getZodConstraint(schema),
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
  });
  return (
    <>
      <h2 className="text-heading">Enter your password</h2>

      <Form method="POST" className="contents" {...getFormProps(form)}>
        <HoneypotInputs />

        <Field
          inputProps={{
            ...getInputProps(fields.identifier, { type: "text" }),
            disabled: true,
          }}
          labelProps={{ children: lastResult?.variant?.type }}
          errors={fields.identifier.errors}
        />

        <Field
          inputProps={{
            ...getInputProps(fields.password, { type: "password" }),
            autoFocus: true,
          }}
          labelProps={{ children: "Password" }}
          errors={fields.password.errors}
        />

        <input type="hidden" name="variant" value={lastResult?.variant?.type} />

        <Button
          className="mt-auto rounded-full"
          type="submit"
          name="intent"
          value="login">
          Log in
        </Button>

        <p className="text-muted-foreground my-4 text-sm">
          Don't have an account?{" "}
          <Link
            className="text-blue-500 hover:underline focus-visible:underline"
            to="/flow/signup"
            aria-label="Sign up">
            Sign up
          </Link>
        </p>
      </Form>
    </>
  );
}

export function GetLoginVariant({ redirectTo }: { redirectTo: string | null }) {
  const isPending = useIsPending();
  const lastResult = useActionData<typeof action>();
  const { flash } = useLoaderData<typeof loader>();
  const [form, fields] = useForm({
    lastResult: lastResult?.result,
    id: "login",
    constraint: getZodConstraint(IdentifierSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: IdentifierSchema });
    },
  });
  return (
    <>
      <h2 className="text-heading">Sign in to Warbler</h2>
      <div className="contents">
        <GoogleLogin />
        <DiscordLogin />

        <Separator />

        <Form className="contents" method="POST" {...getFormProps(form)}>
          <HoneypotInputs />

          <Field
            errors={fields.identifier.errors}
            inputProps={{
              ...getInputProps(fields.identifier, { type: "text" }),
              placeholder: "Email or username",
            }}
          />

          <div className="text-destructive contents text-center text-sm">
            {form.errors && <p>{form.errors.join(", ")}</p>}
            {flash && <p>{flash}</p>}
          </div>

          <Button
            className="rounded-full"
            disabled={isPending}
            type="submit"
            name="intent"
            value="get_login_variant">
            {isPending ? <Spinner /> : "Next"}
          </Button>
        </Form>

        <Button className="rounded-full" variant="outline" asChild>
          <Link to="/flow/password-reset" aria-label="Forget Password">
            Forgot Password?
          </Link>
        </Button>
      </div>

      <p className="text-neutral-700">
        Don't have an account?
        <Button asChild className="text-blue-500" variant="link">
          <Link
            to={{
              pathname: "/flow/signup",
              search: redirectTo
                ? `?redirectTo=${encodeURIComponent(redirectTo)}`
                : "",
            }}
            aria-label="Sign up">
            Sign up
          </Link>
        </Button>
      </p>
    </>
  );
}
