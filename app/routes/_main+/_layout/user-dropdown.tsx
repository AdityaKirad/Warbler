import type { UserSelectType } from "~/.server/drizzle";
import DefaultProfilePicture from "~/assets/default-profile-picture.png";
import { CheckCircleIcon } from "~/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Separator } from "~/components/ui/separator";
import { useRequiredUser } from "~/hooks/use-user";
import { getNameInitials } from "~/lib/utils";
import { loginDialogAtom } from "~/routes/flow+/login";
import { atom, useAtom } from "jotai";
import { MoreHorizontalIcon } from "lucide-react";
import { Form, useLoaderData, useLocation } from "react-router";
import type { loader } from ".";

const manageAccountsDialogAtom = atom(false);

export function UserDropdown() {
  const { sessions } = useLoaderData<typeof loader>();
  const [, loginDialogSet] = useAtom(loginDialogAtom);
  const [, manageAccountsDialogSet] = useAtom(manageAccountsDialogAtom);
  const user = useRequiredUser();
  const location = useLocation();
  const areMultipleSessions = (sessions?.length ?? 0) > 1;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="mt-auto h-auto rounded-full p-2 max-[30rem]:hidden"
          variant="ghost">
          <Avatar>
            <AvatarImage
              src={user.photo ?? DefaultProfilePicture}
              alt={user.username}
              loading="lazy"
              decoding="async"
            />
            <AvatarFallback>{getNameInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="text-left max-xl:hidden">
            <p className="font-medium">{user.name}</p>
            <p className="text-muted-foreground text-sm">@{user.username}</p>
          </div>
          <MoreHorizontalIcon className="ml-auto max-xl:hidden" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="px-0 py-2 xl:w-(--radix-dropdown-menu-trigger-width)">
        {areMultipleSessions && (
          <>
            {sessions.map(({ active, session, user }) =>
              active ? (
                <div
                  key={session.id}
                  className="flex cursor-pointer items-center gap-2 px-2 py-1.5">
                  <SessionItem user={user} active />
                </div>
              ) : (
                <DropdownMenuItem
                  key={session.id}
                  className="rounded-none"
                  asChild>
                  <Form
                    className="relative"
                    method="POST"
                    action={`/flow/set-active-session?token=${encodeURIComponent(session.token)}`}
                    navigate={false}>
                    <SessionItem user={user} />
                    <button className="absolute inset-0" type="submit" />
                  </Form>
                </DropdownMenuItem>
              ),
            )}
            <Separator className="my-2" />
          </>
        )}
        <DropdownMenuItem
          className="w-full rounded-none text-base font-medium"
          onClick={() => {
            history.pushState("", "", "/flow/login");
            loginDialogSet({
              open: true,
              previousLocation: location.pathname + location.search,
            });
          }}>
          Add an existing account
        </DropdownMenuItem>
        {areMultipleSessions && (
          <>
            <DropdownMenuItem
              className="rounded-none"
              onClick={() => manageAccountsDialogSet(true)}>
              Manage accounts
            </DropdownMenuItem>
            <MangageAccountsDialog />
          </>
        )}
        <DropdownMenuItem
          className="rounded-none text-base font-medium"
          asChild>
          <Form method="POST" action="/flow/logout" navigate={false}>
            <button type="submit">Log out @{user.username}</button>
          </Form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MangageAccountsDialog() {
  const { sessions } = useLoaderData<typeof loader>();
  const [open, openSet] = useAtom(manageAccountsDialogAtom);
  const [, loginDialogSet] = useAtom(loginDialogAtom);
  const location = useLocation();
  return (
    <Dialog open={open} onOpenChange={openSet}>
      <DialogContent className="px-0">
        <DialogTitle className="ml-16">Accounts</DialogTitle>
        {sessions.map(({ active, session, user }) =>
          active ? (
            <div
              key={session.id}
              className="flex cursor-pointer items-center gap-2 px-2 py-1.5">
              <SessionItem user={user} active />
            </div>
          ) : (
            <Form
              key={session.id}
              className="hover:bg-accent focus-within:bg-accent relative flex cursor-pointer items-center gap-2 px-2 py-1.5 focus-within:outline-2 focus-within:outline-blue-500/80"
              method="POST"
              action={`/flow/set-active-session?token=${encodeURIComponent(session.token)}`}
              navigate={false}>
              <SessionItem user={user} />
              <button
                className="absolute inset-0 cursor-pointer outline-none"
                type="submit"
              />
            </Form>
          ),
        )}
        <Separator />
        <button
          className="px-4 py-3 text-left text-blue-500 hover:bg-blue-500/5 focus-visible:bg-blue-500/5"
          onClick={() => {
            openSet(false);
            loginDialogSet({
              open: true,
              previousLocation: location.pathname + location.search,
            });
          }}>
          Add an existing account
        </button>
        <DialogDescription className="px-2">
          If you have more than one X account, you can add them and easily
          switch between. You can add up to 5 accounts.
        </DialogDescription>
        <Separator />
        <Form action="/flow/logout/all" method="POST" navigate={false}>
          <button
            type="submit"
            className="text-destructive hover:bg-destructive/5 focus-visible:bg-destructive/5 w-full px-4 py-3">
            Log out of all accounts
          </button>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function SessionItem({
  active,
  user,
}: {
  active?: boolean;
  user: Pick<UserSelectType, "name" | "username" | "photo">;
}) {
  return (
    <>
      <Avatar>
        <AvatarImage
          src={user.photo ?? DefaultProfilePicture}
          alt={`@${user.username}`}
          loading="lazy"
          decoding="async"
        />
        <AvatarFallback>{getNameInitials(user.name)}</AvatarFallback>
      </Avatar>

      <div>
        <p className="font-medium">{user.name}</p>
        <p className="text-muted-foreground text-sm">@{user.username}</p>
      </div>

      {active && <CheckCircleIcon className="ml-auto text-green-400" />}
    </>
  );
}
