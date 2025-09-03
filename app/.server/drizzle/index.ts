import { styleText } from "node:util";
import { remember } from "@epic-web/remember";
import { createClient } from "@libsql/client";
import type { Logger } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

export * from "./schema";

class MyLogger implements Logger {
  logQuery(query: string, params: unknown[]): void {
    console.info(
      `drizzle:query - ${styleText("green", query)} - params: ${styleText("blue", JSON.stringify(params))}`,
    );
  }
}

const client = remember("client", () =>
  createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  }),
);

export const db = drizzle(client, { schema, logger: new MyLogger() });
