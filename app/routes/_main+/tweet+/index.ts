import { generateText } from "@tiptap/core";
import { generateHTML } from "@tiptap/html";
import { db, tweet } from "~/.server/drizzle";
import { requireUser } from "~/.server/utils";
import type { UNSAFE_DataWithResponseInit as DataWithResponseInit } from "react-router";
import { data } from "react-router";
import { extensions } from "../tweet-form/util";
import type { Route } from "./+types";

export async function action({
  request,
}: Route.ActionArgs): Promise<
  DataWithResponseInit<
    { status: "error"; message: string } | { status: "success" }
  >
> {
  const {
    user: { id: userId },
  } = await requireUser(request);

  const formData = await request.formData();

  console.log("Received Form Data: ", Object.fromEntries(formData));

  let tweetJSON;

  try {
    tweetJSON = JSON.parse(formData.get("tweet") as string);
  } catch (error) {
    console.error("Invalid Tweet JSON: ", error);
    return data(
      {
        status: "error",
        message: "Invalid Tweet format",
      },
      { status: 400 },
    );
  }

  console.log("Tweet JSON: ", tweetJSON);

  let charCount: number | undefined;

  try {
    charCount = [...generateText(tweetJSON, extensions)].length;
  } catch (error) {
    console.error("Invalid TipTap Document: ", error);
    return data(
      {
        status: "error",
        message: "Invalid Tweet format",
      },
      { status: 400 },
    );
  }

  if (!charCount) {
    return data({
      status: "error",
      message: "Tweet is empty",
    });
  }

  if (charCount > 280) {
    return data({
      status: "error",
      message: "Tweet is too long",
    });
  }

  await db.insert(tweet).values({
    userId,
    body: generateHTML(tweetJSON, extensions),
    bodyJson: tweetJSON,
  });

  return data({ status: "success" });
}
