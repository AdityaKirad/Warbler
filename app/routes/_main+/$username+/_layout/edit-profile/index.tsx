import {
  getFormProps,
  getInputProps,
  getTextareaProps,
} from "@conform-to/react";
import DefaultProfilePicture from "~/assets/default-profile-picture.png";
import { DateField, Field, TextAreaField } from "~/components/forms";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { getImgSrc } from "~/lib/cloudinary";
import { cn } from "~/lib/utils";
import { format } from "date-fns";
import { ArrowLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";
import type { UsernameLayoutLoader } from "..";
import { CropImage } from "./crop-image";
import { CoverImage, ProfileImage } from "./image-fields";
import { useEditProfile } from "./use-edit-profile";
import { useProfileImages } from "./use-profile-images";

export function EditProfile({
  photo,
  coverImage,
  ...user
}: Pick<
  NonNullable<Awaited<ReturnType<UsernameLayoutLoader>>["data"]>,
  | "name"
  | "username"
  | "bio"
  | "location"
  | "website"
  | "dob"
  | "photo"
  | "coverImage"
>) {
  const {
    crop,
    files,
    imgSrc,
    applyCrop,
    cropDimensionsSet,
    removeCoverImage,
    reset,
    selectFile,
  } = useProfileImages({
    photo: photo
      ? getImgSrc({ public_id: photo.public_id, version: photo.version })
      : DefaultProfilePicture,
    coverImage: coverImage
      ? getImgSrc({
          public_id: coverImage.public_id,
          version: coverImage.version,
        })
      : null,
  });
  const { editDob, fetcher, fields, form, formId, open, editDobSet, openSet } =
    useEditProfile({ coverImage, ...user }, files, reset);
  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          reset();
        }
        openSet(open);
      }}>
      <DialogTrigger asChild>
        <Button
          className="absolute right-4 -bottom-16 rounded-full"
          type="button"
          variant="outline">
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent
        className="overflow-y-scroll px-0 pt-0 pb-4"
        aria-describedby={undefined}
        showCloseButton={false}>
        <DialogHeader className="bg-background/75 flex-row items-center gap-4 py-2 pr-4 pl-2 backdrop-blur-lg">
          {crop.open ? (
            <Button
              className="rounded-full"
              variant="ghost"
              size="icon"
              type="button"
              onClick={applyCrop}>
              <ArrowLeftIcon />
            </Button>
          ) : (
            <DialogClose asChild>
              <Button
                className="rounded-full"
                variant="ghost"
                size="icon"
                type="button">
                <XIcon />
              </Button>
            </DialogClose>
          )}
          <DialogTitle>Edit {crop.open ? "Media" : "Profile"}</DialogTitle>
          <Button
            className={cn("ml-auto rounded-full px-6", { hidden: crop.open })}
            form={formId}
            type="submit">
            Save
          </Button>
          {crop.open && (
            <Button
              className="ml-auto rounded-full px-6"
              type="button"
              onClick={applyCrop}>
              Apply
            </Button>
          )}
        </DialogHeader>
        {crop.open && (
          <CropImage
            aspect={crop.aspect}
            image={crop.src}
            onCropComplete={cropDimensionsSet}
          />
        )}
        <fetcher.Form
          className={cn({ hidden: crop.open })}
          action="/settings/profile"
          method="POST"
          {...getFormProps(form)}>
          <div className="relative mb-14 h-50">
            <CoverImage
              coverImage={imgSrc.coverImage}
              username={user.username}
              selectFile={(file) => selectFile("coverImage", file)}
              removeCoverImage={removeCoverImage}
            />
            <ProfileImage
              photo={imgSrc.photo}
              username={user.username}
              selectFile={(file) => selectFile("photo", file)}
            />
          </div>
          <div className={cn("flex flex-col gap-4 px-4", { "mb-4": !editDob })}>
            <Field
              labelProps={{ children: "Name" }}
              inputProps={getInputProps(fields.name, { type: "text" })}
              errors={fields.name.errors}
            />
            <TextAreaField
              labelProps={{ children: "Bio" }}
              textAreaProps={getTextareaProps(fields.bio)}
              errors={fields.bio.errors}
            />
            <Field
              labelProps={{ children: "Location" }}
              inputProps={getInputProps(fields.location, { type: "text" })}
              errors={fields.location.errors}
            />
            <Field
              labelProps={{ children: "Website" }}
              inputProps={getInputProps(fields.website, { type: "text" })}
              errors={fields.website.errors}
            />
            {editDob && <DateField label="Date of birth" field={fields.dob} />}
          </div>
          {!editDob && (
            <>
              {<input {...getInputProps(fields.dob, { type: "hidden" })} />}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    className="h-auto w-full justify-between rounded-none"
                    type="button"
                    variant="ghost">
                    <div className="text-left text-base">
                      <p>Birth date</p>
                      <p>{format(user.dob!, "MMMM d, yyyy")}</p>
                    </div>
                    <ChevronRightIcon />
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="size-fit max-w-80! p-6"
                  showCloseButton={false}>
                  <DialogTitle>Edit date of birth?</DialogTitle>
                  <DialogDescription>
                    This can only be changed a few times. Make sure you enter
                    the age of the person using the account.{" "}
                  </DialogDescription>
                  <DialogClose className="rounded-full" asChild>
                    <Button type="button" onClick={() => editDobSet(true)}>
                      Edit
                    </Button>
                  </DialogClose>
                  <DialogClose className="rounded-full" asChild>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </DialogClose>
                </DialogContent>
              </Dialog>
            </>
          )}
        </fetcher.Form>
      </DialogContent>
    </Dialog>
  );
}
