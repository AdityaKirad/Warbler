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
} from "~/routes/_main+/onboarding/config";
import { MoreHorizontalIcon, SearchIcon } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import { DOB, ProfilePhoto, Username } from "./onboarding/forms";

type NavItemProps = {
  title: string;
  to: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  ActiveIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

export default function Layout() {
  const { user } = useUser();
  const onboardingStep = getNextOnboardingStep(user.onboardingStepsCompleted);
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
      to: `/${user.username}`,
      title: "Profile",
      Icon: UserOutlinedIcon,
      ActiveIcon: UserSolidIcon,
    },
    {
      to: `/bookmarks`,
      title: "Bookmarks",
      Icon: BookmarkOutlinedIcon,
      ActiveIcon: BookmarkSolidIcon,
    },
    {
      to: "/settings",
      title: "Settings",
      Icon: SettingsOutlinedIcon,
      ActiveIcon: SettingsSolidIcon,
    },
  ];
  return (
    <div className="flex h-full">
      <div className="basis flex shrink-0 grow flex-col items-end">
        <div className="w-70">
          <nav className="fixed inset-y-0 flex w-70 flex-col gap-2 border-r p-2">
            <NavLink
              className="hover:bg-muted inline size-14 rounded-full outline-2 outline-transparent transition-[colors,outline] focus-visible:outline-white"
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

            {links.map((link) => (
              <NavItem key={link.title} {...link} />
            ))}

            <PostTweetDialog />

            <UserDropdown />
          </nav>
        </div>
      </div>
      <div className="flex h-full shrink grow flex-col">
        <main className="h-full w-250">
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
                <OnboardingStep />
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}

function OnboardingStep() {
  const { user } = useUser();
  const onboardingStep = getNextOnboardingStep(user.onboardingStepsCompleted);
  const hasNextStep = hasStepsAfterCurrent(user.onboardingStepsCompleted);
  switch (onboardingStep?.id) {
    case "dob":
      return <DOB {...onboardingStep} hasNextStep={hasNextStep} />;
    case "profile-photo":
      return <ProfilePhoto {...onboardingStep} hasNextStep={hasNextStep} />;
    case "verify-email":
      break;
    case "username":
      return <Username {...onboardingStep} hasNextStep={hasNextStep} />;
  }
}

function UserDropdown() {
  const { user } = useUser();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="mt-auto h-auto rounded-full p-2" variant="ghost">
          <Avatar>
            <AvatarImage
              src={user.photo ?? DefaultProfilePicture}
              alt={user.username}
              loading="lazy"
              decoding="async"
            />
            <AvatarFallback>{getNameInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="font-medium">{user.name}</p>
            <p className="text-muted-foreground text-sm">@{user.username}</p>
          </div>
          <MoreHorizontalIcon className="ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) py-4">
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
        <Button className="rounded-full">Post</Button>
      </DialogTrigger>
      <DialogContent className="h-fit px-4 pt-12 pb-4">
        <DialogTweetForm onSuccess={() => dialogSet(false)} />
      </DialogContent>
    </Dialog>
  );
}

function NavItem({ title, to, Icon, ActiveIcon }: NavItemProps) {
  return (
    <NavLink className="group outline-none" to={to} aria-label={title}>
      {({ isActive }) => {
        const IconComponent = isActive ? ActiveIcon : Icon;
        return (
          <div className="not-[:where(.group):focus-visible_*]:group-hover:bg-muted inline-flex items-center gap-4 rounded-full p-3 outline-2 outline-transparent transition-[colors,outline] group-focus-visible:outline-white">
            <IconComponent />
            <span className={cn({ "font-medium": isActive }, "text-xl")}>
              {title}
            </span>
          </div>
        );
      }}
    </NavLink>
  );
}
