import { Document } from "@tiptap/extension-document";
import { HardBreak } from "@tiptap/extension-hard-break";
import { History } from "@tiptap/extension-history";
import { Link } from "@tiptap/extension-link";
import { Mention } from "@tiptap/extension-mention";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Text } from "@tiptap/extension-text";
import type { Node as PMNode } from "@tiptap/pm/model";
import { mergeAttributes } from "@tiptap/react";
import { suggestion } from "./suggestion";

const MentionWithBackspace = Mention.extend({
  addKeyboardShortcuts() {
    return {
      Backspace: () => {
        const { state } = this.editor;
        const { selection } = state;
        const { empty, anchor } = selection;
        if (!empty) return false;

        let mentionNode: PMNode | null = null;
        let mentionPos = 0;
        state.doc.nodesBetween(anchor - 1, anchor, (node, pos) => {
          if (node.type.name === this.name) {
            mentionNode = node as PMNode;
            mentionPos = pos;
            return false;
          }
        });
        if (!mentionNode) return false;
        const node = mentionNode as PMNode;

        const attrs = node.attrs as {
          mentionSuggestionChar?: string;
          label?: string | null;
          id?: string | null;
        };
        const char = attrs.mentionSuggestionChar ?? "@";
        const label = attrs.label ?? attrs.id ?? "";
        const textWithoutTrigger = String(label).replace(/^@/, "");
        const afterBackspace = textWithoutTrigger.slice(0, -1);
        const newText = afterBackspace ? char + afterBackspace : char;

        return this.editor
          .chain()
          .focus()
          .deleteRange({ from: mentionPos, to: mentionPos + node.nodeSize })
          .insertContentAt(mentionPos, { type: "text", text: newText })
          .run();
      },
    };
  },
});

export const extensions = [
  Document,
  HardBreak,
  History,
  Link,
  Paragraph,
  Text,
  MentionWithBackspace.configure({
    renderHTML({ node, options }) {
      return [
        "a",
        mergeAttributes(
          { class: "text-blue-500", href: `/${node.attrs.id}` },
          options.HTMLAttributes,
        ),
        `${options.suggestion.char}${node.attrs.id}`,
      ];
    },
    suggestion,
  }),
  Placeholder.configure({
    placeholder: "What's happening",
    emptyEditorClass:
      "first:before:pointer-events-none first:before:float-left first:before:h-0 first:before:text-current/50 first:before:content-[attr(data-placeholder)]",
  }),
];
