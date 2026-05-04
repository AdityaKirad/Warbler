import DefaultProfilePicture from "~/assets/default-profile-picture.png";
import { useUser } from "~/hooks/use-user";
import { getImgSrc } from "~/lib/cloudinary";
import { Link } from "react-router";
import type { UsernameLayoutLoader } from ".";
import { EditProfile } from "./edit-profile";
import { ProfileActions } from "./profile-actions";

export function ProfileHeader({
  user,
}: {
  user: NonNullable<Awaited<ReturnType<UsernameLayoutLoader>>>;
}) {
  const currentUser = useUser();
  return (
    <div className="bg-muted relative h-50">
      {user.coverImage && (
        <Link to="">
          <img
            className="object-fit object-cover object-center"
            src={getImgSrc({
              public_id: user.coverImage.public_id,
              version: user.coverImage.version,
            })}
            alt={`@${user.username}`}
            decoding="async"
            loading="lazy"
          />
        </Link>
      )}
      <div>
        <Link
          className="bg-background absolute -bottom-16 left-4 size-32 rounded-full p-1"
          to="photo">
          <img
            className="rounded-full"
            src={
              user.photo
                ? getImgSrc({
                    public_id: user.photo.public_id,
                    version: user.photo.version,
                  })
                : DefaultProfilePicture
            }
            alt={user.name ?? "User profile"}
            decoding="async"
            loading="lazy"
          />
        </Link>
        {user.id === currentUser?.id ? (
          <EditProfile {...user} />
        ) : (
          <ProfileActions user={user} />
        )}
      </div>
    </div>
  );
}
