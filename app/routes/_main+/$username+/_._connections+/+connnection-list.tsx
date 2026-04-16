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

function ConnectionCard(connnection: ConnectionCardProps) {
  return (
    <Form
      className="hover:bg-accent/20 relative flex gap-2 px-4 py-2 transition-colors"
      method="POST"
      action={`/${connnection.username}/follow`}
      navigate={false}>
      <Link
        to={`/${connnection.username}`}
        className="focus-visible:bg-accent/20 absolute inset-0 focus-visible:outline-2 focus-visible:outline-blue-300"
      />
      <Avatar>
        <AvatarImage
          src={connnection.photo ?? DefaultProfilePicture}
          alt={`@${connnection.username}`}
          loading="lazy"
          decoding="async"
        />
        <AvatarFallback>{getNameInitials(connnection.name)}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium">{connnection.name}</p>
        <p className="text-muted-foreground text-sm">@{connnection.username}</p>
        <p>{connnection.bio}</p>
      </div>
      {connnection.following !== null && (
        <Button className="z-10 ml-auto rounded-full" type="submit">
          {connnection.following ? "Unfollow" : "Follow"}
        </Button>
      )}
    </Form>
  );
}
