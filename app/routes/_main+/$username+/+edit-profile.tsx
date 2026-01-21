import DefaultProfilePicture from "~/assets/default-profile-picture.png";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { useState } from "react";
import { Link, useFetcher, useLoaderData } from "react-router";
import type { LayoutLoader } from "./_layout";

export function EditProfile() {
  const fetcher = useFetcher();
  const data = useLoaderData<LayoutLoader>();
  const [dialog, dialogSet] = useState(false);
  return (
    <Dialog open={dialog} onOpenChange={dialogSet}>
      <DialogTrigger asChild>
        <Button
          className="float-right mt-4 mr-8 rounded-full"
          variant="outline">
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="px-4 pt-4">
        <fetcher.Form className="flex flex-col gap-4">
          <DialogTitle className="ml-12">Edit Profile</DialogTitle>
          <div className="relative [--header-height:12.5rem]">
            {data?.coverImage ? (
              <Link to="cover_image"></Link>
            ) : (
              <div className="bg-muted h-(--header-height)" />
            )}
            <div className="bg-background absolute top-[calc(var(--header-height)-var(--photo-size)/2)] left-4 rounded-full p-1 [--photo-size:7.5rem]">
              <img
                className="size-(--photo-size) rounded-full"
                src={data?.photo ?? DefaultProfilePicture}
                alt={data?.name ?? "User profile"}
                decoding="async"
                loading="lazy"
              />
            </div>
          </div>
        </fetcher.Form>
      </DialogContent>
    </Dialog>
  );
}
