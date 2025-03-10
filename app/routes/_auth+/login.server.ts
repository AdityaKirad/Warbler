import { redirect } from "@remix-run/node";
import { authSessionStorage, sessionKey } from "~/services/session/auth.server";
import { safeRedirect } from "remix-utils/safe-redirect";

export async function handleNewSession({
  redirectTo,
  session,
}: {
  redirectTo?: string | null;
  session: { id: string; expiresAt: Date };
}) {
  const authSession = await authSessionStorage.getSession();
  authSession.set(sessionKey, session.id);
  throw redirect(safeRedirect(redirectTo, "/home"), {
    headers: {
      "set-cookie": await authSessionStorage.commitSession(authSession, {
        expires: session.expiresAt,
      }),
    },
  });
}
