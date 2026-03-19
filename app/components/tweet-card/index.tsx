import { renderToReactElement } from "@tiptap/static-renderer/pm/react";
import type { TweetSelectType, UserSelectType } from "~/.server/drizzle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn, formatTweetDate } from "~/lib/utils";
import { format } from "date-fns";
import { useFetcher, useLocation, useNavigate } from "react-router";
import { extensions, mentionNodeLinkMapping } from "../tweet-form";
import { CommentButton } from "./comment-button";
import { LikeButton } from "./like-button";
import { MoreOptionDropdownMenu } from "./more-option-dropdown-menu";
import { RepostButton } from "./repost-button";
import { BookmarkButton, ViewsButton } from "./tweet-engagement-buttons";
import { TweetUserAvatar, TweetUserDetails } from "./tweet-user-profile-hover";

export function TweetCard({
  id,
  content,
  createdAt,
  disabled,
  following,
  showBookmarkCount,
  views,
  count,
  viewer,
  user,
}: Pick<TweetSelectType, "id" | "content" | "views" | "createdAt"> & {
  disabled?: boolean;
  following?: boolean;
  showBookmarkCount?: boolean;
  user: Pick<UserSelectType, "name" | "username" | "photo">;
  count: {
    likes: number;
    replies: number;
    reposts: number;
  };
  viewer?: {
    bookmarked: boolean;
    liked: boolean;
    reposted: boolean;
  };
}) {
  const fetcher = useFetcher();
  const location = useLocation();
  const navigate = useNavigate();

  const engagementFormId = `post-${id}-engagement`;

  function navigateToTweet(
    evt: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
  ) {
    const selection = getSelection();

    if (selection && selection.toString().length > 0) {
      return;
    }

    const target = evt.target as HTMLElement;

    if (
      target.closest(
        "a, button, [role='dialog'], [data-radix-popper-content-wrapper]",
      )
    ) {
      return;
    }

    if (document.querySelector('[role="dialog"]')) {
      return;
    }

    navigate(`/${user.username}/status/${id}`);
  }
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <article
      className={cn(
        "hover:bg-muted/10 focus-visible:bg-muted/10 flex cursor-pointer gap-2 border-b px-4 py-2 outline-2 outline-transparent transition-colors focus-visible:outline-blue-300",
        {
          "pointer-events-none opacity-50": disabled,
        },
      )}
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
          <MoreOptionDropdownMenu
            following={following}
            tweetId={id}
            username={user.username}
          />
        </div>
        <div>
          {renderToReactElement({
            content,
            extensions,
            options: { nodeMapping: mentionNodeLinkMapping },
          })}
        </div>
        <fetcher.Form
          className="flex justify-between"
          method="POST"
          id={engagementFormId}
          action={`/tweet/${id}/interaction`}>
          <CommentButton
            body={content}
            createdAt={createdAt}
            id={id}
            replyCount={count.replies}
            user={user}
          />
          <RepostButton
            tweetId={id}
            reposted={viewer?.reposted}
            repostCount={count.reposts}
            fetcher={fetcher}
          />
          <LikeButton
            fetcher={fetcher}
            liked={viewer?.liked}
            count={count.likes}
          />
          <ViewsButton views={views} />
          <BookmarkButton
            fetcher={fetcher}
            bookmarked={viewer?.bookmarked}
            showBookmarkCount={showBookmarkCount}
          />
          <input type="hidden" name="redirectTo" value={location.pathname} />
        </fetcher.Form>
      </div>
    </article>
  );
}
