import { parseWithZod } from "@conform-to/zod";
import { cloudinary } from "~/.server/cloudinary";
import { db, user } from "~/.server/drizzle";
import { sessionDataStorage } from "~/.server/session/session-data";
import { requireUser } from "~/.server/utils";
import { eq } from "drizzle-orm";
import { data } from "react-router";
import { z } from "zod";
import type { Route } from "./+types/settings.profile";
import { baseSchema } from "./$username+/_layout/edit-profile/base-schema";

function safeJSONParse(data: string) {
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

const imageUploadSchema = z.object({
  public_id: z.string(),
  version: z.number(),
});

const schema = baseSchema.extend({
  photo: z.string().transform(safeJSONParse).pipe(imageUploadSchema).optional(),

  coverImage: z
    .string()
    .transform(safeJSONParse)
    .pipe(
      z.union([
        imageUploadSchema,
        z.object({
          intent: z.literal("delete"),
          public_id: z.string(),
        }),
      ]),
    )
    .optional(),
});

export async function action({ request }: Route.ActionArgs) {
  const { id } = await requireUser(request, { getFreshSession: true });

  const formData = await request.formData();

  const submission = parseWithZod(formData, {
    schema,
  });

  if (submission.status !== "success") {
    return data({ success: false, result: submission.reply() });
  }

  const { coverImage, ...profile } = submission.value;

  const isDeleteCoverImage = coverImage && "intent" in coverImage;

  const res = await db
    .update(user)
    .set({
      ...profile,
      coverImage: isDeleteCoverImage ? null : coverImage,
    })
    .where(eq(user.id, id))
    .returning();

  if (isDeleteCoverImage) {
    if (res.length) {
      try {
        await cloudinary.uploader.destroy(coverImage.public_id, {
          invalidate: true,
          resource_type: "image",
        });
      } catch (error) {
        console.error(error);
      }

      return data({ success: true, result: null });
    } else {
      return data({
        success: false,
        result: submission.reply({
          fieldErrors: {
            coverImage: ["Cannot delete the cover image"],
          },
        }),
      });
    }
  }

  const session = await sessionDataStorage.getSession(
    request.headers.get("cookie"),
  );

  return data(
    { success: true, result: null },
    {
      headers: {
        "set-cookie": await sessionDataStorage.destroySession(session),
      },
    },
  );
}
