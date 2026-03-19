import { useUser } from "~/hooks/use-user";
import { cn } from "~/lib/utils";
import { HeartIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { FetcherWithComponents } from "react-router";
import { Link } from "react-router";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

type LikeButtonProps = {
  count: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetcher: FetcherWithComponents<any>;
  liked?: boolean;
  name?: string;
};

export function LikeButton(props: LikeButtonProps) {
  const user = useUser();
  return user ? (
    <AuthenticatedContent {...props} />
  ) : (
    <NonAuthenticatedContent {...props} />
  );
}

function NonAuthenticatedContent({
  name,
  count,
}: Omit<LikeButtonProps, "fetcher" | "liked">) {
  return (
    <Dialog>
      <DialogTrigger className="group flex items-center gap-0.5 transition-colors outline-none hover:text-rose-500 focus-visible:text-rose-500">
        <div className="rounded-full p-2 group-focus-visible:bg-rose-500/20 group-focus-visible:outline-2 group-focus-visible:outline-rose-300 hover:bg-rose-500/20">
          <HeartIcon className="size-5" />
        </div>
        <span>{count}</span>
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

function AuthenticatedContent({
  count,
  fetcher,
  liked,
}: Omit<LikeButtonProps, "name">) {
  const [interaction, interactionSet] = useState({
    count,
    liked,
  });

  useEffect(() => {
    interactionSet({
      count,
      liked,
    });
  }, [liked, count]);

  return (
    <button
      className={cn(
        "group flex items-center gap-0.5 transition-colors outline-none",
        interaction.liked
          ? "text-rose-500"
          : "hover:text-rose-500 focus-visible:text-rose-500",
      )}
      type="submit"
      name="interaction"
      value="like"
      onClick={(evt) => {
        evt.preventDefault();
        interactionSet((prev) => ({
          liked: !prev.liked,
          count: prev.liked ? prev.count - 1 : prev.count + 1,
        }));
        fetcher.submit(evt.currentTarget);
      }}>
      <div className="rounded-full p-2 group-focus-visible:bg-rose-500/20 group-focus-visible:outline-2 group-focus-visible:outline-rose-300 hover:bg-rose-500/20">
        <HeartIcon
          className="size-5"
          fill={interaction.liked ? "currentColor" : "none"}
        />
      </div>
      <span>{interaction.count}</span>
    </button>
  );
}
