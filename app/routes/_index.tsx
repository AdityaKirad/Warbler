import { requireAnonymous } from "~/.server/authenticator";
import type { Route } from "./+types/_index";

export { default } from "~/components/auth-homepage";

export const meta = () => [
  {
    title: "Happening Now",
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  await requireAnonymous(request);
  return null;
}
