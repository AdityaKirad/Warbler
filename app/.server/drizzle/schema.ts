import { createId as cuid } from "@paralleldrive/cuid2";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import {
  index,
  integer,
  primaryKey,
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
  displayVerifiedEmail: integer({ mode: "boolean" }).notNull().default(false),
  dob: integer({ mode: "timestamp_ms" }),
  photo: text(),
  coverImage: text(),
  location: text(),
  bio: text(),
  website: text(),
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
    uniqueIndex("account_provider_provider_id_unique").on(
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

export const tweet = sqliteTable(
  "tweet",
  {
    id: text("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => cuid()),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    content: text({ mode: "json" }).$type<Record<string, unknown>>().notNull(),
    text: text().notNull(),
    replyToTweetId: text().references((): AnySQLiteColumn => tweet.id, {
      onDelete: "no action",
    }),
    quotedTweetId: text().references((): AnySQLiteColumn => tweet.id),
    views: integer().notNull().default(0),
    createdAt: timestamps.createdAt,
  },
  (table) => [
    index("tweet_user_timeline_idx").on(table.userId, table.createdAt),
    index("tweet_reply_sort_idx").on(table.replyToTweetId, table.createdAt),
    index("tweet_quoted_tweet_id_idx").on(table.quotedTweetId),
  ],
);

export const tweetInteraction = sqliteTable(
  "tweet_interaction",
  {
    tweetId: text()
      .notNull()
      .references(() => tweet.id, { onDelete: "cascade" }),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text({ enum: ["bookmark", "like", "repost"] }).notNull(),
    createdAt: timestamps.createdAt,
  },
  (table) => [
    primaryKey({
      name: "tweet_interaction_pk",
      columns: [table.tweetId, table.userId, table.type],
    }),
    index("tweet_interaction_user_type_created_idx").on(
      table.userId,
      table.type,
      table.createdAt,
    ),
    index("tweet_interaction_tweet_type_idx").on(table.tweetId, table.type),
  ],
);

export const userFollow = sqliteTable(
  "user_follow",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamps.createdAt,
  },
  (table) => [
    primaryKey({
      name: "follows_follower_id_following_id_primary_key",
      columns: [table.followerId, table.followingId],
    }),
    index("user_follow_following_id_idx").on(table.followingId),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  sessions: many(session),
  tweets: many(tweet),
  tweetInteractions: many(tweetInteraction),
  userFollow: many(userFollow, {
    relationName: "UserFollows",
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    relationName: "AccountToUser",
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    relationName: "SessionToUser",
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const followsRelations = relations(userFollow, ({ one }) => ({
  follower: one(user, {
    relationName: "UserFollows",
    fields: [userFollow.followerId],
    references: [user.id],
  }),
  following: one(user, {
    relationName: "UserFollowing",
    fields: [userFollow.followingId],
    references: [user.id],
  }),
}));

export const tweetRelations = relations(tweet, ({ one, many }) => ({
  tweetInteractions: many(tweetInteraction),
  parentTweet: one(tweet, {
    relationName: "TweetReplies",
    fields: [tweet.replyToTweetId],
    references: [tweet.id],
  }),
  replies: many(tweet, {
    relationName: "TweetReplies",
  }),
  quotedTweet: one(tweet, {
    relationName: "TweetQuotes",
    fields: [tweet.quotedTweetId],
    references: [tweet.id],
  }),
  quotes: many(tweet, {
    relationName: "TweetQuotes",
  }),
  user: one(user, {
    relationName: "TweetToUser",
    fields: [tweet.userId],
    references: [user.id],
  }),
}));

export const tweetInteractionRelations = relations(
  tweetInteraction,
  ({ one }) => ({
    tweet: one(tweet, {
      relationName: "InteractionToTweet",
      fields: [tweetInteraction.tweetId],
      references: [tweet.id],
    }),
    user: one(user, {
      relationName: "InteractionToUser",
      fields: [tweetInteraction.userId],
      references: [user.id],
    }),
  }),
);

export type UserInsertType = InferInsertModel<typeof user>;
export type UserSelectType = InferSelectModel<typeof user>;
export type AccountInsertType = InferInsertModel<typeof account>;
export type SessionSelectType = InferSelectModel<typeof session>;
export type VerificationsSelectType = InferSelectModel<typeof verification>;
export type TweetSelectType = InferSelectModel<typeof tweet>;
export type TweetInteractionSelectType = InferSelectModel<
  typeof tweetInteraction
>;
export type UserFollowSelectType = InferSelectModel<typeof userFollow>;
