import { db, follows } from "~/.server/drizzle";
import { requireUser } from "~/.server/utils";
import { and, eq } from "drizzle-orm";
import { redirect } from "react-router";
import { safeRedirect } from "remix-utils/safe-redirect";
import type { Route } from "./+types/follow";

export async function action({ request, params }: Route.ActionArgs) {
  const {
    user: { id: userId },
  } = await requireUser(request);

  const formData = await request.formData();
  const followingId = formData.get("id") as string;

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

  throw redirect(
    safeRedirect(formData.get("redirectTo"), `/${params.username}`),
  );
}
