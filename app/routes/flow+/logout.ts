import { sessionCookie } from "~/.server/cookies/session";
import { db, session } from "~/.server/drizzle";
import { eq } from "drizzle-orm";
import { redirect } from "react-router";
import type { Route } from "./+types/logout";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const token = await sessionCookie.parse(request.headers.get("cookie"));

  if (token) {
    db.delete(session)
      .where(eq(session.token, token))
      .catch(() => {});
  }

  const url = new URL(request.url);

  const redirectTo = url.searchParams.get("redirectTo");

  const redirectURL = redirectTo
    ? `/flow/login?redirectTo=${encodeURIComponent(redirectTo)}`
    : "/flow/login";

  throw redirect(redirectURL, {
    headers: {
      "set-cookie": await sessionCookie.serialize(null, { maxAge: -1 }),
    },
  });
};
