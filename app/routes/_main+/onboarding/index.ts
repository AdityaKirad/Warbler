import { parseWithZod } from "@conform-to/zod";
import { db, user } from "~/.server/drizzle";
import { generateUsernameSuggestions, requireUser } from "~/.server/utils";
import { eq, sql } from "drizzle-orm";
import { redirect } from "react-router";
import { z } from "zod";
import type { Route } from "./+types";
import { dobSchema, usernameSchema } from "./forms";

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

export async function loader({ request }: Route.LoaderArgs) {
  const {
    user: { id },
  } = await requireUser(request);

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
  const { user } = await requireUser(request);

  const formData = await request.formData();

  switch (formData.get("update")) {
    case "avatar":
      return handleAvatarUpdate(formData, user.id);
    case "dob":
      return handleUpdateDob(formData, user.id);
    case "username":
      return handleUsernameUpdate(formData, {
        userId: user.id,
        username: user.username,
      });
    default:
      return null;
  }
}

async function handleAvatarUpdate(formData: FormData, userId: string) {
  const submission = parseWithZod(formData, { schema: avatarSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  await db
    .update(user)
    .set({
      photo:
        submission.value.intent === "update" ? submission.value.avatar : null,
      onboardingStepsCompleted: sql`
      json_insert(
        ${user.onboardingStepsCompleted}, '$[#]', 'profile-photo'
      )
    `,
    })
    .where(eq(user.id, userId));

  throw redirect("/home");
}

async function handleUpdateDob(formData: FormData, userId: string) {
  const submission = parseWithZod(formData, { schema: dobSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  await db
    .update(user)
    .set({
      dob: submission.value.dob,
      onboardingStepsCompleted: sql`
        json_insert(${user.onboardingStepsCompleted}, '$[#]', 'dob')
      `,
    })
    .where(eq(user.id, userId));

  throw redirect("/home");
}

async function handleUsernameUpdate(
  formData: FormData,
  { userId, username }: { userId: string; username: string },
) {
  const submission = parseWithZod(formData, { schema: usernameSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const intent = formData.get("intent");

  const onboardingUpdateSql = sql`json_insert(${user.onboardingStepsCompleted}, '$[#]', 'username')`;

  if (intent === "update" && username !== submission.value.username) {
    const isUsernameTaken = await db.query.user.findFirst({
      columns: { id: true },
      where: (user, { eq }) => eq(user.username, submission.value.username),
    });

    if (!isUsernameTaken) {
      await db
        .update(user)
        .set({
          username: submission.value.username,
          onboardingStepsCompleted: onboardingUpdateSql,
        })
        .where(eq(user.id, userId));
    }

    return submission.reply({
      fieldErrors: {
        username: ["This username is already taken"],
      },
    });
  }

  await db
    .update(user)
    .set({
      onboardingStepsCompleted: onboardingUpdateSql,
    })
    .where(eq(user.id, userId));

  throw redirect("/home");
}
