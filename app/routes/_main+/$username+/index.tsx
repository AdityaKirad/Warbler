import { bookmark, db, like, repost, tweet, user } from "~/.server/drizzle";
import { requireUser } from "~/.server/utils";
import { desc, eq, sql } from "drizzle-orm";
import { useRouteLoaderData } from "react-router";
import { TweetCard } from "../+tweet-card";
import type { loader as layoutLoader } from "./_layout";
import type { Route } from "./+types";

// export const meta: Route.MetaFunction = ({ loaderData }) => [
//   { title: `${loaderData.name} (@${loaderData.username}) / Warbler` },
// ];

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireUser(request);

  const posts = await db
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
    })
    .from(user)
    .leftJoin(tweet, eq(tweet.userId, user.id))
    .where(eq(user.username, params.username))
    .orderBy(desc(tweet.createdAt))
    .limit(50);

  return posts;
}

export default function Page({ loaderData }: Route.ComponentProps) {
  const data = useRouteLoaderData<typeof layoutLoader>(
    "routes/_main+/$username+/_layout",
  )!;
  return loaderData.map(({ id, body, views, createdAt, ...tweetData }) => (
    <TweetCard
      key={id}
      id={id!}
      body={body!}
      views={views!}
      createdAt={createdAt!}
      {...tweetData}
      user={{
        name: data?.name,
        username: data?.username,
        photo: data?.photo,
      }}
    />
  ));
}
