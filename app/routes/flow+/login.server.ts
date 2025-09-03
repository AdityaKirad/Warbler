import type { SessionSelectType } from "~/.server/drizzle";
import { authSessionStorage } from "~/.server/session/auth-session";
import { redirect } from "react-router";
import { safeRedirect } from "remix-utils/safe-redirect";

export async function handleNewSession({
  headers,
  session,
  redirectTo,
}: {
  headers?: HeadersInit;
  session: Pick<SessionSelectType, "token" | "expiresAt">;
  redirectTo?: string | null;
}) {
  const authSession = await authSessionStorage.getSession();

  authSession.set("token", session.token);

  headers = new Headers(headers);

  headers.append(
    "set-cookie",
    await authSessionStorage.commitSession(authSession, {
      expires: session.expiresAt,
    }),
  );

  throw redirect(safeRedirect(redirectTo, "/home"), {
    headers,
  });
}
