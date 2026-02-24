import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "react-router";
import "./tailwind.css";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { HoneypotProvider } from "remix-utils/honeypot/react";
import { honeypot } from "./.server/honeypot";
import { getUser } from "./.server/utils";
import type { Route } from "./+types/root";
import { Toaster } from "./components/ui/sonner";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  const honeypotProps = await honeypot.getInputProps();
  return {
    user,
    honeypotProps,
  };
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="apple-mobile-web-app-title" content="Warbler" />
        <link
          rel="icon"
          type="image/png"
          href="/favicon-96x96.png"
          sizes="96x96"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          href="/apple-touch-icon.png"
          sizes="180x180"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <Toaster />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  return (
    <HoneypotProvider {...loaderData.honeypotProps}>
      <NuqsAdapter>
        <Outlet context={loaderData.user} />
      </NuqsAdapter>
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
