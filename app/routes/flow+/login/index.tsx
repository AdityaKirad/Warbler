import { checkHoneyPot } from "~/.server/honeypot";
import { flashSessionStorage } from "~/.server/session/flash";
import Logo from "~/assets/logo-small.webp";
import { Dialog, DialogContent } from "~/components/ui/dialog";
import { EmailSchema, UsernameSchema } from "~/lib/user-validation";
import { atom, useAtom } from "jotai";
import {
  data,
  useActionData,
  useFetcher,
  useLoaderData,
  useNavigate,
  useRouteLoaderData,
  useSearchParams,
} from "react-router";
import { z } from "zod";
import { CredentialLogin, GetLoginVariant } from "./+forms";
import type { Route } from "./+types";
import { handleGetLoginVariant, handleLogin } from "./login-helpers.server";

export const loginDialogAtom = atom({
  open: false,
  previousLocation: "",
});

export const createCredentialLoginSchema = (variant: string) =>
  z.object({
    identifier: variant === "Email" ? EmailSchema : UsernameSchema,
    password: z.string(),
  });

export const meta = () => [
  {
    title: "Login to Warbler",
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  const session = await flashSessionStorage.getSession(
    request.headers.get("cookie"),
  );

  const flash = session.get("__flash");

  return data(
    {
      flash,
    },
    {
      headers: {
        ...(flash && {
          "set-cookie": await flashSessionStorage.destroySession(session),
        }),
      },
    },
  );
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  checkHoneyPot(formData);

  switch (formData.get("intent")) {
    case "get-login-variant":
      return handleGetLoginVariant(formData);

    case "login":
      return handleLogin(request, formData);

    default:
      throw new Response("Invalid Intent", { status: 400 });
  }
}

export default function Page() {
  const [searchParams] = useSearchParams();
  const lastResult = useActionData<typeof action>();
  const { flash } = useLoaderData<typeof loader>();
  const method = lastResult?.variant?.method;
  const redirectTo = searchParams.get("redirectTo");

  return !method ? (
    <GetLoginVariant
      flash={flash}
      lastResult={lastResult?.result}
      redirectTo={redirectTo}
    />
  ) : method === "credential" ? (
    <CredentialLogin lastResult={lastResult} />
  ) : (
    <></>
  );
}

export function LoginDialog() {
  const [searchParams] = useSearchParams();
  const [dialog, dialogSet] = useAtom(loginDialogAtom);
  const fetcher = useFetcher<typeof action>();
  const loaderData = useRouteLoaderData<typeof loader>(
    "routes/flow+/login/index",
  );
  const navigate = useNavigate();
  const method = fetcher.data?.variant?.method;
  const redirectTo = searchParams.get("redirectTo");

  return (
    <Dialog
      open={dialog.open}
      onOpenChange={(open) => {
        dialogSet({
          open,
          previousLocation: open ? dialog.previousLocation : "",
        });
        if (!open) {
          navigate(dialog.previousLocation);
        }
      }}>
      <DialogContent aria-describedby={undefined}>
        <img
          className="mx-auto"
          src={Logo}
          alt="App Logo"
          width={80}
          height={80}
        />
        {!method ? (
          <GetLoginVariant
            flash={loaderData?.flash}
            lastResult={fetcher.data?.result}
            redirectTo={redirectTo}
            fetcher={fetcher}
          />
        ) : method === "credential" ? (
          <CredentialLogin lastResult={fetcher.data} fetcher={fetcher} />
        ) : (
          <></>
        )}
      </DialogContent>
    </Dialog>
  );
}
