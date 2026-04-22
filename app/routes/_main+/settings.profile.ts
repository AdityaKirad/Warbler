import { parseWithZod } from "@conform-to/zod";
import { db, user } from "~/.server/drizzle";
import { requireUser } from "~/.server/utils";
import { eq } from "drizzle-orm";
import { redirect } from "react-router";
import { z } from "zod";
import type { Route } from "./+types/settings.profile";
import { baseSchema } from "./$username+/_layout/edit-profile/base-schema";

const imageSchema = z.preprocess(
  (val) => (val instanceof File ? undefined : val),
  z
    .string()
    .transform((data) => {
      const { public_id, version } = JSON.parse(data);
      return { public_id, version };
    })
    .optional(),
);

const schema = baseSchema.extend({
  photo: imageSchema,
  coverImage: imageSchema,
});

export async function action({ request }: Route.ActionArgs) {
  const {
    user: { id: currentUserId },
  } = await requireUser(request);

  const formData = await request.formData();

  const submission = parseWithZod(formData, {
    schema,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  await db.update(user).set(submission.value).where(eq(user.id, currentUserId));

  const referer = request.headers.get("referer");

  throw redirect(referer ?? "/home");
}
