import type { UserSelectType } from "~/.server/drizzle";
import DefaultProfilePicture from "~/assets/default-profile-picture.png";
import { getImgSrc } from "~/lib/cloudinary";
import { getNameInitials } from "~/lib/utils";
import type { UsernameLayoutLoader } from "~/routes/_main+/$username+/_layout";
import { BadgeCheckIcon } from "lucide-react";
import { Link, useFetcher } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";

function useProfileHoverCardLoader(username: string) {
  const fetcher = useFetcher<UsernameLayoutLoader>({
    key: `profile:${username}`,
  });

  function handeHoverChange(open: boolean) {
    if (!open) {
      return;
    }

    if (fetcher.state !== "idle" || fetcher.data) {
      return;
    }

    void fetcher.load(`/${username}`);
  }

  return {
    profile: fetcher.data,
    handeHoverChange,
  };
}

export function TweetUserAvatar({
  user,
}: {
  user: Pick<UserSelectType, "name" | "username" | "photo">;
}) {
  const { profile, handeHoverChange } = useProfileHoverCardLoader(
    user.username,
  );
  return (
    <HoverCard onOpenChange={handeHoverChange}>
      <HoverCardTrigger asChild>
        <Avatar asChild>
          <Link
            to={`/${user.username}`}
            className="transition-opacity hover:opacity-80">
            <AvatarImage
              src={
                user.photo
                  ? getImgSrc({
                      public_id: user.photo.public_id,
                      version: user.photo.version,
                    })
                  : DefaultProfilePicture
              }
              alt={user.username}
              loading="lazy"
              decoding="async"
            />
            <AvatarFallback>{getNameInitials(user.name)}</AvatarFallback>
          </Link>
        </Avatar>
      </HoverCardTrigger>
      <ProfileHoverCard data={profile} />
    </HoverCard>
  );
}

export function TweetUserDetails({
  user,
}: {
  user: Pick<UserSelectType, "name" | "username">;
}) {
  const { profile, handeHoverChange } = useProfileHoverCardLoader(
    user.username,
  );
  return (
    <HoverCard onOpenChange={handeHoverChange}>
      <HoverCardTrigger asChild>
        <Link to={`/${user.username}`}>
          <span className="font-medium text-white hover:underline">
            {user.name}
          </span>{" "}
          @{user.username} ·{" "}
        </Link>
      </HoverCardTrigger>
      <ProfileHoverCard data={profile} />
    </HoverCard>
  );
}

function ProfileHoverCard({
  data,
}: {
  data:
    | (Pick<
        UserSelectType,
        "name" | "username" | "photo" | "profileVerified" | "bio"
      > & { count: { following: number; followers: number } })
    | undefined;
}) {
  return (
    <HoverCardContent>
      <div className="flex justify-between">
        <Avatar className="size-20">
          <AvatarImage
            src={
              data?.photo
                ? getImgSrc({
                    public_id: data?.photo.public_id,
                    version: data?.photo.version,
                  })
                : DefaultProfilePicture
            }
            alt={`@${data?.username}`}
            loading="lazy"
            decoding="async"
          />
          <AvatarFallback>{getNameInitials(data?.name)}</AvatarFallback>
        </Avatar>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-bold">{data?.name}</span>
        {data?.profileVerified && <BadgeCheckIcon height={16} width={16} />}
      </div>
      <p className="text-muted-foreground text-sm">{data?.username}</p>
      <p>{data?.bio}</p>
      <div className="flex gap-2">
        <p>
          {data?.count.following}{" "}
          <span className="text-muted-foreground">Following</span>
        </p>
        <p>
          {data?.count.followers}{" "}
          <span className="text-muted-foreground">Followers</span>
        </p>
      </div>
    </HoverCardContent>
  );
}
