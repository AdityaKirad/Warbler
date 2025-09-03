import { createId as cuid } from "@paralleldrive/cuid2";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import {
  customType,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

const dateTime = customType<{ data: Date; driverData: string }>({
  dataType() {
    return "DATETIME";
  },
  fromDriver(value): Date {
    return new Date(value);
  },
});

export const user = sqliteTable("user", {
  id: text()
    .notNull()
    .primaryKey()
    .$defaultFn(() => cuid()),
  name: text().notNull(),
  username: text().notNull().unique(),
  email: text().notNull().unique(),
  emailVerified: integer({ mode: "boolean" }).notNull(),
  dob: dateTime().notNull(),
  image: text(),
  createdAt: dateTime("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: dateTime("updated_at")
    .notNull()
    .$defaultFn(() => new Date()),
});

export const account = sqliteTable(
  "account",
  {
    id: text()
      .notNull()
      .primaryKey()
      .$defaultFn(() => cuid()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    providerId: text("provider_id").notNull().unique(),
    provider: text({ enum: ["credentials", "discord", "google"] }).notNull(),
    password: text().unique(),
    createdAt: dateTime("created_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: dateTime("updated_at")
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    target: text().notNull(),
    type: text({
      enum: ["forget-password", "signup", "verify-email"],
    }).notNull(),
    hash: text().notNull().unique(),
    expiresAt: dateTime("expires_at").notNull(),
  },
  (table) => [
    primaryKey({
      name: "verification_target_type_pkey",
      columns: [table.target, table.type],
    }),
  ],
);

export const session = sqliteTable(
  "session",
  {
    id: text()
      .notNull()
      .primaryKey()
      .$defaultFn(() => cuid()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text().notNull().unique(),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
    createdAt: dateTime("created_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: dateTime("updated_at")
      .notNull()
      .$defaultFn(() => new Date()),
    expiresAt: dateTime("expires_at").notNull(),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
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
