import { db } from "~/.server/drizzle";
import { sql } from "drizzle-orm";
import type { Route } from "./+types/get-users.ts";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("query")?.toLowerCase();

  const users = await db.all(
    sql`
      SELECT 
        u.id,
        u.name,
        u.username,
        u.photo
      FROM user_search
      JOIN user u ON u.id = user_search.user_id
      WHERE user_search MATCH ${query + "*"}
      LIMIT 10
    `,
  );

  return Response.json(users);
}
