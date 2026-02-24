import { EditorContent } from "@tiptap/react";
import DefaultProfilePicture from "~/assets/default-profile-picture.png";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { getNameInitials } from "~/lib/utils";
import { Link } from "react-router";
import { CharCounter } from "./tweet-form/char-counter";
import { EmojiPopover } from "./tweet-form/emoji-popover";
import { useTweetForm } from "./tweet-form/use-tweet-form";

export function DialogTweetForm(props: {
  onSuccess: () => void;
  onError: () => void;
  replyToTweetId?: string;
}) {
  const {
    charCount,
    maxCharCount,
    editor,
    fetcher,
    isOverLimit,
    isPending,
    user,
    handleSubmit,
  } = useTweetForm(props);
  return (
    <fetcher.Form className="flex flex-col gap-2" onSubmit={handleSubmit}>
      <div className="flex min-h-24 gap-2">
        <Avatar asChild>
          <Link to={user.username}>
            <AvatarImage
              src={user.photo ?? DefaultProfilePicture}
              alt={user.username}
              loading="lazy"
              decoding="async"
            />
            <AvatarFallback>{getNameInitials(user.name)}</AvatarFallback>
          </Link>
        </Avatar>
        <EditorContent
          className="min-w-0 grow [&>div]:min-h-full"
          editor={editor}
        />
      </div>
      <Separator />
      <div className="flex gap-2">
        <div className="flex grow items-center gap-2">
          <EmojiPopover editor={editor} />
          <CharCounter charCount={charCount} maxCharCount={maxCharCount} />
        </div>
        {charCount > 0 && (
          <Separator className="h-auto" orientation="vertical" />
        )}
        <Button
          className="rounded-full px-6"
          type="submit"
          disabled={!charCount || isOverLimit || isPending}>
          Post
        </Button>
      </div>
    </fetcher.Form>
  );
}
