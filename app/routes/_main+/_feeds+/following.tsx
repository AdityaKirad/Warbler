import {
  bookmark,
  db,
  follows,
  like,
  repost,
  tweet,
  user,
} from "~/.server/drizzle";
import { requireUser } from "~/.server/utils";
import { desc, eq, sql } from "drizzle-orm";
import { TweetCard } from "../+tweet-card";
import type { Route } from "./+types/following";

export const meta = () => [{ title: "Following / Warbler" }];

export async function loader({ request }: Route.LoaderArgs) {
  const { user: currentUser } = await requireUser(request);
  const replies = db.$with("replies").as(
    db.select({ replyToTweetId: tweet.replyToTweetId }).from(tweet),
  );

  return db
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
        sql<boolean>`EXISTS(SELECT 1 FROM ${bookmark} WHERE ${bookmark.tweetId} = ${tweet.id} AND ${bookmark.userId} = ${currentUser.id})`.as(
          "has_bookmarked",
        ),
      hasLiked:
        sql<boolean>`EXISTS(SELECT 1 FROM ${like} WHERE ${like.tweetId} = ${tweet.id} AND ${like.userId} = ${currentUser.id})`.as(
          "has_liked",
        ),
      hasReposted:
        sql<boolean>`EXISTS(SELECT 1 FROM ${repost} WHERE ${repost.tweetId} = ${tweet.id} AND ${repost.userId} = ${currentUser.id})`.as(
          "has_reposted",
        ),

      user: {
        name: user.name,
        username: user.username,
        photo: user.photo,
      },
    })
    .from(tweet)
    .innerJoin(user, eq(user.id, tweet.userId))
    .innerJoin(follows, eq(follows.followingId, tweet.userId))
    .where(eq(follows.followerId, currentUser.id))
    .orderBy(desc(tweet.createdAt));
}

export default function Page({ loaderData }: Route.ComponentProps) {
  return (
    <>
      {loaderData.map((tweet) => (
        <TweetCard key={tweet.id} {...tweet} />
      ))}
    </>
  );
}
