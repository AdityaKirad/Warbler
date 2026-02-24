import { PageTitle } from "~/components/page-title";
import { SearchFollowSidebar } from "~/components/search-follow-sidebar";
import { Outlet } from "react-router";

export default function Layout() {
  return (
    <div className="flex min-h-screen justify-between">
      <div className="w-150 min-h-screen border-x">
        <PageTitle title="Post activity" />
        <Outlet />
      </div>
      <SearchFollowSidebar />
    </div>
  );
}
