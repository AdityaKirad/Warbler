import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import DefaultProfilePicture from "~/assets/default-profile-picture.png";
import { DateField, ErrorList, Field } from "~/components/forms";
import { Spinner } from "~/components/spinner";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useIsPending } from "~/hooks/use-is-pending";
import { useUser } from "~/hooks/use-user";
import { CameraIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import type { action } from ".";
import { avatarSchema, dobSchema, usernameSchema } from "./schema";

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

      <input type="hidden" name="update_field" value="dob" />

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
  const [imageSrc, imageSrcSet] = useState<string | null>(
    DefaultProfilePicture,
  );
  const [form, fields] = useForm({
    id: "avatar",
    lastResult: fetcher.data,
    constraint: getZodConstraint(avatarSchema),
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: avatarSchema }),
  });
  return (
    <fetcher.Form
      className="contents"
      method="POST"
      encType="multipart/form-data"
      action="/onboarding"
      {...getFormProps(form)}>
      <h2 className="text-heading font-semibold">{title}</h2>
      <p className="text-muted-foreground text-sm">{description}</p>

      <div className="m-auto grid place-items-center gap-2">
        <div
          className="grid size-30 place-items-center rounded-full bg-cover bg-center bg-no-repeat outline-2 outline-offset-2"
          style={{
            backgroundImage: `url(${imageSrc})`,
          }}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <label className="bg-background/50 hover:bg-background/70 has-focus-visible:bg-background/70 rounded-full p-3 transition-colors">
                  <CameraIcon />
                  <input
                    className="sr-only"
                    accept="image/pjp,image/jfif,image/jpe,image/pjpeg,image/jpg,image/jpeg,image/png,image/webp"
                    onChange={(evt) => {
                      const file = evt.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (evt) =>
                          imageSrcSet(evt.target?.result?.toString() ?? null);
                        reader.readAsDataURL(file);
                      }
                    }}
                    {...getInputProps(fields.avatar, { type: "file" })}
                  />
                </label>
              </TooltipTrigger>
              <TooltipContent>Add photo</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <ErrorList errors={fields.avatar.errors} id={fields.avatar.id} />
      </div>

      <Button
        className="mt-auto rounded-full"
        type="submit"
        disabled={isPending}>
        {isPending ? <Spinner /> : hasNextStep ? "Next" : "Save"}
      </Button>

      <Button
        className="mb-4 rounded-full"
        variant="outline"
        type="submit"
        formAction="/onboarding?intent=skip"
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

      <input type="hidden" name="update_field" value="username" />

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
