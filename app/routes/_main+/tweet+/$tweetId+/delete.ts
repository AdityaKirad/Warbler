import { db, tweet } from "~/.server/drizzle";
import { requireUser } from "~/.server/utils";
import { and, eq } from "drizzle-orm";
import { createCookie, redirect } from "react-router";
import type { Route } from "./+types/delete";

export const deletePostToastCookie = createCookie("__delete_post_toast", {
  httpOnly: true,
  maxAge: 60,
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  secrets: process.env.AUTH_SECRET.split(", "),
});

export async function action({ params, request }: Route.ActionArgs) {
  const {
    user: { id: userId },
  } = await requireUser(request);

  const res = await db
    .delete(tweet)
    .where(and(eq(tweet.id, params.tweetId), eq(tweet.userId, userId)))
    .returning();

  const referer = request.headers.get("referer") ?? "/home";
  const url = new URL(referer, process.env.URL);
  const path = url.pathname + url.search;
  const toastValue = res.length ? "success" : "error";

  throw redirect(path, {
    headers: {
      "set-cookie": await deletePostToastCookie.serialize(toastValue, { path }),
    },
  });
}
