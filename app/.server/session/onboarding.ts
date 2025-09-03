import { createCookieSessionStorage } from "react-router";
import type { AccountInsertType, UserInsertType } from "../drizzle";

export const onboardingSessionStorage = createCookieSessionStorage<{
  data: Pick<UserInsertType, "name" | "email" | "emailVerified" | "image"> & {
    provider: Exclude<AccountInsertType["provider"], "credentials">;
    providerId: string;
  };
}>({
  cookie: {
    name: "__onboarding",
    sameSite: "lax",
    path: "/home",
    httpOnly: true,
    maxAge: undefined,
    secrets: process.env.AUTH_SECRET.split(","),
    secure: process.env.NODE_ENV === "production",
  },
});
