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
import { SearchIcon } from "lucide-react";

export type NavItemProps = {
  title: string;
  to: string | ((username: string) => string);
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  ActiveIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  className?: string;
};

export const links: NavItemProps[] = [
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
