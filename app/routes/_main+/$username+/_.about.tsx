import { getUser } from "~/.server/utils/session.js";
import type { Route } from "./+types/_.about";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);

  if (!user.session) {
    throw new Response("Not Found", { status: 400 });
  }

  return user;
}

export const meta = () => [{ title: "About your account / Warbler" }];

export default function Page() {
  return <></>;
}
