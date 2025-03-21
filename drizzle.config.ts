import { type Config } from "drizzle-kit";

export default {
  dialect: "turso",
  schema: "./app/services/drizzle/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
} satisfies Config;
