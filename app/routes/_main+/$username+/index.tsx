import {
  bookmark,
  db,
  follows,
  like,
  repost,
  tweet,
  user,
} from "~/.server/drizzle";
import { getUser } from "~/.server/utils";
import { TweetCard } from "~/components/tweet-card";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { useRouteLoaderData } from "react-router";
import { LAYOUT_ROUTE_ID, type LayoutLoader } from "./_layout";
import type { Route } from "./+types";

export function meta({ matches }: Route.MetaArgs) {
  const match = matches.find((match) => match?.id === LAYOUT_ROUTE_ID);
  const loaderData = match?.loaderData as Awaited<ReturnType<LayoutLoader>>;
  return [
    {
      title: loaderData
        ? `${loaderData.name} (@${loaderData.username}) / Warbler`
        : "Profile / Warbler",
    },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const currentUser = await getUser(request);

  const replies = db
    .$with("replies")
    .as(db.select({ replyToTweetId: tweet.replyToTweetId }).from(tweet));

  const posts = await db
    .with(replies)
    .select({
      id: tweet.id,
      content: tweet.content,
      views: tweet.views,
      createdAt: tweet.createdAt,

      count: {
        likes: db.$count(like, eq(like.tweetId, tweet.id)),
        replies: db.$count(replies, eq(replies.replyToTweetId, tweet.id)),
        reposts: db.$count(repost, eq(repost.tweetId, tweet.id)),
      },

      viewer: {
        bookmarked: sql<boolean>`EXISTS(SELECT 1 FROM ${bookmark} WHERE ${bookmark.tweetId} = ${tweet.id} AND ${bookmark.userId} = ${user.id})`,
        liked: sql<boolean>`EXISTS(SELECT 1 FROM ${like} WHERE ${like.tweetId} = ${tweet.id} AND ${like.userId} = ${user.id})`,
        reposted: sql<boolean>`EXISTS(SELECT 1 FROM ${repost} WHERE ${repost.tweetId} = ${tweet.id} AND ${repost.userId} = ${user.id})`,
      },

      ...(currentUser?.user.id
        ? {
            following: sql<boolean>`EXISTS(SELECT 1 FROM ${follows} WHERE ${follows.followingId} = ${user.id} AND ${follows.followerId} = ${currentUser.user.id})`,
          }
        : {}),
    })
    .from(tweet)
    .innerJoin(user, eq(user.id, tweet.userId))
    .where(
      and(eq(user.username, params.username), isNull(tweet.replyToTweetId)),
    )
    .orderBy(desc(tweet.createdAt));

  return { posts };
}

export default function Page({ loaderData: { posts } }: Route.ComponentProps) {
  const data = useRouteLoaderData<LayoutLoader>(LAYOUT_ROUTE_ID)!;
  return posts.map((post) => (
    <TweetCard
      key={post.id}
      user={{
        name: data.name,
        username: data.username,
        photo: data.photo,
      }}
      {...post}
    />
  ));
}
