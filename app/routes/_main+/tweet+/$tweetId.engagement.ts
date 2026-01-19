import { bookmark, db, like, repost } from "~/.server/drizzle";
import { requireUser } from "~/.server/utils";
import { and, eq } from "drizzle-orm";
import { redirect } from "react-router";
import { safeRedirect } from "remix-utils/safe-redirect";
import type { Route } from "./+types/$tweetId.engagement";

export async function action({
  request,
  params: { tweetId },
}: Route.ActionArgs) {
  const {
    user: { id: userId },
  } = await requireUser(request);

  const formData = await request.formData();

  switch (formData.get("engagement")) {
    case "bookmark":
      await toggleBookmark({ tweetId, userId });
      break;
    case "like":
      await toggleLike({ tweetId, userId });
      break;
    case "repost":
      await toggleRepost({ tweetId, userId });
      break;
    default:
      throw new Response("Invalid engagement", {
        status: 400,
      });
  }

  throw redirect(safeRedirect(formData.get("redirectTo"), "/home"));
}

async function toggleBookmark({
  tweetId,
  userId,
}: {
  tweetId: string;
  userId: string;
}) {
  return db.transaction(async (tx) => {
    const result = await tx
      .delete(bookmark)
      .where(and(eq(bookmark.tweetId, tweetId), eq(bookmark.userId, userId)))
      .returning();

    if (!result.length) {
      await tx.insert(bookmark).values({
        userId,
        tweetId,
      });
    }
  });
}

async function toggleLike({
  tweetId,
  userId,
}: {
  tweetId: string;
  userId: string;
}) {
  return db.transaction(async (tx) => {
    const result = await tx
      .delete(like)
      .where(and(eq(like.tweetId, tweetId), eq(like.userId, userId)))
      .returning();

    if (!result.length) {
      await tx.insert(like).values({
        userId,
        tweetId,
      });
    }
  });
}

async function toggleRepost({
  tweetId,
  userId,
}: {
  tweetId: string;
  userId: string;
}) {
  return db.transaction(async (tx) => {
    const result = await tx
      .delete(repost)
      .where(and(eq(repost.tweetId, tweetId), eq(repost.userId, userId)))
      .returning();

    if (!result.length) {
      await tx.insert(repost).values({
        userId,
        tweetId,
      });
    }
  });
}
