import { defineConfig, sessionDrivers } from "astro/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

const cloudflareBuild = process.argv.includes("build");

// Canonical origin for sitemap/canonical/OG URLs. Overridable so the Phase 7
// domain cutover is a one-line change (or an env var in CI) with no code edits.
const SITE_URL = process.env.SITE_URL ?? "https://solbo-astro7-cloudflare.nickgagne92.workers.dev";

function keystaticCloudflareCompat() {
  return {
    name: "keystatic-cloudflare-compat",
    hooks: {
      "astro:config:setup": ({ config, injectRoute, updateConfig }) => {
        updateConfig({
          server: config.server.host ? {} : { host: "127.0.0.1" },
          vite: {
            plugins: [
              {
                name: "keystatic-config",
                resolveId(id) {
                  return id === "virtual:keystatic-config" ? this.resolve("./keystatic.config", "./a") : null;
                },
              },
            ],
            optimizeDeps: { entries: ["keystatic.config.*", ".astro/keystatic-imports.js"] },
          },
        });

        const dotAstroDir = new URL("./.astro/", config.root);
        mkdirSync(dotAstroDir, { recursive: true });
        writeFileSync(
          new URL("keystatic-imports.js", dotAstroDir),
          'import "@keystatic/astro/ui";\nimport "@keystatic/astro/api";\nimport "@keystatic/core/ui";\n',
        );

        injectRoute({
          entryPoint: "@keystatic/astro/internal/keystatic-astro-page.astro",
          entrypoint: "@keystatic/astro/internal/keystatic-astro-page.astro",
          pattern: "/keystatic/[...params]",
          prerender: false,
        });
        const apiEntrypoint = fileURLToPath(new URL("./src/keystatic-cloudflare-api.mjs", import.meta.url));
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

export default defineConfig({
  site: SITE_URL,
  output: cloudflareBuild ? "server" : "static",
  // Astro's local dev server does not need a workerd runtime. Keeping the
  // Cloudflare adapter to build/preview avoids loading its Worker runner
  // during local authoring while the generated Worker remains the deployable
  // artifact verified by the Cloudflare commands.
  adapter:
    !cloudflareBuild
      ? undefined
      : cloudflare({
          imageService: "passthrough",
          prerenderEnvironment: "workerd",
        }),
  integrations: [react(), sitemap(), keystaticCloudflareCompat()],
  session: {
    driver: sessionDrivers.lruCache(),
  },
});
