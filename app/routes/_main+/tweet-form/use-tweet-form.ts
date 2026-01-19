import { useEditor } from "@tiptap/react";
import { useIsPending } from "~/hooks/use-is-pending";
import { useUser } from "~/hooks/use-user";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import type { action } from "../tweet+";
import { extensions, MAX_TWEET_LENGTH } from "./util";

export function useTweetForm(onSuccess?: () => void) {
  const { user } = useUser();
  const fetcher = useFetcher<typeof action>();
  const isPending = useIsPending();
  const [charCount, charCountSet] = useState(0);
  const editor = useEditor({
    extensions,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      charCountSet(editor.storage.characterCount.characters());
    },
  });

  const isOverlimit = charCount > MAX_TWEET_LENGTH;

  useEffect(() => {
    if (fetcher.data?.status === "success" && editor) {
      editor.commands.clearContent(true);
      onSuccess?.();
    }
  });
  return {
    charCount,
    editor,
    fetcher,
    isPending,
    isOverlimit,
    user,
  };
}
