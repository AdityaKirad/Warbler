import DefaultProfilePicture from "~/assets/default-profile-picture.png";
import { getNameInitials } from "~/lib/utils";
import type { loader } from "~/routes/_main+/explore";
import { SearchIcon } from "lucide-react";
import { Link, useFetcher } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export function SearchFollowSidebar() {
  const fetcher = useFetcher<typeof loader>();
  function handleKeyDown(evt: React.KeyboardEvent<HTMLInputElement>) {}
  return (
    <div
      className="max-tablet:hidden relative mr-4 w-64 pt-4 transition-[width] lg:mr-12 lg:w-80"
      onKeyDown={handleKeyDown}>
      <fetcher.Form
        className="relative flex h-10 items-center"
        method="GET"
        action="/explore">
        <SearchIcon className="ml-2 size-4 stroke-current/50" />
        <input
          className="outline-border absolute inset-0 rounded-full pr-2 pl-8 outline-2 transition-colors focus-visible:caret-blue-500 focus-visible:outline-blue-500"
          type="text"
          placeholder="Search"
          name="query"
          onChange={(evt) =>
            fetcher.load(
              `/explore?query=${encodeURIComponent(evt.target.value)}`,
            )
          }
        />
      </fetcher.Form>
      {fetcher.data?.length && (
        <ul className="absolute inset-x-0 top-16 rounded-lg border py-2">
          {fetcher.data.map((data) => (
            <li key={data.id}>
              <Link
                to={data.username}
                className="data-highlighted:bg-muted flex items-center gap-4 px-4 py-3 transition-colors"
                data-highlighted>
                <Avatar>
                  <AvatarImage
                    src={data.photo ?? DefaultProfilePicture}
                    alt={data.username}
                    loading="lazy"
                    decoding="async"
                  />
                  <AvatarFallback>{getNameInitials(data.name)}</AvatarFallback>
                </Avatar>
                <div className="leading-none">
                  <p className="font-medium">{data.name}</p>
                  <span className="text-muted-foreground">
                    @{data.username}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
