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

export const follows = sqliteTable(
  "follows",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (table) => [
    primaryKey({
      name: "follows_follower_id_following_id_primary_key",
      columns: [table.followerId, table.followingId],
    }),
    index("follows_follower_id_idx").on(table.followerId),
    index("follows_following_id_idx").on(table.followingId),
  ],
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
    bodyJson: text({ mode: "json" }).$type<Record<string, unknown>>().notNull(),
    body: text().notNull(),
    replyToTweetId: text().references((): AnySQLiteColumn => tweet.id),
    quotedTweetId: text().references((): AnySQLiteColumn => tweet.id),
    views: integer().notNull().default(0),
    createdAt: timestamps.createdAt,
  },
  (table) => [
    index("tweet_user_id_idx").on(table.userId),
    index("tweet_reply_to_tweet_id_idx").on(table.replyToTweetId),
    index("tweet_quoted_tweet_id_idx").on(table.quotedTweetId),
  ],
);

export const like = sqliteTable(
  "like",
  {
    tweetId: text()
      .notNull()
      .references(() => tweet.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (table) => [
    primaryKey({
      name: "like_tweet_id_user_id_primary_key",
      columns: [table.tweetId, table.userId],
    }),
    index("like_tweet_id_idx").on(table.tweetId),
    index("like_user_id_idx").on(table.userId),
  ],
);

export const repost = sqliteTable(
  "repost",
  {
    tweetId: text()
      .notNull()
      .references(() => tweet.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (table) => [
    primaryKey({
      name: "repost_tweet_id_user_id_primary_key",
      columns: [table.tweetId, table.userId],
    }),
    index("repost_tweet_id_idx").on(table.tweetId),
    index("repost_user_id_idx").on(table.userId),
  ],
);

export const bookmark = sqliteTable(
  "bookmark",
  {
    tweetId: text()
      .notNull()
      .references(() => tweet.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (table) => [
    primaryKey({
      name: "bookmark_tweet_id_user_id_primary_key",
      columns: [table.tweetId, table.userId],
    }),
    index("bookmark_tweet_id_idx").on(table.tweetId),
    index("bookmark_user_id_idx").on(table.userId),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  bookmarks: many(bookmark),
  follows: many(follows, {
    relationName: "UserFollows",
  }),
  likes: many(like),
  reposts: many(repost),
  sessions: many(session),
  tweets: many(tweet),
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

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(user, {
    relationName: "UserFollows",
    fields: [follows.followerId],
    references: [user.id],
  }),
  following: one(user, {
    relationName: "UserFollowing",
    fields: [follows.followingId],
    references: [user.id],
  }),
}));

export const tweetRelations = relations(tweet, ({ one, many }) => ({
  bookmarks: many(bookmark),
  likes: many(like),
  reposts: many(repost),

  replyToTweet: one(tweet, {
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
  quoteTweet: many(tweet, {
    relationName: "TweetQuotes",
  }),
  user: one(user, {
    relationName: "TweetToUser",
    fields: [tweet.userId],
    references: [user.id],
  }),
}));

export const likeRelations = relations(like, ({ one }) => ({
  tweet: one(tweet, {
    relationName: "LikeToTweet",
    fields: [like.tweetId],
    references: [tweet.id],
  }),
  user: one(user, {
    relationName: "LikeToUser",
    fields: [like.userId],
    references: [user.id],
  }),
}));

export const repostRelations = relations(repost, ({ one }) => ({
  tweet: one(tweet, {
    relationName: "RepostToTweet",
    fields: [repost.tweetId],
    references: [tweet.id],
  }),
  user: one(user, {
    relationName: "RepostToUser",
    fields: [repost.userId],
    references: [user.id],
  }),
}));

export const bookmarkRelations = relations(bookmark, ({ one }) => ({
  tweet: one(tweet, {
    relationName: "BookmarkToTweet",
    fields: [bookmark.tweetId],
    references: [tweet.id],
  }),
  user: one(user, {
    relationName: "BookmarkToUser",
    fields: [bookmark.userId],
    references: [user.id],
  }),
}));

export type AccountSelectType = InferSelectModel<typeof account>;
export type AccountInsertType = InferInsertModel<typeof account>;
export type UserInsertType = InferInsertModel<typeof user>;
export type UserSelectType = InferSelectModel<typeof user>;
export type SessionSelectType = InferSelectModel<typeof session>;
export type VerificationsSelectType = InferSelectModel<typeof verification>;
export type TweetSelectType = InferSelectModel<typeof tweet>;
