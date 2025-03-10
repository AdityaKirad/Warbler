import type { LinksFunction, MetaFunction } from "@remix-run/node";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
} from "@remix-run/react";
import "./tailwind.css";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { HoneypotProvider } from "remix-utils/honeypot/react";
import { getUserId } from "./services/authenticator.server";
import { db } from "./services/db.server";
import { honeypot } from "./services/honeypot.server";

export const meta: MetaFunction = () => [
  {
    name: "apple-mobile-web-app-title",
    content: "Warbler",
  },
];

export const links: LinksFunction = () => [
  {
    rel: "icon",
    type: "image/png",
    href: "/favicon-96x96.png",
    sizes: "96x96",
  },
  {
    rel: "icon",
    type: "image/svg+xml",
    href: "/favicon.svg",
  },
  {
    rel: "shortcut icon",
    href: "/favicon.ico",
  },
  {
    rel: "apple-touch-icon",
    href: "/apple-touch-icon.png",
    sizes: "180x180",
  },
  {
    rel: "manifest",
    href: "/site.webmanifest",
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const id = await getUserId(request);
  const user = id
    ? await db.user.findUnique({
        where: {
          id: id,
        },
        select: { id: true, name: true, username: true, image: true },
      })
    : null;
  const honeypotProps = await honeypot.getInputProps();
  return { honeypotProps, user };
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { honeypotProps } = useLoaderData<typeof loader>();

  return (
    <HoneypotProvider {...honeypotProps}>
      <Outlet />
    </HoneypotProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <>
      {isRouteErrorResponse(error) ? (
        <div>
          <h1>
            {error.status} {error.statusText}
          </h1>
          <p>{error.data}</p>
        </div>
      ) : error instanceof Error ? (
        <div className="prose">
          <h1>Error</h1>
          <p>{error.message}</p>
          <p>The stack trace is:</p>
          <pre>{error.stack}</pre>
        </div>
      ) : (
        <h1>Unknown Error</h1>
      )}
    </>
  );
}
