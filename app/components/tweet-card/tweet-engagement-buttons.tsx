import { cn } from "~/lib/utils";
import { ChartNoAxesColumnIcon, HeartIcon } from "lucide-react";
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
  likeCount,
  hasLiked,
}: {
  likeCount: number;
  hasLiked: boolean;
}) {
  return (
    <button
      className={cn(
        "group flex items-center gap-0.5 transition-colors outline-none",
        hasLiked
          ? "text-rose-500"
          : "hover:text-rose-500 focus-visible:text-rose-500",
      )}
      type="submit"
      name="engagement"
      value="like">
      <div className="rounded-full p-2 group-focus-visible:bg-rose-500/20 group-focus-visible:outline-2 group-focus-visible:outline-rose-300 hover:bg-rose-500/20">
        <HeartIcon
          className="size-5"
          fill={hasLiked ? "currentColor" : "none"}
        />
      </div>
      <span>{likeCount}</span>
    </button>
  );
}

export function BookmarkButton({ hasBookmarked }: { hasBookmarked: boolean }) {
  return (
    <button
      className={cn(
        "group transition-colors outline-none",
        hasBookmarked
          ? "text-blue-500"
          : "hover:text-blue-500 focus-visible:text-blue-500",
      )}
      type="submit"
      name="engagement"
      value="bookmark">
      <div className="rounded-full p-2 group-hover:bg-blue-500/20 group-focus-visible:bg-blue-500/20 group-focus-visible:outline-2 group-focus-visible:outline-blue-300">
        <BookmarkOutlinedIcon
          className="size-5"
          fill={hasBookmarked ? "currentColor" : "none"}
        />
      </div>
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
