import type { LoaderFunctionArgs } from "@remix-run/node";
import { requireAnonymous } from "~/services/authenticator.server";

export { default } from "~/components/auth-page";

export const meta = () => [
  {
    title: "Happening Now",
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAnonymous(request);
  return null;
}
