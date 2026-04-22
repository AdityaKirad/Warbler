import { cloudinary } from "~/.server/cloudinary";
import { requireUser } from "~/.server/utils";
import { ALLOWED_FORMATS } from "~/lib/utils";
import { z } from "zod";
import type { Route } from "./+types/cloudinary.sign";

const schema = z.object({
  type: z.enum(["header", "post", "profile"]),
});

type UploadType = z.infer<typeof schema>["type"];

const IMAGE_FORMATS = Object.entries(ALLOWED_FORMATS)
  .reduce((acc, [ext, mime]) => {
    if (mime.startsWith("image")) {
      acc.push(ext);
    }
    return acc;
  }, [] as string[])
  .join(",");
const ALL_FORMATS = Object.keys(ALLOWED_FORMATS).join(",");

const folders: Record<UploadType, string> = {
  header: "header-images",
  post: "post-images",
  profile: "profile-images",
};
const transformations: Record<UploadType, string> = {
  header: "w_1500,h_500,c_limit,g_auto",
  post: "",
  profile: "w_400,h_400,c_fill,g_auto:face",
};

export async function action({ request }: Route.ActionArgs) {
  const {
    user: { id },
  } = await requireUser(request);

  const json = await request.json();

  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    return Response.json({ error: "Invalid request data" }, { status: 400 });
  }

  const { type } = parsed.data;

  const paramsToSign = {
    allowed_formats: type === "post" ? ALL_FORMATS : IMAGE_FORMATS,
    folder: `${folders[type]}/${id}`,
    overwrite: type !== "post" ? true : undefined,
    public_id:
      type === "profile"
        ? "avatar"
        : type === "header"
          ? "header"
          : crypto.randomUUID(),
    timestamp: Math.floor(Date.now() / 1000),
    transformation: transformations[type],
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET,
  );

  return Response.json({
    ...paramsToSign,
    signature,
    api_key: process.env.CLOUDINARY_API_KEY,
    cloudname: process.env.VITE_CLOUDINARY_CLOUD_NAME,
  });
}
