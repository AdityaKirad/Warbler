import { SearchIcon } from "lucide-react";

export function SearchFollowSidebar() {
  return (
    <div className="mr-12 w-80 pt-4">
      <div className="relative flex h-10 items-center">
        <SearchIcon className="ml-2 size-4 stroke-current/50" />
        <input
          className="outline-border absolute inset-0 rounded-full pr-2 pl-8 outline-2 transition-colors focus-visible:caret-blue-500 focus-visible:outline-blue-500"
          type="text"
          placeholder="Search"
        />
      </div>
    </div>
  );
}
