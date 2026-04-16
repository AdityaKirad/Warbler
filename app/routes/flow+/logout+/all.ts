import {
  isMultiSessionCookie,
  sessionCookieOptions,
} from "~/.server/cookies/session";
import { db, session } from "~/.server/drizzle";
import { parseCookies } from "~/.server/utils/parse-cookies";
import { inArray } from "drizzle-orm";
import { createCookie, redirectDocument } from "react-router";
import type { Route } from "./+types/all";

export async function action({ request }: Route.ActionArgs) {
  const cookie = request.headers.get("cookie");

  if (!cookie) {
    throw redirectDocument("/flow/login");
  }

  const cookies = parseCookies(cookie);

  const multiSessionCookies = Array.from(cookies.keys())
    .filter(isMultiSessionCookie)
    .map((name) => createCookie(name, sessionCookieOptions));

  const tokens = (
    await Promise.all(multiSessionCookies.map((c) => c.parse(cookie)))
  ).filter(Boolean) as string[];

  void db
    .delete(session)
    .where(inArray(session.token, tokens))
    .catch((err) => console.error("Failed to delete sessions", err));

  const headers = new Headers();

  for (const sessionCookie of multiSessionCookies) {
    headers.append(
      "set-cookie",
      await sessionCookie.serialize("", { maxAge: -1 }),
    );
  }

  throw redirectDocument("/flow/login", {
    headers,
  });
}
