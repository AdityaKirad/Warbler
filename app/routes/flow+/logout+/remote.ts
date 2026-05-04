import { sessionCookie } from "~/.server/cookies/session.js";
import { db, session } from "~/.server/drizzle";
import { requireUser } from "~/.server/utils";
import { and, eq, ne } from "drizzle-orm";
import type { Route } from "./+types/remote.ts";

export async function action({ request }: Route.ActionArgs) {
  const { id } = await requireUser(request, { getFreshSession: true });

  const token = (await sessionCookie.parse(
    request.headers.get("cookie"),
  )) as string;

  await db
    .delete(session)
    .where(and(eq(session.userId, id), ne(session.token, token)));

  return {};
}
