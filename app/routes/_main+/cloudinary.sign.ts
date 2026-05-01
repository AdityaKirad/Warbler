import { cloudinary } from "~/.server/cloudinary";
import { requireUser } from "~/.server/utils";
import type { UploadType } from "~/lib/cloudinary";
import { ALLOWED_FORMATS, uploadSchema } from "~/lib/cloudinary";
import type { Route } from "./+types/cloudinary.sign";

const IMAGE_FORMATS = Object.entries(ALLOWED_FORMATS)
  .filter(([_, mime]) => mime.startsWith("image/"))
  .map(([ext]) => ext)
  .join(",");
const ALL_FORMATS = Object.keys(ALLOWED_FORMATS).join(",");

const folders: Record<UploadType, string> = {
  avatar: "avatars",
  banner: "banners",
  post: "posts",
};
const transformations: Record<Exclude<UploadType, "post">, string> = {
  avatar: "w_400,h_400,c_fill,g_auto:face",
  banner: "w_1500,h_500,c_limit,g_auto",
};

export async function action({ request }: Route.ActionArgs) {
  const {
    user: { id, photo },
  } = await requireUser(request);

  const json = await request.json();

  const parsed = uploadSchema.safeParse(json);

  if (!parsed.success) {
    return Response.json({ error: "Invalid request data" }, { status: 400 });
  }

  const { type } = parsed.data;

  const paramsToSign = {
    allowed_formats: type !== "post" ? IMAGE_FORMATS : ALL_FORMATS,
    folder: type !== "post" ? folders[type] : `${folders[type]}/${id}`,
    overwrite: type !== "post" ? true : undefined,
    public_id: type !== "post" ? photo?.public_id : crypto.randomUUID(),
    timestamp: Math.floor(Date.now() / 1000),
    eager: type !== "post" ? transformations[type] : undefined,
    eager_async: type !== "post" ? true : undefined,
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
