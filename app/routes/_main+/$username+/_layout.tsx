import { db, follows, tweet, user } from "~/.server/drizzle";
import DefaultProfilePicture from "~/assets/default-profile-picture.png";
import { FeedTab } from "~/components/feed-tab";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useUser } from "~/hooks/use-user";
import { formatNumber } from "~/lib/utils";
import { format } from "date-fns";
import { eq } from "drizzle-orm";
import {
  ArrowLeftIcon,
  BalloonIcon,
  BanIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  InfoIcon,
  Link2Icon,
  MapPinIcon,
  MoreHorizontalIcon,
  ShareIcon,
  ShieldCheckIcon,
  VolumeOffIcon,
} from "lucide-react";
import {
  Link,
  Outlet,
  useFetcher,
  useLoaderData,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";
import { toast } from "sonner";
import { EditProfile } from "./+edit-profile";
import type { Route } from "./+types/_layout";
import type { action } from "./follow";

export type LayoutLoader = typeof loader;

export async function loader({ params }: Route.LoaderArgs) {
  // const followers = db
  //   .$with("followers")
  //   .as(
  //     db
  //       .select({ id: follows.followerId })
  //       .from(follows)
  //       .where(eq(follows.followingId, user.id)),
  //   );
  const [data] = await db
    // .with(followers)
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

      // followers: followers.id,
      following: db.$count(follows, eq(follows.followerId, user.id)),
      posts: db.$count(tweet, eq(tweet.userId, user.id)),
    })
    .from(user)
    // .leftJoin(followers, eq(user.id, followers.id))
    .where(eq(user.username, params.username));

  return data;
}

export default function Layout({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  console.log(loaderData);
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
        <ProfileHeader />
        <div className="mt-14 flex flex-col gap-2 p-4">
          <ProfileData />
          <div className="[&_span]:text-muted-foreground flex gap-4">
            <p>
              {formatNumber(loaderData?.following)} <span>Following</span>
            </p>
            {/* <p>
              {formatNumber(loaderData?.followers)} <span>Followers</span>
            </p> */}
          </div>
        </div>
        <Tabs />
        <Outlet />
      </div>
    </div>
  );
}

function ProfileHeader() {
  const user = useLoaderData<LayoutLoader>();
  const currentUser = useUser();
  return (
    <div className="relative [--header-height:12.5rem]">
      {user?.coverImage ? (
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
            src={user?.photo ?? DefaultProfilePicture}
            alt={user?.name ?? "User profile"}
            decoding="async"
            loading="lazy"
          />
        </Link>
        {user?.id === currentUser.user.id ? (
          <EditProfile />
        ) : (
          <ProfileActions />
        )}
      </div>
    </div>
  );
}

function ProfileData() {
  const user = useLoaderData<LayoutLoader>();
  return (
    <>
      <div className="leading-none">
        <h2 className="text-xl font-bold">{user?.name}</h2>
        <span className="text-muted-foreground text-sm">@{user?.username}</span>
      </div>
      {user?.bio && <p>{user.bio}</p>}
      <div className="text-muted-foreground flex flex-wrap gap-2 [&_svg]:size-5 [&>div]:flex [&>div]:items-center [&>div]:gap-1">
        {user?.location && (
          <div>
            <MapPinIcon />
            <span>{user.location}</span>
          </div>
        )}
        {user?.website && (
          <div>
            <Link2Icon />
            <span>{user.website}</span>
          </div>
        )}
        {user?.dob && (
          <div>
            <BalloonIcon />
            <span>Born {format(user.dob, "MMMM d, yyyy")}</span>
          </div>
        )}
        {user?.createdAt && (
          <div>
            <CalendarDaysIcon />
            <span>Joined {format(user.createdAt, "MMMM yyyy")}</span>
            <ChevronRightIcon />
          </div>
        )}
        {user?.displayVerifiedEmail && (
          <div>
            <ShieldCheckIcon />
            <span>Verified email address</span>
          </div>
        )}
      </div>
    </>
  );
}

function ProfileActions() {
  const fetcher = useFetcher<typeof action>();
  const params = useParams();
  const user = useLoaderData<typeof loader>();
  const location = useLocation();
  return (
    <div className="float-right mt-4 mr-4 flex gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="rounded-full"
            variant="outline"
            size="icon"
            aria-label="More">
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            className="flex items-center gap-2 text-base font-medium"
            asChild>
            <Link
              to={`/${params.username}/about`}
              aria-label="About this account">
              <InfoIcon />
              <span>About this account</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center gap-2 text-base font-medium"
            asChild>
            <button
              onClick={async () => {
                if (navigator.share) {
                  try {
                    await navigator.share({
                      url: `${process.env.URL}/${params.username}`,
                    });
                  } catch (error) {
                    console.error(error);
                  }
                } else {
                  toast("Your browser doesn't support sharing.");
                }
              }}>
              <ShareIcon />
              <span>Share @{params.username} via...</span>
            </button>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex w-full items-center gap-2 text-base font-medium"
            asChild>
            <button
              onClick={() =>
                navigator.clipboard.writeText(
                  `${process.env.URL}/${params.username}`,
                )
              }>
              <Link2Icon className="-rotate-45" />
              <span>Copy link to profile</span>
            </button>
          </DropdownMenuItem>
          <DropdownMenuItem className="text-base font-medium">
            <VolumeOffIcon />
            <span>Mute</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="text-base font-medium">
            <BanIcon className="rotate-90" />
            <span>Block @{params.username}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <fetcher.Form method="POST" action="follow">
        <input type="hidden" name="id" defaultValue={user?.id} />
        <input
          type="hidden"
          name="redirectTo"
          defaultValue={location.pathname}
        />
        <Button className="rounded-full" type="submit" variant="outline">
          Follow
        </Button>
      </fetcher.Form>
    </div>
  );
}

function Tabs() {
  const user = useLoaderData<typeof loader>();
  const currentUser = useUser();
  return (
    <div className="flex border-b">
      <FeedTab
        to={`/${user?.username}`}
        title="Posts"
        label={`${user?.name} Posts`}
      />
      <FeedTab
        to="with_replies"
        title="Replies"
        label={`${user?.name} Replies`}
      />
      <FeedTab to="media" title="Media" label={`${user?.name} Media`} />
      {user?.id === currentUser.user.id && (
        <FeedTab to="likes" title="Likes" label={`${user?.name} Likes`} />
      )}
    </div>
  );
}
