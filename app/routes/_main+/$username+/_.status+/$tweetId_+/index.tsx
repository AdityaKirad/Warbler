import { renderToReactElement } from "@tiptap/static-renderer/pm/react";
import { bookmark, db, like, repost, tweet, user } from "~/.server/drizzle";
import { getUser } from "~/.server/utils";
import DefaultProfilePicture from "~/assets/default-profile-picture.png";
import { ChatIcon } from "~/components/icons/chat";
import { PageTitle } from "~/components/page-title";
import {
  NonAuthenticatedSidebar,
  SearchFollowSidebar,
} from "~/components/search-follow-sidebar";
import { CommentButton } from "~/components/tweet-card/comment-button";
import { RepostButton } from "~/components/tweet-card/repost-button";
import {
  BookmarkButton,
  LikeButton,
} from "~/components/tweet-card/tweet-engagement-buttons";
import { extensions } from "~/components/tweet-form";
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
import { formatNumber, getNameInitials } from "~/lib/utils";
import { format } from "date-fns";
import { eq, sql } from "drizzle-orm";
import { Link, useFetcher } from "react-router";
import type { Route } from "./+types";

export const meta = ({ loaderData: { post } }: Route.MetaArgs) => [
  {
    title: `${post.user.name} on Warbler: "${post.text}" / Warbler`,
  },
];

export async function loader({ params, request }: Route.LoaderArgs) {
  const data = await getUser(request);
  const currentUserId = data?.user.id;

  const [post] = await db
    .select({
      id: tweet.id,
      content: tweet.content,
      text: tweet.text,
      views: tweet.views,
      createdAt: tweet.createdAt,

      count: {
        likes: db.$count(like, eq(like.tweetId, tweet.id)),
        reposts: db.$count(repost, eq(repost.tweetId, tweet.id)),
        bookmarks: db.$count(bookmark, eq(bookmark.tweetId, tweet.id)),
        replies: sql<number>`(SELECT COUNT (*) FROM ${tweet} AS reply WHERE reply.reply_to_tweet_id = ${tweet.id})`,
      },

      user: {
        name: user.name,
        username: user.username,
        photo: user.photo,
      },

      ...(currentUserId
        ? {
            viewer: {
              bookmarked: sql<boolean>`EXISTS(SELECT 1 FROM ${bookmark} WHERE ${bookmark.tweetId} = ${tweet.id} AND ${bookmark.userId} = ${currentUserId})`,
              liked: sql<boolean>`EXISTS(SELECT 1 FROM ${like} WHERE ${like.tweetId} = ${tweet.id} AND ${like.userId} = ${currentUserId})`,
              reposted: sql<boolean>`EXISTS(SELECT 1 FROM ${repost} WHERE ${repost.tweetId} = ${tweet.id} AND ${repost.userId} = ${currentUserId})`,
            },
          }
        : {}),
    })
    .from(tweet)
    .innerJoin(user, eq(user.id, tweet.userId))
    .where(eq(tweet.id, params.tweetId));

  if (!post) {
    throw new Error("Post not found");
  }

  return { post };
}

export default function Page({ loaderData: { post } }: Route.ComponentProps) {
  const currentUser = useUser();
  const fetcher = useFetcher();
  const formId = `post-${post.id}-engagement`;
  return (
    <div className="flex min-h-screen justify-between">
      <div className="w-150 min-h-screen border-x">
        <PageTitle title="Post" />
        <div className="space-y-2 p-4">
          <div className="flex gap-2">
            <Avatar asChild>
              <Link to={`/${post.user.username}`}>
                <AvatarImage
                  src={post.user.photo ?? DefaultProfilePicture}
                  alt=""
                />
                <AvatarFallback>
                  {getNameInitials(post.user.name)}
                </AvatarFallback>
              </Link>
            </Avatar>
            <div>
              <h3 className="font-">{post.user.name}</h3>
              <p className="text-muted-foreground text-sm">
                @{post.user.username}
              </p>
            </div>
          </div>
          <div>
            {renderToReactElement({
              extensions,
              content: post.content,
            })}
          </div>
          <p className="text-muted-foreground">
            {format(post.createdAt, "h:mm a · MMM d, yyyy")} ·{" "}
            <span className="text-foreground">{formatNumber(post.views)}</span>{" "}
            Views
          </p>
          <Separator />
          <fetcher.Form
            className="flex justify-between"
            method="POST"
            id={formId}
            action={`/tweet/${post.id}/engagement`}>
            <CommentButton
              id={post.id}
              body={post.content}
              createdAt={post.createdAt}
              user={post.user}
              replyCount={post.count.replies}
            />
            <RepostButton
              formId={formId}
              name={post.user.name}
              reposted={post.viewer?.reposted ?? false}
              repostCount={post.count.reposts}
            />
            <LikeButton
              name={post.user.name}
              likeCount={post.count.likes}
              liked={post.viewer?.liked ?? false}
            />
            <BookmarkButton
              bookmarked={post.viewer?.bookmarked ?? false}
              bookmarkCount={post.count.bookmarks}
            />
          </fetcher.Form>
          {!currentUser && (
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
          )}
          <Separator />
        </div>
      </div>
      {currentUser ? <SearchFollowSidebar /> : <NonAuthenticatedSidebar />}
      {!currentUser && (
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
