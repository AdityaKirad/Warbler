import { cn } from "~/lib/utils";
import { NavLink } from "react-router";

export function FeedTab({
  label,
  title,
  to,
}: {
  label: string;
  title: string;
  to: string;
}) {
  return (
    <NavLink
      className={({ isActive }) =>
        cn(
          "hover:bg-muted/50 focus-visible:bg-muted/50 relative flex-1 py-4 text-center font-medium outline-2 outline-transparent transition-[background-color,outline-color] focus-visible:outline-white",
          {
            "after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:rounded-full after:bg-blue-500":
              isActive,
          },
        )
      }
      to={to}
      aria-label={label}>
      {title}
    </NavLink>
  );
}
