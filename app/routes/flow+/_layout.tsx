import LogoSmall from "~/assets/logo-small.webp";
import HomePage from "~/components/auth-homepage";
import { Button } from "~/components/ui/button";
import { useOutsideClick } from "~/hooks/use-outside-click";
import { XIcon } from "lucide-react";
import { Link, Outlet, useNavigate } from "react-router";
import type { Route } from "./+types/_layout";

export const meta: Route.MetaFunction = () => [
  {
    title: "Flow +",
    description: "Flow +",
  },
];

export default function Layout() {
  const navigate = useNavigate();
  const ref = useOutsideClick<HTMLDivElement>(() => navigate("/"));
  return (
    <>
      <HomePage />
      <div>
        <div className="bg-background/80 fixed inset-0 z-20" />
        <div
          className="bg-background fixed top-1/2 left-1/2 z-50 flex w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-2 rounded-lg border px-24 pt-6 pb-12 shadow-lg"
          ref={ref}>
          <img
            alt="brand logo"
            className="mx-auto"
            decoding="async"
            height="64"
            loading="lazy"
            src={LogoSmall}
            width="64"
          />
          <Button
            asChild
            className="absolute top-2 left-2 rounded-full"
            size="icon"
            variant="ghost">
            <Link to="/">
              <XIcon aria-hidden={true} />
              <span className="sr-only">Close</span>
            </Link>
          </Button>
          <Outlet />
        </div>
      </div>
    </>
  );
}
