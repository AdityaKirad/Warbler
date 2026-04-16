import { db } from "~/.server/drizzle";
import { FeedTab } from "~/components/feed-tab";
import { PageTitle } from "~/components/page-title";
import { SearchFollowSidebar } from "~/components/search-follow-sidebar";
import { Outlet } from "react-router";
import type { Route } from "./+types/_layout";

export type CONNECTION_LAYOUT_LOADER = typeof loader;

export const CONNECTION_LAYOUT_ROUTE_ID =
  "routes/_main+/$username+/_._connections+/_layout";

export const loader = ({ params }: Route.LoaderArgs) =>
  db.query.user.findFirst({
    columns: { name: true, username: true },
    where: (user, { eq }) => eq(user.username, params.username),
  });

export default function Layout({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex min-h-full justify-between">
      <div className="min-h-full w-150 border-x">
        <PageTitle
          title={`${loaderData?.name}`}
          description={`@${loaderData?.username}`}
        />
        <div className="flex border-b">
          <FeedTab to="verified_followers" title="Verified Followers" />
          <FeedTab to="followers" title="Followers" />
          <FeedTab to="following" title="Following" />
        </div>
        <Outlet />
      </div>
      <SearchFollowSidebar />
    </div>
  );
}
