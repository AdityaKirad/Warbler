import { redirectWithFlash } from "~/.server/authentication";
import { providers } from "~/.server/oauth-providers";
import type { Route } from "./+types";

export async function loader({ request, params }: Route.LoaderArgs) {
  const provider = providers[params.provider];

  if (!provider) {
    return redirectWithFlash({ error: "Invalid Provider" });
  }

  return provider.generateAuth(request);
}
