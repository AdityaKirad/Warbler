import { useUser } from "~/hooks/use-user";
import type { action } from "~/routes/_main+/$username+/follow";
import {
  BanIcon,
  ChartNoAxesColumnIcon,
  MoreHorizontalIcon,
  PinIcon,
  Trash2,
  VolumeOffIcon,
} from "lucide-react";
import { useEffect } from "react";
import { Link, useFetcher } from "react-router";
import { UserPlusIcon } from "../icons/user-plus";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuDialogItem,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

type MoreOptionDropdownMenuProps = {
  following?: boolean;
  tweetId: string;
  username: string;
};

export function MoreOptionDropdownMenu({
  following,
  tweetId,
  username,
}: MoreOptionDropdownMenuProps) {
  const user = useUser()?.user;
  if (!user) {
    return null;
  }
  return (
    <Dialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="float-right size-8 rounded-full"
            variant="ghost"
            size="icon"
            aria-label="More Options">
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="p-0">
          {username === user.username && (
            <>
              <DeleteTweetDialog tweetId={tweetId} />
              <DropdownMenuItem className="focus:bg-accent/20 rounded-none">
                <PinIcon /> Pin to your profile
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-accent/20 rounded-none">
                <ChartNoAxesColumnIcon /> View post analytics
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem className="focus:bg-accent/20 rounded-none" asChild>
            <Link to={`/${username}/status/${tweetId}/reposts`}>
              <ChartNoAxesColumnIcon /> View post activity
            </Link>
          </DropdownMenuItem>
          {username !== user.username && (
            <>
              <FollowUserItem following={following} username={username} />
              <DropdownMenuItem className="focus:bg-accent/20 rounded-none">
                <VolumeOffIcon /> Mute
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-accent/20 rounded-none">
                <BanIcon /> Block @{username}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </Dialog>
  );
}

function FollowUserItem({
  username,
  following,
}: Omit<MoreOptionDropdownMenuProps, "tweetId">) {
  const fetcher = useFetcher<typeof action>();

  useEffect(() => {});

  return (
    <DropdownMenuItem className="focus:bg-accent/20 rounded-none" asChild>
      <fetcher.Form method="POST" action={`/${username}/follow`}>
        <button className="flex items-center gap-2" type="submit">
          <UserPlusIcon />
          {following ? "Unfollow" : "Follow"} @{username}
        </button>
      </fetcher.Form>
    </DropdownMenuItem>
  );
}

function DeleteTweetDialog({
  tweetId,
}: Pick<MoreOptionDropdownMenuProps, "tweetId">) {
  const fetcher = useFetcher();
  return (
    <>
      <DropdownMenuDialogItem
        className="focus:bg-accent/20 w-full rounded-none text-red-500 focus:text-red-500"
        asChild>
        <DialogTrigger>
          <Trash2 /> Delete
        </DialogTrigger>
      </DropdownMenuDialogItem>
      <DialogContent className="h-fit p-6 sm:max-w-80" showCloseButton={false}>
        <fetcher.Form
          className="flex flex-col gap-2"
          method="POST"
          action={`/tweet/${tweetId}/delete`}>
          <DialogTitle>Delete post?</DialogTitle>
          <DialogDescription>
            This can’t be undone and it will be removed from your profile, the
            timeline of any accounts that follow you, and from search results.
          </DialogDescription>
          <Button className="rounded-full" variant="destructive" type="submit">
            Delete
          </Button>
          <DialogClose asChild>
            <Button className="rounded-full" variant="outline">
              Cancel
            </Button>
          </DialogClose>
        </fetcher.Form>
      </DialogContent>
    </>
  );
}
