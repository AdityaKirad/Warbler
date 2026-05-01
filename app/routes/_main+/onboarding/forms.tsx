import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import DefaultProfilePicture from "~/assets/default-profile-picture.png";
import { DateField, Field } from "~/components/forms";
import { Spinner } from "~/components/spinner";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useFileInput } from "~/hooks/use-file-input";
import { useIsPending } from "~/hooks/use-is-pending";
import { useUser } from "~/hooks/use-user";
import { uploadToCloudinary } from "~/lib/cloudinary";
import { DOBSchema, UsernameSchema } from "~/lib/user-validation";
import { cn } from "~/lib/utils";
import { CameraIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import type { action } from ".";

const avatarSchema = z.object({
  intent: z.enum(["skip", "update"]),
  avatar: z.instanceof(File).optional(),
});

export const dobSchema = z.object({
  dob: DOBSchema,
});

export const usernameSchema = z.object({
  intent: z.enum(["skip", "update"]),
  username: UsernameSchema,
});

export function DOB({
  title,
  description,
  hasNextStep,
}: {
  title: string;
  description: string;
  hasNextStep: boolean;
}) {
  const isPending = useIsPending();
  const fetcher = useFetcher<typeof action>();
  const [form, fields] = useForm({
    id: "dob",
    lastResult: fetcher.data,
    constraint: getZodConstraint(dobSchema),
    onValidate: ({ formData }) => parseWithZod(formData, { schema: dobSchema }),
  });
  return (
    <fetcher.Form
      method="POST"
      className="contents"
      action="/onboarding"
      {...getFormProps(form)}>
      <h2 className="text-heading font-semibold">{title}</h2>

      <DateField
        field={fields.dob}
        description={description}
        label="Date of Birth"
      />

      <input type="hidden" name="update" value="dob" />

      <Button
        className="mt-auto mb-4 rounded-full"
        type="submit"
        disabled={isPending}>
        {isPending ? <Spinner /> : hasNextStep ? "Next" : "Save"}
      </Button>
    </fetcher.Form>
  );
}

export function ProfilePhoto({
  title,
  description,
  hasNextStep,
}: {
  title: string;
  description: string;
  hasNextStep: boolean;
}) {
  const isPending = useIsPending();
  const fetcher = useFetcher<typeof action>();
  const [imgSrc, imgSrcSet] = useState<{ src: string; file: File | null }>({
    src: DefaultProfilePicture,
    file: null,
  });
  const [form] = useForm({
    id: "avatar",
    lastResult: fetcher.data,
    constraint: getZodConstraint(avatarSchema),
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: avatarSchema }),
    async onSubmit(evt, { formData }) {
      evt.preventDefault();

      if (formData.get("intent") === "update") {
        if (!imgSrc.file) {
          toast("Please select a file");
          return;
        }

        URL.revokeObjectURL(imgSrc.src);

        try {
          const data = await uploadToCloudinary(imgSrc.file, "avatar");
          formData.set("avatar", JSON.stringify(data));
        } catch (error) {
          console.error(error);
          toast((error as Error).message);
          return;
        }
      } else {
        if (imgSrc.file) {
          URL.revokeObjectURL(imgSrc.src);
        }
      }

      fetcher.submit(formData, {
        method: "POST",
        action: "/onboarding",
      });
    },
  });
  const {
    accept,
    dragOver,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileInputChange,
  } = useFileInput({
    type: "profile",
    maxSize: 2 * 1024 * 1024,
    onFiles(files) {
      const file = files[0]!;
      imgSrcSet((prev) => {
        if (prev.src.startsWith("blob:")) {
          URL.revokeObjectURL(prev.src);
        }
        return { src: URL.createObjectURL(file), file };
      });
    },
    onInvalidFiles() {
      toast("Invalid file type or file exceeds size limit");
    },
  });
  return (
    <fetcher.Form
      className="contents"
      method="POST"
      action="/onboarding"
      {...getFormProps(form)}>
      <h2 className="text-heading font-semibold">{title}</h2>
      <p className="text-muted-foreground text-sm">{description}</p>

      <div
        className={cn(
          "relative m-auto size-30 rounded-full outline-2 outline-offset-2 transition-colors",
          { "outline-blue-500 outline-dashed": dragOver },
        )}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}>
        <img
          className="aspect-square rounded-full object-cover object-center"
          src={imgSrc.src}
          alt="Profile avatar"
          decoding="async"
          loading="lazy"
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <label className="bg-background/50 hover:bg-background/70 has-focus-visible:bg-background/70 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full p-3 transition-colors">
                <CameraIcon />
                <input
                  className="sr-only"
                  accept={accept}
                  type="file"
                  onChange={handleFileInputChange}
                />
              </label>
            </TooltipTrigger>
            <TooltipContent>Add photo</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <input type="hidden" name="update" value="avatar" />

      <Button
        className="mt-auto rounded-full"
        type="submit"
        name="intent"
        value="update"
        disabled={isPending}>
        {isPending ? <Spinner /> : hasNextStep ? "Next" : "Save"}
      </Button>

      <Button
        className="mb-4 rounded-full"
        variant="outline"
        type="submit"
        name="intent"
        value="skip"
        disabled={isPending}>
        Skip for now
      </Button>
    </fetcher.Form>
  );
}

