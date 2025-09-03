import { createCookieSessionStorage } from "react-router";

export const flashSessionStorage = createCookieSessionStorage<{
  __flash: string;
}>({
  cookie: {
    name: "__flash",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    secrets: process.env.AUTH_SECRET.split(","),
    maxAge: 120,
  },
});
