import { cn } from "~/lib/utils";
import { memo } from "react";
import { NavLink } from "react-router";
import type { NavItemProps } from "./nav-links";

export const NavItem = memo(function ({
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
