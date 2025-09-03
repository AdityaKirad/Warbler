import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { requireUser, signup } from "~/.server/authenticator";
import { db } from "~/.server/drizzle";
import { checkHoneyPot } from "~/.server/honeypot";
import { flashSessionStorage } from "~/.server/session/flash";
import { onboardingSessionStorage } from "~/.server/session/onboarding";
import LogoSmall from "~/assets/logo-small.webp";
import { DateField, Field } from "~/components/forms";
import { Button } from "~/components/ui/button";
import { Loader } from "~/components/ui/loader";
import { useIsPending } from "~/hooks/use-is-pending";
import { useOutsideClick } from "~/hooks/use-outside-click";
import { DOBSchema, UsernameSchema } from "~/lib/user-validation";
import { XIcon } from "lucide-react";
import {
  Form,
  Link,
  redirect,
  useActionData,
  useLocation,
  useNavigate,
} from "react-router";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { z } from "zod";
import { handleNewSession } from "../flow+/login.server";
import type { Route } from "./+types/home";

const schema = z.object({
  dob: DOBSchema,
  username: UsernameSchema,
});

export async function loader({ request }: Route.LoaderArgs) {
  const session = await onboardingSessionStorage.getSession(
    request.headers.get("cookie"),
  );
  if (session.get("data")) return { onboarding: true };
  await requireUser(request);
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  const session = await onboardingSessionStorage.getSession(
    request.headers.get("cookie"),
  );

  const data = session.get("data");

  if (!data) {
    throw redirect("/home", {
      headers: {
        "set-cookie": await onboardingSessionStorage.destroySession(session),
      },
    });
  }

  const formData = await request.formData();

  checkHoneyPot(formData);

  const submission = await parseWithZod(formData, {
    schema: schema.superRefine(async ({ username }, ctx) => {
      const isEmailTaken = await db.query.user.findFirst({
        columns: { id: true },
        where: (user, { eq }) => eq(user.username, username),
      });

      if (isEmailTaken) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["username"],
          message: "Username already taken",
        });
      }
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const { username, dob } = submission.value;

  const sessionData = await signup(request, {
    accountInfo: {
      provider: data.provider,
      providerId: data.providerId,
    },
    userInfo: {
      username,
      dob,
      name: data.name,
      email: data.email,
      emailVerified: data.emailVerified,
      image: data.image,
    },
  });

  if (!sessionData) {
    const flashSession = await flashSessionStorage.getSession();

    flashSession.set(
      "__flash",
      `Something went wrong when signing up you with ${data.provider}. Please try again later.`,
    );

    throw redirect("/home", {
      headers: {
        "set-cookie": await flashSessionStorage.commitSession(flashSession),
      },
    });
  }

  return handleNewSession({
    session: sessionData,
    headers: {
      "set-cookie": await onboardingSessionStorage.destroySession(session),
    },
  });
}

export default function Page({ loaderData }: Route.ComponentProps) {
  const location = useLocation();
  return (
    <>
      {loaderData.onboarding && <OnboardingForm />}
      <div>
        New Page
        <Button asChild>
          <a
            href={`/flow/logout?redirectTo=${encodeURIComponent(location.pathname + location.search)}`}>
            Logout
          </a>
        </Button>
      </div>
    </>
  );
}

function OnboardingForm() {
  const lastResult = useActionData<typeof action>();
  const isSubmitting = useIsPending();
  const [form, fields] = useForm({
    id: "oauth-onboarding",
    lastResult,
    shouldValidate: "onBlur",
    constraint: getZodConstraint(schema),
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
  });
  const navigate = useNavigate();
  const ref = useOutsideClick<React.ElementRef<"div">>(() => navigate("/home"));
  return (
    <div>
      <div className="bg-background/80 fixed inset-0 z-20" />
      <div
        className="bg-background fixed top-1/2 left-1/2 z-50 flex w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-2 rounded-lg border px-24 pt-6 pb-12 shadow-lg"
        ref={ref}>
        <img
          alt="brand logo"
          className="mx-auto"
          decoding="async"
          height="64"
          loading="lazy"
          src={LogoSmall}
          width="64"
        />

        <h1 className="text-heading">Complete your Profile</h1>

        <Form
          className="flex flex-col gap-2"
          method="POST"
          {...getFormProps(form)}>
          <HoneypotInputs />

          <Field
            errors={fields.username.errors}
            inputProps={{ ...getInputProps(fields.username, { type: "text" }) }}
            labelProps={{ children: "UserName" }}
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
            asChild
            className="absolute top-2 left-2 rounded-full"
            size="icon"
            variant="ghost">
            <Link to="/">
              <XIcon aria-hidden={true} />
              <span className="sr-only">Close</span>
            </Link>
          </Button>

          <Button
            className="mt-16 rounded-full"
            disabled={isSubmitting}
            type="submit">
            {isSubmitting ? <Loader /> : "Next"}
          </Button>
        </Form>
      </div>
    </div>
  );
}
