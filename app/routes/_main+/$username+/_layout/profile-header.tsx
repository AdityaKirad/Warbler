import DefaultProfilePicture from "~/assets/default-profile-picture.png";
import { useUser } from "~/hooks/use-user";
import { Link } from "react-router";
import { EditProfile } from "./edit-profile";
import type { LayoutLoader } from "./index";
import { ProfileActions } from "./profile-actions";

export function ProfileHeader({
  user,
}: {
  user: NonNullable<Awaited<ReturnType<LayoutLoader>>>;
}) {
  const currentUser = useUser();
  return (
    <div className="relative [--header-height:12.5rem]">
      {user.coverImage ? (
        <Link to="cover_image"></Link>
      ) : (
        <div className="bg-muted h-(--header-height)" />
      )}
      <div>
        <Link
          className="bg-background absolute top-[calc(var(--header-height)-var(--photo-size)/2)] left-4 rounded-full p-1 [--photo-size:7.5rem]"
          to="about">
          <img
            className="size-(--photo-size) rounded-full"
            src={user.photo ?? DefaultProfilePicture}
            alt={user.name ?? "User profile"}
            decoding="async"
            loading="lazy"
          />
        </Link>
        {user.id === currentUser?.user.id ? (
          <EditProfile user={user} />
        ) : (
          <ProfileActions user={user} />
        )}
      </div>
    </div>
  );
}
