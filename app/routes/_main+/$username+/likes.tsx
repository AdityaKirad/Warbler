import { requireUser } from "~/.server/utils";
import { Spinner } from "~/components/spinner";
import { TweetCard } from "~/components/tweet-card";
import { useInfiniteTweetsScroll } from "~/hooks/use-infinite-tweets-scroll";
import { redirect } from "react-router";
import { getUserLikedPosts, PAGE_SIZE } from "../feed-queries.server";
import type { Route } from "./+types/likes";

export async function loader({ params, request }: Route.LoaderArgs) {
  const { user } = await requireUser(request);

  if (params.username !== user.username) {
    throw redirect(params.username);
  }

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");

  const tweets = await getUserLikedPosts({ cursor, userId: user.id });

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

  return (
    <>
      {tweets.map((tweet) => (
        <TweetCard
          key={tweet.id}
          {...tweet}
          viewer={{
            ...tweet.viewer,
            liked: true,
          }}
        />
      ))}
      <div ref={loadMoreRef} aria-hidden />
      {fetcher.state === "loading" && (
        <Spinner className="mx-auto my-8 text-blue-500" />
      )}
    </>
  );
}
