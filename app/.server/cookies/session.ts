import { createCookie } from "react-router";

const options = {
  httpOnly: true,
  maxAge: 30 * 24 * 60 * 60,
  path: "/",
  sameSite: "lax",
  secrets: process.env.NODE_ENV.split(", "),
  secure: process.env.NODE_ENV === "production",
} as const;

export const sessionCookie = createCookie("__session", options);

export const createMultiSessionCookie = (token: string) =>
  createCookie(`__session_${token}`, options);
