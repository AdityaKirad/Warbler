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
import { TweetCard } from "~/components/tweet-card";
import { desc, eq, sql } from "drizzle-orm";
import type { Route } from "./+types/home";

export const meta = () => [{ title: "Home / Warbler" }];

export async function loader({ request }: Route.LoaderArgs) {
  const { user: currentUser } = await requireUser(request);

  const replies = db
    .$with("replies")
    .as(db.select({ replyToTweetId: tweet.replyToTweetId }).from(tweet));

  const tweets = await db
    .with(replies)
    .select({
      id: tweet.id,
      content: tweet.content,
      views: tweet.views,
      createdAt: tweet.createdAt,

      following:
        sql<boolean>`EXISTS(SELECT 1 FROM ${follows} WHERE ${follows.followingId} = ${user.id} AND ${follows.followerId} = ${currentUser.id})`.as(
          "following",
        ),

      count: {
        likes: db.$count(like, eq(like.tweetId, tweet.id)),
        replies: db.$count(replies, eq(replies.replyToTweetId, tweet.id)),
        reposts: db.$count(repost, eq(repost.tweetId, tweet.id)),
      },

      viewer: {
        bookmarked:
          sql<boolean>`EXISTS(SELECT 1 FROM ${bookmark} WHERE ${bookmark.tweetId} = ${tweet.id} AND ${bookmark.userId} = ${currentUser.id})`.as(
            "has_bookmarked",
          ),
        liked:
          sql<boolean>`EXISTS(SELECT 1 FROM ${like} WHERE ${like.tweetId} = ${tweet.id} AND ${like.userId} = ${currentUser.id})`.as(
            "has_liked",
          ),
        reposted:
          sql<boolean>`EXISTS(SELECT 1 FROM ${repost} WHERE ${repost.tweetId} = ${tweet.id} AND ${repost.userId} = ${currentUser.id})`.as(
            "has_reposted",
          ),
      },

      user: {
        name: user.name,
        username: user.username,
        photo: user.photo,
      },
    })
    .from(tweet)
    .innerJoin(user, eq(user.id, tweet.userId))
    .orderBy(desc(tweet.createdAt));

  return { tweets };
}

function Page({ loaderData: { tweets } }: Route.ComponentProps) {
  return tweets.map((tweet) => <TweetCard key={tweet.id} {...tweet} />);
}

export default Page;
