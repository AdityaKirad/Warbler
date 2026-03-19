import {
  db,
  tweet,
  tweetInteraction,
  user,
  userFollow,
} from "~/.server/drizzle";
import { getUser } from "~/.server/utils";
import { PageTitle } from "~/components/page-title";
import {
  NonAuthenticatedSidebar,
  SearchFollowSidebar,
} from "~/components/search-follow-sidebar";
import { Button } from "~/components/ui/button";
import { useUser } from "~/hooks/use-user";
import { formatNumber } from "~/lib/utils";
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { Link, Outlet } from "react-router";
import type { Route } from "./+types";
import { ProfileData } from "./profile-data";
import { ProfileHeader } from "./profile-header";
import { Tabs } from "./tabs";

export type UsernameLayoutLoader = typeof loader;

export const USERNAME_LAYOUT_ROUTE_ID =
  "routes/_main+/$username+/_layout/index";

export async function loader({ params, request }: Route.LoaderArgs) {
  const currentUser = await getUser(request);

  const { pathname } = new URL(request.url);

  const where = pathname.includes("/likes")
    ? inArray(
        tweet.id,
        db
          .select({ tweetId: tweetInteraction.tweetId })
          .from(tweetInteraction)
          .where(
            and(
              eq(tweetInteraction.userId, user.id),
              eq(tweetInteraction.type, "like"),
            ),
          ),
      )
    : pathname.includes("/with_replies")
      ? or(
          eq(tweet.userId, user.id),
          inArray(
            tweet.id,
            db
              .select({ tweetId: tweetInteraction.tweetId })
              .from(tweetInteraction)
              .where(
                and(
                  eq(tweetInteraction.userId, user.id),
                  eq(tweetInteraction.type, "repost"),
                ),
              ),
          ),
        )
      : and(
          or(
            and(eq(tweet.userId, user.id), isNull(tweet.replyToTweetId)),
            inArray(
              tweet.id,
              db
                .select({ tweetId: tweetInteraction.tweetId })
                .from(tweetInteraction)
                .where(
                  and(
                    eq(tweetInteraction.userId, user.id),
                    eq(tweetInteraction.type, "repost"),
                  ),
                ),
            ),
          ),
        );

  const [data] = await db
    .select({
      id: user.id,
      name: user.name,
      username: user.username,
      photo: user.photo,
      coverImage: user.coverImage,
      bio: user.bio,
      location: user.location,
      dob: user.dob,
      website: user.website,
      displayVerifiedEmail: user.displayVerifiedEmail,
      profileVerified: user.profileVerified,
      createdAt: user.createdAt,

      count: {
        followers: db.$count(userFollow, eq(userFollow.followingId, user.id)),
        following: db.$count(userFollow, eq(userFollow.followerId, user.id)),
        posts: db.$count(tweet, where),
      },

      ...(currentUser?.user.id
        ? {
            following: sql<boolean>`
              EXISTS(
                SELECT 1 
                FROM ${userFollow} 
                WHERE ${userFollow.followingId} = ${user.id} 
                AND ${userFollow.followerId} = ${currentUser.user.id}
              )
            `,
          }
        : {}),
    })
    .from(user)
    .where(eq(user.username, params.username));

  return data;
}

export default function Layout({ loaderData }: Route.ComponentProps) {
  const user = useUser();
  return (
    <div className="flex min-h-screen justify-between">
      <div className="min-h-screen w-150 border-x">
        <PageTitle
          title={loaderData ? loaderData.name : "Profile"}
          {...(loaderData && {
            description: formatNumber(loaderData.count.posts),
          })}
        />
        {loaderData ? (
          <>
            <ProfileHeader user={loaderData} />
            <div className="mt-14 flex flex-col gap-2 p-4">
              <ProfileData user={loaderData} />
              <div className="[&_span]:text-muted-foreground flex gap-4">
                <p>
                  {formatNumber(loaderData.count.following)}{" "}
                  <span>Following</span>
                </p>
                <p>
                  {formatNumber(loaderData.count.followers)}{" "}
                  <span>Followers</span>
                </p>
              </div>
            </div>
            <Tabs user={loaderData} />
            <main>
              <Outlet />
            </main>
          </>
        ) : (
          <div className="mx-auto mt-16 max-w-80">
            <h3 className="text-3xl font-bold">This account doesn’t exist</h3>
            <p className="text-muted-foreground text-sm">
              Try searching for another.
            </p>
          </div>
        )}
      </div>
      {user ? <SearchFollowSidebar /> : <NonAuthenticatedSidebar />}
      {!user && (
        <div className="fixed inset-x-0 bottom-0 bg-blue-500 p-2 max-sm:hidden">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between max-xl:max-w-4xl max-lg:max-w-2xl">
            <div className="max-md:hidden">
              <p className="text-3xl font-semibold">
                Don't miss what's happening
              </p>
              <p>People on Warbler are the first to know</p>
            </div>
            <div className="flex gap-4 max-md:grow max-md:gap-2">
              <Button className="flex-1 rounded-full" variant="outline" asChild>
                <Link to="/flow/login" aria-label="Log in">
                  Log in
                </Link>
              </Button>
              <Button className="flex-1 rounded-full" asChild>
                <Link to="/flow/signup" aria-label="Sign up">
                  Sign up
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
