import { useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { uploadToCloudinary } from "~/lib/utils";
import type { action } from "~/routes/_main+/settings.profile";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import type { UsernameLayoutLoader } from "..";
import { baseSchema as schema } from "./base-schema";

export function useEditProfile(
  user: Pick<
    NonNullable<Awaited<ReturnType<UsernameLayoutLoader>>["data"]>,
    "name" | "username" | "bio" | "location" | "website" | "dob"
  >,
  files: Partial<Record<"photo" | "coverImage", File>>,
) {
  const formId = "edit-profile";
  const fetcher = useFetcher<typeof action>();

  const hasMounted = useRef(false);
  const hasSubmitted = useRef(false);

  const [editDob, editDobSet] = useState(false);
  const [open, openSet] = useState(false);

  const [form, fields] = useForm({
    id: formId,
    defaultValue: { ...user },
    lastResult: fetcher.data,
    constraint: getZodConstraint(schema),
    shouldValidate: "onBlur",
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    async onSubmit(_, { formData, submission }) {
      if (files.photo) {
        try {
          const data = await uploadToCloudinary(files.photo, "profile");
          formData.set("photo", JSON.stringify(data));
        } catch (error) {
          toast((error as Error).message);
          return submission?.reply({
            fieldErrors: { photo: [(error as Error).message] },
          });
        }
      }

      if (files.coverImage) {
        try {
          const data = await uploadToCloudinary(files.coverImage, "header");
          formData.set("coverImage", JSON.stringify(data));
        } catch (error) {
          toast((error as Error).message);
          return submission?.reply({
            fieldErrors: { coverImage: [(error as Error).message] },
          });
        }
      }

      fetcher.submit(formData, {
        method: "POST",
        action: "/settings/profile",
      });

      hasSubmitted.current = true;
    },
  });

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    if (!hasSubmitted.current) {
      return;
    }

    if (fetcher.state === "idle" && !fetcher.data) {
      openSet(false);
      hasSubmitted.current = false;
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
