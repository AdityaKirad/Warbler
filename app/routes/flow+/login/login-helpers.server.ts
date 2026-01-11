import { parseWithZod } from "@conform-to/zod";
import { login, resolveLoginMethod } from "~/.server/authentication";
import { IdentifierSchema } from "~/lib/user-validation";
import { z } from "zod";
import { createCredentialLoginSchema } from ".";
import { handleNewSession } from "./login.server";

export async function handleGetLoginVariant(formData: FormData) {
  const submission = await parseWithZod(formData, {
    schema: (intent) =>
      IdentifierSchema.transform(async (data, ctx) => {
        if (intent !== null) return { ...data, variant: null };

        const variant = await resolveLoginMethod(data.identifier);

        if (!variant) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid Credentials",
            path: ["identifier"],
          });

          return z.NEVER;
        }

        return { ...data, variant };
      }),
    async: true,
  });

  if (submission.status !== "success" || !submission.value.variant) {
    return { result: submission.reply() };
  }

  return {
    variant: submission.value.variant,
  };
}

export async function handleLogin(request: Request, formData: FormData) {
  const submission = await parseWithZod(formData, {
    schema: (intent) =>
      createCredentialLoginSchema(formData.get("variant") as string).transform(
        async (data, ctx) => {
          if (intent !== null) return { ...data, session: null };

          const session = await login(request, data);

          if (!session) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Invalid Credentials",
              path: ["identifier"],
            });

            return z.NEVER;
          }

          return { ...data, session };
        },
      ),
    async: true,
  });

  if (submission.status !== "success" || !submission.value.session) {
    return {
      result: submission.reply(),
      variant: {
        identifier: submission.payload.identifier?.toString(),
        method: "credential",
        type: "Email",
      },
    };
  }

  const { session } = submission.value;

  const url = new URL(request.url);

  return handleNewSession({
    redirectTo: url.searchParams.get("redirectTo"),
    ...session,
  });
}
