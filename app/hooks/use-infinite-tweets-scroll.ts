import { useEffect, useRef, useState } from "react";
import { useFetcher, useLocation } from "react-router";

export function useInfiniteTweetsScroll<T extends { id: string }>(props: {
  hasMore: boolean;
  nextCursor: string | null | undefined;
  tweets: T[];
}) {
  const [tweets, tweetsSet] = useState(props.tweets);
  const [hasMore, hasMoreSet] = useState(props.hasMore);
  const [nextCursor, nextCursorSet] = useState(props.nextCursor);

  const { pathname } = useLocation();
  const fetcher = useFetcher();

  const loadMoreRef = useRef<React.ElementRef<"div">>(null);

  useEffect(() => {
    if (!fetcher.data) {
      return;
    }

    tweetsSet((prev) => [...prev, ...fetcher.data.tweets]);
    nextCursorSet(fetcher.data?.nextCursor);
    hasMoreSet(fetcher.data?.hasMore);
  }, [fetcher.data]);

  useEffect(() => {
    tweetsSet(props.tweets);
    nextCursorSet(props.nextCursor);
    hasMoreSet(props.hasMore);
  }, [props]);

  useEffect(() => {
    const loadMore = loadMoreRef.current;

    if (!loadMore) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry?.isIntersecting &&
          hasMore &&
          fetcher.state === "idle" &&
          nextCursor
        ) {
          fetcher.load(`/${pathname}?cursor=${nextCursor}`);
        }
      },
      { rootMargin: "0px 0px 400px 0px" },
    );

    observer.observe(loadMore);

    return () => {
      observer.disconnect();
    };
  }, [fetcher, hasMore, nextCursor, pathname]);

  return { fetcher, loadMoreRef, tweets };
}
