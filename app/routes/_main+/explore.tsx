import { db } from "~/.server/drizzle";
import { requireUser } from "~/.server/utils";
import { sql } from "drizzle-orm";
import type { Route } from "./+types/explore";

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);

  const url = new URL(request.url);
  const query = url.searchParams.get("query")?.trim().toLowerCase();

  if (!query) {
    return null;
  }

  return db.all<{
    id: string;
    name: string;
    username: string;
    photo: string | null;
  }>(
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
}

export default function Page({ loaderData }: Route.ComponentProps) {
  return <></>;
}
