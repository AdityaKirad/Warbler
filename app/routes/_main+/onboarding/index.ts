import { parseWithZod } from "@conform-to/zod";
import { LibsqlError } from "@libsql/client";
import { db, user } from "~/.server/drizzle";
import { sessionDataStorage } from "~/.server/session/session-data";
import { generateUsernameSuggestions, requireUser } from "~/.server/utils";
import { eq, sql } from "drizzle-orm";
import { redirect } from "react-router";
import { z } from "zod";
import type { Route } from "./+types";
import { dobSchema, usernameSchema } from "./forms";

type ActionType = "avatar" | "dob" | "username";
type ActionCtx = { userId: string; username?: string };

const avatarSchema = z.discriminatedUnion("intent", [
  z.object({
    intent: z.literal("skip"),
  }),
  z.object({
    intent: z.literal("update"),
    avatar: z
      .string()
      .transform((val) => {
        try {
          return JSON.parse(val);
        } catch (error) {
          return val;
        }
      })
      .pipe(
        z.object({
          public_id: z.string(),
          version: z.number(),
        }),
      ),
  }),
]);

const isActionType = (action: string): action is ActionType =>
  action === "avatar" || action === "dob" || action === "username";

const onboardinUpdateSql = (step: string) =>
  sql`json_insert(${user.onboardingStepsCompleted}, '$[#]', ${step})`;

export async function loader({ request }: Route.LoaderArgs) {
  const { id } = await requireUser(request);

  const user = await db.query.user.findFirst({
    columns: { name: true, email: true, dob: true },
    where: (user, { eq }) => eq(user.id, id),
  });

  const suggestions = await generateUsernameSuggestions(db, {
    ...user!,
    count: 5,
  });

  return Response.json({ suggestions });
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request, { getFreshSession: true });

  const formData = await request.formData();

  const actionType = formData.get("action");

  if (!isActionType(actionType as string)) {
    return;
  }

  const ctx: ActionCtx = {
    userId: user.id,
    username: user.username,
  };

  const session = await sessionDataStorage.getSession(
    request.headers.get("cookie"),
  );

  const clearSessionDataHeader =
    await sessionDataStorage.destroySession(session);

  switch (actionType) {
    case "avatar":
      return handleAvatarUpdate(formData, ctx, clearSessionDataHeader);
    case "dob":
      return handleUpdateDob(formData, ctx, clearSessionDataHeader);
    case "username":
      return handleUsernameUpdate(formData, ctx, clearSessionDataHeader);
  }
}

async function handleAvatarUpdate(
  formData: FormData,
  ctx: ActionCtx,
  clearSessionDataHeader: string,
) {
  const submission = parseWithZod(formData, { schema: avatarSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  await db
    .update(user)
    .set({
      photo:
        submission.value.intent === "update" ? submission.value.avatar : null,
      onboardingStepsCompleted: onboardinUpdateSql("profile-photo"),
    })
    .where(eq(user.id, ctx.userId));

  throw redirect("/home", {
    headers: {
      "set-cookie": clearSessionDataHeader,
    },
  });
}

async function handleUpdateDob(
  formData: FormData,
  ctx: ActionCtx,
  clearSessionDataHeader: string,
) {
  const submission = parseWithZod(formData, { schema: dobSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  await db
    .update(user)
    .set({
      dob: submission.value.dob,
      onboardingStepsCompleted: onboardinUpdateSql("dob"),
    })
    .where(eq(user.id, ctx.userId));

  throw redirect("/home", {
    headers: {
      "set-cookie": clearSessionDataHeader,
    },
  });
}

async function handleUsernameUpdate(
  formData: FormData,
  ctx: ActionCtx,
  clearSessionDataHeader: string,
) {
  const submission = parseWithZod(formData, { schema: usernameSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  try {
    await db
      .update(user)
      .set({
        username: submission.value.username,
        onboardingStepsCompleted: onboardinUpdateSql("username"),
      })
      .where(eq(user.id, ctx.userId));
  } catch (error) {
    if (
      error instanceof LibsqlError &&
      error.code === "SQLITE_CONSTRAINT_UNIQUE"
    ) {
      return submission.reply({
        fieldErrors: {
          username: ["This username is already taken"],
        },
      });
    }
    throw error;
  }

  throw redirect("/home", {
    headers: {
      "set-cookie": clearSessionDataHeader,
    },
  });
}
