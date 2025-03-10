import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, redirect, useActionData } from "@remix-run/react";
import DateConform from "~/components/conform-inputs/date-conform";
import { Button } from "~/components/ui/button";
import { DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { DOBSchema } from "~/lib/user-validation";
import { checkHoneyPot } from "~/services/honeypot.server";
import { getOnboardingSession, onboardingSessionStorage } from "~/services/session/onboarding.server";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { z } from "zod";
import { getOnboardingUserEmail } from "./verify.server";

const schema = z.object({
  dob: DOBSchema,
});

export async function loader({ request }: LoaderFunctionArgs) {
  await getOnboardingUserEmail(request);
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  await getOnboardingUserEmail(request);
  const formData = await request.formData();

  checkHoneyPot(formData);

  const sumission = parseWithZod(formData, { schema });

  if (sumission.status !== "success") return sumission.reply();

  const session = await getOnboardingSession(request);
  session.set("dob", sumission.value.dob);

  const redirectTo = new URL(request.url).searchParams.get("redirectTo");
  const redirectURL = redirectTo ? `/onboarding?redirectTo=${redirectTo}` : "/onboarding";

  throw redirect(redirectURL, {
    headers: {
      "set-cookie": await onboardingSessionStorage.commitSession(session),
    },
  });
}

export default function Page() {
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    id: "google-signup",
    constraint: getZodConstraint(schema),
    lastResult,
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });
  return (
    <>
      <DialogHeader className="flex-col items-start gap-2">
        <DialogTitle className="text-heading">What&apos; your birth date?</DialogTitle>
        <p className="text-sm text-muted-foreground">This won&apos;t be public</p>
      </DialogHeader>
      <Form method="POST" {...getFormProps(form)}>
        <DateConform field={fields.dob} />
        <HoneypotInputs />
        <Button className="mt-24 w-full rounded-full" type="submit">
          Sign up
        </Button>
      </Form>
    </>
  );
}
