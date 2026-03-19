import type { TweetInteractionSelectType } from "~/.server/drizzle";
import {
  db,
  tweet,
  tweetInteraction,
  user,
  userFollow,
} from "~/.server/drizzle";
import { and, desc, eq, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import type { SQLiteColumn } from "drizzle-orm/sqlite-core";

type TweetInteractionParams = {
  tweetId: SQLiteColumn;
  type: TweetInteractionSelectType["type"];
};

export const PAGE_SIZE = 50;

const interactionFlag = ({
  userId,
  tweetId,
  type,
}: TweetInteractionParams & { userId: string }) => sql<boolean>`
    EXISTS(
      SELECT 1 
      FROM ${tweetInteraction} 
      WHERE ${tweetInteraction.type} = ${type}
      AND ${tweetInteraction.tweetId} = ${tweetId}
      AND ${tweetInteraction.userId} = ${userId}
    )
  `;

export const interactionCount = ({ tweetId, type }: TweetInteractionParams) =>
  db.$count(
    tweetInteraction,
    and(eq(tweetInteraction.tweetId, tweetId), eq(tweetInteraction.type, type)),
  );

export const followingFlag = ({
  followerId,
  followingId,
}: {
  followerId: string;
  followingId: SQLiteColumn;
}) => sql<boolean>`
    EXISTS(
      SELECT 1
      FROM ${userFollow}
      WHERE ${userFollow.followingId} = ${followingId}
      AND ${userFollow.followerId} = ${followerId}
    )
`;

export const tweetCoreFields = {
  id: tweet.id,
  content: tweet.content,
  views: tweet.views,
  createdAt: tweet.createdAt,
};

export const tweetUserField = {
  user: {
    name: user.name,
    username: user.username,
    photo: user.photo,
  },
};

export const tweetInteractionCountField = {
  count: {
    likes: interactionCount({ tweetId: tweet.id, type: "like" }),
    reposts: interactionCount({ tweetId: tweet.id, type: "repost" }),
    replies: sql<number>`
      (
        SELECT COUNT(*)
        FROM ${tweet} AS reply
        WHERE reply.reply_to_tweet_id = ${tweet.id}
      )
    `,
  },
};

export const tweetViewerField = (userId: string) => ({
  viewer: {
    reposted: interactionFlag({
      userId,
      type: "repost",
      tweetId: tweet.id,
    }),
    liked: interactionFlag({ userId, type: "like", tweetId: tweet.id }),

    bookmarked: interactionFlag({
      userId,
      type: "bookmark",
      tweetId: tweet.id,
    }),
  },
});

export async function getHomeFeed({
  cursor,
  userId,
}: {
  cursor: string | null;
  userId: string;
}) {
  return db
    .select({
      ...tweetCoreFields,
      ...tweetUserField,
      ...tweetInteractionCountField,
      ...tweetViewerField(userId),

      following: followingFlag({
        followerId: userId,
        followingId: tweet.userId,
      }),
    })
    .from(tweet)
    .innerJoin(user, eq(user.id, tweet.userId))
    .where(cursor ? lt(tweet.createdAt, new Date(cursor)) : undefined)
    .orderBy(desc(tweet.createdAt))
    .limit(PAGE_SIZE);
}

export async function getFollowingFeed({
  cursor,
  userId,
}: {
  cursor: string | null;
  userId: string;
}) {
  return db
    .select({
      ...tweetCoreFields,
      ...tweetUserField,
      ...tweetInteractionCountField,
      ...tweetViewerField(userId),
    })
    .from(tweet)
    .innerJoin(user, eq(user.id, tweet.userId))
    .where(
      and(
        or(
          eq(tweet.userId, userId),
          sql`
          EXISTS(
            SELECT 1
            FROM ${userFollow}
            WHERE ${userFollow.followingId} = ${tweet.userId}
            AND ${userFollow.followerId} = ${userId}
          )
        `,
        ),
        cursor ? lt(tweet.createdAt, new Date(cursor)) : undefined,
      ),
    )
    .orderBy(desc(tweet.createdAt))
    .limit(PAGE_SIZE);
}

export async function getBookmarksFeed({
  cursor,
  userId,
}: {
  cursor: string | null;
  userId: string;
}) {
  return db
    .select({
      ...tweetCoreFields,
      ...tweetUserField,
      ...tweetInteractionCountField,

      viewer: {
        liked: interactionFlag({ userId, type: "like", tweetId: tweet.id }),
        reposted: interactionFlag({
          userId,
          type: "repost",
          tweetId: tweet.id,
        }),
      },

      following: followingFlag({
        followerId: userId,
        followingId: tweet.userId,
      }),
    })
    .from(tweetInteraction)
    .innerJoin(tweet, eq(tweetInteraction.tweetId, tweet.id))
    .innerJoin(user, eq(tweet.userId, user.id))
    .where(
      and(
        eq(tweetInteraction.userId, userId),
        eq(tweetInteraction.type, "bookmark"),
        cursor ? lt(tweet.createdAt, new Date(cursor)) : undefined,
      ),
    )
    .orderBy(desc(tweet.createdAt))
    .limit(PAGE_SIZE);
}

export async function getUserPosts({
  cursor,
  userId,
  username,
}: {
  cursor: string | null;
  userId: string | undefined;
  username: string;
}) {
  return db
    .select({
      ...tweetCoreFields,
      ...tweetUserField,
      ...tweetInteractionCountField,

      ...(userId
        ? {
            ...tweetViewerField(userId),

            following: followingFlag({
              followerId: userId,
              followingId: user.id,
            }),
          }
        : {}),
    })
    .from(tweet)
    .innerJoin(user, eq(user.id, tweet.userId))
    .leftJoin(
      tweetInteraction,
      and(
        eq(tweetInteraction.tweetId, tweet.id),
        eq(
          tweetInteraction.userId,
          sql`
            (
              SELECT ${user.id} 
              FROM ${user} 
              WHERE ${user.username} = ${username}
            )
          `,
        ),
        eq(tweetInteraction.type, "repost"),
      ),
    )
    .where(
      and(
        or(
          and(eq(user.username, username), isNull(tweet.replyToTweetId)),
          isNotNull(tweetInteraction.userId),
        ),
        cursor ? lt(tweet.createdAt, new Date(cursor)) : undefined,
      ),
    )
    .orderBy(
      desc(sql`COALESCE(${tweetInteraction.createdAt}, ${tweet.createdAt})`),
    )
    .limit(PAGE_SIZE);
}

export async function getUserPostsWithReplies({
  cursor,
  userId,
  username,
}: {
  cursor: string | null;
  userId: string;
  username: string;
}) {
  return db
    .select({
      ...tweetCoreFields,
      ...tweetUserField,
      ...tweetInteractionCountField,
      ...tweetViewerField(userId),

      following: followingFlag({ followerId: userId, followingId: user.id }),
    })
    .from(tweet)
    .innerJoin(user, eq(user.id, tweet.userId))
    .leftJoin(
      tweetInteraction,
      and(
        eq(tweetInteraction.tweetId, tweet.id),
        eq(
          tweetInteraction.userId,
          sql`
            (
              SELECT ${user.id} 
              FROM ${user} 
              WHERE ${user.username} = ${username}
            )
          `,
        ),
        eq(tweetInteraction.type, "repost"),
      ),
    )
    .where(
      and(
        or(eq(user.username, username), isNotNull(tweetInteraction.userId)),
        cursor ? lt(tweet.createdAt, new Date(cursor)) : undefined,
      ),
    )
    .orderBy(
      desc(sql`COALESCE(${tweetInteraction.createdAt}, ${tweet.createdAt})`),
    )
    .limit(PAGE_SIZE);
}

export async function getUserLikedPosts({
  cursor,
  userId,
}: {
  cursor: string | null;
  userId: string;
}) {
  return db
    .select({
      ...tweetCoreFields,
      ...tweetUserField,
      ...tweetInteractionCountField,

      viewer: {
        bookmarked: interactionFlag({
          userId,
          tweetId: tweet.id,
          type: "bookmark",
        }),
        reposted: interactionFlag({
          userId,
          tweetId: tweet.id,
          type: "repost",
        }),
      },

      following: followingFlag({ followerId: userId, followingId: user.id }),
    })
    .from(tweetInteraction)
    .innerJoin(tweet, eq(tweet.id, tweetInteraction.tweetId))
    .innerJoin(user, eq(tweet.userId, user.id))
    .where(
      and(
        eq(tweetInteraction.userId, userId),
        eq(tweetInteraction.type, "like"),
        cursor ? lt(tweet.createdAt, new Date(cursor)) : undefined,
      ),
    )
    .orderBy(desc(tweet.createdAt))
    .limit(PAGE_SIZE);
}

export async function getTweetReplies({
  cursor,
  tweetId,
  userId,
}: {
  cursor: string | null;
  tweetId: string;
  userId: string;
}) {
  return db
    .select({
      ...tweetCoreFields,
      ...tweetUserField,
      ...tweetInteractionCountField,
      ...tweetViewerField(userId),

      following: followingFlag({
        followerId: userId,
        followingId: tweet.userId,
      }),
    })
    .from(tweet)
    .innerJoin(user, eq(user.id, tweet.userId))
    .where(
      and(
        eq(tweet.replyToTweetId, tweetId),
        cursor ? lt(tweet.createdAt, new Date(cursor)) : undefined,
      ),
    )
    .orderBy(desc(tweet.createdAt))
    .limit(PAGE_SIZE);
}
