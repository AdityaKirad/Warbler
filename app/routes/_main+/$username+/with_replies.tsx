import { bookmark, db, like, repost, tweet, user } from "~/.server/drizzle";
import { requireUser } from "~/.server/utils";
import { TweetCard } from "~/components/tweet-card";
import { desc, eq, sql } from "drizzle-orm";
import { useRouteLoaderData } from "react-router";
import type { LayoutLoader } from "./_layout";
import type { Route } from "./+types/with_replies";

export function meta({ matches }: Route.MetaArgs) {
  const match = matches.find(
    (match) => match?.id === "routes/_main+/$username+/_layout",
  );
  const loaderData = match?.loaderData as Awaited<ReturnType<LayoutLoader>>;
  return [
    { title: `${loaderData?.name} (@${loaderData?.username}) / Warbler` },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireUser(request);
  const replies = db
    .$with("replies")
    .as(db.select({ replyToTweetId: tweet.replyToTweetId }).from(tweet));

  const posts = await db
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
    .from(tweet)
    .leftJoin(user, eq(user.id, tweet.userId))
    .where(eq(user.username, params.username))
    .orderBy(desc(tweet.createdAt))
    .limit(50);

  return posts;
}

export default function Page({ loaderData }: Route.ComponentProps) {
  const data = useRouteLoaderData<LayoutLoader>(
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
