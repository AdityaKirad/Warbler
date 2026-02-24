import { FeedTab } from "~/components/feed-tab";
import { FeedsTweetForm } from "~/components/feeds-tweet-form";
import { SearchFollowSidebar } from "~/components/search-follow-sidebar";
import { useOutlet } from "react-router";

export default function Layout() {
  const outlet = useOutlet();
  return (
    <div className="flex min-h-screen justify-between">
      <main className="w-150 min-h-screen border-x">
        <div className="bg-background sticky top-0 z-10 flex border-b">
          <FeedTab label="All Tweets" title="For you" to="/home" />
          <FeedTab label="Following tweets" title="Following" to="/following" />
        </div>
        <FeedsTweetForm />
        {outlet}
      </main>
      <SearchFollowSidebar />
    </div>
  );
}
