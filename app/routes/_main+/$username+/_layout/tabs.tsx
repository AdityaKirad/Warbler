import { FeedTab } from "~/components/feed-tab";
import { useUser } from "~/hooks/use-user";
import type { LayoutLoader } from "./index";

export function Tabs({
  user,
}: {
  user: NonNullable<Awaited<ReturnType<LayoutLoader>>>;
}) {
  const currentUser = useUser();
  return (
    <div className="flex border-b">
      <FeedTab
        to={`/${user.username}`}
        title="Posts"
        label={`${user.name} Posts`}
      />
      <FeedTab
        to="with_replies"
        title="Replies"
        label={`${user.name} Replies`}
      />
      <FeedTab to="media" title="Media" label={`${user?.name} Media`} />
      {user.id === currentUser?.user.id && (
        <FeedTab to="likes" title="Likes" label={`${user?.name} Likes`} />
      )}
    </div>
  );
}
