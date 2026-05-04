import { requireUser } from "~/.server/utils";
import { Spinner } from "~/components/spinner";
import { TweetCard } from "~/components/tweet-card";
import { useInfiniteTweetsScroll } from "~/hooks/use-infinite-tweets-scroll";
import { getFollowingFeed, PAGE_SIZE } from "../feed-queries.server";
import type { Route } from "./+types/following";
import { useOptimisticTweet } from "./+use-optimistic-tweet";

export const meta = () => [{ title: "Following / Warbler" }];

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");

  const tweets = await getFollowingFeed({ cursor, userId: user.id });

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
  const { fetcher, loadMoreRef, tweets } = useInfiniteTweetsScroll(loaderData);

  const optimisticTweet = useOptimisticTweet();

  const displayedTweets = optimisticTweet
    ? [
        optimisticTweet,
        ...tweets.filter((tweet) => tweet.id !== optimisticTweet.id),
      ]
    : tweets;

  return (
    <>
      {displayedTweets.map((tweet) => (
        <TweetCard key={tweet.id} {...tweet} following />
      ))}
      <div ref={loadMoreRef} aria-hidden />
      {fetcher.state === "loading" && (
        <Spinner className="mx-auto my-8 text-blue-500" />
      )}
    </>
  );
}
