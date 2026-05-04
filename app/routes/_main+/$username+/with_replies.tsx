import { getUser } from "~/.server/utils";
import { Spinner } from "~/components/spinner";
import { TweetCard } from "~/components/tweet-card";
import { useInfiniteTweetsScroll } from "~/hooks/use-infinite-tweets-scroll";
import { useUser } from "~/hooks/use-user";
import { useParams } from "react-router";
import { getUserPostsWithReplies, PAGE_SIZE } from "../feed-queries.server";
import { USERNAME_LAYOUT_ROUTE_ID, type UsernameLayoutLoader } from "./_layout";
import type { Route } from "./+types/with_replies";

export function meta({ matches }: Route.MetaArgs) {
  const match = matches.find((match) => match?.id === USERNAME_LAYOUT_ROUTE_ID);
  const loaderData = match?.loaderData as Awaited<
    ReturnType<UsernameLayoutLoader>
  >;

  return [
    {
      title: loaderData
        ? `Posts with replies by ${loaderData.name} (@${loaderData.username}) / Warbler`
        : "Profile / Warbler",
    },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await getUser(request);

  if (!user) {
    return;
  }

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");

  const tweets = await getUserPostsWithReplies({
    cursor,
    userId: user.id,
    username: params.username,
  });

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
  const user = useUser();

  return user && loaderData ? (
    <AuthenticatedContent loaderData={loaderData} />
  ) : (
    <NonAuthenticatedContent />
  );
}

function NonAuthenticatedContent() {
  const params = useParams();
  return (
    <div className="mx-auto mt-16 max-w-80">
      <h3 className="text-3xl font-bold">{params.username} hasn’t posted</h3>
      <p className="text-muted-foreground text-sm">
        When they do, their posts will show up here.
      </p>
    </div>
  );
}

function AuthenticatedContent({
  loaderData,
}: {
  loaderData: NonNullable<Awaited<ReturnType<typeof loader>>>;
}) {
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
