import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Field } from "~/components/forms";
import { DiscordLogin, GoogleLogin } from "~/components/social-login";
import { Spinner } from "~/components/spinner";
import { Button } from "~/components/ui/button";
import { DialogTitle } from "~/components/ui/dialog";
import { Separator } from "~/components/ui/separator";
import { useIsPending } from "~/hooks/use-is-pending";
import { useUser } from "~/hooks/use-user";
import { IdentifierSchema } from "~/lib/user-validation";
import type { FetcherWithComponents } from "react-router";
import { Form, Link } from "react-router";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import type { action } from ".";
import { createCredentialLoginSchema } from ".";

export function CredentialLogin<T>({
  lastResult,
  fetcher,
}: {
  lastResult: Awaited<ReturnType<typeof action>> | undefined;
  fetcher?: FetcherWithComponents<T>;
}) {
  const user = useUser();
  const variant = lastResult?.variant?.type;
  const schema = createCredentialLoginSchema(variant as string);
  const [form, fields] = useForm({
    id: "login",
    defaultValue: {
      identifier: lastResult?.variant?.identifier,
    },
    lastResult: lastResult?.result,
    constraint: getZodConstraint(schema),
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
  });
  const Title = fetcher ? DialogTitle : "h2";
  const CredentialForm = fetcher ? fetcher.Form : Form;
  return (
    <>
      <Title className="text-heading">Enter your password</Title>

      <CredentialForm
        method="POST"
        className="contents"
        {...getFormProps(form)}>
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

        <input type="hidden" name="variant" value={variant} />

        <Button
          className="mt-auto rounded-full"
          type="submit"
          name="intent"
          value="login">
          Log in
        </Button>

        {!user && (
          <p className="text-muted-foreground my-4 text-sm">
            Don't have an account?{" "}
            <Link
              className="text-blue-500 hover:underline focus-visible:underline"
              to="/flow/signup"
              aria-label="Sign up">
              Sign up
            </Link>
          </p>
        )}
      </CredentialForm>
    </>
  );
}

export function GetLoginVariant<T>({
  flash,
  lastResult,
  redirectTo,
  fetcher,
}: {
  flash: string | undefined;
  lastResult: Awaited<ReturnType<typeof action>>["result"];
  redirectTo: string | null;
  fetcher?: FetcherWithComponents<T>;
}) {
  const isPending = useIsPending();
  const user = useUser();
  const [form, fields] = useForm({
    lastResult,
    id: "login",
    constraint: getZodConstraint(IdentifierSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: IdentifierSchema });
    },
  });
  const Title = fetcher ? DialogTitle : "h2";
  const VariantForm = fetcher ? fetcher.Form : Form;
  return (
    <>
      <Title className="text-heading">Sign in to Warbler</Title>
      <div className="contents">
        <GoogleLogin />
        <DiscordLogin />

        <Separator />

        <VariantForm
          className="contents"
          action="/flow/login"
          method="POST"
          {...getFormProps(form)}>
          <HoneypotInputs />

          <Field
            errors={fields.identifier.errors}
            inputProps={{
              ...getInputProps(fields.identifier, { type: "text" }),
              placeholder: "Email or username",
            }}
          />

          {form.errors && (
            <p className="text-destructive text-center text-sm">
              {form.errors.join(", ")}
            </p>
          )}
          {flash && (
            <p className="text-destructive text-center text-sm">{flash}</p>
          )}

          <Button
            className="rounded-full"
            disabled={isPending}
            type="submit"
            name="intent"
            value="get-login-variant">
            {isPending ? <Spinner /> : "Next"}
          </Button>
        </VariantForm>

        <Button className="rounded-full" variant="outline" asChild>
          <Link to="/flow/password-reset" aria-label="Forget Password">
            Forgot Password?
          </Link>
        </Button>
      </div>

      {!user && (
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
      )}
    </>
  );
}
