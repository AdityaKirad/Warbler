import type {
  SuggestionKeyDownProps,
  SuggestionProps,
} from "@tiptap/suggestion";
import DefaultProfilePicture from "~/assets/default-profile-picture.png";
import { getNameInitials } from "~/lib/utils";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Spinner } from "../spinner";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import type {
  MentionListRef,
  MentionSelected,
  MentionUser,
} from "./suggestion";

export type MentionListProps = SuggestionProps<MentionUser, MentionSelected> & {
  onNoResults?: () => void;
};

export const MentionList = forwardRef<MentionListRef, MentionListProps>(
  (props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [localItems, setLocalItems] = useState<MentionUser[]>([]);

    const fetchUsers = useCallback(
      async (query: string): Promise<{ ok: boolean; data: MentionUser[] }> => {
        const res = await fetch(
          `/get-users?query=${encodeURIComponent(query)}`,
        );
        if (!res.ok) return { ok: false, data: [] };
        const data = (await res.json()) as MentionUser[];
        return { ok: true, data };
      },
      [],
    );

    const { query, onNoResults } = props;
    useEffect(() => {
      if (!query) {
        setLocalItems([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setLocalItems([]);
      const t = setTimeout(() => {
        fetchUsers(query).then(({ ok, data }) => {
          setLocalItems(data);
          setLoading(false);
          if (ok && data.length === 0) {
            onNoResults?.();
          }
        });
      }, 100);
      return () => clearTimeout(t);
    }, [query, fetchUsers, onNoResults]);

    useEffect(() => setSelectedIndex(0), [localItems]);

    const selectItem = useCallback(
      (index: number) => {
        const item = localItems[index];
        if (item) {
          props.command({
            id: item.username,
          });
        }
      },
      [localItems, props],
    );

    useImperativeHandle(
      ref,
      () => ({
        onKeyDown: ({ event }: SuggestionKeyDownProps) => {
          if (event.key === "ArrowUp") {
            setSelectedIndex(
              (i) =>
                (i + localItems.length - 1) % Math.max(1, localItems.length),
            );
            return true;
          }
          if (event.key === "ArrowDown") {
            setSelectedIndex((i) => (i + 1) % Math.max(1, localItems.length));
            return true;
          }
          if (event.key === "Enter") {
            selectItem(selectedIndex);
            return true;
          }
          return false;
        },
      }),
      [localItems.length, selectedIndex, selectItem],
    );

    if (!loading && localItems.length === 0 && query) {
      return null;
    }

    return (
      <div className="bg-background relative z-10 flex h-full flex-col overflow-auto rounded-md border py-2">
        {loading ? (
          <div className="py-4">
            <Spinner className="mx-auto" />
          </div>
        ) : localItems.length > 0 ? (
          localItems.map((item, index) => (
            <button
              className="data-highlighted:bg-muted flex items-center gap-2 px-4 py-2"
              key={item.id}
              data-highlighted={index === selectedIndex ? true : undefined}
              onClick={() => selectItem(index)}>
              <Avatar>
                <AvatarImage
                  src={item.photo ?? DefaultProfilePicture}
                  alt={`@${item.username}`}
                  loading="lazy"
                  decoding="async"
                />
                <AvatarFallback>{getNameInitials(item.name)}</AvatarFallback>
              </Avatar>
              <div className="leading-none">
                <p className="font-medium">{item.name}</p>
                <span className="text-muted-foreground text-sm">
                  @{item.username}
                </span>
              </div>
            </button>
          ))
        ) : null}
      </div>
    );
  },
);

MentionList.displayName = "MentionList";
