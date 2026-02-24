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
import { PageTitle } from "~/components/page-title";
import { SearchFollowSidebar } from "~/components/search-follow-sidebar";
import { Spinner } from "~/components/spinner";
import { TweetCard } from "~/components/tweet-card";
import { desc, eq, sql } from "drizzle-orm";
import Fuse from "fuse.js";
import { SearchIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useNavigation } from "react-router";
import type { Route } from "./+types/bookmarks";

export const meta = () => [
  {
    title: "Warbler",
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  const { user: currentUser } = await requireUser(request);

  const replies = db
    .$with("replies")
    .as(db.select({ replyToTweetId: tweet.replyToTweetId }).from(tweet));

  const bookmarks = await db
    .with(replies)
    .select({
      id: tweet.id,
      content: tweet.content,
      views: tweet.views,
      createdAt: tweet.createdAt,

      following: sql<boolean>`EXISTS(SELECT 1 FROM ${follows} WHERE ${follows.followingId} = ${user.id} AND ${follows.followerId} = ${currentUser.id})`,

      count: {
        likes: db.$count(like, eq(like.tweetId, tweet.id)),
        replies: db.$count(replies, eq(replies.replyToTweetId, tweet.id)),
        reposts: db.$count(repost, eq(repost.tweetId, tweet.id)),
      },

      viewer: {
        liked:
          sql<boolean>`EXISTS(SELECT 1 FROM ${like} WHERE ${like.tweetId} = ${tweet.id} AND ${like.userId} = ${user.id})`.as(
            "has_liked",
          ),
        reposted:
          sql<boolean>`EXISTS(SELECT 1 FROM ${repost} WHERE ${repost.tweetId} = ${tweet.id} AND ${repost.userId} = ${user.id})`.as(
            "has_reposted",
          ),
      },

      user: {
        name: user.name,
        username: user.username,
        photo: user.photo,
      },
    })
    .from(bookmark)
    .innerJoin(tweet, eq(bookmark.tweetId, tweet.id))
    .innerJoin(user, eq(tweet.userId, user.id))
    .where(eq(bookmark.userId, currentUser.id))
    .orderBy(desc(tweet.createdAt));

  return { bookmarks };
}

export default function Page({
  loaderData: { bookmarks },
}: Route.ComponentProps) {
  // const [searchParams, searchParamsSet] = useSearchParams();
  const navigation = useNavigation();
  // const query = searchParams.get("query") ?? "";
  const [search, searchSet] = useQueryState("query");
  const fuse = new Fuse(bookmarks, {
    keys: ["user.name", "user.username"],
  });
  const results = fuse.search(search ?? "").map((res) => res.item);
  const isSearching = navigation.state !== "idle";
  return (
    <div className="flex min-h-screen justify-between">
      <div className="w-150 min-h-screen border-x">
        <PageTitle title="Bookmarks" />
        <div className="my-2 px-4">
          <div className="relative flex h-10 items-center">
            <SearchIcon className="ml-2 size-4 stroke-current/50" />
            <input
              className="outline-border absolute inset-0 grow rounded-full pr-2 pl-8 outline-2 transition-colors focus-visible:caret-blue-500 focus-visible:outline-blue-500"
              placeholder="Search bookmarks"
              value={search ?? ""}
              onChange={(evt) => searchSet(evt.target.value)}
            />
          </div>
        </div>
        {search ? (
          isSearching ? (
            <Spinner className="mx-auto mt-8 text-blue-500" />
          ) : results.length ? (
            results.map((bookmark) => (
              <TweetCard
                key={bookmark.id}
                {...bookmark}
                viewer={{
                  ...bookmark.viewer,
                  bookmarked: true,
                }}
              />
            ))
          ) : (
            <div className="mx-auto w-full max-w-80 py-8">
              <p className="text-4xl font-bold wrap-break-word">
                No results for {search}
              </p>
              <p className="text-muted-foreground text-sm">
                Try searching for something else, or check your Search settings
                to see if they’re protecting you from potentially sensitive
                content.
              </p>
            </div>
          )
        ) : (
          bookmarks.map((bookmark) => (
            <TweetCard
              key={bookmark.id}
              {...bookmark}
              viewer={{
                ...bookmark.viewer,
                bookmarked: true,
              }}
            />
          ))
        )}
      </div>
      <SearchFollowSidebar />
    </div>
  );
}