export function Username({
  title,
  description,
  hasNextStep,
}: {
  title: string;
  description: string;
  hasNextStep: boolean;
}) {
  const isPending = useIsPending();
  const fetcher = useFetcher<typeof action>();
  const user = useUser();
  const [suggestions, suggestionsSet] = useState<string[]>([]);
  const [showAllSuggestions, showAllSuggestionsSet] = useState(false);
  const [form, fields] = useForm({
    id: "username",
    defaultValue: {
      username: user?.username,
    },
    lastResult: fetcher.data,
    constraint: getZodConstraint(usernameSchema),
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: usernameSchema }),
  });

  const visibleSuggestions = showAllSuggestions
    ? suggestions
    : suggestions.slice(0, 2);

  useEffect(() => {
    (async () => {
      const res = await fetch("/onboarding");
      const data = await res.json();
      suggestionsSet(data.suggestions);
    })();
  }, []);
  return (
    <fetcher.Form
      method="POST"
      className="contents"
      action="/onboarding"
      {...getFormProps(form)}>
      <h2 className="text-heading font-semibold">{title}</h2>
      <p className="text-muted-foreground text-sm">{description}</p>

      <Field
        labelProps={{ children: "Username" }}
        inputProps={{
          ...getInputProps(fields.username, { type: "text" }),
        }}
        errors={fields.username.errors}
      />
      <div className="flex flex-wrap gap-2">
        {visibleSuggestions.map((suggestion) => (
          <Button
            key={suggestion}
            className="h-fit p-0 text-blue-500"
            type="button"
            variant="link"
            onClick={() =>
              form.update({
                name: fields.username.name,
                value: suggestion,
              })
            }>
            {suggestion}
          </Button>
        ))}
      </div>

      {suggestions.length > 2 && (
        <Button
          className="size-fit p-0 text-blue-500"
          type="button"
          variant="link"
          onClick={() => showAllSuggestionsSet((prev) => !prev)}>
          {showAllSuggestions ? "Show less" : "Show more"}
        </Button>
      )}

      <input type="hidden" name="update" value="username" />

      <Button
        className="mt-auto rounded-full"
        type="submit"
        name="intent"
        value="update"
        disabled={isPending}>
        {isPending ? <Spinner /> : hasNextStep ? "Next" : "Save"}
      </Button>

      <Button
        className="rounded-full"
        variant="outline"
        type="submit"
        name="intent"
        value="skip"
        disabled={isPending}>
        Skip for now
      </Button>
    </fetcher.Form>
  );
}
