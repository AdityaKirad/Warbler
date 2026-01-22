import { bookmark, db, like, repost, tweet } from "~/.server/drizzle";
import { requireUser } from "~/.server/utils";
import { TweetCard } from "~/components/tweet-card";
import { useUser } from "~/hooks/use-user";
import { eq, sql } from "drizzle-orm";
import { redirect } from "react-router";
import type { Route } from "./+types/likes";

export async function loader({ params, request }: Route.LoaderArgs) {
  const { user } = await requireUser(request);
  const replies = db
    .$with("replies")
    .as(db.select({ replyToTweetId: tweet.replyToTweetId }).from(tweet));

  if (params.username !== user.username) {
    throw redirect(params.username);
  }

  const likes = await db
    .with(replies)
    .select({
      id: tweet.id,
      body: tweet.body,
      views: tweet.views,
      createdAt: tweet.createdAt,

      replyCount: db.$count(replies, eq(replies.replyToTweetId, tweet.id)),
      likeCount: db.$count(like, eq(like.tweetId, tweet.id)),
      repostCount: db.$count(repost, eq(repost.tweetId, tweet.id)),

      hasBookmarked:
        sql<boolean>`EXISTS(SELECT 1 FROM ${bookmark} WHERE ${bookmark.tweetId} = ${tweet.id} AND ${bookmark.userId} = ${user.id})`.as(
          "has_bookmarked",
        ),
      hasLiked:
        sql<boolean>`EXISTS(SELECT 1 FROM ${like} WHERE ${like.tweetId} = ${tweet.id} AND ${like.userId} = ${user.id})`.as(
          "has_liked",
        ),
      hasReposted:
        sql<boolean>`EXISTS(SELECT 1 FROM ${repost} WHERE ${repost.tweetId} = ${tweet.id} AND ${repost.userId} = ${user.id})`.as(
          "has_reposted",
        ),
    })
    .from(like)
    .innerJoin(tweet, eq(tweet.id, like.tweetId))
    .where(eq(like.userId, user.id));

  return likes;
}

export default function Page({ loaderData }: Route.ComponentProps) {
  const user = useUser();
  return loaderData.map((tweet) => (
    <TweetCard key={tweet.id} {...tweet} {...user} />
  ));
}
