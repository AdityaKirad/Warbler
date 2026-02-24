import { format } from "date-fns";
import {
  BalloonIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  Link2Icon,
  MapPinIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Link } from "react-router";
import type { LayoutLoader } from "./index";

export function ProfileData({
  user,
}: {
  user: NonNullable<Awaited<ReturnType<LayoutLoader>>>;
}) {
  return (
    <>
      <div className="leading-none">
        <h2 className="text-xl font-bold">{user.name}</h2>
        <span className="text-muted-foreground text-sm">@{user.username}</span>
      </div>
      {user.bio && <p>{user.bio}</p>}
      <div className="text-muted-foreground flex flex-wrap gap-2">
        {user.location && (
          <div className="flex items-center gap-1">
            <MapPinIcon height={20} width={20} />
            <span>{user.location}</span>
          </div>
        )}
        {user.website && (
          <a
            className="flex items-center gap-1"
            href={user.website}
            target="_blank"
            rel="noopener noreferrer">
            <Link2Icon height={20} width={20} />
            <span>{user.website}</span>
          </a>
        )}
        {user.dob && (
          <div className="flex items-center gap-1">
            <BalloonIcon height={20} width={20} />
            <span>Born {format(user.dob, "MMMM d, yyyy")}</span>
          </div>
        )}
        {user.createdAt && (
          <Link to="about" className="group flex items-center gap-1">
            <CalendarDaysIcon height={20} width={20} />
            <span className="group-hover:underline group-hover:decoration-1 group-hover:underline-offset-2">
              Joined {format(user.createdAt, "MMMM yyyy")}
            </span>
            <ChevronRightIcon />
          </Link>
        )}
        {user.displayVerifiedEmail && (
          <div className="flex items-center gap-1">
            <ShieldCheckIcon height={20} width={20} />
            <span>Verified email address</span>
          </div>
        )}
      </div>
    </>
  );
}
