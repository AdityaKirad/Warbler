import type { Node as PMNode } from "@tiptap/pm/model";
import { Link } from "react-router";

export const mentionNodeLinkMapping = {
  mention({ node }: { node: PMNode }): JSX.Element {
    const username = node.attrs.id;
    const suggestionChar = node.attrs.mentionSuggestionChar;

    return (
      <Link className="text-blue-500 hover:underline" to={`/${username}`}>
        {`${suggestionChar}${username}`}
      </Link>
    );
  },
};

export const mentionNodeTextMapping = {
  mention({ node }: { node: PMNode }): JSX.Element {
    const username = node.attrs.id;
    const suggestionChar = node.attrs.mentionSuggestionChar;

    return <>{`${suggestionChar}${username}`}</>;
  },
};
