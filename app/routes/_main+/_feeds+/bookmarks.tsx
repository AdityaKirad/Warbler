import { bookmark, db, like, repost, tweet, user } from "~/.server/drizzle";
import { requireUser } from "~/.server/utils";
import { TweetCard } from "~/components/tweet-card";
import { Button } from "~/components/ui/button";
import { desc, eq, sql } from "drizzle-orm";
import { ArrowLeftIcon, SearchIcon } from "lucide-react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/bookmarks";

export async function loader({ request }: Route.LoaderArgs) {
  const {
    user: { id },
  } = await requireUser(request);
  const replies = db
    .$with("replies")
    .as(db.select({ replyToTweetId: tweet.replyToTweetId }).from(tweet));

  const bookmarks = await db
    .with(replies)
    .select({
      id: tweet.id,
      body: tweet.body,
      views: tweet.views,
      createdAt: tweet.createdAt,

      replyCount: db.$count(replies, eq(replies.replyToTweetId, tweet.id)),
      likeCount: db.$count(like, eq(like.tweetId, tweet.id)),
      repostCount: db.$count(repost, eq(repost.tweetId, tweet.id)),

      hasLiked:
        sql<boolean>`EXISTS(SELECT 1 FROM ${like} WHERE ${like.tweetId} = ${tweet.id} AND ${like.userId} = ${user.id})`.as(
          "has_liked",
        ),
      hasReposted:
        sql<boolean>`EXISTS(SELECT 1 FROM ${repost} WHERE ${repost.tweetId} = ${tweet.id} AND ${repost.userId} = ${user.id})`.as(
          "has_reposted",
        ),

      user: {
        name: user.name,
        username: user.username,
        photo: user.photo,
      },
    })
    .from(bookmark)
    .innerJoin(tweet, eq(bookmark.tweetId, tweet.id))
    .innerJoin(user, eq(tweet.userId, user.id))
    .where(eq(bookmark.userId, id))
    .orderBy(desc(tweet.createdAt));

  return bookmarks;
}

export default function Page({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  return (
    <>
      <div className="flex items-center gap-4 p-2">
        <Button
          className="rounded-full [&_svg]:size-5"
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          aria-label="Back">
          <ArrowLeftIcon />
        </Button>
        <h1 className="text-xl font-bold">Bookmarks</h1>
      </div>
      <div className="mb-2 px-4">
        <div className="relative flex h-10 items-center">
          <SearchIcon className="ml-2 size-4 stroke-current/50" />
          <input
            className="outline-border absolute inset-0 grow rounded-full pr-2 pl-8 outline-2 transition-colors focus-visible:caret-blue-500 focus-visible:outline-blue-500"
            placeholder="Search bookmarks"
          />
        </div>
      </div>
      {loaderData.map((tweet) => (
        <TweetCard key={tweet.id} {...tweet} hasBookmarked />
      ))}
    </>
  );
}
