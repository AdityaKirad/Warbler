import { parseWithZod } from "@conform-to/zod";
import type { VerificationType } from "~/.server/authentication";
import {
  getExpirationDate,
  isDateExpired,
  validateVerificationCode,
} from "~/.server/authentication";
import { getSignedToken, parseSignedToken } from "~/.server/utils";
import { base64url } from "~/lib/utils";
import { redirect } from "react-router";
import { schema } from "./verification-form";

export async function handleVerification(request: Request, formData: FormData) {
  const token = getVerificationToken<{
    identifier: string;
    expiresAt: string;
    type: VerificationType;
    data: Record<string, unknown>;
  }>(request);

  if (!token || isDateExpired(new Date(token.expiresAt))) {
    return redirect("/flow/login");
  }

  const submission = parseWithZod(formData, { schema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const { code } = submission.value;

  const result = await validateVerificationCode({
    identifier: token.identifier,
    code,
  });

  if (!result.success) {
    return submission.reply({
      fieldErrors: {
        code: [result.error],
      },
    });
  }

  const newToken = getSignedToken({
    emailVerified: true,
    data: token.data,
    expiresAt: getExpirationDate(60 * 10),
  });

  const nextStep: Record<VerificationType, string> = {
    signup: `/flow/signup?requested_variant=${base64url.encode("set-password")}&signature=${newToken}`,
    "password-reset": `/flow/password-reset?requested_variant=${base64url.encode("change-password")}&signature=${newToken}`,
    "verify-email": `/home?signature=${newToken}`,
  };

  throw redirect(nextStep[token.type]);
}

export function getVerificationToken<T>(request: Request) {
  const url = new URL(request.url);

  const token = url.searchParams.get("signature");

  if (!token) {
    return null;
  }

  return parseSignedToken<T>(token);
}
