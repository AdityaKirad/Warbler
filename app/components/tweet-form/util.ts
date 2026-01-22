import { Document } from "@tiptap/extension-document";
import { HardBreak } from "@tiptap/extension-hard-break";
import { History } from "@tiptap/extension-history";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Text } from "@tiptap/extension-text";
import { CharacterCount, Placeholder } from "@tiptap/extensions";

export const MAX_TWEET_LENGTH = 280;

export const extensions = [
  Document,
  Paragraph,
  Text,
  HardBreak,
  History,
  CharacterCount,
  Placeholder.configure({
    placeholder: "What's happening",
  }),
];
