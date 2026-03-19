import { useEditor, useEditorState } from "@tiptap/react";
import { useIsPending } from "~/hooks/use-is-pending";
import { useRequiredUser } from "~/hooks/use-user";
import type { action } from "~/routes/_main+/tweet+";
import { useEffect } from "react";
import { Link, useFetcher } from "react-router";
import { toast } from "sonner";
import { CharacterCountWithOverflow } from "./character-count-with-overflow";
import { extensions } from "./extensions";

export const NEW_TWEET_FETCHER_KEY = "new-tweet";

export function useTweetForm({
  onSuccess,
  onError,
  replyToTweetId,
}: Partial<{
  replyToTweetId: string;
  onSuccess: () => void;
  onError: () => void;
}> = {}) {
  const fetcher = useFetcher<typeof action>({ key: NEW_TWEET_FETCHER_KEY });
  const isPending = useIsPending();
  const { user } = useRequiredUser();

  const maxCharCount = user.profileVerified ? 1120 : 280;
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      CharacterCountWithOverflow.configure({
        limit: maxCharCount,
        overflowClass: "bg-red-900",
      }),
      ...extensions,
    ],
    editorProps: {
      attributes: {
        class: "outline-none",
      },
    },
  });

  const state = useEditorState({
    editor,
    selector: (context) => ({
      charCount:
        context.editor?.storage.characterCountWithOverflow.characters(),
    }),
  });

  const charCount = state?.charCount ?? 0;
  const isOverLimit = charCount > maxCharCount;

  useEffect(() => {
    const { data, state } = fetcher;

    console.table({ data, state });

    if (state !== "idle" || !data) {
      return;
    }

    if (data.status === "error") {
      toast(data.message);
      onError?.();
      return;
    }

    if (data.status === "success" && editor) {
      onSuccess?.();
      editor.commands.clearContent(true);
      toast(
        <div>
          Your post was sent.{" "}
          <Link to={`/${user?.username}/status/${data.id}`}>View</Link>
        </div>,
      );
    }
  }, [editor, fetcher, onSuccess, onError, user?.username]);

  function handleSubmit(evt: React.FormEvent<HTMLFormElement>) {
    evt.preventDefault();

    if (!charCount || isOverLimit || isPending) {
      return;
    }

    const formData = new FormData();
    if (replyToTweetId) {
      formData.set("replyToTweetId", replyToTweetId);
    }
    formData.set("tweet", JSON.stringify(editor?.getJSON()));
    fetcher.submit(formData, { method: "POST", action: "/tweet" });
  }

  return {
    defaultValue: fetcher.data?.value,
    isOverLimit,
    isPending,
    charCount,
    maxCharCount,
    editor,
    fetcher,
    user,
    handleSubmit,
  };
}
