import { isDateExpired } from "~/.server/authentication/utils";
import { checkHoneyPot } from "~/.server/honeypot";
import { requireAnonymous } from "~/.server/utils";
import { base64url } from "~/lib/utils";
import { VerificationForm } from "../verify/verification-form";
import {
  getVerificationToken,
  handleVerification,
} from "../verify/verify.server";
import { ChangePasswordForm, IdentifyForm } from "./+forms";
import type { Route } from "./+types";
import { handleChangePassword, handleIdentify } from "./password-reset.server";

export const meta = () => [{ title: "Warbler" }];

export async function loader({ request }: Route.LoaderArgs) {
  await requireAnonymous(request);

  const url = new URL(request.url);
  const requestedVariant = url.searchParams.get("requested_variant");

  if (!requestedVariant) {
    return {
      variant: "identify",
    } as const;
  }

  const variant = base64url.decode(requestedVariant);

  if (variant !== "verify" && variant !== "change-password") {
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

  if (variant === "change-password" && !token.emailVerified) {
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
    case "identify":
      return handleIdentify(request, formData);
    case "verify":
      return handleVerification(request, formData);
    case "change-password":
      return handleChangePassword(request, formData);
    default:
      throw Error("Invalid Action");
  }
}

const components = {
  identify: IdentifyForm,
  verify: VerificationForm,
  "change-password": ChangePasswordForm,
};

export default function Page({ loaderData }: Route.ComponentProps) {
  const Component = components[loaderData.variant];
  return <Component />;
}
