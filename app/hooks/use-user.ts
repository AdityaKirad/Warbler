import type { loader } from "~/root";
import { useRouteLoaderData } from "react-router";

export function useUser() {
  return useRouteLoaderData<typeof loader>("root")?.user;
}

export function useRequiredUser() {
  const user = useUser();

  if (!user) {
    throw new Error("User is not logged in");
  }
  return user;
}
