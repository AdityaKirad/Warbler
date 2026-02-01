import { EditorContent } from "@tiptap/react";
import DefaultProfilePicture from "~/assets/default-profile-picture.png";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { getNameInitials } from "~/lib/utils";
import { Link } from "react-router";
import { EmojiPopover } from "./tweet-form/emoji-popover";
import { useTweetForm } from "./tweet-form/use-tweet-form";

export function DialogTweetForm({
  onSuccess,
  replyToTweetId,
}: {
  onSuccess?: () => void;
  replyToTweetId?: string;
}) {
  const { charCount, editor, fetcher, isOverlimit, isPending, user } =
    useTweetForm(onSuccess);
  return (
    <fetcher.Form
      className="flex flex-col gap-2"
      onSubmit={(evt) => {
        evt.preventDefault();

        const formData = new FormData();
        if (replyToTweetId) {
          formData.set("replyToTweetId", replyToTweetId);
        }
        formData.set("tweet", JSON.stringify(editor?.getJSON()));
        fetcher.submit(formData, { method: "POST", action: "/tweet" });
      }}>
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
      <div className="flex justify-between">
        <div className="flex gap-2">
          <EmojiPopover editor={editor} />
        </div>
        <Button
          className="rounded-full px-6"
          type="submit"
          disabled={!charCount || isOverlimit || isPending}>
          Post
        </Button>
      </div>
    </fetcher.Form>
  );
}
