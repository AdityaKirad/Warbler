import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { logout } from "~/services/authenticator.server";

export function loader() {
  return redirect("/home");
}

export function action({ request }: ActionFunctionArgs) {
  return logout(request);
}
