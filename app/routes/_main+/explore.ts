import { db } from "~/.server/drizzle";
import type { Route } from "./+types/explore";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("query")?.toLowerCase();

  return db.query.user.findMany({
    columns: { id: true, name: true, username: true, photo: true },
    where: (user, { and, like, sql }) =>
      and(
        like(sql`lower(${user.name})`, `%${query}%`),
        like(sql`lower(${user.username})`, `%${query}%`),
      ),
  });
}
