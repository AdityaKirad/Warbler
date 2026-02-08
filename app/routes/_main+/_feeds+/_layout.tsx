import { EditorContent } from "@tiptap/react";
import DefaultProfilePicture from "~/assets/default-profile-picture.png";
import { FeedTab } from "~/components/feed-tab";
import { SearchFollowSidebar } from "~/components/search-follow-sidebar";
import { EmojiPopover, useTweetForm } from "~/components/tweet-form";
import { CharCounter } from "~/components/tweet-form/char-counter";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { getNameInitials } from "~/lib/utils";
import { Link, Outlet, useLocation } from "react-router";
import { ClientOnly } from "remix-utils/client-only";

export default function Layout() {
  const location = useLocation();
  return (
    <div className="flex h-full justify-between">
      <div className="h-full w-150 border-x">
        {["/home", "/following"].includes(location.pathname) && (
          <>
            <div className="bg-background sticky top-0 z-10 flex border-b">
              <FeedTab label="All Tweets" title="For you" to="/home" />
              <FeedTab
                label="Following tweets"
                title="Following"
                to="/following"
              />
            </div>
            <TweetForm />
          </>
        )}
        <Outlet />
      </div>
      <SearchFollowSidebar />
    </div>
  );
}

function TweetForm() {
  const {
    charCount,
    maxCharCount,
    editor,
    fetcher,
    isPending,
    isOverlimit,
    user,
  } = useTweetForm();
  return (
    <fetcher.Form
      className="flex gap-2 border-b px-4 py-2"
      method="POST"
      action="/tweet"
      onSubmit={(evt) => {
        evt.preventDefault();

        const formData = new FormData();
        formData.set("tweet", JSON.stringify(editor?.getJSON()));
        fetcher.submit(formData, { method: "POST", action: "/tweet" });
      }}>
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
            <textarea
              className="peer h-12 resize-none outline-none"
              name="tweet"
              placeholder="What's happening"
              required
            />
          }>
          {() => (
            <EditorContent className="peer [&>div]:min-h-12" editor={editor} />
          )}
        </ClientOnly>
        <Separator />
        <div className="flex items-center gap-2">
          <div className="flex grow items-center gap-2">
            <EmojiPopover editor={editor} />
            <CharCounter charCount={charCount} maxCharCount={maxCharCount} />
          </div>
          {charCount > 0 && <Separator orientation="vertical" />}
          <Button
            className="pointer-events-none rounded-full px-6 opacity-50 peer-not-placeholder-shown:pointer-events-auto peer-not-placeholder-shown:opacity-1"
            type="submit"
            disabled={isOverlimit || isPending}>
            Post
          </Button>
        </div>
      </div>
    </fetcher.Form>
  );
}
