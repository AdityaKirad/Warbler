import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import type { SEOHandle } from "@nasa-gcn/remix-seo";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import { GoogleLogin } from "~/components/google-login";
import { PasswordField } from "~/components/password-field";
import { Button } from "~/components/ui/button";
import { DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Field, FieldError } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import { useIsPending } from "~/hooks/use-is-pending";
import { IdentifierSchema, PasswordSchema } from "~/lib/user-validation";
import { login, requireAnonymous } from "~/services/authenticator.server";
import { checkHoneyPot } from "~/services/honeypot.server";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import type { IssueData } from "zod";
import { z } from "zod";
import { handleNewSession } from "./login.server";

const schema = z.object({
  identifier: IdentifierSchema,
  password: PasswordSchema,
  redirectTo: z.string().optional(),
});

export const handle: SEOHandle = {
  getSitemapEntries: () => null,
};

export const meta = () => [
  {
    title: "Login to Warbler",
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAnonymous(request);
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAnonymous(request);

  const formData = await request.formData();

  checkHoneyPot(formData);

  const submission = await parseWithZod(formData, {
    schema: (intent) =>
      schema.transform(async (data, ctx) => {
        if (intent !== null) return { ...data, session: null };

        const session = await login(data);
        if (!session) {
          const issue: IssueData = {
            code: z.ZodIssueCode.custom,
            message: "Invalid credentials",
          };
          ctx.addIssue({
            path: ["identifier"],
            ...issue,
          });
          ctx.addIssue({
            path: ["password"],
            ...issue,
          });
          return z.NEVER;
        }

        return { ...data, session };
      }),
    async: true,
  });

  if (submission.status !== "success" || !submission.value.session) {
    return submission.reply({ hideFields: ["password"] });
  }

  const { session, redirectTo } = submission.value;

  return handleNewSession({
    session,
    redirectTo,
  });
}

export default function Page() {
  const [searchParams] = useSearchParams();
  const lastResult = useActionData<typeof action>();
  const isSubmitting = useIsPending();
  const redirectTo = searchParams.get("redirectTo");
  const [form, fields] = useForm({
    id: "login",
    constraint: getZodConstraint(schema),
    defaultValue: { redirectTo },
    lastResult,
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });
  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-heading">Sign in to Warbler</DialogTitle>
      </DialogHeader>
      <div className="contents">
        <GoogleLogin redirectTo={redirectTo} />
        <Separator />
        <Form className="contents" method="POST" {...getFormProps(form)}>
          <HoneypotInputs />

          <Field>
            <Input placeholder="Email or username" {...getInputProps(fields.identifier, { type: "text" })} />
            <FieldError>{fields.identifier.errors?.join(", ")}</FieldError>
          </Field>

          <PasswordField placeholder="Your password" field={fields.password} />

          <input {...getInputProps(fields.redirectTo, { type: "hidden" })} />

          <Button type="submit" className="rounded-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader /> : "Next"}
          </Button>
        </Form>
        <Button className="rounded-full" variant="outline" asChild>
          <Link to="/forgot-password">Forgot Password?</Link>
        </Button>
      </div>
      <p className="text-neutral-700">
        Don&apos;t have an account?
        <Button className="text-blue-500" variant="link" asChild>
          <Link
            to={{
              pathname: "/signup",
              search: redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : "",
            }}>
            Sign up
          </Link>
        </Button>
      </p>
    </>
  );
}
