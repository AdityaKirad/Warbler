import type { loader } from "~/root";
import { useRouteLoaderData } from "react-router";

export function useUser() {
  const data = useRouteLoaderData<typeof loader>("root");

  if (!data?.user) {
    throw new Error("User not found");
  }

  return data.user;
}
