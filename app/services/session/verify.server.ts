import { createCookieSessionStorage } from "@remix-run/node";

export const verificationSessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__verification",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    maxAge: 600,
    secrets: process.env.SESSION_SECRET.split(","),
    secure: process.env.NODE_ENV === "production",
  },
});
