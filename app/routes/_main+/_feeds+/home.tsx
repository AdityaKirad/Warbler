import { bookmark, db, like, repost, tweet, user } from "~/.server/drizzle";
import { requireUser } from "~/.server/utils";
import { desc, eq, sql } from "drizzle-orm";
import type { Route } from "./+types/home";
import "date-fns";
import { TweetCard } from "../../../components/tweet-card";

export const meta = () => [{ title: "Home / Warbler" }];

export async function loader({ request }: Route.LoaderArgs) {
  const { user: currentUser } = await requireUser(request);

  const tweets = await db
    .select({
      id: tweet.id,
      body: tweet.body,
      views: tweet.views,
      createdAt: tweet.createdAt,

      likeCount: db.$count(like, eq(like.tweetId, tweet.id)),
      repostCount: db.$count(repost, eq(repost.tweetId, tweet.id)),
      replyCount: sql<number>`(SELECT COUNT (*) FROM ${tweet} AS reply WHERE reply.reply_to_tweet_id = ${tweet.id})`,

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
    .orderBy(desc(tweet.createdAt));

  return tweets;
}

export default function Page({ loaderData }: Route.ComponentProps) {
  return loaderData.map((tweet) => <TweetCard key={tweet.id} {...tweet} />);
}
