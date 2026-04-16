import { requireUser } from "~/.server/utils";
import { Spinner } from "~/components/spinner";
import { TweetCard } from "~/components/tweet-card";
import { useInfiniteTweetsScroll } from "~/hooks/use-infinite-tweets-scroll";
import { getHomeFeed, PAGE_SIZE } from "../feed-queries.server";
import type { Route } from "./+types/home";
import { useOptimisticTweet } from "./+use-optimistic-tweet";

export const meta = () => [{ title: "Home / Warbler" }];

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requireUser(request);

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");

  const tweets = await getHomeFeed({ cursor, userId: user.id });

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
  const optimisticTweet = useOptimisticTweet();
  const { fetcher, loadMoreRef, tweets } = useInfiniteTweetsScroll(loaderData);

  const displayTweets = optimisticTweet ? [optimisticTweet, ...tweets] : tweets;

  return (
    <>
      {displayTweets.map((tweet) => (
        <TweetCard key={tweet.id} {...tweet} />
      ))}
      <div ref={loadMoreRef} aria-hidden />
      {fetcher.state === "loading" && (
        <Spinner className="mx-auto my-8 text-blue-500" />
      )}
    </>
  );
}
