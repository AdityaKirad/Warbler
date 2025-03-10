import type { LoaderFunctionArgs } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { requireUserId } from "~/services/authenticator.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  return {};
}

export default function Page() {
  return (
    <div>
      New Page
      <Form method="POST" action="/logout">
        <Button type="submit">Logout</Button>
      </Form>
    </div>
  );
}
