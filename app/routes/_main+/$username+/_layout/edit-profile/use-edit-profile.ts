import { useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { uploadToCloudinary } from "~/lib/cloudinary";
import type { action } from "~/routes/_main+/settings.profile";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import type { UsernameLayoutLoader } from "..";
import { baseSchema as schema } from "./base-schema";

export function useEditProfile(
  {
    coverImage,
    ...user
  }: Pick<
    NonNullable<Awaited<ReturnType<UsernameLayoutLoader>>["data"]>,
    "name" | "bio" | "location" | "website" | "dob" | "coverImage"
  >,
  files: {
    photo?: File;
    coverImage?: File | null;
  },
  reset: () => void,
) {
  const formId = "edit-profile";
  const fetcher = useFetcher<typeof action>({ key: formId });

  const [editDob, editDobSet] = useState(false);
  const [open, openSet] = useState(false);

  const [form, fields] = useForm({
    id: formId,
    defaultValue: {
      ...user,
    },
    lastResult: fetcher.data?.result,
    constraint: getZodConstraint(schema),
    shouldValidate: "onBlur",
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    async onSubmit(evt, { formData }) {
      evt.preventDefault();

      const uploadPromises = [];

      if (files.photo) {
        uploadPromises.push(
          uploadToCloudinary(files.photo, "avatar").then((data) =>
            formData.set("photo", JSON.stringify(data)),
          ),
        );
      }

      if (files.coverImage) {
        uploadPromises.push(
          uploadToCloudinary(files.coverImage, "banner").then((data) =>
            formData.set("coverImage", JSON.stringify(data)),
          ),
        );
      }

      try {
        await Promise.all(uploadPromises);
      } catch (error) {
        console.error(error);
        toast((error as Error).message);
        return;
      }

      if (files.coverImage === null) {
        formData.set(
          "coverImage",
          JSON.stringify({
            intent: "delete",
            public_id: coverImage?.public_id,
          }),
        );
      }

      reset();
      fetcher.submit(formData, {
        method: "POST",
        action: "/settings/profile",
      });
    },
  });

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) {
      return;
    }

    if (fetcher.data.success) {
      // reset();
      openSet(false);
      return;
    }

    const error = fetcher.data.result?.error;

    if (error?.photo) {
      toast(error.photo);
    }

    if (error?.coverImage) {
      toast(error.coverImage);
    }
  }, [fetcher.data, fetcher.state]);

  return {
    editDob,
    fetcher,
    fields,
    form,
    formId,
    open,
    editDobSet,
    openSet,
  };
}
