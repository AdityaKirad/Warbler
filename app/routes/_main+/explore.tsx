import { db } from "~/.server/drizzle";
import { requireUser } from "~/.server/utils";
import type { Route } from "./+types/explore";

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);

  const url = new URL(request.url);
  const query = url.searchParams.get("query")?.trim().toLowerCase();

  if (!query) {
    return null;
  }

  return db.query.user.findMany({
    columns: { id: true, name: true, username: true, photo: true },
    where: (user, { and, like, sql }) =>
      and(
        like(sql`lower(${user.name})`, `%${query}%`),
        like(sql`lower(${user.username})`, `%${query}%`),
      ),
  });
}

export default function Page({ loaderData }: Route.ComponentProps) {
  return <></>;
}
