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
import { TweetCard } from "./+tweet-card";
import type { Route } from "./+types/following";

export const meta = () => [{ title: "Following / Warbler" }];

export async function loader({ request }: Route.LoaderArgs) {
  const { user: authenticatedUser } = await requireUser(request);

  return db
    .select({
      id: tweet.id,
      body: tweet.body,
      views: tweet.views,
      createdAt: tweet.createdAt,

      replyCount: db.$count(tweet, eq(tweet.replyToTweetId, tweet.id)),
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

      user: {
        name: user.name,
        username: user.username,
        image: user.image,
      },
    })
    .from(tweet)
    .innerJoin(user, eq(user.id, tweet.userId))
    .innerJoin(follows, eq(follows.followingId, tweet.userId))
    .where(eq(follows.followerId, authenticatedUser.id))
    .orderBy(desc(tweet.createdAt));
}

export default function Page({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      {loaderData.map((tweet) => (
        <TweetCard key={tweet.id} {...tweet} />
      ))}
    </div>
  );
}
