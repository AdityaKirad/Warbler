import { useUser } from "~/hooks/use-user";
import { cn } from "~/lib/utils";
import { PenLineIcon, Repeat2Icon } from "lucide-react";
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

export function RepostButton({
  name,
  formId,
  repostCount,
  reposted,
}: {
  name?: string;
  formId: string;
  repostCount: number;
  reposted: boolean;
}) {
  const currentUser = useUser();
  if (!currentUser) {
    return (
      <NonAuthenticatedContent
        name={name as string}
        repostCount={repostCount}
      />
    );
  }
  return (
    <AuthenticatedContent
      formId={formId}
      reposted={reposted}
      repostCount={repostCount}
    />
  );
}

function AuthenticatedContent({
  formId,
  reposted,
  repostCount,
}: {
  formId: string;
  reposted: boolean;
  repostCount: number;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "group flex cursor-pointer items-center gap-0.5 transition-colors outline-none",

          reposted
            ? "text-green-500"
            : "hover:text-green-500 focus-visible:text-green-500",
        )}>
        <div className="rounded-full p-2 group-hover:bg-green-500/20 group-focus-visible:bg-green-500/20 group-focus-visible:outline-2 group-focus-visible:outline-green-300">
          <Repeat2Icon className="size-5" />
        </div>
        <span className="group-hover:text-green-500 group-focus-visible:text-green-500">
          {repostCount}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem className="w-full text-base [&_svg]:size-5" asChild>
          <button type="submit" name="engagement" value="repost" form={formId}>
            <Repeat2Icon />
            <span>{reposted ? "Undo repost" : "Repost"}</span>
          </button>
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
}: {
  name: string;
  repostCount: number;
}) {
  return (
    <Dialog>
      <DialogTrigger className="group flex cursor-pointer items-center gap-0.5 transition-colors outline-none hover:text-green-500 focus-visible:text-green-500">
        <div className="rounded-full p-2 group-hover:bg-green-500/20 group-focus-visible:bg-green-500/20 group-focus-visible:outline-2 group-focus-visible:outline-green-300">
          <Repeat2Icon className="size-5" />
        </div>
        <span>{repostCount}</span>
      </DialogTrigger>
      <DialogContent className="justify-center py-20 max-sm:px-8 sm:h-fit">
        <Repeat2Icon className="mx-auto size-12 stroke-green-500" />
        <DialogTitle>Repost to spread the word.</DialogTitle>
        <DialogDescription>
          When you join Warbler, you can share {name}&apos;s post with your
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
