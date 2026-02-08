/* eslint-disable @typescript-eslint/no-explicit-any */
import type { JSONContent } from "@tiptap/core";
import { generateText } from "@tiptap/core";
import { generateHTML } from "@tiptap/html";
import { db, tweet } from "~/.server/drizzle";
import { requireUser } from "~/.server/utils";
import { data, redirect } from "react-router";
import { extensions } from "../../../components/tweet-form/extensions";
import type { Route } from "./+types";

type TipTapDoc = {
  type: "doc";
  content: JSONContent[];
};

export async function action({ request }: Route.ActionArgs) {
  const {
    user: { id: userId, profileVerified },
  } = await requireUser(request);

  const formData = await request.formData();
  const tweetRaw = formData.get("tweet");

  if (typeof tweetRaw !== "string") {
    return data("Invalid tweet payload", { status: 400 });
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(tweetRaw as string);
  } catch (error) {
    console.error("Tweet JSON Parse Error: ", error);
    parsed = null;
  }

  let json;

  if (isTiptapDoc(parsed)) {
    json = parsed;
  } else {
    json = textToTipTapDoc(tweetRaw.trim());
  }

  let text: string;

  try {
    text = generateText(json, extensions);
  } catch (error) {
    console.error("Invalid TipTap document: ", error);
    return data("Invalid Tweet format", { status: 400 });
  }

  const charCount = [...text].length;

  if (!charCount) {
    return data("Tweet is empty");
  }

  const maxCharCount = profileVerified ? 1120 : 280;

  if (charCount > maxCharCount) {
    return data("Tweet is too long");
  }

  await db.insert(tweet).values({
    userId,
    text,
    replyToTweetId: formData.get("replyToTweetId")?.toString(),
    bodyJson: json,
    body: generateHTML(json, extensions),
  });

  const referer = request.headers.get("referer");

  throw redirect(referer ?? "/home");
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
