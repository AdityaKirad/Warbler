import { createId as cuid } from "@paralleldrive/cuid2";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer({ mode: "timestamp_ms" })
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer({ mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  expiresAt: integer({ mode: "timestamp_ms" }).notNull(),
};

export const user = sqliteTable("user", {
  id: text()
    .notNull()
    .primaryKey()
    .$defaultFn(() => cuid()),
  name: text().notNull(),
  username: text().notNull().unique(),
  email: text().notNull().unique(),
  emailVerified: integer({ mode: "boolean" }).notNull(),
  dob: integer({ mode: "timestamp_ms" }),
  image: text(),
  profileVerified: integer({ mode: "boolean" }).notNull().default(false),
  onboardingStepsCompleted: text({ mode: "json" })
    .$type<string[]>()
    .notNull()
    .default([]),
  createdAt: timestamps.createdAt,
  updatedAt: timestamps.updatedAt,
});

export const account = sqliteTable(
  "account",
  {
    id: text()
      .notNull()
      .primaryKey()
      .$defaultFn(() => cuid()),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    provider: text().notNull(),
    providerId: text().notNull(),
    password: text(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (table) => [
    index("account_user_id_idx").on(table.userId),
    uniqueIndex("account_provider_provider_id_unique_idx").on(
      table.provider,
      table.providerId,
    ),
  ],
);

export const verification = sqliteTable("verification", {
  id: text()
    .notNull()
    .primaryKey()
    .$defaultFn(() => cuid()),
  identifier: text().notNull().unique(),
  value: text().notNull(),
  ...timestamps,
});

export const session = sqliteTable(
  "session",
  {
    id: text()
      .notNull()
      .primaryKey()
      .$defaultFn(() => cuid()),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    token: text().notNull().unique(),
    userAgent: text(),
    ipAddress: text(),
    location: text(),
    ...timestamps,
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  sessions: many(session),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    relationName: "AccountToUser",
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const SessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    relationName: "SessionToUser",
    fields: [session.userId],
    references: [user.id],
  }),
}));

export type AccountSelectType = InferSelectModel<typeof account>;
export type AccountInsertType = InferInsertModel<typeof account>;
export type UserInsertType = InferInsertModel<typeof user>;
export type UserSelectType = InferSelectModel<typeof user>;
export type SessionSelectType = InferSelectModel<typeof session>;
export type VerificationsSelectType = InferSelectModel<typeof verification>;
