import type { UserSelectType } from "~/.server/drizzle";
import DefaultProfilePicture from "~/assets/default-profile-picture.png";
import Logo from "~/assets/logo-small.webp";
import { DialogTweetForm } from "~/components/dialog-tweet-form";
import {
  BookmarkOutlinedIcon,
  BookmarkSolidIcon,
  HomeOutlinedIcon,
  HomeSolidIcon,
  MessageOutlinedIcon,
  MessageSolidIcon,
  NotificationOutlinedIcon,
  NotificationSolidIcon,
  SettingsOutlinedIcon,
  SettingsSolidIcon,
  UserOutlinedIcon,
  UserSolidIcon,
} from "~/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  dialogContentClassName,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useUser } from "~/hooks/use-user";
import { cn, getNameInitials } from "~/lib/utils";
import {
  getNextOnboardingStep,
  hasStepsAfterCurrent,
  type OnboardingStep,
} from "~/routes/_main+/onboarding/config";
import { MoreHorizontalIcon, SearchIcon } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { data, NavLink, Outlet } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/_layout";
import { DOB, ProfilePhoto, Username } from "./onboarding/forms";
import { deletePostToastCookie } from "./tweet+/$tweetId+/delete";

type NavItemProps = {
  title: string;
  to: string | ((username: string) => string);
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  ActiveIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  className?: string;
};

