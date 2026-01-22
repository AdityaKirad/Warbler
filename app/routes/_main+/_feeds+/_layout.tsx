import { EditorContent } from "@tiptap/react";
import DefaultProfilePicture from "~/assets/default-profile-picture.png";
import { FeedTab } from "~/components/feed-tab";
import { SearchFollowSidebar } from "~/components/search-follow-sidebar";
import { EmojiPopover, useTweetForm } from "~/components/tweet-form";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { getNameInitials } from "~/lib/utils";
import { Link, Outlet, useLocation } from "react-router";

export default function Layout() {
  const location = useLocation();
  return (
    <div className="flex gap-8">
      <div className="h-full w-150 border-r">
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
  const { charCount, editor, fetcher, isPending, isOverlimit, user } =
    useTweetForm();
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
        <EditorContent
          className="[&_p.is-editor-empty]:first:before:pointer-events-none [&_p.is-editor-empty]:first:before:float-left [&_p.is-editor-empty]:first:before:h-0 [&_p.is-editor-empty]:first:before:text-current/50 [&_p.is-editor-empty]:first:before:content-[attr(data-placeholder)] [&>div]:min-h-12 [&>div]:outline-none"
          editor={editor}
        />
        <Separator />
        <div className="flex items-center justify-between">
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
      </div>
    </fetcher.Form>
  );
}
