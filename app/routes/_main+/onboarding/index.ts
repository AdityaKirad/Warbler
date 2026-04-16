import { parseWithZod } from "@conform-to/zod";
import type { FileUpload } from "@remix-run/form-data-parser";
import { parseFormData } from "@remix-run/form-data-parser";
import { cloudinary } from "~/.server/cloudinary";
import { db, user } from "~/.server/drizzle";
import { generateUsernameSuggestions, requireUser } from "~/.server/utils";
import { eq, sql } from "drizzle-orm";
import { redirect } from "react-router";
import type { Route } from "./+types";
import { dobSchema, MAX_IMAGE_SIZE, usernameSchema } from "./schema";

export async function loader({ request }: Route.LoaderArgs) {
  const {
    user: { id },
  } = await requireUser(request);

  const data = await db.query.user.findFirst({
    columns: { name: true, email: true, dob: true },
    where: (user, { eq }) => eq(user.id, id),
  });

  const suggestions = await generateUsernameSuggestions(db, {
    ...data!,
    count: 5,
  });

  return Response.json({ suggestions });
}

export async function action({ request }: Route.ActionArgs) {
  const { user } = await requireUser(request);

  if (request.headers.get("content-type")?.includes("multipart/form-data")) {
    return handleAvatarUpdate(request, user.id);
  }

  const formData = await request.formData();

  switch (formData.get("update_field")) {
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

async function handleAvatarUpdate(request: Request, userId: string) {
  const url = new URL(request.url);

  const intent = url.searchParams.get("intent");

  if (intent === "skip") {
    await db
      .update(user)
      .set({
        onboardingStepsCompleted: sql`
          json_insert(
            ${user.onboardingStepsCompleted}, '$[#]', 'profile-photo'
          )
        `,
      })
      .where(eq(user.id, userId));
  }

  async function uploadHandler(fileUpload: FileUpload) {
    if (fileUpload.fieldName !== "avatar") {
      return undefined;
    }
    try {
      const base64 = Buffer.from(await fileUpload.arrayBuffer()).toString(
        "base64",
      );
      const file = await cloudinary.uploader.upload(
        `data:${fileUpload.type};base64,${base64}`,
        {
          folder: "profile-pictures",
          allowed_formats: ["jpg", "png", "webp"],
          resource_type: "image",
          transformation: {
            width: 400,
            height: 400,
            crop: "fill",
            gravity: "face",
          },
        },
      );

      return file.secure_url;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  const formData = await parseFormData(
    request,
    { maxFiles: 1, maxFileSize: MAX_IMAGE_SIZE },
    uploadHandler,
  );

  const photo = formData.get("avatar")?.toString();

  await db
    .update(user)
    .set({
      photo,
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
      onboardingStepsCompleted: sql`json_insert(${user.onboardingStepsCompleted}, '$[#]', 'dob')`,
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
