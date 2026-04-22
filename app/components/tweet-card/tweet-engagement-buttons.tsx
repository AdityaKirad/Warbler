import Logo from "~/assets/logo.webp";
import { useUser } from "~/hooks/use-user";
import { cn } from "~/lib/utils";
import { ChartNoAxesColumnIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { FetcherWithComponents } from "react-router";
import { Link } from "react-router";
import { BookmarkOutlinedIcon } from "../icons";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

type BookmarkButtonProps = {
  bookmarked?: boolean;
  count?: number;
  showBookmarkCount?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetcher: FetcherWithComponents<any>;
};

export function BookmarkButton(props: BookmarkButtonProps) {
  const user = useUser();

  return user ? (
    <AuthenticatedBookmarkButton {...props} />
  ) : (
    <NonAuthenticatedBookmarkButton {...props} />
  );
}

export function ViewsButton({ views }: { views: number }) {
  return (
    <Dialog>
      <DialogTrigger className="group flex items-center gap-0.5 transition-colors outline-none hover:text-blue-500 focus-visible:text-blue-500">
        <div className="rounded-full p-2 group-hover:bg-blue-500/20 group-focus-visible:bg-blue-500/20 group-focus-visible:outline-2 group-focus-visible:outline-blue-300">
          <ChartNoAxesColumnIcon className="size-5" />
        </div>
        <span>{views}</span>
      </DialogTrigger>
      <DialogContent className="h-fit p-20">
        <DialogTitle className="text-[2rem]">Views</DialogTitle>
        <DialogDescription>Times this post was seen.</DialogDescription>
        <DialogClose className="rounded-full" asChild>
          <Button type="button">Dismiss</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

function NonAuthenticatedBookmarkButton({
  count,
}: Pick<BookmarkButtonProps, "count">) {
  return (
    <Dialog>
      <DialogTrigger className="group flex items-center gap-0.5 transition-colors outline-none hover:text-blue-500 focus-visible:text-blue-500">
        <div className="rounded-full p-2 group-focus-visible:bg-blue-500/20 group-focus-visible:outline-2 group-focus-visible:outline-blue-300 hover:bg-blue-500/20">
          <BookmarkOutlinedIcon className="size-5" />
        </div>
        <span>{count}</span>
      </DialogTrigger>
      <DialogContent className="justify-center py-20 max-sm:px-8 sm:h-fit">
        <img
          className="mx-auto"
          src={Logo}
          height={56}
          width={56}
          alt="Warbler"
          decoding="async"
          loading="lazy"
        />
        <DialogTitle>Don't miss what's happening</DialogTitle>
        <DialogDescription>
          People on Warbler are the first to know.
        </DialogDescription>
        <Button className="rounded-full text-base" asChild>
          <Link to="/flow/login">Log in</Link>
        </Button>
        <Button
          className="rounded-full text-base"
          variant="outline"
          size="lg"
          asChild>
          <Link to="/flow/signup">Sign up</Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function AuthenticatedBookmarkButton({
  bookmarked,
  count,
  fetcher,
  showBookmarkCount,
}: BookmarkButtonProps) {
  const [interaction, interactionSet] = useState({
    bookmarked,
    ...(showBookmarkCount ? { count } : {}),
  });

  useEffect(() => {
    interactionSet({
      bookmarked,
      ...(showBookmarkCount ? { count } : {}),
    });
  }, [bookmarked, count, showBookmarkCount]);
  return (
    <button
      className={cn(
        "group transition-colors outline-none",
        interaction.bookmarked
          ? "text-blue-500"
          : "hover:text-blue-500 focus-visible:text-blue-500",
        { "flex items-center gap-0.5": showBookmarkCount },
      )}
      type="submit"
      name="interaction"
      value="bookmark"
      onClick={(evt) => {
        evt.preventDefault();
        interactionSet((prev) => ({
          bookmarked: !prev.bookmarked,
          ...(showBookmarkCount && prev.count
            ? {
                count: interaction.bookmarked ? prev.count - 1 : prev.count + 1,
              }
            : {}),
        }));
        fetcher.submit(evt.currentTarget);
      }}>
      <div className="rounded-full p-2 group-hover:bg-blue-500/20 group-focus-visible:bg-blue-500/20 group-focus-visible:outline-2 group-focus-visible:outline-blue-300">
        <BookmarkOutlinedIcon
          className="size-5"
          fill={interaction.bookmarked ? "currentColor" : "none"}
        />
      </div>
      {showBookmarkCount && <span>{interaction.count}</span>}
    </button>
  );
}
