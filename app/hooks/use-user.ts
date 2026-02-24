import type { loader } from "~/root";
import { useRouteLoaderData } from "react-router";

export function useUser() {
  return useRouteLoaderData<typeof loader>("root")?.user;
}
