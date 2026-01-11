import { createCookie } from "react-router";

const options = {
  httpOnly: true,
  maxAge: 60 * 10,
  sameSite: "lax",
  secrets: process.env.AUTH_SECRET.split(", "),
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const;

export const oauthCodeVerifierCookie = createCookie(
  "__oauth_code_verifier",
  options,
);
export const oauthStateCookie = createCookie("__oauth_state_cookie", options);
