import Logo from "~/assets/logo.webp";
import { useUser } from "~/hooks/use-user";
import { cn } from "~/lib/utils";
import { ChartNoAxesColumnIcon, HeartIcon } from "lucide-react";
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

export function LikeButton({
  name,
  likeCount,
  liked,
}: {
  name?: string;
  likeCount: number;
  liked: boolean;
}) {
  const user = useUser();
  if (!user) {
    return (
      <Dialog>
        <DialogTrigger className="group flex items-center gap-0.5 transition-colors outline-none hover:text-rose-500 focus-visible:text-rose-500">
          <div className="rounded-full p-2 group-focus-visible:bg-rose-500/20 group-focus-visible:outline-2 group-focus-visible:outline-rose-300 hover:bg-rose-500/20">
            <HeartIcon className="size-5" />
          </div>
          <span>{likeCount}</span>
        </DialogTrigger>
        <DialogContent className="justify-center py-20 max-sm:px-8 sm:h-fit">
          <HeartIcon
            className="mx-auto size-12 text-rose-500"
            fill="currentColor"
          />
          <DialogTitle>Like a post to share the love.</DialogTitle>
          <DialogDescription>
            Join Warbler now to let {name} know you like their post.
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

  return (
    <button
      className={cn(
        "group flex items-center gap-0.5 transition-colors outline-none",
        liked
          ? "text-rose-500"
          : "hover:text-rose-500 focus-visible:text-rose-500",
      )}
      type="submit"
      name="engagement"
      value="like">
      <div className="rounded-full p-2 group-focus-visible:bg-rose-500/20 group-focus-visible:outline-2 group-focus-visible:outline-rose-300 hover:bg-rose-500/20">
        <HeartIcon className="size-5" fill={liked ? "currentColor" : "none"} />
      </div>
      <span>{likeCount}</span>
    </button>
  );
}

export function BookmarkButton({
  bookmarked,
  bookmarkCount,
}: {
  bookmarked: boolean;
  bookmarkCount?: number;
}) {
  const user = useUser();

  if (!user) {
    return (
      <Dialog>
        <DialogTrigger className="group flex items-center gap-0.5 transition-colors outline-none hover:text-blue-500 focus-visible:text-blue-500">
          <div className="rounded-full p-2 group-focus-visible:bg-blue-500/20 group-focus-visible:outline-2 group-focus-visible:outline-blue-300 hover:bg-blue-500/20">
            <BookmarkOutlinedIcon className="size-5" />
          </div>
          <span>{bookmarkCount}</span>
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
          <DialogTitle>Don&apos;t miss what&apos;s happening</DialogTitle>
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

  return (
    <button
      className={cn(
        "group transition-colors outline-none",
        bookmarked
          ? "text-blue-500"
          : "hover:text-blue-500 focus-visible:text-blue-500",
        { "flex items-center gap-0.5": bookmarkCount },
      )}
      type="submit"
      name="engagement"
      value="bookmark">
      <div className="rounded-full p-2 group-hover:bg-blue-500/20 group-focus-visible:bg-blue-500/20 group-focus-visible:outline-2 group-focus-visible:outline-blue-300">
        <BookmarkOutlinedIcon
          className="size-5"
          fill={bookmarked ? "currentColor" : "none"}
        />
      </div>
      {bookmarkCount && <span>{bookmarkCount}</span>}
    </button>
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
          <Button>Dismiss</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
