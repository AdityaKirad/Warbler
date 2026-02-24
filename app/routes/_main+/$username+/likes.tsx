import { bookmark, db, follows, like, repost, tweet } from "~/.server/drizzle";
import { requireUser } from "~/.server/utils";
import { TweetCard } from "~/components/tweet-card";
import { useUser } from "~/hooks/use-user";
import { eq, sql } from "drizzle-orm";
import { redirect } from "react-router";
import type { Route } from "./+types/likes";

export async function loader({ params, request }: Route.LoaderArgs) {
  const { user } = await requireUser(request);

  if (params.username !== user.username) {
    throw redirect(params.username);
  }

  const replies = db
    .$with("replies")
    .as(db.select({ replyToTweetId: tweet.replyToTweetId }).from(tweet));

  const likes = await db
    .with(replies)
    .select({
      id: tweet.id,
      content: tweet.content,
      views: tweet.views,
      createdAt: tweet.createdAt,

      following: sql<boolean>`EXISTS(SELECT 1 FROM ${follows} WHERE ${follows.followingId} = ${user.id} AND ${follows.followerId} = ${user.id})`,

      count: {
        likes: db.$count(like, eq(like.tweetId, tweet.id)),
        replies: db.$count(replies, eq(replies.replyToTweetId, tweet.id)),
        reposts: db.$count(repost, eq(repost.tweetId, tweet.id)),
      },

      viewer: {
        bookmarked:
          sql<boolean>`EXISTS(SELECT 1 FROM ${bookmark} WHERE ${bookmark.tweetId} = ${tweet.id} AND ${bookmark.userId} = ${user.id})`.as(
            "has_bookmarked",
          ),
        liked:
          sql<boolean>`EXISTS(SELECT 1 FROM ${like} WHERE ${like.tweetId} = ${tweet.id} AND ${like.userId} = ${user.id})`.as(
            "has_liked",
          ),
        reposted:
          sql<boolean>`EXISTS(SELECT 1 FROM ${repost} WHERE ${repost.tweetId} = ${tweet.id} AND ${repost.userId} = ${user.id})`.as(
            "has_reposted",
          ),
      },
    })
    .from(like)
    .innerJoin(tweet, eq(tweet.id, like.tweetId))
    .where(eq(like.userId, user.id));

  return { likes };
}

export default function Page({ loaderData: { likes } }: Route.ComponentProps) {
  const user = useUser()!;
  return likes.map((tweet) => (
    <TweetCard
      key={tweet.id}
      user={{
        name: user.user.name,
        username: user.user.username,
        photo: user.user.photo,
      }}
      {...tweet}
    />
  ));
}
