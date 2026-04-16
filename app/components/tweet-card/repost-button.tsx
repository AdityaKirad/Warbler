import { useUser } from "~/hooks/use-user";
import { cn } from "~/lib/utils";
import { PenLineIcon, Repeat2Icon } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

type RepostButtonProps = {
  name?: string;
  tweetId: string;
  repostCount: number;
  reposted?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetcher: FetcherWithComponents<any>;
};

export function RepostButton(props: RepostButtonProps) {
  const user = useUser();

  return user ? (
    <AuthenticatedContent {...props} />
  ) : (
    <NonAuthenticatedContent {...props} />
  );
}

function AuthenticatedContent({
  tweetId,
  reposted,
  repostCount,
  fetcher,
}: Omit<RepostButtonProps, "name">) {
  const [interaction, interactionSet] = useState({
    reposted,
    repostCount,
  });

  useEffect(() => {
    interactionSet({
      reposted,
      repostCount,
    });
  }, [reposted, repostCount]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "group flex items-center gap-0.5 transition-colors outline-none",

          interaction.reposted
            ? "text-green-500"
            : "hover:text-green-500 focus-visible:text-green-500",
        )}>
        <div className="rounded-full p-2 group-hover:bg-green-500/20 group-focus-visible:bg-green-500/20 group-focus-visible:outline-2 group-focus-visible:outline-green-300">
          <Repeat2Icon className="size-5" />
        </div>
        <span className="group-hover:text-green-500 group-focus-visible:text-green-500">
          {interaction.repostCount}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          className="w-full text-base [&_svg]:size-5"
          onSelect={() => {
            interactionSet((prev) => ({
              reposted: !prev.reposted,
              repostCount: prev.reposted
                ? prev.repostCount - 1
                : prev.repostCount + 1,
            }));
            const formData = new FormData();
            formData.set("interaction", "repost");
            fetcher.submit(formData, {
              method: "POST",
              action: `/tweet/${tweetId}/interaction`,
            });
          }}>
          <Repeat2Icon />
          <span>{interaction.reposted ? "Undo repost" : "Repost"}</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="text-base [&_svg]:size-5">
          <PenLineIcon />
          <span>Quote</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NonAuthenticatedContent({
  name,
  repostCount,
}: Omit<RepostButtonProps, "tweetId" | "reposted" | "fetcher">) {
  return (
    <Dialog>
      <DialogTrigger className="group flex items-center gap-0.5 transition-colors outline-none hover:text-green-500 focus-visible:text-green-500">
        <div className="rounded-full p-2 group-hover:bg-green-500/20 group-focus-visible:bg-green-500/20 group-focus-visible:outline-2 group-focus-visible:outline-green-300">
          <Repeat2Icon className="size-5" />
        </div>
        <span>{repostCount}</span>
      </DialogTrigger>
      <DialogContent className="justify-center py-20 max-sm:px-8 sm:h-fit">
        <Repeat2Icon className="mx-auto size-12 stroke-green-500" />
        <DialogTitle>Repost to spread the word.</DialogTitle>
        <DialogDescription>
          When you join Warbler, you can share {name}'s post with your
          followers.
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
