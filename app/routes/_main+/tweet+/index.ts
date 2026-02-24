/* eslint-disable @typescript-eslint/no-explicit-any */
import type { JSONContent } from "@tiptap/core";
import { generateText } from "@tiptap/core";
import { db, tweet } from "~/.server/drizzle";
import { requireUser } from "~/.server/utils";
import type { UNSAFE_DataWithResponseInit as DataWithResponseInit } from "react-router";
import { data } from "react-router";
import { extensions } from "../../../components/tweet-form/extensions";
import type { Route } from "./+types";

type TipTapDoc = {
  type: "doc";
  content: JSONContent[];
};

export async function action({
  request,
}: Route.ActionArgs): Promise<
  DataWithResponseInit<
    | { status: "error"; message: string; value: string }
    | { status: "success"; id: string; value: string }
  >
> {
  const {
    user: { id: userId, profileVerified },
  } = await requireUser(request);

  const formData = await request.formData();

  const id = formData.get("id")?.toString();
  const replyToTweetId = formData.get("replyToTweetId")?.toString();
  const tweetRaw = formData.get("tweet");

  const referer = request.headers.get("referer") ?? "/home";

  if (typeof tweetRaw !== "string") {
    return data(
      {
        status: "error",
        message: "Invalid tweet payload",
        value: "",
      },
      {
        status: 302,
        headers: {
          Location: referer,
        },
      },
    );
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(tweetRaw);
  } catch (error) {
    console.error("Tweet JSON Parse Error: ", error);
    parsed = null;
  }

  let content;

  if (isTiptapDoc(parsed)) {
    content = parsed;
  } else {
    content = textToTipTapDoc(tweetRaw.trim());
  }

  let text: string;

  try {
    text = generateText(content, extensions);
  } catch (error) {
    console.error("Invalid TipTap document: ", error);
    return data(
      { status: "error", message: "Invalid Tweet format", value: tweetRaw },
      {
        status: 302,
        headers: {
          Location: referer,
        },
      },
    );
  }

  const charCount = [...text].length;

  if (!charCount) {
    return data(
      { status: "error", message: "Tweet is empty", value: tweetRaw },
      {
        status: 302,
        headers: {
          Location: referer,
        },
      },
    );
  }

  const maxCharCount = profileVerified ? 1120 : 280;

  if (charCount > maxCharCount) {
    return data(
      { status: "error", message: "Tweet is too long", value: tweetRaw },
      {
        status: 302,
        headers: {
          Location: referer,
        },
      },
    );
  }

  const [createdTweet] = await db
    .insert(tweet)
    .values({
      id,
      userId,
      replyToTweetId,
      text,
      content,
    })
    .returning({ id: tweet.id });

  return data(
    { status: "success", value: "", id: createdTweet?.id as string },
    {
      status: 302,
      headers: {
        Location: referer,
      },
    },
  );
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
