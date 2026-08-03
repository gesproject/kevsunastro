// @ts-nocheck
import { defineConfig, sessionDrivers } from "astro/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";

function keystaticCloudflareCompat() {
	return {
		name: "keystatic-cloudflare-compat",
		hooks: {
			"astro:config:setup": ({ injectRoute, updateConfig, config }) => {
				updateConfig({
					server: config.server.host ? {} : { host: "127.0.0.1" },
					vite: {
						plugins: [
							{
								name: "keystatic",
								resolveId(id) {
									if (id === "virtual:keystatic-config") {
										return this.resolve("./keystatic.config", "./a");
									}

									return null;
								},
							},
						],
						optimizeDeps: {
							entries: ["keystatic.config.*", ".astro/keystatic-imports.js"],
						},
					},
				});

				const dotAstroDir = new URL("./.astro/", config.root);
				mkdirSync(dotAstroDir, { recursive: true });
				writeFileSync(
					new URL("keystatic-imports.js", dotAstroDir),
					`import "@keystatic/astro/ui";\nimport "@keystatic/astro/api";\nimport "@keystatic/core/ui";\n`,
				);

				injectRoute({
					entryPoint: "@keystatic/astro/internal/keystatic-astro-page.astro",
					entrypoint: "@keystatic/astro/internal/keystatic-astro-page.astro",
					pattern: "/keystatic/[...params]",
					prerender: false,
				});

				const apiEntrypoint = fileURLToPath(
					new URL("./src/keystatic-cloudflare-api.mjs", import.meta.url),
				);
				injectRoute({
					entryPoint: apiEntrypoint,
					entrypoint: apiEntrypoint,
					pattern: "/api/keystatic/[...params]",
					prerender: false,
				});
			},
		},
	};
}

// https://astro.build/config
export default defineConfig({
	site: "https://example.com",
	integrations: [mdx(), sitemap(), react(), keystaticCloudflareCompat()],
	adapter: cloudflare({
		imageService: "passthrough",
		prerenderEnvironment: "workerd",
	}),
	session: {
		driver: sessionDrivers.lruCache(),
	},
});
