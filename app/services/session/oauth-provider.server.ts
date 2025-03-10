import { createCookieSessionStorage } from "@remix-run/node";

export const oauthProviderSessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__oauth_provider",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    maxAge: 60 * 10,
    secrets: process.env.SESSION_SECRET.split(","),
    secure: process.env.NODE_ENV === "production",
  },
});
