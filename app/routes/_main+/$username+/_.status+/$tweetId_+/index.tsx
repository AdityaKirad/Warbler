import { renderToReactElement } from "@tiptap/static-renderer/pm/react";
import { db, tweet, user } from "~/.server/drizzle";
import { getUser } from "~/.server/utils";
import DefaultProfilePicture from "~/assets/default-profile-picture.png";
import { FeedsTweetForm } from "~/components/feeds-tweet-form";
import { ChatIcon } from "~/components/icons/chat";
import { PageTitle } from "~/components/page-title";
import {
  NonAuthenticatedSidebar,
  SearchFollowSidebar,
} from "~/components/search-follow-sidebar";
import { TweetCard } from "~/components/tweet-card";
import { CommentButton } from "~/components/tweet-card/comment-button";
import { LikeButton } from "~/components/tweet-card/like-button";
import { RepostButton } from "~/components/tweet-card/repost-button";
import { BookmarkButton } from "~/components/tweet-card/tweet-engagement-buttons";
import { extensions, mentionNodeLinkMapping } from "~/components/tweet-form";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Separator } from "~/components/ui/separator";
import { useUser } from "~/hooks/use-user";
import { getImgSrc } from "~/lib/cloudinary";
import { cn, formatNumber, getNameInitials } from "~/lib/utils";
import {
  followingFlag,
  getTweetReplies,
  interactionCount,
  tweetCoreFields,
  tweetInteractionCountField,
  tweetUserField,
  tweetViewerField,
} from "~/routes/_main+/feed-queries.server";
import { format } from "date-fns";
import { eq } from "drizzle-orm";
import { Link, useFetcher } from "react-router";
import type { Route } from "./+types";

export const meta = ({ loaderData: { post } }: Route.MetaArgs) => [
  {
    title: `${post.user.name} on Warbler: "${post.text}" / Warbler`,
  },
];

export async function loader({ params, request }: Route.LoaderArgs) {
  const { user: currentUser } = await getUser(request);

  const [post] = await db
    .select({
      ...tweetCoreFields,
      ...tweetUserField,

      text: tweet.text,

      count: {
        ...tweetInteractionCountField.count,
        bookmarks: interactionCount({ tweetId: tweet.id, type: "bookmark" }),
      },

      ...(currentUser?.id
        ? {
            ...tweetViewerField(currentUser.id),
            following: followingFlag({
              followingId: tweet.userId,
              followerId: currentUser.id,
            }),
          }
        : {}),
    })
    .from(tweet)
    .innerJoin(user, eq(user.id, tweet.userId))
    .where(eq(tweet.id, params.tweetId));

  if (!post) {
    throw new Error("Post not found");
  }

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");

  const replies = currentUser?.id
    ? await getTweetReplies({
        cursor,
        tweetId: post.id,
        userId: currentUser.id,
      })
    : [];

  return { post, replies };
}

export default function Page({
  loaderData: { post, replies },
}: Route.ComponentProps) {
  const user = useUser();
  return (
    <div className="flex min-h-screen justify-between">
      <div className="min-h-screen w-150 border-x">
        <PageTitle title="Post" />
        <div className={cn("space-y-2 p-4", { "border-b": user })}>
          <TweetContent tweet={post} />
          {user ? (
            <>
              <Separator />
              <FeedsTweetForm removePaddingAndBorders />
            </>
          ) : (
            <>
              <Dialog>
                <DialogTrigger className="bg-muted flex w-full items-center gap-2 rounded-xl border p-2 font-medium">
                  <ChatIcon />
                  Read {post.count.replies} replies
                </DialogTrigger>
                <DialogContent className="justify-center py-20 max-sm:px-8 sm:h-fit">
                  <ChatIcon
                    className="mx-auto size-12 text-blue-500"
                    fill="currentColor"
                  />
                  <DialogTitle>See what everyone is saying.</DialogTitle>
                  <DialogDescription>
                    Join Warbler now to read replies on this post.
                  </DialogDescription>
                  <Button className="rounded-full text-base" asChild>
                    <Link to="/flow/login">Log in</Link>
                  </Button>
                  <Button
                    className="rounded-full text-base"
                    variant="outline"
                    size="lg"
                    asChild>
                    <Link to="/flow/signup">Sign up</Link>
                  </Button>
                </DialogContent>
              </Dialog>
              <Separator />
            </>
          )}
        </div>
        {user &&
          replies.map((reply) => <TweetCard key={reply.id} {...reply} />)}
      </div>
      {user ? <SearchFollowSidebar /> : <NonAuthenticatedSidebar />}
      {!user && (
        <div className="fixed inset-x-0 bottom-0 bg-blue-500 p-2 max-sm:hidden">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between max-xl:max-w-4xl max-lg:max-w-2xl">
            <div className="max-md:hidden">
              <p className="text-3xl font-semibold">
                Don't miss what's happening
              </p>
              <p>People on Warbler are the first to know</p>
            </div>
            <div className="flex gap-4 max-md:grow max-md:gap-2">
              <Button className="flex-1 rounded-full" variant="outline" asChild>
                <Link to="/flow/login" aria-label="Log in">
                  Log in
                </Link>
              </Button>
              <Button className="flex-1 rounded-full" asChild>
                <Link to="/flow/signup" aria-label="Sign up">
                  Sign up
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TweetContent({
  tweet,
}: {
  tweet: Awaited<ReturnType<typeof loader>>["post"];
}) {
  const fetcher = useFetcher();
  const formId = `tweet-${tweet.id}-engagement`;
  return (
    <>
      <div className="flex gap-2">
        <Avatar asChild>
          <Link to={`/${tweet.user.username}`}>
            <AvatarImage
              src={
                tweet.user.photo
                  ? getImgSrc({
                      public_id: tweet.user.photo.public_id,
                      version: tweet.user.photo.version,
                    })
                  : DefaultProfilePicture
              }
              alt=""
            />
            <AvatarFallback>{getNameInitials(tweet.user.name)}</AvatarFallback>
          </Link>
        </Avatar>
        <div>
          <h3 className="font-">{tweet.user.name}</h3>
          <p className="text-muted-foreground text-sm">
            @{tweet.user.username}
          </p>
        </div>
      </div>
      <div>
        {renderToReactElement({
          extensions,
          content: tweet.content,
          options: { markMapping: mentionNodeLinkMapping },
        })}
      </div>
      <p className="text-muted-foreground">
        {format(tweet.createdAt, "h:mm a · MMM d, yyyy")} ·{" "}
        <span className="text-foreground">{formatNumber(tweet.views)}</span>{" "}
        Views
      </p>
      <Separator />
      <fetcher.Form
        className="flex justify-between"
        method="POST"
        id={formId}
        action={`/tweet/${tweet.id}/interaction`}>
        <CommentButton
          id={tweet.id}
          body={tweet.content}
          createdAt={tweet.createdAt}
          user={tweet.user}
          replyCount={tweet.count.replies}
        />
        <RepostButton
          fetcher={fetcher}
          name={tweet.user.name}
          tweetId={tweet.id}
          reposted={tweet.viewer?.reposted ?? false}
          repostCount={tweet.count.reposts}
        />
        <LikeButton
          fetcher={fetcher}
          name={tweet.user.name}
          liked={tweet.viewer?.liked ?? false}
          count={tweet.count.likes}
        />
        <BookmarkButton
          fetcher={fetcher}
          bookmarked={tweet.viewer?.bookmarked ?? false}
          count={tweet.count.bookmarks}
          showBookmarkCount
        />
      </fetcher.Form>
    </>
  );
}
