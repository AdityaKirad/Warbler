import { isDateExpired } from "~/.server/authentication";
import { checkHoneyPot } from "~/.server/honeypot";
import { requireAnonymous } from "~/.server/utils";
import { DOBSchema, EmailSchema, NameSchema } from "~/lib/user-validation";
import { base64url } from "~/lib/utils";
import { z } from "zod";
import { VerificationForm } from "../verify/verification-form";
import {
  getVerificationToken,
  handleVerification,
} from "../verify/verify.server";
import { SetPasswordForm, SignupForm } from "./+forms";
import type { Route } from "./+types";
import { handleOnboarding, handleSignup } from "./signup.server";

export const signupSchema = z.object({
  name: NameSchema,
  email: EmailSchema,
  dob: DOBSchema,
});

export const meta = () => [{ title: "Signup to Warbler" }];

export async function loader({ request }: Route.LoaderArgs) {
  await requireAnonymous(request);

  const url = new URL(request.url);
  const requestedVariant = url.searchParams.get("requested_variant");

  if (!requestedVariant) {
    return {
      variant: "signup",
    } as const;
  }

  const variant = base64url.decode(requestedVariant);

  if (variant !== "verify" && variant !== "set-password") {
    throw new Response("Unhandled variant", { status: 401 });
  }

  const token = getVerificationToken<{
    emailVerified: boolean;
    expiresAt: string;
  }>(request);

  if (!token || isDateExpired(new Date(token.expiresAt))) {
    throw new Response("Verification token expired or invalid", {
      status: 401,
    });
  }

  if (variant === "set-password" && !token.emailVerified) {
    throw new Response("Email not verified", { status: 401 });
  }

  return {
    variant,
  } as const;
}

export async function action({ request }: Route.ActionArgs) {
  await requireAnonymous(request);

  const formData = await request.formData();

  checkHoneyPot(formData);

  switch (formData.get("intent")) {
    case "signup":
      return handleSignup(request, formData);
    case "verify":
      return handleVerification(request, formData);
    case "set-password":
      return handleOnboarding(request, formData);
    default:
      throw new Response("Invalid Action", { status: 401 });
  }
}

const components = {
  signup: SignupForm,
  verify: VerificationForm,
  "set-password": SetPasswordForm,
} as const;
export default function Page({
  loaderData: { variant },
}: Route.ComponentProps) {
  const Component = components[variant];

  return <Component />;
}
