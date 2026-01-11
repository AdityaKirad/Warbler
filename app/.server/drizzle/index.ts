import { styleText } from "node:util";
import type { Client, ResultSet } from "@libsql/client";
import { createClient } from "@libsql/client";
import type { ExtractTablesWithRelations, Logger } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { drizzle } from "drizzle-orm/libsql";
import type { SQLiteTransaction } from "drizzle-orm/sqlite-core";
import * as schema from "./schema";

export * from "./schema";

type Schema = typeof schema;

export type DrizzleAdapter =
  | (LibSQLDatabase<Schema> & { $client: Client })
  | SQLiteTransaction<
      "async",
      ResultSet,
      Schema,
      ExtractTablesWithRelations<Schema>
    >;

class MyLogger implements Logger {
  logQuery(query: string, params: unknown[]): void {
    console.info(
      `drizzle:query - ${styleText("green", query)} - params: ${styleText("blue", JSON.stringify(params))}`,
    );
  }
}

const globalForClient = globalThis as unknown as {
  client: Client | undefined;
};

const client =
  globalForClient.client ??
  createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

if (process.env.NODE_ENV !== "production") {
  globalForClient.client = client;
}

export const db = drizzle(client, {
  schema,
  logger: new MyLogger(),
  casing: "snake_case",
});
