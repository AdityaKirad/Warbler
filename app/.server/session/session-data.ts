import { createCookieSessionStorage } from "react-router";
import type { UserSelectType } from "../drizzle";

export const sessionDataStorage = createCookieSessionStorage<{
  session: {
    session: { updatedAt: number; expiresAt: number };
    user: Pick<
      UserSelectType,
      "id" | "name" | "username" | "photo" | "profileVerified"
    >;
  };
  updatedAt: number;
  expiresAt: number;
}>({
  cookie: {
    name: "__session_data",
    httpOnly: true,
    maxAge: 5 * 60,
    path: "/",
    sameSite: "lax",
    secrets: process.env.AUTH_SECRET.split(", "),
    secure: process.env.NODE_ENV === "production",
  },
});
