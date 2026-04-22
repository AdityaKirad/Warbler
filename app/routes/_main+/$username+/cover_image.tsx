import { getUser } from "~/.server/utils";
import { Button } from "~/components/ui/button";
import { useOutsideClick } from "~/hooks/use-outside-click";
import { cld } from "~/lib/utils";
import { XIcon } from "lucide-react";
import { useNavigate, useRouteLoaderData } from "react-router";
import type { loader as LayoutLoader } from "./_layout";
import type { Route } from "./+types/cover_image";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);

  if (!user.session) {
    throw new Response("Not Found", { status: 400 });
  }

  return user.session.user;
}

export const meta = ({ loaderData: user }: Route.MetaArgs) => [
  { title: `${user.name} (@${user.username}) / Warbler` },
];

export default function Page() {
  const navigate = useNavigate();
  const ref = useOutsideClick<HTMLDivElement>(() => navigate(-1));
  const data = useRouteLoaderData<typeof LayoutLoader>(
    "routes/_main+/$username+/_layout/index",
  );

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
            data?.photo
              ? cld
                  .image(data.photo.public_id)
                  .setVersion(data.photo.version)
                  .toURL()
              : ""
          }
          alt={`@${data?.username}`}
          width={500}
          height={500}
        />
      </div>
    </div>
  );
}
