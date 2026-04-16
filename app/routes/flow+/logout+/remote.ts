import { db, session } from "~/.server/drizzle";
import { requireUser } from "~/.server/utils";
import { and, eq, ne } from "drizzle-orm";
import type { Route } from "./+types/remote.ts";

export async function action({ request }: Route.ActionArgs) {
  const {
    session: { token },
    user: { id },
  } = await requireUser(request);

  await db
    .delete(session)
    .where(and(eq(session.userId, id), ne(session.token, token)));

  return {};
}
