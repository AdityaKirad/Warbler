import { renderToReactElement } from "@tiptap/static-renderer/pm/react";
import type { UserSelectType } from "~/.server/drizzle";
import DefaultProfilePicture from "~/assets/default-profile-picture.png";
import { useUser } from "~/hooks/use-user";
import { formatTweetDate, getNameInitials } from "~/lib/utils";
import { format } from "date-fns";
import { useState } from "react";
import { Link } from "react-router";
import { DialogTweetForm } from "../dialog-tweet-form";
import { ChatIcon } from "../icons/chat";
import { extensions } from "../tweet-form";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Separator } from "../ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export function CommentButton(props: {
  body: Record<string, unknown>;
  createdAt: Date;
  id: string;
  replyCount: number;
  user: Pick<UserSelectType, "name" | "username" | "photo">;
}) {
  const [dialog, dialogSet] = useState(false);
  const currentUser = useUser();
  return (
    <Dialog open={dialog} onOpenChange={dialogSet}>
      <DialogTrigger className="group flex cursor-pointer items-center gap-0.5 transition-colors outline-none hover:text-blue-500 focus-visible:text-blue-500">
        <div className="rounded-full p-2 group-hover:bg-blue-400/20 group-focus-visible:bg-blue-400/20 group-focus-visible:outline-2 group-focus-visible:outline-blue-300">
          <ChatIcon className="size-5" />
        </div>
        <span>{props.replyCount}</span>
      </DialogTrigger>
      {currentUser ? (
        <AuthenicatedContent dialogSet={() => dialogSet(false)} {...props} />
      ) : (
        <NonAuthenticatedContent name={props.user.name} />
      )}
    </Dialog>
  );
}

function AuthenicatedContent({
  id,
  body,
  createdAt,
  user,
  dialogSet,
}: {
  id: string;
  body: Record<string, unknown>;
  createdAt: Date;
  user: Pick<UserSelectType, "name" | "username" | "photo">;
  dialogSet: () => void;
}) {
  return (
    <DialogContent className="h-fit px-4 pt-12 pb-4">
      <article className="flex gap-2">
        <div className="flex flex-col items-center">
          <Avatar asChild>
            <Link to={`/${user.username}`} className="z-10">
              <AvatarImage
                src={user.photo ?? DefaultProfilePicture}
                alt={user.username}
                loading="lazy"
                decoding="async"
              />
              <AvatarFallback>{getNameInitials(user.name)}</AvatarFallback>
            </Link>
          </Avatar>
          <Separator
            className="mt-1 h-auto w-0.5 grow rounded-none rounded-t-full"
            orientation="vertical"
          />
        </div>
        <div>
          <div className="text-muted-foreground">
            <span className="font-medium text-white">{user.name}</span> @
            {user.username} ·{" "}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>{formatTweetDate(createdAt)}</span>
                </TooltipTrigger>
                <TooltipContent>
                  {format(createdAt, "h:mm a · MMM d, yyyy")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div>
            {renderToReactElement({
              extensions,
              content: body,
            })}
          </div>
          <div className="text-muted-foreground">
            Replying to <span className="text-blue-500">@{user.username}</span>
          </div>
        </div>
      </article>
      <DialogTweetForm
        replyToTweetId={id}
        onSuccess={dialogSet}
        onError={dialogSet}
      />
    </DialogContent>
  );
}

function NonAuthenticatedContent({ name }: { name: string }) {
  return (
    <DialogContent className="justify-center py-20 max-sm:px-8 sm:h-fit">
      <ChatIcon className="mx-auto size-12 text-blue-500" fill="currentColor" />
      <DialogTitle>Reply to join the conversation.</DialogTitle>
      <DialogDescription>
        Once you join Warbler, you can respond to {name}’s post.
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
  );
}
