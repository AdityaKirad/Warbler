import type { MentionOptions } from "@tiptap/extension-mention";
import { ReactRenderer } from "@tiptap/react";
import type {
  SuggestionKeyDownProps,
  SuggestionProps,
} from "@tiptap/suggestion";
import type { UserSelectType } from "~/.server/drizzle";
import { MentionList } from "./mention-list";

export type MentionUser = Pick<
  UserSelectType,
  "id" | "name" | "username" | "photo"
>;

export interface MentionSelected {
  id: string | null;
  label?: string | null;
}

export interface MentionListRef {
  onKeyDown(props: SuggestionKeyDownProps): boolean;
}

function applyMentionListStyles(
  element: HTMLElement,
  editorContainer: HTMLElement,
) {
  const style = editorContainer.style;
  if (style.position === "" || style.position === "static") {
    editorContainer.style.position = "relative";
  }
  element.style.position = "absolute";
  element.style.left = "0px";
  element.style.top = "1.5rem";
  element.style.width = "17.5rem";
  element.style.height = "15rem";
}

export const suggestion: Omit<
  MentionOptions<MentionUser, MentionSelected>["suggestion"],
  "editor"
> = {
  decorationClass: "text-blue-500",
  decorationEmptyClass: "text-foreground",
  // items({ query }: { query: string }): Promise<MentionUser[]> {
  //   if (!query) {
  //     return Promise.resolve([]);
  //   }
  //   return Promise.resolve([]);
  // },
  render: () => {
    let component: ReactRenderer<
      MentionListRef,
      SuggestionProps<MentionUser, MentionSelected> & {
        onNoResults?: () => void;
      }
    >;

    return {
      onStart: (props: SuggestionProps<MentionUser, MentionSelected>) => {
        component = new ReactRenderer(MentionList, {
          props: {
            ...props,
            onNoResults: () => {
              component.destroy();
            },
          },
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        const editorContainer =
          props.editor.view.dom.parentElement ?? document.body;
        editorContainer.appendChild(component.element);
        applyMentionListStyles(component.element, editorContainer);

        if (!props.query) {
          component.element.style.display = "none";
        } else {
          component.element.style.display = "";
        }
      },

      onUpdate(props: SuggestionProps<MentionUser, MentionSelected>) {
        component.updateProps({
          ...props,
          onNoResults: () => {
            component.destroy();
          },
        });

        if (!props.clientRect) {
          return;
        }

        if (props.query) {
          component.element.style.display = "";
        } else {
          component.element.style.display = "none";
        }
      },

      onKeyDown(props: SuggestionKeyDownProps) {
        if (props.event.key === "Escape") {
          component.destroy();

          return true;
        }

        return component.ref?.onKeyDown(props) ?? false;
      },

      onExit() {
        component.destroy();
      },
    };
  },
};
