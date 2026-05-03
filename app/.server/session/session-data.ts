import { createCookieSessionStorage } from "react-router";
import type { SessionSelectType, UserSelectType } from "../drizzle";

export const sessionDataStorage = createCookieSessionStorage<{
  session: SessionSelectType;
  user: UserSelectType;
  updatedAt: Date;
  expires: Date;
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
