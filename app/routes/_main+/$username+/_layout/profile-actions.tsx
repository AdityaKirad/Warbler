import { UserPlusIcon } from "~/components/icons/user-plus";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useUser } from "~/hooks/use-user";
import {
  BanIcon,
  InfoIcon,
  Link2Icon,
  MoreHorizontalIcon,
  ShareIcon,
  VolumeOffIcon,
} from "lucide-react";
import { Form, Link } from "react-router";
import { toast } from "sonner";
import type { LayoutLoader } from "./index";

export function ProfileActions({
  user,
}: {
  user: NonNullable<Awaited<ReturnType<LayoutLoader>>>;
}) {
  const currentUser = useUser();
  return (
    <div className="float-right mt-4 mr-4 flex gap-2">
      {currentUser ? (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="rounded-full"
                variant="outline"
                size="icon"
                aria-label="More">
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                className="flex items-center gap-2 text-base font-medium"
                asChild>
                <Link
                  to={`/${user.username}/about`}
                  aria-label="About this account">
                  <InfoIcon />
                  <span>About this account</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2 text-base font-medium"
                asChild>
                <button
                  onClick={async () => {
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          url: `${process.env.URL}/${user.username}`,
                        });
                      } catch (error) {
                        console.error(error);
                      }
                    } else {
                      toast("Your browser doesn't support sharing.");
                    }
                  }}>
                  <ShareIcon />
                  <span>Share @{user.username} via...</span>
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex w-full items-center gap-2 text-base font-medium"
                asChild>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      `${process.env.URL}/${user.username}`,
                    )
                  }>
                  <Link2Icon className="-rotate-45" />
                  <span>Copy link to profile</span>
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-base font-medium">
                <VolumeOffIcon />
                <span>Mute</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-base font-medium">
                <BanIcon className="rotate-90" />
                <span>Block @{user.username}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Form method="POST" action="follow" navigate={false}>
            <Button className="rounded-full" type="submit" variant="outline">
              {user.following ? "Unfollow" : "Follow"}
            </Button>
          </Form>
        </>
      ) : (
        <Dialog>
          <DialogTrigger asChild>
            <Button className="rounded-full">Follow</Button>
          </DialogTrigger>
          <DialogContent className="justify-center py-20 max-sm:px-8 sm:h-fit">
            <UserPlusIcon className="mx-auto size-12 text-blue-500" />
            <DialogTitle>
              Follow {user.name} to see what they share on Warbler.
            </DialogTitle>
            <DialogDescription>
              Sign up so you never miss their posts.
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
      )}
    </div>
  );
}
