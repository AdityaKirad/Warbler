import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

type CharacterCountWithOverflowOptions = {
  limit: number | null;
  overflowClass: string;
  textCounter: (text: string) => number;
};

type CharacterCountWithOverflowStorage = {
  characters: () => number;
};

export const CharacterCountWithOverflow = Extension.create<
  CharacterCountWithOverflowOptions,
  CharacterCountWithOverflowStorage
>({
  name: "characterCountWithOverflow",

  addOptions() {
    return {
      limit: null,
      overflowClass: "char-overflow",
      textCounter: (text: string) => text.length,
    };
  },

  addStorage() {
    return {
      characters: () => 0,
    };
  },

  onBeforeCreate() {
    this.storage.characters = () => {
      const node = this.editor.state.doc;
      const text = node.textBetween(0, node.content.size, undefined, " ");
      return this.options.textCounter(text);
    };
  },

  addProseMirrorPlugins() {
    const key = new PluginKey("characterCountOverflow");

    return [
      new Plugin({
        key,
        state: {
          init: () => DecorationSet.empty,

          apply: (tr, old) => {
            if (!tr.docChanged) {
              return old;
            }

            const limit = this.options.limit;
            if (!limit) {
              return DecorationSet.empty;
            }

            const doc = tr.doc;
            const text = doc.textBetween(0, doc.content.size, undefined, " ");
            const total = this.options.textCounter(text);

            if (total <= limit) {
              return DecorationSet.empty;
            }

            // Find overflow start position
            let count = 0;
            let overflowFrom = null as number | null;

            doc.descendants((node, pos) => {
              if (!node.isText || overflowFrom !== null) {
                return;
              }

              const len = node.text?.length ?? 0;

              if (count + len > limit) {
                overflowFrom = pos + (limit - count);
              }

              count += len;
            });

            if (overflowFrom === null) {
              return DecorationSet.empty;
            }

            const deco = Decoration.inline(overflowFrom, doc.content.size, {
              class: this.options.overflowClass,
            });

            return DecorationSet.create(doc, [deco]);
          },
        },

        props: {
          decorations(state) {
            return key.getState(state);
          },
        },
      }),
    ];
  },
});
