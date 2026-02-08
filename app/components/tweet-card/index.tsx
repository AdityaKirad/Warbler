import type { TweetSelectType, UserSelectType } from "~/.server/drizzle";
import { Button } from "~/components/ui/button";
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
import { cn, formatTweetDate } from "~/lib/utils";
import type { action } from "~/routes/_main+/tweet+/$tweetId.engagement";
import { format } from "date-fns";
import { MoreHorizontalIcon, PenLineIcon, Repeat2Icon } from "lucide-react";
import { useFetcher, useLocation, useNavigate } from "react-router";
import { CommentButton } from "./comment-button";
import {
  BookmarkButton,
  LikeButton,
  ViewsButton,
} from "./tweet-engagement-buttons";
import { TweetUserAvatar, TweetUserDetails } from "./tweet-user-profile-hover";

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
  user: Pick<UserSelectType, "name" | "username" | "photo">;
}) {
  const fetcher = useFetcher<typeof action>();
  const location = useLocation();
  const navigate = useNavigate();

  function navigateToTweet(
    evt: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
  ) {
    const selection = getSelection();

    if (selection && selection.toString().length > 0) {
      return;
    }

    const target = evt.target as HTMLElement;

    if (target.closest("a, button")) {
      return;
    }

    navigate(`/${user.username}/status/${id}`);
  }
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <article
      className="hover:bg-muted/10 focus-visible:bg-muted/10 flex cursor-pointer gap-2 border-b px-4 py-2 outline-2 outline-transparent transition-colors focus-visible:outline-blue-300"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      onClick={navigateToTweet}
      onKeyDown={(evt) => {
        if (evt.key === "Enter") {
          navigateToTweet(evt);
        }
      }}>
      <TweetUserAvatar user={user} />
      <div className="grow space-y-2">
        <div className="text-muted-foreground">
          <TweetUserDetails user={user} />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="hover:underline">
                  {formatTweetDate(createdAt)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {format(createdAt, "h:mm a · MMM d, yyyy")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <MoreOptionDropdownMenu />
        </div>
        <div dangerouslySetInnerHTML={{ __html: body }} />
        <fetcher.Form
          method="POST"
          action={`/tweet/${id}/engagement`}
          className="flex justify-between">
          <CommentButton
            body={body}
            createdAt={createdAt}
            id={id}
            replyCount={replyCount}
            user={user}
          />
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

export function RepostButton({
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
          "group flex cursor-pointer items-center gap-0.5 transition-colors outline-none",
          hasReposted
            ? "text-green-500"
            : "hover:text-green-500 focus-visible:text-green-500",
        )}>
        <div className="rounded-full p-2 group-hover:bg-green-500/20 group-focus-visible:bg-green-500/20 group-focus-visible:outline-2 group-focus-visible:outline-green-300">
          <Repeat2Icon className="size-5" />
        </div>
        <span>{repostCount}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
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

export function MoreOptionDropdownMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="float-right size-8 rounded-full"
          variant="ghost"
          size="icon"
          aria-label="More Options">
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem asChild></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
