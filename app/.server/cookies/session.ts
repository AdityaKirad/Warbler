import { createCookie } from "react-router";
import { getHash } from "../utils/get-hash";

export const SESSION_COOKIE_NAME = "__session";
export const MULTI_SESSION_COOKIE_PREFIX = `${SESSION_COOKIE_NAME}_multi_`;

export const sessionCookieOptions = {
  httpOnly: true,
  maxAge: 30 * 24 * 60 * 60,
  path: "/",
  sameSite: "lax",
  secrets: process.env.AUTH_SECRET.split(", "),
  secure: process.env.NODE_ENV === "production",
} as const;

export const sessionCookie = createCookie("__session", sessionCookieOptions);

export const isMultiSessionCookie = (name: string) =>
  name.includes(MULTI_SESSION_COOKIE_PREFIX);

export const createMultiSessionCookieId = (token: string) =>
  getHash(token, true).toString().slice(0, 8);
