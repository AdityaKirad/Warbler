import { db, tweetInteraction } from "~/.server/drizzle";
import { requireUser } from "~/.server/utils";
import { and, eq } from "drizzle-orm";
import { data } from "react-router";
import type { Route } from "./+types/interaction";

const INTERACTIONS = ["like", "repost", "bookmark"] as const;
type InteractionType = (typeof INTERACTIONS)[number];

export async function action({
  request,
  params: { tweetId },
}: Route.ActionArgs) {
  const { id: userId } = await requireUser(request);

  const formData = await request.formData();
  const interaction = formData.get("interaction")?.toString() ?? "";

  if (!interaction || !isInteraction(interaction)) {
    throw new Response("Invalid interaction", { status: 400 });
  }

  await db.transaction(async (tx) => {
    const result = await tx
      .delete(tweetInteraction)
      .where(
        and(
          eq(tweetInteraction.tweetId, tweetId),
          eq(tweetInteraction.userId, userId),
          eq(tweetInteraction.type, interaction),
        ),
      )
      .returning();

    if (!result.length) {
      await tx.insert(tweetInteraction).values({
        tweetId,
        userId,
        type: interaction,
      });
    }
  });

  return data({ status: "ok" });
}

function isInteraction(interaction: string): interaction is InteractionType {
  return INTERACTIONS.includes(interaction as InteractionType);
}
