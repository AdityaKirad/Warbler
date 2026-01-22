import { bookmark, db, like, repost, tweet, user } from "~/.server/drizzle";
import { getUser } from "~/.server/utils";
import DefaultProfilePicture from "~/assets/default-profile-picture.png";
import { PageTitle } from "~/components/page-title";
import {
  BookmarkButton,
  CommentButton,
  LikeButton,
  RepostButton,
} from "~/components/tweet-card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Separator } from "~/components/ui/separator";
import { formatNumber, getNameInitials } from "~/lib/utils";
import { format } from "date-fns";
import { eq, sql } from "drizzle-orm";
import { Link } from "react-router";
import type { Route } from "./+types/_.status.$tweetId";

export const meta = ({ loaderData }: Route.MetaArgs) => [
  {
    title: `${loaderData?.user.name} on Warbler: "${loaderData?.text}" / Warbler`,
  },
];

export async function loader({ params, request }: Route.LoaderArgs) {
  const data = await getUser(request);
  const currentUser = data?.user;

  const [post] = await db
    .select({
      id: tweet.id,
      body: tweet.body,
      text: tweet.text,
      view: tweet.views,
      createdAt: tweet.createdAt,

      likeCount: db.$count(like, eq(like.tweetId, tweet.id)),
      repostCount: db.$count(repost, eq(repost.tweetId, tweet.id)),
      replyCount: sql<number>`(SELECT COUNT (*) FROM ${tweet} AS reply WHERE reply.reply_to_tweet_id = ${tweet.id})`,

      hasBookmarked:
        sql<boolean>`EXISTS(SELECT 1 FROM ${bookmark} WHERE ${bookmark.tweetId} = ${tweet.id} AND ${bookmark.userId} = ${currentUser?.id})`.as(
          "has_bookmarked",
        ),
      hasLiked:
        sql<boolean>`EXISTS(SELECT 1 FROM ${like} WHERE ${like.tweetId} = ${tweet.id} AND ${like.userId} = ${currentUser?.id})`.as(
          "has_liked",
        ),
      hasReposted:
        sql<boolean>`EXISTS(SELECT 1 FROM ${repost} WHERE ${repost.tweetId} = ${tweet.id} AND ${repost.userId} = ${currentUser?.id})`.as(
          "has_reposted",
        ),

      user: {
        name: user.name,
        username: user.username,
        photo: user.photo,
      },
    })
    .from(tweet)
    .innerJoin(user, eq(user.id, tweet.userId))
    .where(eq(tweet.id, params.tweetId));

  return post;
}

export default function Page({ loaderData }: Route.ComponentProps) {
  return (
    <div className="h-full w-150 border-r">
      <PageTitle title="Post" />
      <div className="space-y-2 p-4">
        <div className="flex gap-2">
          <Avatar asChild>
            <Link to={`/${loaderData?.user.username}`}>
              <AvatarImage
                src={loaderData?.user.photo ?? DefaultProfilePicture}
                alt=""
              />
              <AvatarFallback>
                {getNameInitials(loaderData?.user.name)}
              </AvatarFallback>
            </Link>
          </Avatar>
          <div>
            <h3 className="font-">{loaderData?.user.name}</h3>
            <p className="text-muted-foreground text-sm">
              @{loaderData?.user.username}
            </p>
          </div>
        </div>
        <div dangerouslySetInnerHTML={{ __html: loaderData?.body ?? "" }} />
        <p className="text-muted-foreground">
          {format(loaderData?.createdAt, "h:mm a · MMM d, yyyy")} ·{" "}
          <span>{formatNumber(loaderData?.view)} Views</span>
        </p>
        <Separator />
        <div className="flex justify-between">
          <CommentButton {...loaderData} />
          <RepostButton {...loaderData} />
          <LikeButton {...loaderData} />
          <BookmarkButton {...loaderData} />
        </div>
        <Separator />
      </div>
    </div>
  );
}
