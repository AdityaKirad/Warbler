import { createId } from "@paralleldrive/cuid2";
import { NEW_TWEET_FETCHER_KEY } from "~/components/tweet-form";
import { useRequiredUser } from "~/hooks/use-user";
import { useFetchers } from "react-router";
import { validateTweet } from "../tweet+";

export function useOptimisticTweet() {
  const user = useRequiredUser();
  const fetchers = useFetchers();

  const fetcher = fetchers.find(
    (fetcher) => fetcher.key === NEW_TWEET_FETCHER_KEY,
  );

  const tweet = fetcher?.formData?.get("tweet") as string | undefined;

  if (!tweet) {
    return;
  }

  const parsed = validateTweet({
    tweet,
    profileVerified: user.profileVerified,
  });

  if (parsed.status !== "success") {
    return;
  }

  return {
    user,
    id: createId(),
    content: parsed.content as unknown as { [x: string]: undefined },
    createdAt: new Date(),
    views: 0,
    disabled: true,
    following: false,
    count: {
      likes: 0,
      replies: 0,
      reposts: 0,
    },
    viewer: {
      bookmarked: false,
      liked: false,
      reposted: false,
    },
  };
}
