import { EditorContent } from "@tiptap/react";
import DefaultProfilePicture from "~/assets/default-profile-picture.png";
import { getNameInitials } from "~/lib/utils";
import { Link, useSearchParams } from "react-router";
import { ClientOnly } from "remix-utils/client-only";
import { EmojiPopover, useTweetForm } from "./tweet-form";
import { CharCounter } from "./tweet-form/char-counter";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

export function FeedsTweetForm() {
  const {
    user,
    editor,
    fetcher,
    charCount,
    maxCharCount,
    isPending,
    isOverLimit,
    handleSubmit,
  } = useTweetForm();
  const [searchParams] = useSearchParams();
  const content = searchParams.get("tweet_content");
  const error = searchParams.get("tweet_error");
  return (
    <fetcher.Form
      className="flex gap-2 border-b px-4 py-2"
      method="POST"
      action="/tweet"
      onSubmit={handleSubmit}>
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
      <div className="flex min-w-0 grow flex-col gap-2">
        <ClientOnly
          fallback={
            <>
              <textarea
                className="peer h-12 resize-none outline-none"
                name="tweet"
                placeholder="What's happening"
                defaultValue={content ?? ""}
                required
              />
              {error && <p className="text-destructive text-sm">{error}</p>}
            </>
          }>
          {() => (
            <EditorContent className="peer [&>div]:min-h-12" editor={editor} />
          )}
        </ClientOnly>
        <Separator />
        <div className="flex gap-2">
          <div className="flex grow items-center gap-2">
            <EmojiPopover editor={editor} />
            <CharCounter charCount={charCount} maxCharCount={maxCharCount} />
          </div>
          {charCount > 0 && <Separator orientation="vertical" />}
          <Button
            className="rounded-full px-6"
            type="submit"
            disabled={isOverLimit || isPending}>
            Post
          </Button>
        </div>
      </div>
    </fetcher.Form>
  );
}

export function UserAvatar() {}
