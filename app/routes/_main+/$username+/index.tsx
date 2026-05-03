import { getUser } from "~/.server/utils";
import { Spinner } from "~/components/spinner";
import { TweetCard } from "~/components/tweet-card";
import { useInfiniteTweetsScroll } from "~/hooks/use-infinite-tweets-scroll";
import { data } from "react-router";
import { getUserPosts, PAGE_SIZE } from "../feed-queries.server";
import { USERNAME_LAYOUT_ROUTE_ID, type UsernameLayoutLoader } from "./_layout";
import type { Route } from "./+types";

export function meta({ matches }: Route.MetaArgs) {
  const match = matches.find((match) => match?.id === USERNAME_LAYOUT_ROUTE_ID);
  const loaderData = match?.loaderData as Awaited<
    ReturnType<UsernameLayoutLoader>
  >["data"];
  return [
    {
      title: loaderData
        ? `${loaderData.name} (@${loaderData.username}) / Warbler`
        : "Profile / Warbler",
    },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { user, clearSessionHeader } = await getUser(request);

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");

  const tweets = await getUserPosts({
    cursor,
    userId: user?.id,
    username: params.username,
  });

  return data(
    {
      tweets,
      hasMore: tweets.length === PAGE_SIZE,
      nextCursor:
        tweets.length > 0
          ? tweets[tweets.length - 1]?.createdAt.toISOString()
          : null,
    },
    { headers: clearSessionHeader ? { "set-cookie": clearSessionHeader } : {} },
  );
}

export default function Page({ loaderData }: Route.ComponentProps) {
  const { fetcher, loadMoreRef, tweets } = useInfiniteTweetsScroll(loaderData);
  return (
    <>
      {tweets.map((tweet) => (
        <TweetCard key={tweet.id} {...tweet} />
      ))}
      <div ref={loadMoreRef} aria-hidden />
      {fetcher.state === "loading" && (
        <Spinner className="mx-auto my-8 text-blue-500" />
      )}
    </>
  );
}
