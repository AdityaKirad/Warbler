import {
  createMultiSessionCookie,
  sessionCookie,
} from "~/.server/cookies/session";
import type { SessionSelectType, UserSelectType } from "~/.server/drizzle";
import { redirect } from "react-router";
import { safeRedirect } from "remix-utils/safe-redirect";

export async function handleNewSession({
  headers,
  redirectTo,
  session,
  user: _user,
}: {
  headers?: HeadersInit;
  redirectTo?: string | null;
  session: SessionSelectType;
  user: UserSelectType;
}) {
  const multiSessionTokenCookie = createMultiSessionCookie(session.token);

  headers = new Headers(headers);

  headers.append(
    "set-cookie",
    await sessionCookie.serialize(session.token, {
      expires: session.expiresAt,
    }),
  );
  headers.append(
    "set-cookie",
    await multiSessionTokenCookie.serialize(session.token, {
      expires: session.expiresAt,
    }),
  );

  throw redirect(safeRedirect(redirectTo, "/home"), {
    headers,
  });
}
