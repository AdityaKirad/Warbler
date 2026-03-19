import type { Config } from "drizzle-kit";

export default {
  dialect: "turso",
  schema: "./app/.server/drizzle/schema.ts",
  out: "./app/.server/drizzle/migrations",
  casing: "snake_case",
  dbCredentials: {
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
} satisfies Config;
