import { createId as cuid } from "@paralleldrive/cuid2";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import { customType, index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

const dateTime = customType<{ data: Date; driverData: string }>({
  dataType() {
    return "DATETIME";
  },
  fromDriver(value): Date {
    return new Date(value);
  },
});

export const users = sqliteTable("users", {
  id: text("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => cuid()),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  dob: dateTime("dob").notNull(),
  image: text("image"),
  createdAt: dateTime("createdAt")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: dateTime("updatedAt")
    .notNull()
    .$defaultFn(() => new Date()),
});

export const verifications = sqliteTable(
  "verifications",
  {
    target: text("target").notNull(),
    type: text("type", { enum: ["onboarding", "reset-password"] }).notNull(),
    charSet: text("charSet").notNull(),
    secret: text("secret").notNull(),
    algorithm: text("algorithm").notNull(),
    digits: integer("digits").notNull(),
    period: integer("period").notNull(),
    createdAt: dateTime("createdAt")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    expiresAt: dateTime("expiresAt").notNull(),
  },
  (verification) => [
    primaryKey({ name: "verification_target_type_pkey", columns: [verification.target, verification.type] }),
  ],
);

export const passwords = sqliteTable("passwords", {
  hash: text("hash").notNull(),
  userId: text("userId")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => cuid()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: dateTime("createdAt")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: dateTime("updatedAt")
      .notNull()
      .$defaultFn(() => new Date()),
    expiresAt: dateTime("expiresAt").notNull(),
  },
  (session) => [index("session_userId_idx").on(session.userId)],
);

export const usersRelations = relations(users, ({ many, one }) => ({
  password: one(passwords),
  sessions: many(sessions),
}));

export const passwordRelations = relations(passwords, ({ one }) => ({
  user: one(users, {
    relationName: "PasswordToUser",
    fields: [passwords.userId],
    references: [users.id],
  }),
}));

export const SessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    relationName: "SessionToUser",
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export type UserInsertType = InferInsertModel<typeof users>;
export type UserSelectType = InferSelectModel<typeof users>;
export type PasswordSelectType = InferSelectModel<typeof passwords>;
