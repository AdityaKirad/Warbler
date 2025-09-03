import { db, session } from "~/.server/drizzle";
import { authSessionStorage } from "~/.server/session/auth-session";
import { eq } from "drizzle-orm";
import { redirect } from "react-router";
import type { Route } from "./+types/logout";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const authSession = await authSessionStorage.getSession(
    request.headers.get("cookie"),
  );

  const token = authSession.get("token");

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
      "set-cookie": await authSessionStorage.destroySession(authSession),
    },
  });
};
