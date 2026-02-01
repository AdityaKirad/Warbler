import type { Editor } from "@tiptap/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import EmojiPickerModule, { EmojiStyle, Theme } from "emoji-picker-react";
import { SmileIcon } from "lucide-react";

const EmojiPicker =
  (EmojiPickerModule as { default?: unknown })?.default ?? EmojiPickerModule;

export function EmojiPopover({ editor }: { editor: Editor | null }) {
  return (
    <Popover>
      <TooltipProvider>
        <Tooltip>
          <PopoverTrigger asChild>
            <TooltipTrigger className="rounded-full p-2 transition-colors hover:bg-blue-500/20 focus-visible:bg-blue-500/20 focus-visible:outline-2 focus-visible:outline-blue-300">
              <SmileIcon className="size-5 stroke-blue-500" />
            </TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent>Emoji</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="h-100 w-80 p-0">
        <EmojiPicker
          lazyLoadEmojis={true}
          skinTonesDisabled={true}
          height="100%"
          width="100%"
          emojiStyle={EmojiStyle.TWITTER}
          theme={Theme.DARK}
          onEmojiClick={(emoji) => editor?.commands.insertContent(emoji.emoji)}
        />
      </PopoverContent>
    </Popover>
  );
}
