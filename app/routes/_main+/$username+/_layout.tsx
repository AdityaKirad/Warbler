import { db, follows, tweet, user } from "~/.server/drizzle";
import DefaultProfilePicture from "~/assets/default-profile-picture.png";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { useUser } from "~/hooks/use-user";
import { formatNumber } from "~/lib/utils";
import { format } from "date-fns";
import { eq } from "drizzle-orm";
import {
  ArrowLeftIcon,
  BalloonIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  Link2Icon,
  MapPinIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { useState } from "react";
import {
  Link,
  Outlet,
  useFetcher,
  useLoaderData,
  useNavigate,
} from "react-router";
import { FeedTab } from "../+feed-tab";
import type { Route } from "./+types/_layout";

export async function loader({ params }: Route.LoaderArgs) {
  const [data] = await db
    .select({
      id: user.id,
      name: user.name,
      username: user.username,
      photo: user.photo,
      coverImage: user.coverImage,
      bio: user.bio,
      location: user.location,
      dob: user.dob,
      website: user.website,
      displayVerifiedEmail: user.displayVerifiedEmail,
      profileVerified: user.profileVerified,
      createdAt: user.createdAt,

      followers: db.$count(follows, eq(follows.followingId, user.id)),
      following: db.$count(follows, eq(follows.followerId, user.id)),
      posts: db.$count(tweet, eq(tweet.userId, user.id)),
    })
    .from(user)
    .where(eq(user.username, params.username));

  return data;
}

export default function Layout({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { user } = useUser();
  return (
    <div className="h-full">
      <div className="h-full w-150 border-r">
        <div className="bg-background/75 sticky top-0 z-10 flex items-center gap-4 p-2 backdrop-blur-sm">
          <Button
            className="rounded-full"
            variant="ghost"
            size="icon"
            aria-label="Back"
            onClick={() => navigate(-1)}>
            <ArrowLeftIcon className="size-5" />
          </Button>
          <div className="leading-none">
            <h1 className="text-xl font-bold">{loaderData?.name}</h1>
            <span className="text-muted-foreground text-sm">
              {formatNumber(loaderData?.posts)}
            </span>
          </div>
        </div>
        <div className="relative [--header-height:12.5rem]">
          {loaderData?.coverImage ? (
            <Link to="cover_image"></Link>
          ) : (
            <div className="bg-muted h-(--header-height)" />
          )}
          <div>
            <Link
              className="bg-background absolute top-[calc(var(--header-height)-var(--photo-size)/2)] left-4 rounded-full p-1 [--photo-size:7.5rem]"
              to="about">
              <img
                className="size-(--photo-size) rounded-full"
                src={loaderData?.photo ?? DefaultProfilePicture}
                alt={loaderData?.name ?? "User profile"}
                decoding="async"
                loading="lazy"
              />
            </Link>
            {loaderData?.id === user.id ? <EditProfileButton /> : <></>}
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-2 p-4">
          <div className="leading-none">
            <h2 className="text-xl font-bold">{loaderData?.name}</h2>
            <span className="text-muted-foreground text-sm">
              @{loaderData?.username}
            </span>
          </div>
          {loaderData?.bio && <p>{loaderData.bio}</p>}
          <div className="text-muted-foreground flex flex-wrap gap-2 [&_svg]:size-5 [&>div]:flex [&>div]:items-center [&>div]:gap-1">
            {loaderData?.location && (
              <div>
                <MapPinIcon />
                <span>{loaderData.location}</span>
              </div>
            )}
            {loaderData?.website && (
              <div>
                <Link2Icon />
                <span>{loaderData.website}</span>
              </div>
            )}
            {loaderData?.dob && (
              <div>
                <BalloonIcon />
                <span>Born {format(loaderData.dob, "MMMM d, yyyy")}</span>
              </div>
            )}
            {loaderData?.createdAt && (
              <div>
                <CalendarDaysIcon />
                <span>Joined {format(loaderData.createdAt, "MMMM yyyy")}</span>
                <ChevronRightIcon />
              </div>
            )}
            {loaderData?.displayVerifiedEmail && (
              <div>
                <ShieldCheckIcon />
                <span>Verified email address</span>
              </div>
            )}
          </div>
          <div className="[&_span]:text-muted-foreground flex gap-4">
            <p>
              {formatNumber(loaderData?.following)} <span>Following</span>
            </p>
            <p>
              {formatNumber(loaderData?.followers)} <span>Followers</span>
            </p>
          </div>
        </div>
        <div className="flex border-b">
          <FeedTab to="" title="Posts" label={`${loaderData?.name} Posts`} />
          <FeedTab
            to="with_replies"
            title="Replies"
            label={`${loaderData?.name} Replies`}
          />
          <FeedTab
            to="media"
            title="Media"
            label={`${loaderData?.name} Media`}
          />
        </div>
        <Outlet />
      </div>
    </div>
  );
}

function EditProfileButton() {
  const fetcher = useFetcher();
  const data = useLoaderData<typeof loader>();
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
