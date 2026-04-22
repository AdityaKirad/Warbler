import { getUser } from "~/.server/utils";
import DefaultProfilePicture from "~/assets/default-profile-picture.png";
import { Button } from "~/components/ui/button";
import { useOutsideClick } from "~/hooks/use-outside-click";
import { cld } from "~/lib/utils";
import { XIcon } from "lucide-react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/photo";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);

  if (!user.session) {
    throw new Response("Not Found", {
      status: 400,
      headers: {
        "set-cookie": user.clearSessionHeader,
      },
    });
  }

  return user.session.user;
}

export const meta = ({ loaderData: user }: Route.MetaArgs) => [
  { title: `${user.name} (@${user.username}) / Warbler` },
];

export default function Page({ loaderData: user }: Route.ComponentProps) {
  const navigate = useNavigate();
  const ref = useOutsideClick<HTMLDivElement>(() => navigate(-1));

  return (
    <div className="fixed inset-0 z-10">
      <div className="bg-background/90 fixed inset-0 m-auto" />

      <div ref={ref} className="fixed inset-0 flex items-center justify-center">
        <Button
          className="absolute top-2 left-2 rounded-full"
          variant="ghost"
          size="icon"
          type="button"
          aria-label="Close"
          onClick={() => navigate(-1)}>
          <XIcon />
        </Button>

        <img
          className="rounded-full"
          loading="lazy"
          decoding="async"
          src={
            user.photo
              ? cld
                  .image(user.photo.public_id)
                  .setVersion(user.photo.version)
                  .toURL()
              : DefaultProfilePicture
          }
          alt={`@${user.username}`}
          width={400}
          height={400}
        />
      </div>
    </div>
  );
}
