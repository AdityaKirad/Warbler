import { db, user, userFollow } from "~/.server/drizzle";
import { getUser } from "~/.server/utils";
import { and, eq, inArray, sql } from "drizzle-orm";
import { redirect } from "react-router";
import type { CONNECTION_LAYOUT_LOADER } from "./_layout";
import { CONNECTION_LAYOUT_ROUTE_ID } from "./_layout";
import { ConnectionList } from "./+connnection-list";
import type { Route } from "./+types/verified_followers";

export function meta({ matches }: Route.MetaArgs) {
  const match = matches.find(
    (match) => match?.id === CONNECTION_LAYOUT_ROUTE_ID,
  );
  const user = match?.loaderData as Awaited<
    ReturnType<CONNECTION_LAYOUT_LOADER>
  >;
  return [
    {
      title: `Verified accounts following ${user?.name} (@${user?.username}) / Warbler`,
    },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { session, clearSessionHeader } = await getUser(request);

  if (!session) {
    throw redirect(params.username, {
      headers: {
        "set-cookie": clearSessionHeader,
      },
    });
  }

  const followers = await db
    .select({
      id: user.id,
      name: user.name,
      username: user.username,
      photo: user.photo,
      bio: user.bio,

      following: sql<boolean | null>`
        CASE WHEN ${user.id} != ${session.user.id} 
        THEN EXISTS(
          SELECT 1 
          FROM ${userFollow} 
          WHERE ${userFollow.followingId} = ${user.id} 
          AND ${userFollow.followerId} = ${session.user.id}
        ) 
        ELSE NULL END`,
    })
    .from(userFollow)
    .innerJoin(user, eq(userFollow.followerId, user.id))
    .where(
      and(
        inArray(
          userFollow.followingId,
          db
            .select({ id: user.id })
            .from(user)
            .where(eq(user.username, params.username)),
        ),
        eq(user.profileVerified, true),
      ),
    );

  return followers.map((follower) => ({
    ...follower,
    profileVerified: true,
  }));
}

export default function Page({ loaderData }: Route.ComponentProps) {
  return <ConnectionList connections={loaderData} />;
}
