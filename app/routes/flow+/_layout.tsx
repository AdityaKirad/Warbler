import Logo from "~/assets/logo-small.webp";
import { Button } from "~/components/ui/button";
import { dialogContentClassName } from "~/components/ui/dialog";
import { cn } from "~/lib/utils";
import { XIcon } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router";

export default function Layout() {
  return (
    <div className="bg-muted fixed inset-0">
      <div className={cn(dialogContentClassName, "gap-2 overflow-y-auto")}>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 left-2 rounded-full"
          asChild>
          <Link to="/" aria-label="Close">
            <XIcon />
            <span className="sr-only">Close</span>
          </Link>
        </Button>
        <img
          alt="brand logo"
          className="mx-auto"
          height="64"
          width="64"
          decoding="async"
          loading="lazy"
          src={Logo}
        />
        <Outlet />
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  const location = useLocation();
  return (
    <div>
      <div className="px-2">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <img
            src={Logo}
            alt="App Logo"
            height={80}
            width={80}
            decoding="async"
            loading="lazy"
          />
          <div className="flex gap-2 sm:hidden">
            <Button className="rounded-full" variant="outline" asChild>
              <Link to="/flow/login" aria-label="Log in">
                Log in
              </Link>
            </Button>
            <Button className="rounded-full" asChild>
              <Link to="/flow/signup" aria-label="Sign up">
                Sign up
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-7xl justify-end">
        <div className="flex flex-col items-center gap-4">
          <p className="text-xl font-semibold">
            Something went wrong, but don't fret — it's not your fault.
          </p>
          <Button
            className="rounded-full bg-blue-500/90 text-white hover:bg-blue-500 focus-visible:bg-blue-500"
            asChild>
            <Link to={location} aria-label="Refresh">
              Refresh
            </Link>
          </Button>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 bg-blue-500 p-2 max-sm:hidden">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between max-xl:max-w-4xl max-lg:max-w-2xl">
          <div className="max-md:hidden">
            <p className="text-3xl font-semibold">
              Don't miss what's happening
            </p>
            <p>People on Warbler are the first to know</p>
          </div>
          <div className="flex gap-4 max-md:grow max-md:gap-2">
            <Button className="flex-1 rounded-full" variant="outline" asChild>
              <Link to="/flow/login" aria-label="Log in">
                Log in
              </Link>
            </Button>
            <Button className="flex-1 rounded-full" asChild>
              <Link to="/flow/signup" aria-label="Sign up">
                Sign up
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
