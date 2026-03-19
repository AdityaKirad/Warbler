/* eslint-disable @typescript-eslint/no-explicit-any */
import type { JSONContent } from "@tiptap/core";
import { generateText } from "@tiptap/core";
import { db, tweet } from "~/.server/drizzle";
import { requireUser } from "~/.server/utils";
import { extensions } from "../../../components/tweet-form/extensions";
import type { Route } from "./+types";

type TipTapDoc = {
  type: "doc";
  content: JSONContent[];
};

export async function action({
  request,
}: Route.ActionArgs): Promise<
  | { status: "error"; message: string; value: string }
  | { status: "success"; id: string; value: string }
> {
  const {
    user: { id: userId, profileVerified },
  } = await requireUser(request);

  const formData = await request.formData();

  const replyToTweetId = formData.get("replyToTweetId")?.toString();
  const tweetRaw = formData.get("tweet");

  if (typeof tweetRaw !== "string") {
    return {
      status: "error",
      message: "Invalid tweet payload",
      value: "",
    };
  }

  const parsed = validateTweet({ profileVerified, tweet: tweetRaw });

  if (parsed.status === "error") {
    return parsed;
  }

  const [createdTweet] = await db
    .insert(tweet)
    .values({
      userId,
      replyToTweetId,
      ...parsed,
    })
    .returning({ id: tweet.id });

  if (!createdTweet) {
    return {
      status: "error",
      message: "Failed to create tweet",
      value: tweetRaw,
    };
  }

  return { status: "success", id: createdTweet.id, value: "" };
}

export function validateTweet({
  tweet,
  profileVerified,
}: {
  tweet: string;
  profileVerified: boolean;
}):
  | { status: "error"; message: string; value: string }
  | {
      status: "success";
      content: { type: "doc"; content: JSONContent[] };
      text: string;
    } {
  let parsed: unknown;

  try {
    parsed = JSON.parse(tweet);
  } catch (error) {
    console.error("Tweet JSON Parse Error: ", error);
    parsed = null;
  }

  let content;

  if (isTiptapDoc(parsed)) {
    content = parsed;
  } else {
    content = textToTipTapDoc(tweet?.trim());
  }

  let text: string;

  try {
    text = generateText(content, extensions);
  } catch (error) {
    console.error("Invalid TipTap document: ", error);
    return { status: "error", message: "Invalid Tweet format", value: tweet };
  }

  const charCount = [...text].length;

  if (!charCount) {
    return { status: "error", message: "Tweet is empty", value: tweet };
  }

  const maxCharCount = profileVerified ? 1120 : 280;

  if (charCount > maxCharCount) {
    return { status: "error", message: "Tweet is too long", value: tweet };
  }

  return { status: "success", content, text };
}

function isTiptapDoc(value: unknown): value is TipTapDoc {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as any).type === "doc" &&
    Array.isArray((value as any).content)
  );
}

function textToTipTapDoc(text: string): TipTapDoc {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text,
          },
        ],
      },
    ],
  };
}
