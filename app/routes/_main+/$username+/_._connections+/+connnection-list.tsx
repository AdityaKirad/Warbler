import type { UserSelectType } from "~/.server/drizzle";
import DefaultProfilePicture from "~/assets/default-profile-picture.png";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { getNameInitials } from "~/lib/utils";
import { Form, Link } from "react-router";

type ConnectionCardProps = Pick<
  UserSelectType,
  "id" | "name" | "username" | "photo" | "bio" | "profileVerified"
> & {
  following: boolean | null;
};

export function ConnectionList({
  connections,
}: {
  connections: ConnectionCardProps[];
}) {
  return (
    <div className="flex flex-col gap-2">
      {connections.map((connection) => (
        <ConnectionCard key={connection.id} {...connection} />
      ))}
    </div>
  );
}

function ConnectionCard(props: ConnectionCardProps) {
  return (
    <Form
      className="hover:bg-accent/20 relative flex gap-2 px-4 py-2 transition-colors"
      method="POST"
      action={`/${props.username}/follow`}
      navigate={false}>
      <Link
        to={`/${props.username}`}
        className="focus-visible:bg-accent/20 absolute inset-0 focus-visible:outline-2 focus-visible:outline-blue-300"
      />
      <Avatar>
        <AvatarImage
          src={props.photo ?? DefaultProfilePicture}
          alt={`@${props.username}`}
          loading="lazy"
          decoding="async"
        />
        <AvatarFallback>{getNameInitials(props.name)}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium">{props.name}</p>
        <p className="text-muted-foreground text-sm">@{props.username}</p>
        <p>{props.bio}</p>
      </div>
      {props.following !== null && (
        <Button className="z-10 ml-auto rounded-full" type="submit">
          {props.following ? "Unfollow" : "Follow"}
        </Button>
      )}
    </Form>
  );
}