const links: NavItemProps[] = [
  {
    to: "/home",
    title: "Home",
    Icon: HomeOutlinedIcon,
    ActiveIcon: HomeSolidIcon,
  },
  {
    to: "/explore",
    title: "Explore",
    Icon: SearchIcon,
    ActiveIcon: SearchIcon,
  },
  {
    to: "/notifications",
    title: "Notifications",
    Icon: NotificationOutlinedIcon,
    ActiveIcon: NotificationSolidIcon,
  },
  {
    to: "/chat",
    title: "Chat",
    Icon: MessageOutlinedIcon,
    ActiveIcon: MessageSolidIcon,
  },
  {
    to: (username) => `/${username}`,
    title: "Profile",
    Icon: UserOutlinedIcon,
    ActiveIcon: UserSolidIcon,
    className: "max-[30rem]:hidden",
  },
  {
    to: `/bookmarks`,
    title: "Bookmarks",
    Icon: BookmarkOutlinedIcon,
    ActiveIcon: BookmarkSolidIcon,
    className: "max-[30rem]:hidden",
  },
  {
    to: "/settings",
    title: "Settings",
    Icon: SettingsOutlinedIcon,
    ActiveIcon: SettingsSolidIcon,
    className: "max-[30rem]:hidden",
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  const toastValue = await deletePostToastCookie.parse(
    request.headers.get("cookie"),
  );
  return data(
    { toastValue },
    {
      headers: toastValue
        ? {
            "set-cookie": await deletePostToastCookie.serialize("", {
              maxAge: -1,
            }),
          }
        : {},
    },
  );
}

export default function Layout({ loaderData }: Route.ComponentProps) {
  const user = useUser()?.user;
  const onboardingStep = getNextOnboardingStep(user?.onboardingStepsCompleted);
  const hasNextStep = hasStepsAfterCurrent(user?.onboardingStepsCompleted);
  useEffect(() => {
    if (!loaderData?.toastValue) {
      return;
    }

    if (loaderData.toastValue === "success") {
      toast("Your post was deleted");
    } else {
      toast.error("Something went wrong. Please try again.");
    }
  }, [loaderData?.toastValue]);
  return (
    <div className="flex h-full">
      <div className="basis flex shrink-0 grow flex-col items-end">
        <div className="transition-[width] min-[30rem]:w-20 xl:w-70">
          <nav className="fixed bottom-0 flex gap-2 p-2 transition-[width] max-xl:items-center max-[30rem]:inset-x-0 max-[30rem]:justify-between max-[30rem]:border-t min-[30rem]:top-0 min-[30rem]:w-20 min-[30rem]:flex-col xl:w-70">
            <NavLink
              className="hover:bg-muted inline size-14 rounded-full outline-2 outline-transparent transition-[colors,outline] focus-visible:outline-white max-[30rem]:hidden"
              to="/home"
              aria-label="Home">
              <img
                src={Logo}
                alt="App Logo"
                width={56}
                height={56}
                decoding="async"
                loading="lazy"
              />
            </NavLink>

            {user
              ? links.map(({ title, to, ...props }) => (
                  <NavItem
                    key={title}
                    to={typeof to === "function" ? to(user.username) : to}
                    title={title}
                    {...props}
                  />
                ))
              : null}

            {user && (
              <>
                <PostTweetDialog />
                <UserDropdown user={user} />
              </>
            )}
          </nav>
        </div>
      </div>
      <div className="flex h-full shrink grow flex-col">
        <div className="mobile:w-150 tablet:w-225 size-full transition-[width] lg:w-250">
          {onboardingStep ? (
            <div className="bg-muted/60 fixed inset-0">
              <div className={dialogContentClassName}>
                <img
                  className="mx-auto"
                  src={Logo}
                  alt="App Logo"
                  decoding="async"
                  loading="lazy"
                  width={56}
                  height={56}
                />
                <OnboardingStep
                  step={onboardingStep}
                  hasNextStep={hasNextStep}
                />
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </div>
    </div>
  );
}

function OnboardingStep({
  step,
  hasNextStep,
}: {
  hasNextStep: boolean;
  step: OnboardingStep;
}) {
  switch (step?.id) {
    case "dob":
      return <DOB hasNextStep={hasNextStep} {...step} />;
    case "profile-photo":
      return <ProfilePhoto hasNextStep={hasNextStep} {...step} />;
    case "verify-email":
      return null;
    case "username":
      return <Username hasNextStep={hasNextStep} {...step} />;
  }
}

function UserDropdown({ user }: { user: UserSelectType }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="mt-auto h-auto rounded-full p-2 max-[30rem]:hidden"
          variant="ghost">
          <Avatar>
            <AvatarImage
              src={user.photo ?? DefaultProfilePicture}
              alt={user.username}
              loading="lazy"
              decoding="async"
            />
            <AvatarFallback>{getNameInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="text-left max-xl:hidden">
            <p className="font-medium">{user.name}</p>
            <p className="text-muted-foreground text-sm">@{user.username}</p>
          </div>
          <MoreHorizontalIcon className="ml-auto max-xl:hidden" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="py-4 xl:w-(--radix-dropdown-menu-trigger-width)">
        <DropdownMenuItem className="text-base font-medium">
          Add an existing account
        </DropdownMenuItem>
        <DropdownMenuItem className="text-base font-medium" asChild>
          <a href="/flow/logout" aria-label="Log out">
            Log out @{user.username}
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PostTweetDialog() {
  const [dialog, dialogSet] = useState(false);
  return (
    <Dialog open={dialog} onOpenChange={dialogSet}>
      <DialogTrigger asChild>
        <Button className="rounded-full max-xl:size-14 max-[30rem]:hidden [&_svg]:size-6">
          <svg
            viewBox="0 0 24 24"
            className="xl:hidden"
            height={24}
            width={24}
            aria-hidden>
            <g>
              <path d="M23 3c-6.62-.1-10.38 2.421-13.05 6.03C7.29 12.61 6 17.331 6 22h2c0-1.007.07-2.012.19-3H12c4.1 0 7.48-3.082 7.94-7.054C22.79 10.147 23.17 6.359 23 3zm-7 8h-1.5v2H16c.63-.016 1.2-.08 1.72-.188C16.95 15.24 14.68 17 12 17H8.55c.57-2.512 1.57-4.851 3-6.78 2.16-2.912 5.29-4.911 9.45-5.187C20.95 8.079 19.9 11 16 11zM4 9V6H1V4h3V1h2v3h3v2H6v3H4z"></path>
            </g>
          </svg>
          <span className="max-xl:hidden">Post</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="h-fit px-4 pt-12 pb-4">
        <DialogTweetForm
          onError={() => dialogSet(false)}
          onSuccess={() => dialogSet(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

const NavItem = memo(function ({
  title,
  to,
  Icon,
  ActiveIcon,
  className,
}: Omit<NavItemProps, "to"> & { to: string }) {
  return (
    <NavLink
      className={cn("group outline-none", className)}
      to={to}
      aria-label={title}>
      {({ isActive }) => {
        const IconComponent = isActive ? ActiveIcon : Icon;
        return (
          <div className="not-[:where(.group):focus-visible_*]:group-hover:bg-muted inline-flex items-center gap-4 rounded-full p-3 outline-2 outline-transparent transition-[colors,outline] group-focus-visible:outline-white">
            <IconComponent />
            <span
              className={cn(
                { "font-medium": isActive },
                "text-xl max-xl:hidden",
              )}>
              {title}
            </span>
          </div>
        );
      }}
    </NavLink>
  );
});

NavItem.displayName = "NavItem";
