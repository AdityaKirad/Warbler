import { db, follows, user } from "~/.server/drizzle";
import { requireUser } from "~/.server/utils";
import { and, eq, sql } from "drizzle-orm";
import { redirect } from "react-router";
import type { Route } from "./+types/follow";

export async function action({ request, params }: Route.ActionArgs) {
  const {
    user: { id: userId },
  } = await requireUser(request);

  const followingId = sql<string>`(SELECT ${user.id} FROM ${user} WHERE ${user.username} = ${params.username})`;

  await db.transaction(async (tx) => {
    const result = await tx
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, userId),
          eq(follows.followingId, followingId),
        ),
      )
      .returning();

    if (!result.length) {
      await tx.insert(follows).values({
        followingId,
        followerId: userId,
      });
    }
  });

  const referer = request.headers.get("referer");

  throw redirect(referer ?? "/home");
}
