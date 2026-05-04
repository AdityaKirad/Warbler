import { db, user, userFollow } from "~/.server/drizzle";
import { requireUser } from "~/.server/utils";
import { and, eq, sql } from "drizzle-orm";
import { redirect } from "react-router";
import type { Route } from "./+types/follow";

export async function action({ request, params }: Route.ActionArgs) {
  const { id } = await requireUser(request, { getFreshSession: true });

  const followingId = sql<string>`
    (
      SELECT ${user.id} 
      FROM ${user} 
      WHERE ${user.username} = ${params.username}
    )
  `;

  await db.transaction(async (tx) => {
    const result = await tx
      .delete(userFollow)
      .where(
        and(
          eq(userFollow.followerId, id),
          eq(userFollow.followingId, followingId),
        ),
      )
      .returning();

    if (!result.length) {
      await tx.insert(userFollow).values({
        followingId,
        followerId: id,
      });
    }
  });

  const referer = request.headers.get("referer");

  throw redirect(referer ?? "/home");
}
