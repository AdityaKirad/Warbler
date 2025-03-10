import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, redirect, useActionData, useSearchParams } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Field, FieldError } from "~/components/ui/field";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "~/components/ui/input-otp";
import { Label } from "~/components/ui/label";
import { Loader } from "~/components/ui/loader";
import { useIsPending } from "~/hooks/use-is-pending";
import { IdentifierSchema } from "~/lib/user-validation";
import { checkHoneyPot } from "~/services/honeypot.server";
import { verificationSessionStorage } from "~/services/session/verify.server";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { z } from "zod";
import { validateRequest } from "./verify.server";

export const typeQueryParam = "type";
export const targetQueryParam = "target";
export const redirectToQueryParam = "redirectTo";

const VerificationTypeSchema = z.enum(["onboarding", "reset-password"]);
export const VerificationSchema = z.object({
  otp: z.string().min(6).max(6),
  [redirectToQueryParam]: z.string().optional(),
});

export type VerificationType = z.infer<typeof VerificationTypeSchema>;

export const meta = () => [{ title: "Verify your account" }];

async function getVericationParams(request: Request): Promise<{ target: string; type: VerificationType }> {
  const session = await verificationSessionStorage.getSession(request.headers.get("cookie"));
  const type = session.get(typeQueryParam);
  const target = session.get(targetQueryParam);
  const redirectTo = new URL(request.url).searchParams.get("redirectTo");

  if (!type || !target) {
    const redirectURL = redirectTo ? `/login?redirectTo=${redirectTo}` : "/login";
    throw redirect(redirectURL);
  }

  return { type, target };
}

export async function loader({ request }: LoaderFunctionArgs) {
  await getVericationParams(request);
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const { target, type } = await getVericationParams(request);
  const formData = await request.formData();

  checkHoneyPot(formData);

  return validateRequest({ body: formData, request, target, type });
}

export default function Page() {
  const lastResult = useActionData<typeof action>();
  const isSubmitting = useIsPending();
  const [searchParams] = useSearchParams();
  const [form, fields] = useForm({
    id: "signup",
    lastResult,
    constraint: getZodConstraint(VerificationSchema),
    defaultValue: {
      redirectTo: searchParams.get("redirectTo"),
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: VerificationSchema });
    },
  });
  return (
    <>
      <h1>We have sent you a code</h1>
      <Form method="POST" {...getFormProps(form)}>
        <HoneypotInputs />

        <Field>
          <Label htmlFor={fields.otp.id}>Enter it below to verify your email</Label>
          <InputOTP maxLength={6} {...getInputProps(fields.otp, { type: "text" })}>
            <InputOTPGroup className="flex-1 [&>*]:flex-1">
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup className="flex-1 [&>*]:flex-1">
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <FieldError>{fields.otp.errors}</FieldError>
        </Field>

        <input {...getInputProps(fields[redirectToQueryParam], { type: "hidden" })} />
        <Button className="mt-24 w-full rounded-full text-[1rem]" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader /> : "Next"}
        </Button>
      </Form>
    </>
  );
}
