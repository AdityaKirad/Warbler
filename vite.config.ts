import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { remixDevTools } from "remix-development-tools";
import { flatRoutes } from "remix-flat-routes";

declare module "@remix-run/node" {
	interface Future {
		v3_singleFetch: true;
	}
}

export default defineConfig({
	plugins: [
		remixDevTools({
			suppressDeprecationWarning: true,
		}),
		remix({
			future: {
				v3_fetcherPersist: true,
				v3_relativeSplatPath: true,
				v3_throwAbortReason: true,
				v3_singleFetch: true,
				v3_lazyRouteDiscovery: true,
			},
			ignoredRouteFiles: ["**/*"],
			routes: async (defineRoutes) =>
				flatRoutes("routes", defineRoutes, {
					ignoredRouteFiles: ["**/*.server.*", "**/*.client.*"],
				}),
		}),
		tsconfigPaths(),
	],
});
