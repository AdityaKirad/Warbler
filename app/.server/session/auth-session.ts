import { createCookieSessionStorage } from "react-router";

export const authSessionStorage = createCookieSessionStorage<{ token: string }>(
  {
    cookie: {
      name: "__session_token",
      sameSite: "lax",
      path: "/",
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60,
      secrets: process.env.AUTH_SECRET.split(","),
      secure: process.env.NODE_ENV === "production",
    },
  },
);
