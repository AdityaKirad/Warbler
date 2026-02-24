import { db, follows, user } from "~/.server/drizzle";
import { getUser } from "~/.server/utils";
import { eq, inArray, sql } from "drizzle-orm";
import { redirect } from "react-router";
import type { CONNECTION_LAYOUT_LOADER } from "./_layout";
import { CONNECTION_LAYOUT_ROUTE_ID } from "./_layout";
import { ConnectionList } from "./+connnection-list";
import type { Route } from "./+types/followers";

export function meta({ matches }: Route.MetaArgs) {
  const match = matches.find(
    (match) => match?.id === CONNECTION_LAYOUT_ROUTE_ID,
  );
  const user = (
    match?.loaderData as Awaited<ReturnType<CONNECTION_LAYOUT_LOADER>>
  ).user;
  return [
    {
      title: `People following ${user?.name} (@${user?.username}) / Warbler`,
    },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const currentUser = await getUser(request);

  if (!currentUser) {
    throw redirect(params.username);
  }

  const followers = await db
    .select({
      id: user.id,
      name: user.name,
      username: user.username,
      photo: user.photo,
      bio: user.bio,
      profileVerified: user.profileVerified,

      following: sql<
        boolean | null
      >`CASE WHEN ${user.id} != ${currentUser.user.id} THEN EXISTS(SELECT 1 FROM ${follows} WHERE ${follows.followingId} = ${user.id} AND ${follows.followerId} = ${currentUser.user.id}) ELSE NULL END`,
    })
    .from(follows)
    .innerJoin(user, eq(follows.followerId, user.id))
    .where(
      inArray(
        follows.followingId,
        db
          .select({ id: user.id })
          .from(user)
          .where(eq(user.username, params.username)),
      ),
    );

  return { followers };
}

export default function Page({
  loaderData: { followers },
}: Route.ComponentProps) {
  return <ConnectionList connections={followers} />;
}
