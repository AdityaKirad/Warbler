import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { login, requireAnonymous } from "~/.server/authenticator";
import { checkHoneyPot } from "~/.server/honeypot";
import { flashSessionStorage } from "~/.server/session/flash";
import { Field } from "~/components/forms";
import { DiscordLogin, GoogleLogin } from "~/components/social-login";
import { Button } from "~/components/ui/button";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import { useIsPending } from "~/hooks/use-is-pending";
import { IdentifierSchema } from "~/lib/user-validation";
import { data, Form, Link, useSearchParams } from "react-router";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { z } from "zod";
import type { Route } from "./+types/login";
import { handleNewSession } from "./login.server";

const schema = z.object({
  identifier: IdentifierSchema,
  password: z.string(),
  redirectTo: z.string().optional(),
});

export const meta = () => [
  {
    title: "Login to Warbler",
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  await requireAnonymous(request);

  const session = await flashSessionStorage.getSession(
    request.headers.get("cookie"),
  );

  return data(session.get("__flash"), {
    headers: {
      "set-cookie": await flashSessionStorage.destroySession(session),
    },
  });
}

export async function action({ request }: Route.ActionArgs) {
  await requireAnonymous(request);

  const formData = await request.formData();

  checkHoneyPot(formData);

  const submission = parseWithZod(formData, { schema });

  if (submission.status !== "success") {
    return submission.reply({ hideFields: ["password"] });
  }

  const { redirectTo, ...credentials } = submission.value;

  const session = await login({ request, ...credentials });

  if (session === null) {
    return submission.reply({
      fieldErrors: {
        email: ["Invalid Crendentials"],
        password: ["Invalid Credentials"],
      },
      hideFields: ["password"],
    });
  }

  if (session === undefined) {
    return submission.reply({
      formErrors: [
        "We're having trouble logging you in. Please try again later.",
      ],
      hideFields: ["password"],
    });
  }

  return handleNewSession({ session, redirectTo });
}

export default function Page({
  actionData,
  loaderData: error,
}: Route.ComponentProps) {
  const isPending = useIsPending();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const [form, fields] = useForm({
    id: "login",
    constraint: getZodConstraint(schema),
    defaultValue: { redirectTo },
    lastResult: actionData,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });

  return (
    <>
      <h1 className="text-heading">Sign in to Warbler</h1>
      <div className="contents">
        <GoogleLogin redirectTo={redirectTo} />
        <DiscordLogin redirectTo={redirectTo} />
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

          <Field
            errors={fields.password.errors}
            inputProps={{
              ...getInputProps(fields.password, { type: "password" }),
              placeholder: "Your password",
            }}
          />

          <input {...getInputProps(fields.redirectTo, { type: "hidden" })} />

          <div className="text-destructive contents text-center text-sm">
            {form.errors && <p>{form.errors.join(", ")}</p>}
            {error && <p>{error}</p>}
          </div>

          <Button className="rounded-full" disabled={isPending} type="submit">
            {isPending ? <Loader /> : "Next"}
          </Button>
        </Form>
        <Button asChild className="rounded-full" variant="outline">
          <Link to="/flow/forgot-password">Forgot Password?</Link>
        </Button>
      </div>
      <p className="text-neutral-700">
        Don&apos;t have an account?
        <Button asChild className="text-blue-500" variant="link">
          <Link
            to={{
              pathname: "/flow/signup",
              search: redirectTo
                ? `?redirectTo=${encodeURIComponent(redirectTo)}`
                : "",
            }}>
            Sign up
          </Link>
        </Button>
      </p>
    </>
  );
}
