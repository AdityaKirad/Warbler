import { EditorContent } from "@tiptap/react";
import DefaultProfilePicture from "~/assets/default-profile-picture.png";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { cn, getNameInitials } from "~/lib/utils";
import { Link, NavLink, Outlet } from "react-router";
import { EmojiPopover } from "../tweet-form/emoji-popover";
import { useTweetForm } from "../tweet-form/use-tweet-form";

export default function Layout() {
  return (
    <div className="h-full">
      <div className="h-full w-150 border-r">
        <div className="bg-background sticky top-0 z-10 flex border-b">
          <FeedTabs label="All Tweets" title="For you" to="/home" />
          <FeedTabs
            label="Following tweets"
            title="Following"
            to="/following"
          />
        </div>
        <TweetForm />
        <Outlet />
      </div>
    </div>
  );
}

function TweetForm() {
  const { charCount, editor, fetcher, isPending, isOverlimit, user } =
    useTweetForm();
  return (
    <fetcher.Form
      className="flex gap-2 px-4 py-2"
      onSubmit={(evt) => {
        evt.preventDefault();

        const formData = new FormData();
        formData.set("tweet", JSON.stringify(editor?.getJSON()));
        fetcher.submit(formData, { method: "POST", action: "/tweet" });
      }}>
      <Avatar asChild>
        <Link to={user.username}>
          <AvatarImage
            src={user.image ?? DefaultProfilePicture}
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

function FeedTabs({
  label,
  title,
  to,
}: {
  label: string;
  title: string;
  to: string;
}) {
  return (
    <NavLink
      className={({ isActive }) =>
        cn(
          "hover:bg-muted/50 focus-visible:bg-muted/50 relative flex-1 py-4 text-center font-medium outline-2 outline-transparent transition-[background-color,outline-color] focus-visible:outline-white",
          {
            "after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:rounded-full after:bg-blue-500":
              isActive,
          },
        )
      }
      to={to}
      aria-label={label}>
      {title}
    </NavLink>
  );
}
