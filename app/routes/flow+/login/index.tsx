import { checkHoneyPot } from "~/.server/honeypot";
import { flashSessionStorage } from "~/.server/session/flash";
import { requireAnonymous } from "~/.server/utils";
import { EmailSchema, UsernameSchema } from "~/lib/user-validation";
import { data, useSearchParams } from "react-router";
import { z } from "zod";
import { CredentialLogin, GetLoginVariant } from "./+forms";
import type { Route } from "./+types";
import { handleGetLoginVariant, handleLogin } from "./login-helpers.server";

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
  await requireAnonymous(request);

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
  await requireAnonymous(request);

  const formData = await request.formData();

  checkHoneyPot(formData);

  switch (formData.get("intent")) {
    case "get_login_variant":
      return handleGetLoginVariant(formData);

    case "login":
      return handleLogin(request, formData);

    default:
      throw new Response("Invalid Intent", { status: 400 });
  }
}

export default function Page({ actionData }: Route.ComponentProps) {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const method = actionData?.variant?.method;
  if (!method) {
    return <GetLoginVariant redirectTo={redirectTo} />;
  }
  return <>{method === "credential" ? <CredentialLogin /> : <></>}</>;
}
