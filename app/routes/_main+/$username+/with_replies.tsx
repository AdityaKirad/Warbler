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
import { useUser } from "~/hooks/use-user";
import { desc, eq, sql } from "drizzle-orm";
import { useRouteLoaderData } from "react-router";
import { LAYOUT_ROUTE_ID, type LayoutLoader } from "./_layout";
import type { Route } from "./+types/with_replies";

export function meta({ matches }: Route.MetaArgs) {
  const match = matches.find((match) => match?.id === LAYOUT_ROUTE_ID);
  const loaderData = match?.loaderData as Awaited<ReturnType<LayoutLoader>>;
  return [
    {
      title: loaderData
        ? `Posts with replies by ${loaderData.name} (@${loaderData.username}) / Warbler`
        : "Profile / Warbler",
    },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const currentUser = await getUser(request);

  if (!currentUser) {
    return null;
  }

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
    .from(tweet)
    .innerJoin(user, eq(user.id, tweet.userId))
    .where(eq(user.username, params.username))
    .orderBy(desc(tweet.createdAt));

  return { posts };
}

export default function Page({ loaderData }: Route.ComponentProps) {
  const data = useRouteLoaderData<LayoutLoader>(LAYOUT_ROUTE_ID)!;
  const user = useUser();
  if (!user) {
    return (
      <div className="mx-auto mt-16 max-w-80">
        <h3 className="text-3xl font-bold">{data?.username} hasn’t posted</h3>
        <p className="text-muted-foreground text-sm">
          When they do, their posts will show up here.
        </p>
      </div>
    );
  }
  return loaderData?.posts.map((post) => (
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
