import type { UserSelectType } from "~/.server/drizzle";
import DefaultProfilePicture from "~/assets/default-profile-picture.png";
import { formatTweetDate, getNameInitials } from "~/lib/utils";
import { format } from "date-fns";
import { useState } from "react";
import { Link } from "react-router";
import { DialogTweetForm } from "../dialog-tweet-form";
import { ChatIcon } from "../icons/chat";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { Separator } from "../ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export function CommentButton({
  body,
  createdAt,
  id,
  replyCount,
  user,
}: {
  body: string;
  createdAt: Date;
  id: string;
  replyCount: number;
  user: Pick<UserSelectType, "name" | "username" | "photo">;
}) {
  const [dialog, dialogSet] = useState(false);
  return (
    <Dialog open={dialog} onOpenChange={dialogSet}>
      <DialogTrigger className="group flex cursor-pointer items-center gap-0.5 transition-colors outline-none hover:text-blue-500 focus-visible:text-blue-500">
        <div className="rounded-full p-2 group-hover:bg-blue-400/20 group-focus-visible:bg-blue-400/20 group-focus-visible:outline-2 group-focus-visible:outline-blue-300">
          <ChatIcon className="size-5" />
        </div>
        <span>{replyCount}</span>
      </DialogTrigger>
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
            <div className="pb-4" dangerouslySetInnerHTML={{ __html: body }} />
            <div className="text-muted-foreground">
              Replying to{" "}
              <span className="text-blue-500">@{user.username}</span>
            </div>
          </div>
        </article>
        <DialogTweetForm
          replyToTweetId={id}
          onSuccess={() => dialogSet(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
