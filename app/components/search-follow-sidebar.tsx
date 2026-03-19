import DefaultProfilePicture from "~/assets/default-profile-picture.png";
import { cn, getNameInitials } from "~/lib/utils";
import type { loader } from "~/routes/_main+/explore";
import { SearchIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Link, useFetcher } from "react-router";
import { DiscordLogin, GoogleLogin } from "./social-login";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";

function SidebarShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-tablet:hidden relative mr-4 w-64 pt-4 transition-[width] lg:mr-12 lg:w-80">
      {children}
    </div>
  );
}

export function SearchFollowSidebar() {
  const fetcher = useFetcher<typeof loader>();
  const listboxRef = useRef<HTMLUListElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const results = fetcher.data ?? [];

  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const prevResultsRef = useRef(fetcher.data);
  if (prevResultsRef.current !== fetcher.data) {
    prevResultsRef.current = fetcher.data;
    setHighlightedIndex(-1);
  }

  function getOptionAt(idx: number): HTMLElement | null {
    if (!listboxRef.current) {
      return null;
    }

    const options =
      listboxRef.current.querySelectorAll<HTMLElement>("[role='option']");

    return options[idx] ?? null;
  }

  function onKeyDown(evt: React.KeyboardEvent<HTMLInputElement>) {
    if (!results.length) {
      return;
    }

    switch (evt.key) {
      case "ArrowDown": {
        evt.preventDefault();
        setHighlightedIndex((prev) =>
          prev < 0 ? 0 : (prev + 1) % results.length,
        );
        break;
      }
      case "ArrowUp": {
        evt.preventDefault();
        setHighlightedIndex((prev) =>
          prev < 0
            ? results.length - 1
            : (prev - 1 + results.length) % results.length,
        );
        break;
      }
      case "Enter": {
        if (highlightedIndex >= 0 && highlightedIndex < results.length) {
          evt.preventDefault();
          getOptionAt(highlightedIndex)?.click();
        }
        break;
      }
      case "Escape": {
        setHighlightedIndex(-1);
        break;
      }
    }
  }

  function onChange(evt: React.ChangeEvent<HTMLInputElement>) {
    const value = evt.target.value.trim();

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value) {
      fetcher.load("/explore");
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetcher.load(`/explore?query=${encodeURIComponent(value)}`);
    }, 250);
  }

  return (
    <SidebarShell>
      <fetcher.Form
        className="relative flex h-10 items-center"
        method="GET"
        action="/explore"
        role="search">
        <SearchIcon className="ml-2 size-4 stroke-current/50" aria-hidden />
        <input
          className="outline-border absolute inset-0 rounded-full pr-2 pl-8 outline-2 transition-colors focus-visible:caret-blue-500 focus-visible:outline-blue-500"
          type="text"
          placeholder="Search"
          name="query"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls="search-results"
          aria-autocomplete="list"
          aria-activedescendant={
            highlightedIndex >= 0 && results[highlightedIndex]
              ? `search-result-${results[highlightedIndex].id}`
              : undefined
          }
          onKeyDown={onKeyDown}
          onChange={onChange}
        />
      </fetcher.Form>

      {results.length > 0 && (
        <ul
          id="search-results"
          ref={listboxRef}
          role="listbox"
          aria-label="Search results"
          className="absolute inset-x-0 top-16 rounded-lg border py-2">
          {results.map((data, idx) => {
            const isActive = idx === highlightedIndex;
            return (
              <li key={data.id} role="presentation">
                <Link
                  id={`search-result-${data.id}`}
                  to={`/${data.username}`}
                  role="option"
                  aria-selected={isActive}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 transition-colors",
                    { "bg-muted": isActive },
                  )}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onMouseLeave={() => setHighlightedIndex(-1)}>
                  <Avatar>
                    <AvatarImage
                      src={data.photo ?? DefaultProfilePicture}
                      alt={data.username}
                      loading="lazy"
                      decoding="async"
                    />
                    <AvatarFallback>
                      {getNameInitials(data.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="leading-none">
                    <p className="font-medium">{data.name}</p>
                    <span className="text-muted-foreground">
                      @{data.username}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </SidebarShell>
  );
}

export function NonAuthenticatedSidebar() {
  return (
    <SidebarShell>
      <div className="flex flex-col gap-3 rounded-lg border p-3">
        <h3 className="text-lg font-bold">New to Warbler?</h3>
        <p className="text-muted-foreground text-sm">
          Sign up now to get your own timeline!
        </p>
        <GoogleLogin />
        <DiscordLogin />
        <Button className="rounded-full" asChild>
          <Link to="/flow/signup">Create Account</Link>
        </Button>
      </div>
    </SidebarShell>
  );
}
