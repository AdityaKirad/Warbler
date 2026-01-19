import type { TweetSelectType, UserSelectType } from "~/.server/drizzle";
import DefaultProfilePicture from "~/assets/default-profile-picture.png";
import { BookmarkOutlinedIcon } from "~/components/icons";
import { ChatIcon } from "~/components/icons/chat";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn, formatTweetDate, getNameInitials } from "~/lib/utils";
import { format } from "date-fns";
import {
  ChartNoAxesColumnIcon,
  HeartIcon,
  PenLineIcon,
  Repeat2Icon,
} from "lucide-react";
import { Link, useFetcher, useLocation } from "react-router";
import type { action } from "../tweet+/$tweetId.engagement";

export function TweetCard({
  id,
  body,
  views,
  createdAt,
  user,
  likeCount,
  replyCount,
  repostCount,
  hasBookmarked,
  hasLiked,
  hasReposted,
}: Pick<TweetSelectType, "id" | "body" | "views" | "createdAt"> & {
  likeCount: number;
  replyCount: number;
  repostCount: number;
  hasBookmarked: boolean;
  hasLiked: boolean;
  hasReposted: boolean;
  user: Pick<UserSelectType, "name" | "username" | "image">;
}) {
  const fetcher = useFetcher<typeof action>();
  const location = useLocation();
  return (
    <article
      key={id}
      className="hover:bg-muted/10 relative isolate flex gap-2 border-b px-4 py-2 transition-colors first:border-t-2">
      <Link className="absolute inset-0" to={`/${user?.username}/${id}`} />
      <Avatar asChild>
        <Link to={`/${user?.username}`} className="z-10">
          <AvatarImage
            src={user?.image ?? DefaultProfilePicture}
            alt={user?.username}
            loading="lazy"
            decoding="async"
          />
          <AvatarFallback>{getNameInitials(user?.name)}</AvatarFallback>
        </Link>
      </Avatar>
      <div className="grow space-y-2">
        <div className="text-muted-foreground">
          <Link to={`/${user?.username}`} className="relative z-10">
            <span className="font-medium text-white hover:underline">
              {user?.name}
            </span>{" "}
            @<span>{user?.username}</span> ·{" "}
          </Link>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="relative z-10 hover:underline">
                  {formatTweetDate(createdAt)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {format(createdAt, "h:mm a · MMM d, yyyy")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div dangerouslySetInnerHTML={{ __html: body }} />
        <fetcher.Form
          method="POST"
          action={`/tweet/${id}/engagement`}
          className="flex justify-between">
          <CommentButton replyCount={replyCount} />
          <RepostButton hasReposted={hasReposted} repostCount={repostCount} />
          <LikeButton hasLiked={hasLiked} likeCount={likeCount} />
          <ViewsButton views={views} />
          <BookmarkButton hasBookmarked={hasBookmarked} />
          <input type="hidden" name="redirectTo" value={location.pathname} />
        </fetcher.Form>
      </div>
    </article>
  );
}

function CommentButton({ replyCount }: { replyCount: number }) {
  return (
    <Dialog>
      <DialogTrigger className="group z-10 flex cursor-pointer items-center gap-0.5 transition-colors outline-none hover:text-blue-500 focus-visible:text-blue-500">
        <div className="z-10 rounded-full p-2 group-hover:bg-blue-400/20 group-focus-visible:bg-blue-400/20 group-focus-visible:outline-2 group-focus-visible:outline-blue-300">
          <ChatIcon className="size-5" />
        </div>
        <span>{replyCount}</span>
      </DialogTrigger>
      <DialogContent></DialogContent>
    </Dialog>
  );
}

function RepostButton({
  repostCount,
  hasReposted,
}: {
  repostCount: number;
  hasReposted: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "group z-10 flex cursor-pointer items-center gap-0.5 transition-colors outline-none",
          hasReposted
            ? "text-green-500"
            : "hover:text-green-500 focus-visible:text-green-500",
        )}>
        <div className="rounded-full p-2 group-hover:bg-green-500/20 group-focus-visible:bg-green-500/20 group-focus-visible:outline-2 group-focus-visible:outline-green-300">
          <Repeat2Icon className="size-5" />
        </div>
        <span>{repostCount}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-background">
        <DropdownMenuItem className="w-full text-base [&_svg]:size-5" asChild>
          <button type="submit" name="engagement" value="repost">
            <Repeat2Icon />
            <span>Repost</span>
          </button>
        </DropdownMenuItem>
        <DropdownMenuItem className="text-base [&_svg]:size-5">
          <PenLineIcon />
          <span>Quote</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LikeButton({
  likeCount,
  hasLiked,
}: {
  likeCount: number;
  hasLiked: boolean;
}) {
  return (
    <button
      className={cn(
        "group relative z-10 flex items-center gap-0.5 transition-colors outline-none",
        hasLiked
          ? "text-rose-500"
          : "hover:text-rose-500 focus-visible:text-rose-500",
      )}
      type="submit"
      name="engagement"
      value="like">
      <div className="rounded-full p-2 group-focus-visible:bg-rose-500/20 group-focus-visible:outline-2 group-focus-visible:outline-rose-300 hover:bg-rose-500/20">
        <HeartIcon
          className="size-5"
          fill={hasLiked ? "currentColor" : "none"}
        />
      </div>
      <span>{likeCount}</span>
    </button>
  );
}

function ViewsButton({ views }: { views: number }) {
  return (
    <Dialog>
      <DialogTrigger className="group relative z-10 flex items-center gap-0.5 transition-colors outline-none hover:text-blue-500 focus-visible:text-blue-500">
        <div className="rounded-full p-2 group-hover:bg-blue-500/20 group-focus-visible:bg-blue-500/20 group-focus-visible:outline-2 group-focus-visible:outline-blue-300">
          <ChartNoAxesColumnIcon className="size-5" />
        </div>
        <span>{views}</span>
      </DialogTrigger>
      <DialogContent className="h-fit p-20">
        <DialogTitle className="text-[2rem]">Views</DialogTitle>
        <DialogDescription>Times this post was seen.</DialogDescription>
        <DialogClose className="rounded-full" asChild>
          <Button>Dismiss</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

function BookmarkButton({ hasBookmarked }: { hasBookmarked: boolean }) {
  return (
    <button
      className={cn(
        "group relative z-10 transition-colors outline-none",
        hasBookmarked
          ? "text-blue-500"
          : "hover:text-blue-500 focus-visible:text-blue-500",
      )}
      type="submit"
      name="engagement"
      value="bookmark">
      <div className="rounded-full p-2 group-hover:bg-blue-500/20 group-focus-visible:bg-blue-500/20 group-focus-visible:outline-2 group-focus-visible:outline-blue-300">
        <BookmarkOutlinedIcon
          className="size-5"
          fill={hasBookmarked ? "currentColor" : "none"}
        />
      </div>
    </button>
  );
}
