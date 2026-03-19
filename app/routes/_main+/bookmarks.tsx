import { requireUser } from "~/.server/utils";
import { PageTitle } from "~/components/page-title";
import { SearchFollowSidebar } from "~/components/search-follow-sidebar";
import { Spinner } from "~/components/spinner";
import { TweetCard } from "~/components/tweet-card";
import { useInfiniteTweetsScroll } from "~/hooks/use-infinite-tweets-scroll";
import Fuse from "fuse.js";
import { SearchIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useMemo } from "react";
import { useNavigation } from "react-router";
import type { Route } from "./+types/bookmarks";
import { getBookmarksFeed, PAGE_SIZE } from "./feed-queries.server";

export const meta = () => [
  {
    title: "Warbler",
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  const {
    user: { id: userId },
  } = await requireUser(request);

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");

  const tweets = await getBookmarksFeed({ cursor, userId });

  return {
    tweets,
    hasMore: tweets.length === PAGE_SIZE,
    nextCursor:
      tweets.length > 0
        ? tweets[tweets.length - 1]?.createdAt.toISOString()
        : null,
  };
}

export default function Page({ loaderData }: Route.ComponentProps) {
  const [search, searchSet] = useQueryState("query");
  const { fetcher, loadMoreRef, tweets } = useInfiniteTweetsScroll(loaderData);
  const navigation = useNavigation();
  const fuse = useMemo(
    () =>
      new Fuse(tweets, {
        keys: ["user.name", "user.username"],
      }),
    [tweets],
  );
  const results = fuse.search(search ?? "").map((res) => res.item);
  const isSearching = navigation.state !== "idle";
  return (
    <div className="flex min-h-screen justify-between">
      <div className="min-h-screen w-150 border-x">
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
          tweets.map((tweet) => (
            <TweetCard
              key={tweet.id}
              {...tweet}
              viewer={{
                ...tweet.viewer,
                bookmarked: true,
              }}
            />
          ))
        )}
        <div ref={loadMoreRef} aria-hidden />
        {fetcher.state === "loading" && (
          <Spinner className="mx-auto my-8 text-blue-500" />
        )}
      </div>
      <SearchFollowSidebar />
    </div>
  );
}
