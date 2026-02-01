import { db } from "~/.server/drizzle";
import type { Route } from "./+types/get-users.ts";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("query")?.toLowerCase();

  const users = await db.query.user.findMany({
    columns: { id: true, name: true, username: true, photo: true },
    where: (user, { like, sql }) =>
      like(sql`lower(${user.username})`, `%${query}%`),
  });

  return Response.json(users);
}
