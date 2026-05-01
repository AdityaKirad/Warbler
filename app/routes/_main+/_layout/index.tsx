import { getUsers } from "~/.server/utils";
import { DialogTweetForm } from "~/components/dialog-tweet-form";
import { AppLogo } from "~/components/icons/app-logo";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  dialogContentClassName,
  DialogTrigger,
} from "~/components/ui/dialog";
import { useUser } from "~/hooks/use-user";
import {
  getNextOnboardingStep,
  hasStepsAfterCurrent,
  type OnboardingStep,
} from "~/routes/_main+/onboarding/config";
import { useEffect, useState } from "react";
import { data, NavLink, Outlet } from "react-router";
import { toast } from "sonner";
import { DOB, ProfilePhoto, Username } from "../onboarding/forms";
import { deletePostToastCookie } from "../tweet+/$tweetId+/delete";
import type { Route } from "./+types";
import { NavItem } from "./nav-item";
import { links } from "./nav-links";
import { UserDropdown } from "./user-dropdown";

export async function loader({ request }: Route.LoaderArgs) {
  const { sessions, headers } = await getUsers(request);

  const toastValue = await deletePostToastCookie.parse(
    request.headers.get("cookie"),
  );

  return data(
    { sessions, toastValue },
    {
      headers: {
        ...Object.fromEntries(headers),
        ...(toastValue
          ? {
              "set-cookie": await deletePostToastCookie.serialize("", {
                maxAge: -1,
              }),
            }
          : {}),
      },
    },
  );
}

export default function Layout({ loaderData }: Route.ComponentProps) {
  const user = useUser();
  const onboardingStep = getNextOnboardingStep(user?.onboardingStepsCompleted);
  const hasNextStep = hasStepsAfterCurrent(user?.onboardingStepsCompleted);

  useEffect(() => {
    if (!loaderData?.toastValue) {
      return;
    }

    if (loaderData.toastValue === "success") {
      toast("Your post was deleted");
    } else {
      toast.error("Something went wrong. Please try again.");
    }
  }, [loaderData?.toastValue]);
  return (
    <div className="flex h-full">
      <div className="basis flex shrink-0 grow flex-col items-end">
        <div className="transition-[width] min-[30rem]:w-20 xl:w-70">
          <nav className="fixed bottom-0 flex gap-2 p-2 transition-[width] max-xl:items-center max-[30rem]:inset-x-0 max-[30rem]:justify-between max-[30rem]:border-t min-[30rem]:top-0 min-[30rem]:w-20 min-[30rem]:flex-col xl:w-70">
            <NavLink
              className="hover:bg-muted w-fit rounded-full p-2 outline-2 outline-transparent transition-[colors,outline] focus-visible:outline-white max-[30rem]:hidden"
              to="/home"
              aria-label="Home">
              <AppLogo height={40} width={40} />
            </NavLink>

            {user
              ? links.map(({ title, to, ...props }) => (
                  <NavItem
                    key={title}
                    to={typeof to === "function" ? to(user.username) : to}
                    title={title}
                    {...props}
                  />
                ))
              : null}

            {user && (
              <>
                <PostTweetDialog />
                <UserDropdown />
              </>
            )}
          </nav>
        </div>
      </div>
      <div className="flex h-full shrink grow flex-col">
        <div className="mobile:w-150 tablet:w-225 size-full transition-[width] lg:w-250">
          {onboardingStep ? (
            <div className="bg-muted/60 fixed inset-0">
              <div className={dialogContentClassName}>
                <AppLogo className="mx-auto" height={56} width={56} />
                <OnboardingStep
                  step={onboardingStep}
                  hasNextStep={hasNextStep}
                />
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </div>
    </div>
  );
}

function OnboardingStep({
  step,
  hasNextStep,
}: {
  hasNextStep: boolean;
  step: OnboardingStep;
}) {
  switch (step?.id) {
    case "dob":
      return <DOB hasNextStep={hasNextStep} {...step} />;
    case "profile-photo":
      return <ProfilePhoto hasNextStep={hasNextStep} {...step} />;
    case "verify-email":
      return null;
    case "username":
      return <Username hasNextStep={hasNextStep} {...step} />;
  }
}

function PostTweetDialog() {
  const [dialog, dialogSet] = useState(false);
  return (
    <Dialog open={dialog} onOpenChange={dialogSet}>
      <DialogTrigger asChild>
        <Button
          className="rounded-full max-xl:size-14 max-[30rem]:hidden [&_svg]:size-6"
          type="button">
          <svg
            viewBox="0 0 24 24"
            className="xl:hidden"
            height={24}
            width={24}
            aria-hidden>
            <g>
              <path d="M23 3c-6.62-.1-10.38 2.421-13.05 6.03C7.29 12.61 6 17.331 6 22h2c0-1.007.07-2.012.19-3H12c4.1 0 7.48-3.082 7.94-7.054C22.79 10.147 23.17 6.359 23 3zm-7 8h-1.5v2H16c.63-.016 1.2-.08 1.72-.188C16.95 15.24 14.68 17 12 17H8.55c.57-2.512 1.57-4.851 3-6.78 2.16-2.912 5.29-4.911 9.45-5.187C20.95 8.079 19.9 11 16 11zM4 9V6H1V4h3V1h2v3h3v2H6v3H4z"></path>
            </g>
          </svg>
          <span className="max-xl:hidden">Post</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="h-fit px-4 pt-12 pb-4">
        <DialogTweetForm
          onError={() => dialogSet(false)}
          onSuccess={() => dialogSet(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
