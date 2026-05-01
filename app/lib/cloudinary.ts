import { Cloudinary } from "@cloudinary/url-gen";
import { z } from "zod";

export const uploadSchema = z.object({
  type: z.enum(["avatar", "banner", "post"]),
});

export type UploadType = z.infer<typeof uploadSchema>["type"];

export const ALLOWED_FORMATS = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  mp4: "video/mp4",
  mov: "video/quicktime",
  m4v: "video/x-m4v",
  webm: "video/webm",
};

const cld = new Cloudinary({
  cloud: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  },
  url: {
    secure: true,
    analytics: false,
  },
});

export const getImgSrc = ({
  public_id,
  version,
}: {
  public_id: string;
  version: number;
}) =>
  cld
    .image(public_id)
    .setVersion(version)
    .format("auto")
    .quality("auto")
    .toURL();

export async function uploadToCloudinary(file: File, type: UploadType) {
  const res = await fetch("/cloudinary/sign", {
    method: "POST",
    body: JSON.stringify({
      type,
    }),
  });

  if (!res.ok) {
    throw new Error("Something went wrong while signing the request");
  }

  const {
    allowed_formats,
    api_key,
    cloudname,
    eager,
    eager_async,
    folder,
    overwrite,
    public_id,
    signature,
    timestamp,
  } = await res.json();

  const formData = new FormData();

  formData.append("file", file);
  formData.append("folder", folder);
  formData.append("api_key", api_key);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("allowed_formats", allowed_formats);

  if (public_id) {
    formData.append("public_id", public_id);
  }

  if (eager) {
    formData.append("eager", eager);
  }

  if (eager_async) {
    formData.append("eager_async", String(eager_async));
  }

  if (overwrite) {
    formData.append("overwrite", String(overwrite));
  }

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudname}/auto/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const data = await uploadRes.json();

  if (!uploadRes.ok) {
    throw new Error(
      data.error.message || "Something went wrong while uploading the image",
    );
  }

  return { public_id: data.public_id, version: data.version };
}
