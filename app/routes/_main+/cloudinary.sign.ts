import { cloudinary } from "~/.server/cloudinary";
import { requireUser } from "~/.server/utils";
import type { Route } from "./+types/cloudinary.sign";

export async function action({ request }: Route.ActionArgs) {
  await requireUser(request);

  const { folder } = Object.fromEntries(await request.formData());

  const paramsToSign = {
    folder,
    timestamp: Math.floor(new Date().getTime() / 1000),
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET,
  );

  return Response.json({
    ...paramsToSign,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  });
}
