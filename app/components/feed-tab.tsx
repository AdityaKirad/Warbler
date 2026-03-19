import { cn } from "~/lib/utils";
import { memo } from "react";
import { NavLink } from "react-router";

export const FeedTab = memo(function FeedTab({
  label,
  title,
  to,
}: {
  label?: string;
  title: string;
  to: string;
}) {
  return (
    <NavLink
      className="hover:bg-muted/50 focus-visible:bg-muted/50 flex-1 py-4 text-center outline-2 outline-transparent transition-[background-color,outline-color] focus-visible:outline-white"
      to={to}
      aria-label={label}
      end>
      {({ isActive }) => (
        <span
          className={cn("relative px-2 font-medium", {
            "after:absolute after:inset-x-0 after:-bottom-4 after:h-1 after:rounded-full after:bg-blue-500":
              isActive,
          })}>
          {title}
        </span>
      )}
    </NavLink>
  );
});
