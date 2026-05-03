import { db, user, userFollow } from "~/.server/drizzle";
import { getUser } from "~/.server/utils";
import { eq, inArray, sql } from "drizzle-orm";
import { redirect } from "react-router";
import type { CONNECTION_LAYOUT_LOADER } from "./_layout";
import { CONNECTION_LAYOUT_ROUTE_ID } from "./_layout";
import { ConnectionList } from "./+connnection-list";
import type { Route } from "./+types/following";

export function meta({ matches }: Route.MetaArgs) {
  const match = matches.find(
    (match) => match?.id === CONNECTION_LAYOUT_ROUTE_ID,
  );
  const user = match?.loaderData as Awaited<
    ReturnType<CONNECTION_LAYOUT_LOADER>
  >;

  return [
    {
      title: `People followed by ${user?.name} (@${user?.username}) / Warbler`,
    },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { user: currentUser, clearSessionHeader } = await getUser(request);

  if (!currentUser) {
    throw redirect(params.username, {
      headers: {
        "set-cookie": clearSessionHeader,
      },
    });
  }

  return db
    .select({
      id: user.id,
      name: user.name,
      username: user.username,
      photo: user.photo,
      bio: user.bio,
      profileVerified: user.profileVerified,

      following: sql<boolean | null>`
        EXISTS(
          SELECT 1 
          FROM ${userFollow} 
          WHERE ${userFollow.followingId} = ${user.id} 
          AND ${userFollow.followerId} = ${currentUser.id}
        ) 
      `,
    })
    .from(userFollow)
    .innerJoin(user, eq(userFollow.followingId, user.id))
    .where(
      inArray(
        userFollow.followerId,
        db
          .select({ id: user.id })
          .from(user)
          .where(eq(user.username, params.username)),
      ),
    );
}

export default function Page({ loaderData }: Route.ComponentProps) {
  return <ConnectionList connections={loaderData} />;
}
