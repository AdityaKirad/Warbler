import type { UserSelectType } from "~/.server/drizzle";
import DefaultProfilePicture from "~/assets/default-profile-picture.png";
import { getNameInitials } from "~/lib/utils";
import type { loader } from "~/routes/_main+/$username+/_layout";
import { BadgeCheckIcon } from "lucide-react";
import { Link, useFetcher } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";

function useProfileHoverCardLoader(username: string) {
  const fetcher = useFetcher<typeof loader>({
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
    fetcher,
    handeHoverChange,
  };
}

export function TweetUserAvatar({
  user,
}: {
  user: Pick<UserSelectType, "name" | "username" | "photo">;
}) {
  const { fetcher, handeHoverChange } = useProfileHoverCardLoader(
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
              src={user.photo ?? DefaultProfilePicture}
              alt={user.username}
              loading="lazy"
              decoding="async"
            />
            <AvatarFallback>{getNameInitials(user.name)}</AvatarFallback>
          </Link>
        </Avatar>
      </HoverCardTrigger>
      <ProfileHoverCard data={fetcher.data} />
    </HoverCard>
  );
}

export function TweetUserDetails({
  user,
}: {
  user: Pick<UserSelectType, "name" | "username">;
}) {
  const { fetcher, handeHoverChange } = useProfileHoverCardLoader(
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
      <ProfileHoverCard data={fetcher.data} />
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
      > & { following: number; followers: number })
    | undefined;
}) {
  return (
    <HoverCardContent>
      <div className="flex justify-between">
        <Avatar className="size-20">
          <AvatarImage
            src={data?.photo ?? DefaultProfilePicture}
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
          {data?.following}{" "}
          <span className="text-muted-foreground">Following</span>
        </p>
        <p>
          {data?.followers}{" "}
          <span className="text-muted-foreground">Followers</span>
        </p>
      </div>
    </HoverCardContent>
  );
}
