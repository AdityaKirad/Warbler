import { useEditor } from "@tiptap/react";
import { useIsPending } from "~/hooks/use-is-pending";
import { useUser } from "~/hooks/use-user";
import type { action } from "~/routes/_main+/tweet+";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import { CharacterCountWithOverflow } from "./character-count-with-overflow";
import { extensions } from "./extensions";

export function useTweetForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const fetcher = useFetcher<typeof action>();
  const isPending = useIsPending();
  const { user } = useUser();
  const [charCount, charCountSet] = useState(0);
  const maxCharCount = user?.profileVerified ? 1120 : 280;
  const editor = useEditor({
    extensions: [
      CharacterCountWithOverflow.configure({
        limit: maxCharCount,
        overflowClass: "bg-red-900",
      }),
      ...extensions,
    ],
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      charCountSet(editor.storage.characterCountWithOverflow.characters());
    },
  });

  useEffect(() => {
    if (fetcher.state !== "idle") {
      return;
    }

    if (typeof fetcher.data === "string") {
      toast(fetcher.data);
      fetcher.reset();
      return;
    }

    if (fetcher.data === undefined && editor) {
      editor.commands.clearContent(true);
      onSuccess?.();
      fetcher.reset();
    }
  });
  return {
    isOverlimit: charCount > maxCharCount,
    isPending,
    charCount,
    maxCharCount,
    editor,
    fetcher,
    user,
  };
}
